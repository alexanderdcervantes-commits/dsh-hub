# dsh-workspace-snapshot

[![CI](https://github.com/txy-ucas/dsh-workspace-snapshot/actions/workflows/ci.yml/badge.svg)](https://github.com/txy-ucas/dsh-workspace-snapshot/actions/workflows/ci.yml)
[![DSH compatibility](https://github.com/txy-ucas/dsh-workspace-snapshot/actions/workflows/dsh-compatibility.yml/badge.svg)](https://github.com/txy-ucas/dsh-workspace-snapshot/actions/workflows/dsh-compatibility.yml)
[![Release](https://img.shields.io/github/v/release/txy-ucas/dsh-workspace-snapshot)](https://github.com/txy-ucas/dsh-workspace-snapshot/releases/latest)
[![License](https://img.shields.io/github/license/txy-ucas/dsh-workspace-snapshot)](./LICENSE)

A bounded, read-only Git workspace status tool for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It adds one model-facing `workspace_snapshot` tool that reports branch tracking and repository-relative path states as validated structured data.

The plugin never stages files, changes branches, writes Git configuration, creates commits, or pushes.

## Scope

This plugin is intentionally a status probe, not a complete Git workflow. It answers which paths are staged, unstaged, conflicted, or untracked without exposing repository mutation operations or file-content diffs. Use a dedicated review or Git workflow plugin when the agent must inspect changed lines, create commits, or manage branches. The narrower scope keeps this plugin useful in read-only deployments and complementary to broader Git tooling.

## Requirements

- Node.js `^22.19.0 || >=24.0.0`
- DeepSeek Harness `0.1.0-rc.6`
- Git available in the Harness subprocess provider's execution world

The package pins the exact Cordis and DSH peer API versions it was tested against. An incompatible Harness upgrade fails package resolution instead of silently loading an unverified API combination.

## Install

Install the prebuilt v0.1.0 release into the profile you use:

```sh
dsh plugin --profile web add https://github.com/txy-ucas/dsh-workspace-snapshot/releases/download/v0.1.0/dsh-workspace-snapshot-0.1.0.tgz
```

The release tarball needs no package build allowance. A pinned source install is also supported:

```sh
dsh plugin --profile web add github:txy-ucas/dsh-workspace-snapshot#v0.1.0
```

Git installations run the package's `prepare` build. pnpm 10 or newer may require this entry in the profile's `pnpm-workspace.yaml` before repeating the install:

```yaml
allowBuilds:
  dsh-workspace-snapshot: true
```

For local development, run this from the checkout's parent directory:

```sh
dsh plugin --profile web add ./dsh-workspace-snapshot
```

Verify composition without starting the UI:

```sh
dsh --profile web --dump-config
```

The output must include the `workspace-snapshot` row.

## Use

Ask the agent:

```text
Inspect the Git workspace before making changes.
```

The model can call `workspace_snapshot` and receives a canonical object such as:

```json
{
  "status": "ok",
  "repositoryRoot": ".",
  "branch": "feature/status-tool",
  "detached": false,
  "upstream": "origin/feature/status-tool",
  "ahead": 2,
  "behind": 0,
  "clean": false,
  "entries": [
    { "kind": "changed", "path": "src/index.ts", "indexStatus": "M", "worktreeStatus": "." },
    { "kind": "changed", "path": "README.md", "indexStatus": ".", "worktreeStatus": "M" },
    { "kind": "untracked", "path": "notes.txt" }
  ],
  "totalPaths": 3,
  "conflictCount": 0,
  "stagedCount": 1,
  "unstagedCount": 1,
  "untrackedCount": 1,
  "omittedPaths": 0,
  "truncated": false
}
```

Every path appears once in `entries`. A changed entry separates Git's index and worktree status characters; rename and copy entries also carry `originalPath`. A conflict entry carries one validated unmerged status, and an untracked entry carries only its path.

| Field | Meaning |
|---|---|
| `repositoryRoot` | Stable `"."` path base. Every entry path and optional `originalPath` is relative to the repository root, without exposing its host absolute path. |
| `branch` | Current branch name, or `null` for detached or unknown HEAD state. |
| `detached` | Whether Git reports a detached HEAD. |
| `upstream` | Tracking branch, or `null` when none is configured. |
| `ahead` / `behind` | Commit distance from the configured upstream. Both are zero when Git reports no branch comparison. |
| `clean` | Whether Git reported no tracked changes, conflicts, or untracked paths. The tool always requests untracked paths. |
| `entries` | Bounded path records discriminated by `kind: changed`, `conflict`, or `untracked`. Each path appears once. |
| `totalPaths` | Complete number of Git path records parsed from bounded stdout. |
| `conflictCount` | Complete number of conflict paths, including omitted entries. |
| `stagedCount` / `unstagedCount` | Complete changed-path counts derived from non-dot index/worktree statuses. One changed path may increment both. |
| `untrackedCount` | Complete number of untracked paths. |
| `omittedPaths` | Path records excluded from `entries` by `maxPathRecords` or `maxResultBytes`. |
| `truncated` | Whether `entries` is incomplete. The count fields remain complete when this is true. |

Native and Code Mode consumers receive the same canonical object. Native rendering is exactly its JSON serialization; paths containing control characters are JSON-escaped.

## Errors

Expected external failures are returned as structured values rather than raw exceptions:

```json
{
  "status": "error",
  "code": "NOT_A_REPOSITORY",
  "message": "The session working directory is not inside a Git repository.",
  "retryable": false
}
```

Stable codes are `NOT_A_REPOSITORY`, `GIT_UNAVAILABLE`, `TIMEOUT`, `CANCELLED`, `OUTPUT_LIMIT`, `INVALID_GIT_OUTPUT`, and `GIT_FAILED`. Raw stderr, thrown values, and stack traces are never returned to the model.

## Configuration

The installable bundle inserts the plugin with defaults. Override the complete row configuration in the profile's later `cordis.patch.yml` layer when needed:

```yaml
- id: workspace-snapshot
  config:
    timeoutMs: 5000
    maxGitStdoutBytes: 262144
    maxPathRecords: 500
    maxResultBytes: 131072
```

| Field | Default | Contract |
|---|---:|---|
| `timeoutMs` | `5000` | Shared deadline for executable lookup and status, from 100 to 120000 ms. |
| `maxGitStdoutBytes` | `262144` | Retained Git stdout limit, from 1024 to 4000000. Exceeding it returns `OUTPUT_LIMIT`; partial output is never parsed. |
| `maxPathRecords` | `500` | Maximum path records initially retained in `entries`, from 1 to 10000. All records in bounded stdout still contribute to complete counts. |
| `maxResultBytes` | `131072` | UTF-8 byte limit for the complete canonical JSON result, from 1024 to 4000000. Entries are removed whole until it fits; JSON is never cut. |

Configuration is intentionally flat. Invalid limits fail plugin loading.

## Safety and lifecycle

- The plugin declares `inject = ['tools', 'subprocess']`; Cordis activates it only while both services are available.
- Tool registration is owned by `ctx.effect()` and disappears on HMR, unload, or uninstall.
- Every call runs one fixed read-only argv: `git --no-pager --no-optional-locks -c core.fsmonitor=false -c core.untrackedCache=false -c status.relativePaths=false status --porcelain=v2 --branch -z --untracked-files=all`.
- Git runs through `ctx.subprocess`, never `node:child_process`, so the selected execution-world provider and its process-tree cleanup remain authoritative.
- The child environment removes every inherited `GIT_*` value, then sets only `GIT_CONFIG_COUNT=0`, `GIT_OPTIONAL_LOCKS=0`, and `LC_ALL=C`. Ambient repository, index, object-store, and config injection cannot redirect the query.
- Optional locks, repository FSMonitor hooks, the untracked cache, and relative-to-cwd status paths are disabled explicitly. No model- or user-controlled string enters argv.
- The NUL-delimited parser handles spaces, newlines, Unicode paths, and rename/copy source paths without shell quoting.
- The parser requires complete branch headers and validates record tags, submodule state, file modes, object IDs, rename/copy scores, and status enums before accepting output.
- The caller's abort signal and the configured timeout bound executable lookup, the Git process, and complete process-tree exit. Captured stdout is not accepted while descendants remain live. Timer and signal-listener ownership ends before the tool settles.
- Git stdout, retained path records, and canonical result bytes are independently bounded. The plugin keeps no cache, watcher, socket, interval, or cross-session mutable state.
- UI presentation is a pure generic read card. The model-facing result is derived only from the validated canonical value.

## Scope and limitations

- Ignored paths are not returned.
- Submodule state appears through Git's porcelain status fields but is not expanded recursively.
- Git may read repository metadata and working-tree paths. The plugin disables known status-time hooks and write optimizations; it does not claim that Git itself performs no operating-system reads.
- The snapshot is point-in-time information. Another process may modify the repository immediately after Git exits.
- This tool does not replace `git diff`, review tools, permission policy, or commit tooling.
- DeepSeek Harness is in developer preview. Exact peer versions deliberately reject unverified Harness APIs; the scheduled compatibility workflow reports when `@deepseek-ai/dsh@latest` requires a plugin update.

## Uninstall

```sh
dsh plugin --profile web remove dsh-workspace-snapshot
```

## Development

```sh
corepack enable
pnpm install
pnpm run check
node tests/install.e2e.mjs
DSH_VERSION=latest node tests/install.e2e.mjs
```

The suite covers strict porcelain headers and record metadata, path classification and complete counts, result-byte truncation, fixed argv, inherited Git-environment isolation, a real FSMonitor hook sentinel, lingering process-tree timeout and cancellation, structured external failures, canonical rendering, Cordis fiber disposal, package construction, and installation into an isolated Harness profile.

## License

[MIT](LICENSE)
