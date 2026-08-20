# dsh-achievements 🏆[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

> A gamification layer for **DeepSeek Harness (DSH)**: 102 achievements across seven five-tier growth lines, session behavior badges, trajectory chains and a Harness-native layer (Token / Context, Code Mode, Compaction, Workspace) — with real-time unlock toasts, a badge wall in the settings page, shareable cards, Agent Wrapped and a public SDK for third-party packs. **Zero core changes.**

[简体中文](./README.zh.md)

## 📸 Screenshots

| Achievements panel: profile card, rarity stats, lifetime counters and the grouped badge wall | Expanded cards: icon, rarity, description, progress, XP and unlock timestamp |
|---|---|
| ![Achievements panel](https://raw.githubusercontent.com/luumod/dsh-achievements/03642e5f89d85fb60cd76064ea2f995243e3a5b0/docs/screenshots/badge-panel.png) | ![Achievement cards](https://raw.githubusercontent.com/luumod/dsh-achievements/03642e5f89d85fb60cd76064ea2f995243e3a5b0/docs/screenshots/badge-cards.png) |

## ✨ Highlights

- **102 achievements in four product lines** — seven **five-tier lifetime growth lines** (rarity strictly `common → uncommon → rare → epic → legendary`), 10 **session behavior badges**, 20 **session trajectory achievements** across four extra chains (one of them fully hidden), and 34 **Harness-native achievements** (Token / Context, Code Mode, Compaction, Workspace). Every unlock earns XP, raises your level and persona, and is timestamped on the badge wall.
- **Real-time unlocks, no extra server** — new achievements stream to the browser over **SSE**, with a 30s polling fallback (plus refresh on focus/visibility). A first-snapshot baseline means reinstalls and upgrades never produce a toast storm.
- **Zero core changes** — the Host half listens only to the official `session/event` seam: `turn/end`, `step/start`, `assistant/message`, `step/end`, `tool/call`, `tool/result`, Code Mode's `tool/code-dispatch-start` / `tool/code-dispatch`, `compaction/summary`, plus the read-only `workspaceRegistry` projection. All read-only signals; no core patches, no forks of the runtime.
- **Pure, unit-testable core** — a strict three-layer pipeline: event **classifier** → state **reducer** → unlock **evaluate**. Each layer is a pure function with its own tests: **23 test files, 373 tests**, all green.
- **State that survives and upgrades cleanly** — v2 state (`profile` + per-session buckets) persists as a JSON file in the DSH home directory; v1 states migrate losslessly. Lifetime counters live on the profile and never depend on the 64-session retention window, with a conservative lower-bound backfill on upgrade; already-satisfied milestones are silently reconciled at startup (no reducer, no session attribution, no broadcast).
- **O(1) trajectory tracking** — P7 session facts are maintained at low-frequency boundaries only (`step/start`, `assistant/message`, `step/end`, settled tool calls); per-token chunks are never consumed or persisted.
- **Session Report V2 + History** — the most recent session becomes a structured report: six core KPIs, up to four Harness-native highlights (reasoning depth, context pressure, Code Mode concurrency, compaction, …), a tests summary with pass rate, attributed level-ups, and four collapsed advanced `<details>` (trajectory/timing, token/context, tools/files, Code Mode/compaction). A **recent-session history** (last 10, touch order) and **10 lifetime personal records** (`profile.sessionRecords`, independent of the 64-session retention window) complete the picture.
- **Privacy-safe by construction** — share text, share cards, Agent Wrapped, achievement chains and the session report read aggregate counters, achievement metadata, persona and level only. File paths and command strings never leave the engine, and the history never renders a `sessionId` / path / command.
- **Open SDK** — third-party Host plugins register achievements via `ctx.achievements.register` / `registerPack` and share the exact same evaluation path as the built-ins; duplicate ids throw immediately. Other client plugins read state through `ctx.achievementsState`.

## 🏅 The achievements (102)

Achievements fall into two tracks. Each of the **seven lifetime growth lines** has five tiers, always `common → uncommon → rare → epic → legendary` (new-milestone XP: 10 / 30 / 75 / 175 / 400):

| Line | Common | Uncommon | Rare | Epic | Legendary |
|---|---|---:|---:|---:|---:|---:|
| 🎬 Turns | 1 | 25 | 50 | 100 | 500 |
| 🔧 Tool calls | 1 | 25 | 100 | 500 | 2000 |
| 💬 Sessions | 1 | 10 | 50 | 200 | 500 |
| 🌅 Active days | 1 | 7 | 30 | 100 | 365 |
| 📖 File reads | 10 | 100 | 500 | 2500 | 10000 |
| ✏️ File edits | 1 | 10 | 50 | 250 | 1000 |
| 🧪 Test runs | 1 | 10 | 50 | 250 | 1000 |

**Special achievements** — daily streaks (`streak-3` / `streak-7`), the early `ten-turns` bonus, and ten per-session behavior badges:

| Achievement | Condition |
|---|---|
| 🔁 Déjà Vu | edit the same file 5 times in one session |
| 🕳 Rabbit Hole | read 20 files before your first edit |
| 💣 YOLO | edit 8 files before your first test |
| 🔥 It Works Eventually | pass after 5 failed tests |
| 🎰 Surely This Time | same test command fails 5 times in a row |
| 🎯 One Shot | pass the first test after a single edit |
| 📚 Librarian | read 30 distinct files in one session |
| 🌱 Touch Grass | 100 tool calls in one session |
| 🦴 Dependency Archaeologist | read a file inside a dependency directory |
| 🗿 Gigachad | read, edit and pass a test within 5 tool calls |

**P7 trajectory chains** (20 achievements, rarity strictly `common → uncommon → rare → epic → legendary`, XP 10 / 20 / 40 / 70 / 120). They read only low-frequency boundaries and never persist per-token chunks:

| Chain | Metric | Five thresholds |
|---|---|---|
| 💬 Session Marathon | distinct closed-step turns in one session | 5 / 20 / 50 / 100 / 200 |
| 🪜 Turn Depth | closed steps within a single turn | 5 / 20 / 50 / 100 / 500 |
| 🔧 Tool Barrage | settled tool calls within a single step (incl. Code Mode sub-calls) | 5 / 10 / 25 / 50 / 100 |
| ⏳ Time Anomaly | single model-request think duration (`step/start → assistant/message`, hidden) | 30s / 100s / 300s / 500s / 1000s |

**P8 Harness-native** (34 achievements) — facts that only exist inside DeepSeek Harness. Token / Context and Code Mode are session-scoped; Workspace is lifetime. `max-tokens-hit` and `context-pressure-*` stay hidden + low XP on purpose (no badge for wasting tokens):

| Group | Chains | Thresholds |
|---|---|---|
| 🧠 Token / Context | Reasoning Depth · Cache Reuse · Context Pressure (hidden) · Hit the Ceiling (hidden) | 4096/8192/16384 · 8192/32768/65536 · 70%/90% · 1 turn |
| 👯 Code Mode | Parallelism · Dispatch Marathon | 2/4/8/10 · 5/10/25/50/100 |
| 🧹 Compaction | Memory Maintenance · Compression Scale · Manual Housekeeping | 1/3/5 · 20k/50k tokens · 1 manual |
| 🏠 Workspace | Workspace Explorer · Project History | 1/3/5/10/20 · 5/10/25/50/100 sessions |

## ⚙️ Architecture

```
DSH session/event (turn/end, step/start, assistant/message, step/end, tool/call, tool/result,
                  tool/code-dispatch-start, tool/code-dispatch, compaction/summary) + workspaceRegistry
  → src/events.ts        classifier  — raw payload → standardized AchievementEvent + ToolSummary
  → src/reducer.ts       reducer     — pure reduceState: profile + per-session behavior + P7/P8 facts
  → src/achievements.ts  evaluate    — applyEvent: buildContext + evaluate every still-locked def
  → src/index.ts         Host        — persist JSON → SSE push (unlock) + read-only HTTP API; startup reconcile
  → src/client/          Browser     — EventSource + 30s polling → badge panel + unlock toasts
```

The three layers are fully decoupled and independently unit-tested; the rules layer never reads raw Harness tool payloads. The browser bundle can only import modules that are safe for it (a purity gate in `tsdown.config.ts` blocks any `node:*` import from leaking in).

## 📦 Install

Prereqs: DSH (`dsh web` works), Node ≥ 22.19.

```bash
# From GitHub (prebuilt lib/ is committed, no allowBuilds needed)
dsh plugin --profile web add "github:luumod/dsh-achievements#main"

# From a local checkout (npm pack is the reliable path on Windows; avoid `link:`)
cd dsh-achievements && npm install --legacy-peer-deps && npm run build
npm pack --ignore-scripts
dsh plugin --profile web add "<absolute path to>\dsh-achievements-0.1.0.tgz"
```

**Restart `dsh web` after installing**, then just use it — the first completed turn unlocks the first achievement (all counting rides the official event seam, so simply chatting works).

## 🎮 Usage

1. Chat and let the agent work — turns, tool calls, new sessions and daily activity accumulate silently; a toast pops in the bottom-right whenever a new achievement unlocks (rarity color, XP and flavor text included), accompanied by an unlock sound effect. The sound ships with the package (`assets/unlock.m4a`) — overwrite that file to use your own.
2. **Settings → 🏆 成就** shows the full experience:
   - **Profile card** — persona, level with XP progress, unlocked/total count, favorite tool and a rarity breakdown;
   - **Lifetime counters** — turns / tool calls / sessions / active days / file reads / file edits / test runs, plus the current and longest streak;
   - **Badge wall** — collapsed into the seven growth routes, the special/trajectory chains and the Harness-native chains (Token / Code Mode / Compaction / Workspace), each group header showing its progress bar; a single *all / locked / unlocked* filter narrows the cards; unlocked cards carry timestamps, locked ones are dimmed, hidden achievements stay `???` until unlocked;
   - **Session report** — the latest session as a structured report: six core KPIs, up to four highlights, a tests pass-rate summary, attributed level-ups, four advanced `<details>` (trajectory/timing, Token/Context, tools/files, Code Mode/Compaction), plus a collapsible **🏅 Personal Records** list and the **📚 recent-session history** (last 10, touch order);
   - **🎁 Agent Wrapped** and **📤 Share** — local, private summary and shareable cards.

## 🔌 For developers: the `ctx.achievements` SDK

Register your own achievements from a Host plugin — built-ins and third-party packs share one evaluation path and one registry (duplicate ids throw):

```ts
export const inject = ['achievements']

export function apply(ctx: Context): void {
  ctx.achievements.register({
    id: 'python-first-run',
    icon: '🐍',
    title: { zh: '蟒蛇出洞', en: 'First Python Run' },
    description: { zh: '首次运行 Python', en: 'Run Python for the first time' },
    rarity: 'uncommon',
    xp: 20,
    scope: 'session',
    evaluate: ctx => ({ unlocked: ctx.session.toolCalls >= 1 }),
  })
}
```

Or register a whole pack: `ctx.achievements.registerPack({ id, version, name, achievements })`. Registrations reconcile immediately, so an already-satisfied lifetime pack unlocks without waiting for the next live event. See `docs/SDK.md` for the full guide and `examples/python-pack.ts` for a runnable pack.

On the browser side, other client plugins read state via `ctx.achievementsState.refresh()` / `ctx.achievementsState.unlockedIds()`.

## 🛠️ Development

```bash
npm install --legacy-peer-deps
$env:DSH_NODE_MODULES = "$env:USERPROFILE\.dsh\profiles\node_modules"   # PowerShell; local runtime symlinks
npm run setup:dsh-workspace
npm run verify     # ★ one-shot gate: clean + typecheck + test + build (incl. the browser purity gate)
npm test           # vitest — 23 files / 373 tests (engine rules, streaks, idempotency, SDK, manifest…)
```

> Note: if `npm run build` fails with `Failed to import module "unrun"`, run `npm install --no-save unrun` once (tsdown optional peer, Node ≥ 22.19 recommended).

## 📁 Layout

```
dsh-achievements/
├── package.json            # dual contract: dsh.bundle.patch + dsh.client
├── cordis.patch.yml        # bundle patch layer
├── tsdown.config.ts        # client bundle + browser purity gate
├── scripts/                # build / clean / setup-dsh-workspace / verify
├── docs/SDK.md             # third-party authoring guide
├── examples/python-pack.ts # runnable sample pack
├── src/
│   ├── index.ts            # Host half: event wiring, registry, persistence, HTTP + SSE, SDK
│   ├── events.ts           # ★ event classifier (standard AchievementEvent + ToolSummary)
│   ├── reducer.ts          # ★ pure reducer (reduceState / buildContext)
│   ├── achievements.ts     # ★ pure engine (applyEvent) + domain model + 102 built-ins
│   ├── state.ts            # State v2 (profile + sessions), migration, JSON persistence
│   ├── sdk.ts              # createAchievementRegistry + AchievementPack
│   ├── code-mode-tracker.ts  # Host transient Code Mode run tracker (never persisted)
│   ├── workspace-facts.ts  # workspace snapshot projection + order-insensitive fingerprint
│   ├── gamification.ts     # levelOf / xpForLevel / RARITY_META (browser-safe)
│   ├── profile.ts          # Profile ViewModel + persona + rarity summary (browser-safe)
│   ├── session-report.ts   # Session Report V2 + highlights + personal records (browser-safe)
│   ├── share.ts            # share cards / Agent Wrapped / chains (browser-safe, privacy-safe)
│   ├── api.ts              # API path constants + SSE frame format (browser-safe)
│   └── client/             # Browser half
│       ├── index.ts        # apply: ctx.achievementsState + polling + SSE + slot injection
│       ├── achievements-client.ts  # state HTTP client
│       ├── badge-panel.tsx # badge wall (settings.section), grouped from the chain model
│       ├── badge-panel-model.ts # chain-derived grouping + status filter (pure)
│       ├── session-report-panel.tsx # Session Report V2 / history / personal records panel
│       ├── toast.ts        # unlock toast (zero-dependency DOM)
│       └── unlock-tracker.ts  # toast baseline dedup (pure)
└── tests/                  # 23 spec files: classifier / reducer / evaluate / state / SDK / chains / session-report…
```

## 🧩 Ecosystem positioning

- **Fills a gap** — the DSH ecosystem previously had no unified achievement/badge system (community research explicitly flagged the missing gamification layer).
- **Same dual-sided pattern as `dsh-soundscape`** — Host drives a pure engine off the official event seams; the browser half is a client plugin (`settings.section` + state polling).
- **Zero core changes** — read-only events + a private state file + `ctx.effect` registrations. A fork of [Blaczz/dsh-achievements](https://github.com/Blaczz/dsh-achievements), extended with behavior + trajectory achievements, the SDK and the sharing layer.

## ⚖️ License

MIT © 2026 Blaczz (upstream). An independent community plugin, not affiliated with [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).
