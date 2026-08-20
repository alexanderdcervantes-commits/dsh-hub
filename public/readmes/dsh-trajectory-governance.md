# dsh-trajectory-governance

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

**Agent trajectory governance & anomaly diagnosis for DeepSeek Harness (dsh).**

Rebuilds the flat `session/event` log into a **structured, multi-branch trajectory
tree**, keeps **observation-layer snapshots**, and runs **three temporal anomaly
strategies** (loop deadlock / invalid retry / goal drift) with results mounted on
tree nodes and surfaced in an **independent GUI tab**.

> Zero kernel modification · consume-only event subscription · observation-layer
> snapshots (no control-plane rollback) · independent SQLite storage · never
> overwrites the official Trajectory view.

---

## Why

The official Trajectory page is a **flat raw-event log**. For long-running agent
tasks (dozens of turns, subagents, forks) you cannot see:

- which tool call belongs to which sub-task / subagent / fork branch,
- where the agent started drifting from the original goal,
- whether it is looping in place burning tokens (deadlock / invalid retry).

This plugin is an **upper observation & reasoning layer**: it consumes committed
events and derives structure, snapshots, and diagnoses — it never steers,
intercepts, or rolls back the agent. Both views coexist.

| Aspect | Official Trajectory | dsh-trajectory-governance |
| --- | --- | --- |
| View | flat raw event log | structured multi-branch trajectory tree |
| Lineage | none | parent/child + fork/subagent branches (derived implicitly) |
| Snapshots | no | observation-layer snapshots (nodeId + context hash + branchId) |
| Diagnosis | no | loop_deadlock / invalid_retry / goal_drift with confidence + suggestions |
| Storage | host storage | plugin-private SQLite (`~/.dsh-trajectory-governance/`) |
| Behavior | — | consume-only; never schedules, forks, or rewinds the agent |

## Architecture

```
dsh web profile
 ├─ @deepseek-ai/dsh-base (official core)
 └─ dsh-trajectory-governance (this bundle)
      │
      │  ctx.on('session/event' | 'session/created' | 'session/disposed'
      │         | 'subagent/start' | 'subagent/end')   ← emit-mode, post-commit, read-only
      ▼
 ┌─ ingest ───────────────┐   ┌─ tree ─────────────────┐
 │ normalize (scalars)    │──▶│ cross-session trajectory │
 │ sqlite (events/sessions)│   │ tree + branch attach    │
 └────────────────────────┘   └─────────────────────────┘
 ┌─ snapshot ─────────────┐   ┌─ diagnose ──────────────┐
 │ index-only snapshots    │   │ 3 strategies (async)    │
 │ LRU/TTL prune, branches │   │ results → anomalies DB  │
 └────────────────────────┘   └─────────────────────────┘
      │
      ▼
 ┌─ api (host) ────────────┐   ┌─ client (browser) ─────┐
 │ /trajectory-governance/  │◀──│ independent Tab:        │
 │ api/* (JSON, same-origin)│   │ conversation.view slot, │
 └─────────────────────────┘   │ id 'trajectory-…'       │
                               └─────────────────────────┘
```

Data flow: `session/event` (durable, post-commit) → normalized + persisted →
tree/snapshot/diagnosis services → JSON API → the GUI tab. The diagnosis engine
runs **asynchronously** on an interval (incremental watermark + tail overlap) and
never blocks the agent loop.

## Install

Requires dsh `>= 0.1.0-rc.6`. Two ways:

**Bundle (published / git):**

```sh
dsh plugin --profile web add github:dfycaly98931680/dsh-trajectory-governance#<commit-sha>
```

A git install fetches sources, so the package ships a `prepare` build; pnpm
requires an explicit allow-list for it (add the printed key to the profile's
`pnpm-workspace.yaml`, then re-run):

```yaml
allowBuilds:
  dsh-trajectory-governance: true
```

Alternatively install a built tarball (`pnpm pack`) — no build permission needed.

**Dev overlay (no pnpm):**

```sh
dsh web --patch C:\path\to\dsh-plugin\overlay.dev.yml
```

Then restart the web app. You should see `[trajectory-governance] loaded;
storage=... sessions=N events=M anomalies=K` in the logs.

## Use

1. Run any agent task in the GUI (ideally a long one).
2. Open the **轨迹治理 / Trajectory Governance** tab (a separate `conversation.view`
   entry — the official Trajectory tab is untouched).
3. Pick a session: the tree renders with **branch badges** (subagent/fork),
   **snapshot marks (★)**, and **red-highlighted anomaly ranges (⚠)**.
4. Click a node for the raw event + mounted diagnosis report (type, confidence,
   severity, description, suggestion).
5. Use the snapshot bar to capture checkpoints at any node, list them, and jump
   back; delete stale branches via the API/CLI.

CLI inspection utilities (against the plugin's own SQLite):

```sh
node scripts/inspect.mjs   [dbPath]                 # sessions/events overview
node scripts/tree.mjs      <sessionId> [dbPath]     # trajectory tree JSON
node scripts/snapshot.mjs  <dbPath> <cmd> [...]     # list|create|context|delete|prune
```

## Configuration

The plugin row accepts `config` (all optional; deep-merged over defaults):

```yaml
- insert:
    - id: trajectory-governance
      name: dsh-trajectory-governance
      config:
        storage:
          path: C:/data/trajectory.db   # default ~/.dsh-trajectory-governance/trajectory.db
        diagnosis:
          strategyA:
            enabled: true
            windowSize: 5
            similarityThreshold: 0.85
            resultSimilarityThreshold: 0.8
          strategyB:
            enabled: true
            minRounds: 3
          strategyC:
            enabled: true
            sampleEveryNRounds: 5
            similarityThreshold: 0.5
            consecutiveSamples: 2
            embedder: lexical        # 'lexical' built-in; 'llm' is the extension seam
          analyzer:
            enabled: true
            intervalMs: 10000
          alerts:
            enabled: true
            minConfidence: 0.8
            cooldownMs: 600000
            channels:
              desktop: true          # browser Notification (client side)
              cordisEvent: true      # 'trajectory/anomaly' bus event for the ecosystem
              webhook:
                url: ""              # Feishu/DingTalk/Slack-style text webhook
          actions:
            onLoopDeadlock: notify   # notify | suggest-stop(一键中断按钮) | auto-stop
            onInvalidRetry: notify
            onGoalDrift: notify
          cost:
            enabled: true
            tokenPricePerM: 0.28     # adjust to your provider pricing
            estimateWhenUsageMissing: true
```

Full schema: `DIAGNOSIS_CONFIG_SCHEMA` in `src/diagnose/config.ts`.

## Alerts & stop-loss (v0.2)

When a NEW anomaly is detected (confidence ≥ `alerts.minConfidence`), the plugin:

1. emits `trajectory/anomaly` on the Cordis bus (ecosystem notification plugins
   can subscribe) and POSTs a text webhook if configured — the message is in
   **stop-loss language**: type, confidence, and how much tokens/money/time the
   range already consumed (from official `assistant/message.usage`);
2. the GUI tab polls `/api/alerts`, shows a desktop notification (browser
   Notification API, permission button in the bar), and pins abnormal sessions
   on top of the dropdown sorted by wasted tokens;
3. offers a **one-click interrupt** (`POST /api/actions/interrupt`) which calls
   the official `agent.cancel` capability — never a monkey-patch. Default tier
   is `notify`; `auto-stop` (loop deadlock only, confidence ≥ 0.9) can be
   configured for unattended setups.

## Breakpoints & waste reports (v0.3)

**Breakpoint exit — the legitimate lightweight "rollback".** Instead of a
control-plane rewind (already covered by [dsh-turn-rewind](https://github.com/Anionex/dsh-turn-rewind)),
this plugin offers a *diagnosis-driven restart*: at any snapshot / anomaly
start / selected node, **"branch a new session here"** resolves the target down
to the nearest stable `turn/end` boundary and calls the **official
`ctx.sessions.fork(source, boundary)`** — a fresh child session seeded at that
point. It never touches workspace files, keeps the observation-layer stance,
and turns "you wasted money here" into a one-click action.

**Waste attribution report** — not another usage-stats dashboard (that niche is
saturated): it answers the attribution question nobody else does, *"which
sessions wasted tokens/money, on which anomaly types"*:

```sh
curl http://127.0.0.1:3080/trajectory-governance/api/report/waste          # all sessions (Markdown + JSON)
curl "http://127.0.0.1:3080/trajectory-governance/api/report/waste?sessionId=<id>"  # one session detail
```

Both are also reachable from the tab ("浪费报告" / "本会话报告" buttons).

## Quick demo (reproduce loop deadlock & goal drift)

**Instant (no waiting for a real loop):** seed a synthetic session into the
live store, refresh the tab, pick `demo-session`:

```sh
node scripts/demo-seed.mjs            # writes into the default live DB
```

You should see a tree with red-highlighted `loop_deadlock` (5 identical tool
calls) and a severe `goal_drift` range, plus a snapshot mark (★).

**Real agent:**

1. Give the agent a **long, open-ended refactor** prompt (e.g. "重构这个项目为
   TypeScript 并补单元测试，先读代码再动手").
2. Let it run until it starts **repeating the same tool call** (same file, same
   content) with no visible progress — Strategy A flags `loop_deadlock` on the
   trigger node.
3. Ask a follow-up in a different domain ("顺便帮我看看怎么做番茄意面") — after
   N sampled turns Strategy C flags `goal_drift` (mild/moderate/severe) against
   the original baseline.

Verify: the tree tab highlights the ranges in red; `scripts/inspect.mjs` shows the
anomaly counts; `scripts/tree.mjs <sessionId>` dumps the mounted `anomalyInfo`.

## Screenshots

> TODO — add after the first live run: tree tab overview / anomaly card / snapshot
> list. (Placeholders reserved here.)

## Testing

```sh
npm install
npm run build && npm test    # 46 tests: normalize/store/subscriber/tree/snapshot/diagnose/api
```

## Boundaries (important)

- **Zero kernel modification** — no fork, no monkey-patch, no host storage access.
- **Consume-only events** — `session/event` etc. are emit-mode, post-commit,
  fire-and-forget listeners; payloads are never mutated.
- **Observation-layer snapshots** — a snapshot is an index (nodeId + context hash
  + branchId); context is rebuilt from the event store. This plugin never forks,
  resumes, or rewinds the agent.
- **Independent Tab** — registered with its own slot id; the official Trajectory
  page (id `trajectory`) is never overwritten.
- **Preview API** — `SESSION_FORMAT_VERSION = 0`, no compatibility implied. The
  event vocabulary is centralized in `src/core/event-catalog.ts`; unknown types
  honor the envelope's `ignorable` marker.

## Repository layout

```
src/
  index.ts                  # Cordis plugin entry (name/apply)
  core/                     # types + 44-type event catalog
  ingest/                   # normalize + session-event subscriber
  persistence/              # node:sqlite store (events/sessions/snapshots/anomalies)
  tree/                     # trajectory tree builder + queries
  snapshot/                 # observation snapshots + branch manager
  diagnose/                 # similarity, config, 3 strategies, engine, mount, runtime
  api/                      # host JSON API (/trajectory-governance/api/*)
  client/                   # independent GUI tab (conversation.view, id 'trajectory-governance')
tests/                      # node:test suites
scripts/                    # inspect / tree / snapshot / smoke
cordis.patch.yml            # official bundle load row
plugin.manifest.yaml        # self-describing metadata (loader uses cordis.patch.yml)
```

## License

MIT — see [LICENSE](LICENSE). Part of the [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
ecosystem. Topic: `dsh-plugin`.
