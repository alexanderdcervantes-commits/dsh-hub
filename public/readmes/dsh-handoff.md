# dsh-handoff

Persistent working memory for [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness): one automatically maintained `handoff.md` per git branch, plus shared project knowledge available on every branch.

This is a [Cordis](https://github.com/deepseek-ai/deepseek-harness) plugin port of **pi-handoff**. The on-disk store is **byte-identical** to pi-handoff's, so both agents share one store at `~/.agent/agent-handoff/` and read each other's `handoff.md`, `project.md`, and `events.jsonl`. **If you already use pi-handoff with pi, switching to dsh (or running both) reuses your existing handoff files with no migration.**

The extension records recent turns, periodically folds them into concise Markdown, and injects the result into future sessions via a dsh runtime-context snapshot. Nothing is written into your repository.

> This is an out-of-tree community plugin, not part of the official `@deepseek-ai/*` packages. The `@deepseek-ai/*` runtime packages are optional peer dependencies resolved by dsh at load time.

---

## Quick start

You do **not** need to clone or build anything — the published repo ships a prebuilt `lib/index.js`, and `dsh plugin add` auto-activates it (the package declares a `dsh.bundle.patch`, so it is reconciled into the profile's bundle list automatically). One command:

```bash
# Install into a profile (e.g. "web", the default GUI profile). The short
# `github:` shorthand and the full HTTPS URL are equivalent:
dsh plugin --profile web add github:FleetingEcho/dsh-handoff
# dsh plugin --profile web add https://github.com/FleetingEcho/dsh-handoff.git
```

Then restart that profile (a running profile won't pick up a new layer until it reboots), open a session, and confirm:

```bash
/handoff status
```

You should see the store path (`~/.agent/agent-handoff/...`), the detected git branch, and `recording: yes`. Done — the rest of this README is reference.

> First time using dsh? `$DSH_HOME` defaults to `~/.dsh`, and profiles live under `$DSH_HOME/profiles/<name>/`. Run `dsh --help` to list commands and `dsh plugin --profile <name> --help` for plugin-management flags.

---

## Install into a profile

dsh profiles are ordered stacks of plugin bundles under `$DSH_HOME/profiles/<name>/`. This plugin is a self-activating bundle (it declares `dsh.bundle.patch` in `package.json`), so `dsh plugin add` does the whole job: it runs pnpm in the profile directory, copies the package in, and reconciles it into `dsh.profile.bundles`.

### Install from GitHub (recommended)

`dsh plugin` is a thin pnpm forwarder, so it accepts any pnpm package specifier. The two forms below are equivalent for this plugin — `github:owner/repo` is the short pnpm shorthand for a GitHub repo, and the full HTTPS URL is the most explicit:

```bash
dsh plugin --profile <name> add github:FleetingEcho/dsh-handoff
# equivalent explicit form:
dsh plugin --profile <name> add https://github.com/FleetingEcho/dsh-handoff.git
```

Either form records the dependency (as `github:FleetingEcho/dsh-handoff`) and activates the plugin. The same shorthand works for any git-hosted dsh plugin, e.g. `github:omdsh-dev/DSH-better-sidebar`; you can also pin a ref with `github:owner/repo#<branch|tag|commit>`. Verify it landed in the bundle list and composed into the config tree:

```bash
dsh --profile <name> --dump-config | grep -A8 fleetingecho/dsh-handoff
```

You should see an `id: handoff` entry with its default config. Then restart the profile and run `/handoff status`.

### Install from a local clone

If you want to edit the source, install the local directory instead (it links rather than copies, so edits to `lib/index.js` are picked up on the next profile boot after a rebuild):

```bash
cd /home/zteng/work/Tools/dsh-handoff
npm install && npm run build          # only needed if you change src/*
dsh plugin --profile <name> add /home/zteng/work/Tools/dsh-handoff
```

### Updating an existing installation

```bash
dsh plugin --profile web update @fleetingecho/dsh-handoff
```

This pulls the latest commit from GitHub and reconciles the profile's plugin
tree. Restart the profile after updating, then run `/handoff status` in a
session to verify the new version loaded.

### Removing

```bash
dsh plugin --profile web remove @fleetingecho/dsh-handoff
```

### Verifying it loaded

In a session under that profile:

```bash
/handoff status
```

- Store path + detected branch + `recording: yes` → it loaded.
- `handoff: not initialized for this session` → the plugin didn't load. Check `dsh --profile <name> --dump-config | grep -A8 fleetingecho` for an `id: handoff` row; if it's absent, the bundle didn't activate (re-run the `add` command). If the row is present but the session reports an error, check the profile boot log — the most common load failure is a `Cannot find package '@deepseek-ai/...'` from installing as a bare `link:` to a directory outside the profile (use the GitHub/tarball form, or ensure the `@deepseek-ai/*` peers resolve from the profile's shared `node_modules`).

---

## How memory is organized

dsh-handoff keeps three kinds of memory with different lifetimes:

| Memory | Scope | Purpose |
|---|---|---|
| `handoff.md` | Current branch | Goal, progress, decisions, active files, and next steps |
| Project knowledge | Every branch | Reviewed architecture, conventions, workflows, reusable decisions, and pitfalls |
| Pinned rules | Every branch | Hard rules and explicit preferences that automated summaries must never rewrite |

Each git branch has an independent `handoff.md`. Switching branches switches handoffs automatically (re-detected every turn). Project knowledge and pins live in `project.md` and are injected on every branch. Outside a git repository, the directory uses one `default` branch.

---

## A day in the life

You normally just work. A background refresh runs roughly every `thresholdTurns` turns, sooner when a large amount of material accumulates, and after each turn settles. Buffered events are durable, so quitting does not need to wait for a model call.

```text
you: "Add a login page to the app"
…agent works, writes files, runs tests…
[handoff silently records each turn and folds them into handoff.md]

you: /handoff status      # peek at the store, pending events, pins, suggestions
you: /handoff flush       # refresh the branch handoff right now
```

### Resuming next session

Start the next session with "keep going" or "what's left?". The previous branch handoff is already injected as context — you do not need to re-summarize. dsh-handoff's runtime-context snapshot is change-gated, so a stable handoff costs nothing per step and a changed one supersedes the earlier snapshot exactly once.

### Starting a fresh task

```bash
/handoff clear     # archive the current branch handoff and start a fresh skeleton
```

Project knowledge and pinned rules are **not** cleared — they survive a clear and branch switches because they live in `project.md`.

### Pausing recording

```bash
/handoff pause     # stop recording this session; the gap is never written
/handoff resume    # start recording again
```

While paused, nothing is collected and no refresh runs, so the paused stretch leaves no trace to filter out later. Work buffered **before** the pause is kept and folds in after `resume`. Injection keeps working while paused, so the agent still reads the existing documents. Pins, `project add`, and an explicit `/handoff flush` still work — pausing suppresses automatic recording, not deliberate commands. A pause lasts only for the current session; starting a new session always resumes recording.

### Subagents

Only top-level agents adopt a store, collect, and inject. Subagents (delegation depth > 0) are isolated short-lived workers: they neither write to the shared `events.jsonl` (which would only contend on its lock with the parent) nor receive the handoff injection. The `handoff` tool reports "not initialized for this session" when called from a subagent.

---

## Commands and tool

### User commands (`/handoff …`)

| Command | Purpose |
|---|---|
| `/handoff [status]` | Show store, branch, queue, usage, pins, and project suggestions |
| `/handoff flush` | Refresh the current branch handoff now |
| `/handoff clear` | Start a fresh task handoff; project knowledge and pins remain |
| `/handoff project status` | Show shared knowledge and pending suggestions |
| `/handoff project refresh [all]` | Extract durable knowledge from active branches; `all` includes archived/deleted stores |
| `/handoff project` / `project review` | Apply queued suggestions |
| `/handoff project add [Section:] <fact>` | Add shared knowledge directly |
| `/handoff project forget <substring>` | Remove one shared fact; ambiguous matches remove nothing |
| `/handoff pin <rule>` | Add a protected project-wide rule |
| `/handoff unpin <substring>` | Remove one pin; ambiguous matches remove nothing |
| `/handoff pause` / `resume` | Stop and restart recording for this session; injection stays active |

### Agent tool (`handoff`)

The model can call the `handoff` tool with these actions:

- `status` — inspect the store
- `flush` — refresh the branch handoff now
- `project_propose` — queue durable project knowledge for user review (requires `note`, optional `section`)
- `pin` — record a hard standing rule (applies on every branch)
- `unpin` — remove a pin by substring

Destructive controls (`clear`, `pause`, `resume`) remain **user-only**. While paused, the tool's `flush` reports the pause instead of writing.

### `write-handoff` skill

A `write-handoff` skill is registered so the model (or you, via the skill command) can manually compact the current conversation into a handoff document. It reads the auto-maintained `handoff.md` first and only writes a manual version if the automatic one is missing or stale.

---

## Shared project knowledge

Run a project refresh when several branches have accumulated useful experience:

```bash
/handoff project refresh
/handoff project          # review/apply queued suggestions
```

`refresh` only calls the model after a branch handoff changes. Changed branches are scanned in bounded batches; each successful batch is checkpointed, so a later failure never marks unprocessed branches as scanned. Deleted/archived git branch stores are skipped by default; use `/handoff project refresh all` to mine them too.

`/handoff project review` applies all queued suggestions (this profile has no interactive confirm surface from a plugin command; inspect them first with `/handoff project status` and apply/remove individually with `/handoff project add` / `/handoff project forget` if you want manual control).

You can also manage knowledge directly:

```bash
/handoff project status
/handoff project add Prefer small atomic store mutations
/handoff project add Architecture: Events are the durable source of pending work
/handoff project forget atomic store
```

Direct additions default to `Conventions`. Available sections are: `Project Overview`, `Architecture`, `Conventions`, `Workflows`, `Decisions and Rationale`, `Known Pitfalls`.

The agent-facing `handoff` tool can queue ordinary project knowledge with `project_propose`.

## Pinned rules

Pins are the protected tier. Use them for hard constraints that should never be rephrased or removed automatically:

```bash
/handoff pin Deploys go through ops/deploy.sh, never make release
/handoff pin The staging database is read-only
/handoff unpin staging database
```

Do **not** pin current task progress, branch-specific state, duplicated documentation already in `AGENTS.md`/`README`, or secrets. Pins are permanent, apply to every branch, and are never rewritten by the summarizer.

---

## Storage layout

All files live outside the project (identical layout to pi-handoff):

```text
~/.agent/agent-handoff/<project>/
├── project.md                 shared knowledge and pinned rules
├── project-candidates.json    suggestion and review state
├── project-meta.json          per-branch project-scan revisions
└── <branch>/
    ├── handoff.md             current branch handoff
    ├── events.jsonl           durable events and document snapshots
    └── meta.json              cursors and session metadata
```

The project key uses the git repository root, so launching the harness from different subdirectories reaches the same store. Outside a repository the working directory itself is the key. Set `HANDOFF_DIR` (or config `dir`) to use another storage root.

The branch document contains seven fixed sections: **Current Goal, Progress, Decisions, Constraints, Open Questions, Active Files, Next Steps**. It is capped at roughly 16,000 characters while preserving all section headings. Shared project knowledge is capped at roughly 16,000 characters; protected pins use a separate section.

### Storage limits

| File/content | Limit | Cleanup behavior |
|---|---:|---|
| `handoff.md` | 24k characters / 96 KB | Oversized model output is compacted by section; oversized writes are rejected |
| Project knowledge | 16k characters | Existing oversized sections are compacted; new facts are rejected at the limit |
| Pinned rules | 200 rules, 500 characters each, 16k total | New pins are rejected; legacy duplicate/overflow pins are removed with a marker |
| `project.md` | 128 KB | Enforced on every atomic write |
| `events.jsonl` | 1,000 lines / 4 MB | Trims toward 900 lines / 2 MB; pending overflow leaves a summarizer-visible marker |
| `project-candidates.json` | 200 pending + 500 reviewed, 240 chars/field, 1 MB | Oldest excess candidates are removed automatically |
| `project-meta.json` | 2,000 branch hashes / 2 MB | Oldest scan hashes are removed automatically |
| branch `meta.json` | 32 KB | Unknown fields are discarded and known values are normalized on startup |

---

## Configuration

All options can be overridden from the profile's `cordis.patch.yml` (a top-level YAML array of patch entries; target this plugin by `id: handoff`) **or** via environment variables. Env vars (with `PI_HANDOFF_*` aliases for parity) override config. The defaults ship in this plugin's own `cordis.patch.yml`, so you only need a profile patch to change something.

| Field | Default | Env | Purpose |
|---|---|---|---|
| `dir` | `~/.agent/agent-handoff` | `HANDOFF_DIR` / `PI_HANDOFF_DIR` | Store root override |
| `model` | active session model | `HANDOFF_MODEL` / `PI_HANDOFF_MODEL` | Summarizer model as `provider/model-id` |
| `thresholdChars` | 24000 | `HANDOFF_THRESHOLD_CHARS` | Auto-refresh once this many new chars accumulate |
| `thresholdTurns` | 20 | `HANDOFF_THRESHOLD_TURNS` | Auto-refresh every this many turns (0 = chars only) |
| `maxTokens` | 16384 | `HANDOFF_MAX_TOKENS` | Max output tokens for one summarizer call |
| `debug` | false | `HANDOFF_DEBUG` / `PI_HANDOFF_DEBUG` | Log refresh/extraction diagnostics to stderr |

### Overriding config in a profile

Edit `$DSH_HOME/profiles/<name>/cordis.patch.yml` (it starts as `[]`). A patch entry with `id: handoff` merges its `config` over the bundle's defaults (last write wins per field):

```yaml
# $DSH_HOME/profiles/<name>/cordis.patch.yml
- id: handoff
  config:
    model: "glm/GLM 5.2"     # use your configured glm provider for background folds
    thresholdTurns: 15
    # dir: "~/.agent/agent-handoff"   # optional: override the store root
    # debug: true
```

Confirm the composed value with `dsh --profile <name> --dump-config | grep -A10 'id: handoff'`, then restart the profile.

### Choosing the summarizer model

By default the summarizer reuses the session's active model (read from the session's request header, falling back to the agent's `provider`/`model` options). To pin a cheaper/faster model for background folds, set `model` in the patch layer (above) or `HANDOFF_MODEL`.

The value is `provider/model-id` exactly as dsh routes it (e.g. `glm/GLM 5.2`, `deepseek/deepseek-chat`). A model with no configured credentials is skipped and the session's active model is used instead.

---

## How it maps to pi-handoff

If you are coming from pi-handoff, here is how each piece translates. The store format is unchanged, so no migration is needed — both agents read and write the same files.

| pi-handoff | dsh-handoff |
|---|---|
| `session_start` event | `agent/session-start` (top-level agents only) |
| `before_agent_start` branch re-detect | `session/event` `turn/start` |
| `message_end` / `tool_execution_*` / `turn_end` collection | `session/event` (`user/message`, `assistant/message`, `tool/call`, `tool/result`, `turn/end`) |
| `agent_settled` drain | `agent/status` → `idle` (and `turn/end`) |
| `session_before_compact` / `session_compact` | `session/event` `compaction/*` (invalidate snapshot) |
| `session_shutdown` | `agent/disposed` |
| `context` event injection | `ctx.systemPrompt.context()` (change-gated runtime-context snapshot) |
| `complete()` summarizer call | `ctx.llm.stream()` over the resolved provider/model route |
| `/pi-handoff` command | `/handoff` command |
| `handoff` tool | `handoff` tool (same actions) |
| `/skill:write-handoff` | registered via `ctx.skills.register()` |

### Intentional differences

- **Subagents** (delegation depth > 0) do not adopt a store or get injected — they would only contend on the parent's `events.jsonl` lock.
- **No goal-change confirm offer** (pi's `before_agent_start` UI prompt): dsh has no lightweight plugin-side confirm surface. Use `/handoff clear` manually.
- **Env aliases**: `HANDOFF_*` with `PI_HANDOFF_*` fallbacks for parity.

---

## Development

End users never need to build — `lib/index.js` is committed so `dsh plugin add` works straight from the repo. Building is only for contributors changing `src/*`.

```bash
cd /home/zteng/work/Tools/dsh-handoff
npm install        # devDependencies for the build toolchain
npm run build      # bun build → lib/index.js (externals @deepseek-ai/*)
npm run typecheck  # tsc --noEmit (needs the @deepseek-ai/* type packages resolvable)
```

For local type checking, make the `@deepseek-ai/*` type packages resolvable (e.g. symlink them from an installed dsh, or `npm install` them temporarily without saving):

```bash
mkdir -p node_modules/@deepseek-ai
for p in cordis dsh-agent dsh-commands dsh-llm dsh-session dsh-skill dsh-system-prompt dsh-tools schemastery; do
  ln -s <path-to-dsh>/node_modules/@deepseek-ai/$p node_modules/@deepseek-ai/$p
done
npm run typecheck
```

Main files:

| File | Role |
|---|---|
| `src/index.ts` | Cordis plugin: lifecycle, refresh queue, commands, tool, skill, injection |
| `src/store.ts` | Paths, migrations, project knowledge, events, atomic persistence (shared format) |
| `src/collector.ts` | Deterministic redacted turn collection from dsh session events |
| `src/summarizer.ts` | Branch refresh and project-knowledge extraction |
| `src/injector.ts` | Branch and project context injection (runtime-context snapshot) |
| `src/redact.ts` | Secret denylist |
| `lib/index.js` | Prebuilt bundle (committed; externals `@deepseek-ai/*`) |
| `package.json` | Declares `dsh.bundle.patch` → makes `dsh plugin add` auto-activate this package |
| `cordis.patch.yml` | Bundle patch that self-inserts the plugin (`id: handoff`) with default config |
