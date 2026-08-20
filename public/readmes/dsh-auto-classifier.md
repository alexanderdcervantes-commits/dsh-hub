# dsh-auto-classifier — autonomous ("auto") mode for DeepSeek Harness

English | [中文](README.zh.md)

A Claude-Code-auto-mode-like permission classifier for DeepSeek Harness. Adds a fourth permission preset **auto (Autonomous)** beside `read-only / workspace-write / danger-full-access`: tool calls are classified automatically — dangerous operations are blocked before they run, safe ones flow, and sandbox escalations are decided by the classifier without a human watching the approval prompts.

## How it works

Host-plane plugin. Two `{ prepend: true }` listeners decide BEFORE the browser answerer, active only in sessions whose permission preset is `auto`; every other session keeps the stock interactive behavior (handlers call `next()`):

| Hook | Role |
|---|---|
| `tools/pre-execute` (the tool pre-execution waterfall) | Every tool call sees its name + full arguments: dangerous commands (system-directory deletion, formatting, registry writes, `git reset --hard` / force push, credential access, …) are denied BEFORE anything executes |
| `approval/request` (the approval waterfall) | Sandbox escalations (`sandbox_permissions`) are auto-allowed / auto-rejected by the classifier — no browser prompt in auto sessions |
| git snapshot | Before an allowed high-risk escalation the workspace is checkpointed (`git add -A && git commit`, throttled); `auto_snapshot` tool snapshots manually anytime |
| systemPrompt section | Injects autonomous-mode discipline: risk tiers, git rescue, no infinite retry loops, email-and-stop when a human decision is needed |
| web control page (v0.1.5, bilingual since v0.1.7, model config since v0.1.10, **explicit credentials since v0.1.14**) | **Settings → Plugins → Auto Classifier · 自动分类器**: live config toggles (LLM judge, write-content scan, strict default, judge stages, default decision) as phone-style switches, judge-model config (**provider / base URL / API key / model** fields — the credentials you type are saved and the judge calls that provider **directly over HTTPS** (OpenAI-compatible or Anthropic), with a **Test · 测试** button that pings the exact credentials typed and a **Save · 保存** that persists them; a mode badge shows Direct · 直连 vs Service · 服务), session stats, and the recently-denied list — labels are bilingual (EN · 中文). The browser half ships via `exports["./client"]` + `dsh.client`; static bundle clients have no `host.call`, so the page fetches same-origin routes the host half registers on `webServer` (deferred with `ctx.inject(['webServer'])` since v0.1.6 — the service mounts after webStartup): `GET /dsh-auto-classifier/status`, `GET /dsh-auto-classifier/denials`, `POST /dsh-auto-classifier/set` (whitelisted live-config keys only), `GET/POST /dsh-auto-classifier/model` (dedicated judge-model endpoint; provider/baseURL/apiKey/model persisted, the API key is **never returned** — only a mask), `POST /dsh-auto-classifier/model/test` (live ping with the credentials typed in the form, 20s cap). Toggles apply immediately to the running classifier and persist across restarts (config.json) |

## Rule engine (Claude Code style, tool-scoped)

- **Rule syntax**: `Tool(pattern)` — `pwsh(^git\s+commit\b)`, `write,edit(C:\Windows)`; comma-separated tool names allowed; a bare regex without parens applies to every tool. Patterns are case-insensitive regexes.
- **Field projection (no false positives)**: command tools (pwsh/bash/run_code) scan only `command/code` (cleaned first: env-var prefixes `FOO=bar` and `> / >>` redirections stripped); path tools (write/edit/read) scan only `file_path`; other tools are not scanned — text in file content or code that merely mentions a dangerous word is not a false positive. Approval requests scan the `reason` sentence.
- **Order**: deny rules (highest priority) → in-workspace structural allow (write/edit/read only) → allow rules → LLM judge (optional) → pwsh strict default → `defaultDecision`.
- **In-workspace file operations are never judged** (Claude Code Tier-1, since v0.1.3): `write`/`edit`/`read` whose resolved target lies inside the session workspace (`agent.session.header.cwd`) are allowed deterministically — edits inside the project are reviewable via version control, and the file sandbox already confines the write. Deny rules still run first, so protected targets (`.dsh` configs, credentials, system dirs, `.git/config|hooks` metadata) stay blocked.
- **Default deny table** (inspired by Claude Code soft_deny): destructive file ops, disk/boot/system servicing, shutdown/reboot, account/service tampering, registry writes, git push / force-push / reset --hard, external code execution (`curl|bash`, `iwr|iex`), privilege escalation (sudo/runas/gsudo), network listeners, system-level package installs, credential files, protected-path writes, DSH/shell config tampering.
- **Default allow table**: routine git (no push), package managers, language runtimes, gh/dsh/winget/scoop/choco, PowerShell cmdlets.
- **LLM judge** (`llmJudge: true`): when no rule matches, the model decides semantically. It mirrors Claude Code's production classifier (a readable, un-escaped copy of that prompt lives at `reference/claude-automode-classifier-reference.md`):
  - **Two-stage** (`judgeStages: "both"`, default): a fast single-token filter (cheap, errs toward blocking — Claude: FPR 8.5%) is followed by a chain-of-thought re-review **only when the filter flags** the call (FPR → 0.4%). `"fast"` / `"thinking"` run a single stage.
  - **Reasoning-blind input**: the judge sees the session's recent user messages (authorization evidence) + recent tool calls (name + projected target only, results and payload content stripped) + workspace facts (workspace root, resolved path, in-workspace, git repo). Assistant text and tool outputs are **stripped**.
  - **HARD / SOFT tiers** (since v0.1.4): HARD (external code exec, irreversible destruction, persistence, security weakening, privilege escalation, network listeners, secret exfiltration) never clears; SOFT (writes outside workspace, package mgmt outside project, git push, shared-state deletion, large-scale changes) clears only on **named+specifics** user intent — the user's own message names the action AND the dangerous parameter; questions are not consent; a post-block reaffirmation is strengthened consent; explicit boundaries persist until lifted. Out-of-scope items (poor code, wrong answers, looping, wasted tokens, transient retries) are never blocked.
  - **suspectedBypass** (since v0.1.4): a target denied earlier in the session that is re-attempted through a different tool, or whose path is embedded in a command, is flagged for the judge (`bypassWindow` recent denials participate). It is a judge signal, not an automatic denial — the judge weighs it against the user-intent evidence.
  - **scanWriteContent** (since v0.1.4, default `false`): when on, write/edit payloads that carry a deny-pattern hit are judged NOW, at write time (Claude's WRITTEN FILE EXECUTION), instead of the in-workspace structural allow.
  - Failure degrades to `defaultDecision`. Applied on the pre-execute path only — escalations use rules + default, since the underlying command was already screened.
- **Denial message** (`denyMessage`): classifier denials return a fixed Kafka-style ruling — "Before the classifier stands a doorkeeper. Today the doorkeeper says: not yet…" — stating that this is a classifier judgement (not a sandbox denial, so `sandbox_permissions` is the wrong channel), to seek another entrance, and that a different tool is re-classified anew. Customize or empty it as you like.
- **Denial log**: every classifier denial is appended to `~/.dsh/auto-classifier/denials.jsonl` (rotated past 1 MB) — a "Recently denied" review trail that survives restarts; `auto_status` prints the path.
- **Denial caps**: 3 consecutive / 20 total (same as Claude Code `denialTracking`) — past a cap the classifier hard-stops and hints the agent to notify the user. DSH has no built-in mail: the hint points to the [dsh-notify-skill](https://github.com/PAKIKNOWLEDGE/dsh-notify-skill) email plugin (also on the awesome-dsh-plugin list) or any notification channel you configure.
- Every decision is logged via `ctx.logger`; `auto_status` shows the last 20 and the cap counters.

## Install (web profile)

```sh
# 1. Pack and add to the profile's dependencies + bundles (physical tarball — do NOT use link:)
#    cd dsh-auto-classifier && npm pack --cache <workspace-path>   # workspace-write sandbox blocks npm's default cache dir
#    package.json dependencies:  "dsh-auto-classifier": "file:C:/.../dsh-auto-classifier-0.1.0.tgz"
#    package.json dsh.profile.bundles: append "dsh-auto-classifier"
cd ~/.dsh/profiles/web
pnpm add "dsh-auto-classifier@file:C:/.../dsh-auto-classifier-0.1.0.tgz" --force

# 2. Validate the composed config (no server start)
dsh --profile web --dump-config   # auto-classifier row + 4 presets

# 3. Restart dsh web, then switch the session preset to auto (or /permission auto)
```

> The plugin's `cordis.patch.yml` injects its rows as a bundle patch — never manually insert the same row ids in the profile/home layers (duplicate loader entry kills web startup). After source changes: `npm pack` → `pnpm add ... --force` (refreshes lockfile integrity).

## Updating

The plugin's `cordis.patch.yml` ships inside the package, so the injected rows update with it — no manual profile-layer edits. Prefer the official `dsh plugin` form (it forwards to pnpm **and** reconciles `dsh.profile.bundles` against the installed state, so a package that gains its `dsh.bundle` declaration in a newer version is activated automatically, and re-adding an already-listed bundle never duplicates the entry):

```sh
dsh plugin --profile web update dsh-auto-classifier              # respects the ^0.1.x range
# or pin explicitly (add --registry=https://registry.npmjs.org/ while npmmirror lags):
dsh plugin --profile web add "dsh-auto-classifier@0.1.3" --registry=https://registry.npmjs.org/

dsh --profile web --dump-config                                 # verify: exit 0 + auto-classifier row
```

Then restart dsh web. `auto_status` reports the live config — 0.1.3+ shows `stages: both` in the `llmJudge` line. A plain `pnpm update` inside the profile dir also bumps the version but skips the bundle reconciliation (fine for an in-place bump). If the previous install used a local `file:...tgz`, remove it first (`dsh plugin --profile web remove dsh-auto-classifier`) before adding from the registry, to avoid a duplicate injection.

## Configuration (`auto-classifier` row in cordis.patch.yml)

| Key | Default | Meaning |
|---|---|---|
| `presetName` | `auto` | The permission preset under which the classifier is authoritative |
| `defaultDecision` | `allow` | Decision when no rule matches and no judge (`deny` = fail closed) |
| `llmJudge` | `false` | Enable the model semantic judge (one call per unmatched operation) |
| `judgeProvider` / `judgeBaseURL` / `judgeApiKey` / `judgeModel` | empty | **Explicit judge credentials** (since v0.1.14), set in the web control page. When a non-empty API key + model + base URL are present, the judge calls that provider **directly over HTTPS** (OpenAI-compatible `/chat/completions`, or Anthropic `/messages` when the provider/base URL is Anthropic) with zero dependency on the harness llm registry or its config-file credentials. Empty `judgeApiKey` falls back to `llmProvider`/`llmModel` below. |
| `llmProvider` / `llmModel` | `deepseek-official` / `deepseek-v4-flash` | Judge model via the harness llm service (fallback when no direct credentials are set) |
| `judgeStages` | `both` | `both` = fast filter + thinking re-review on flag; `fast` / `thinking` = single stage |
| `denyMessage` | Kafka doorkeeper copy | Fixed text appended to classifier denials (explains the sandbox_permissions channel does not apply); empty to disable |
| `hardDenyMessage` | hard-boundary note | Extra sentence appended when a deny RULE (HARD) blocked the call — suggests running the step outside auto mode |
| `judgeMaxUserMessages` / `judgeUserMessageChars` | `3` / `400` | How many recent user messages (truncated) the judge sees as intent evidence |
| `judgeToolHistory` | `6` | How many recent tool calls (name + target, stripped) the judge sees for session context |
| `judgeFastMaxTokens` / `judgeThinkingTimeoutMs` | `8` / `30000` | Stage-1 output cap and stage-2 abort timeout |
| `scanWriteContent` / `writeContentScanChars` | `false` / `2000` | When on, judge write/edit payloads that carry a deny-pattern hit (content truncated to this many chars) |
| `bypassWindow` | `5` | How many recent denials participate in suspectedBypass matching |
| `pwshStrict` | `true` | Unmatched command-tool calls go to the judge / strict default (more conservative than path tools, mirroring Claude Code's default for PowerShell) |
| `denyPatterns` / `allowPatterns` | built-in | `Tool(pattern)` regex arrays, override or extend |
| `denialLimitConsecutive` / `denialLimitTotal` | `3` / `20` | Denial caps, hard-stop hint past them |
| `gitSnapshotOnAllow` | `true` | Snapshot the git worktree before allowing an escalation |
| `gitSnapshotIntervalMs` | `30000` | Per-session snapshot interval floor |

## License

MIT
