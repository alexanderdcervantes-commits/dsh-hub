# `@deepseek-ai/dsh-sandbox-microsandbox`

English | [中文](README.zh.md)

A DSH profile bundle for the fail-closed microsandbox microVM capability. The root package contains the `ctx.microsandbox` provider and exports the model-facing tools as `@deepseek-ai/dsh-sandbox-microsandbox/tool`.

## Repository shape

```text
package.json              # provider/tool package and dsh.bundle manifest
cordis.patch.yml          # dormant provider and tool rows
src/                      # provider, runtime, resolver, and tool subpath
lib/                      # generated install artifacts
legacy/                   # source-compatible host integration patch for older DSH snapshots
docs/                     # detailed provider/tool references
tests/provider/            # provider, resolver, SDK, and host tests
tests/tool/                # model-tool and renderer tests
```

The single root artifact keeps Git/profile installation self-contained while preserving two Cordis entry points:

```yaml
- id: microsandbox
  name: '@deepseek-ai/dsh-sandbox-microsandbox'

- id: tool-microsandbox
  name: '@deepseek-ai/dsh-sandbox-microsandbox/tool'
```

Both rows are disabled by the bundle. To enable the capability, a profile must explicitly enable the provider with `config.enabled: true` and enable the tool row separately. This prevents installation from starting a microVM capability or exposing model-facing tools implicitly.

## Capability boundary

`ctx.microsandbox` is an environment-coherent microVM service, not a `dsh-sandbox` same-world provider. It uses the pinned `microsandbox@0.6.7` SDK, package-owned `msb` resolution, bounded functional qualification, and fail-closed platform checks. It never degrades to unconfined host execution.

The tool entry exposes:

```text
microsandbox_exec  exact argv execution with captured output
microsandbox_fs    guest file read, write, and directory listing
```

The old host integration patch remains under `legacy/` for DSH snapshots that do not yet provide the provider/tool catalog and composition seams. A new bundle layer does not modify DSH host source.

## Development

A full typecheck expects sibling checkouts:

```text
~/git/deepseek-harness
~/git/sandbox-micro
```

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
```

The `prepare` script builds provider, invariant, and tool entries directly from `src/`, so a Git install does not require sibling project references. pnpm 10 may require the profile to allow the package's prepare script; only approve a pinned, trusted checkout.

## Model Experience

The provider adds no prompt text. The tool subpath adds `microsandbox_exec` and `microsandbox_fs` to the authoritative tools service; their output preserves guest exit codes, captured streams, runner failures, timeout/abort classification, and guest file content.

## Known Limitations and Deferred Work

- Linux requires `/dev/kvm`; unsupported or unqualified hosts remain unavailable.
- macOS Apple Silicon real-host acceptance is not included in the first release posture.
- Secrets, network policy, snapshots, and image/volume lifecycle tools remain provider-only or fail closed.
- The external SDK and platform binaries are pinned to `0.6.7` and require their corresponding registry packages.
