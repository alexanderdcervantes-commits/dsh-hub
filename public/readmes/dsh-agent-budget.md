# @deepseek-ai/dsh-agent-budget

English | [中文](README.zh.md)

`dsh-agent-budget` gives one live agent session, or its complete local descendant tree, a durable Token limit and absolute deadline. It reserves capacity before every attributed `llm/stream` provider attempt and replaces that estimate with provider-reported usage after the stream settles, so concurrent child agents cannot all spend the same remaining balance.

The plugin is an out-of-tree DSH bundle for one Host process. A hard budget refuses new provider attempts before dispatch; it is not an exact billing system and does not forcibly cancel work already in flight.

Decision record: [durable agent-tree token admission](docs/design/2026-08-09-agent-budget-admission.md).

## What it provides

- Durable `session` and local descendant-tree scopes, restored through the DSH Storage Domain.
- Soft accounting or hard admission with concurrency-safe local reservations.
- Absolute deadlines that survive restart, plus fail-closed recovery when dispatched usage is unknown.
- Direct human control through `/budget`; optional model-facing tools are available for intentional manual compositions.
- Output convergence that reduces `maxTokens` as a bounded account approaches exhaustion.

## Install

The shipped `web` and `headless` profiles provide the Storage, Storage Domain, Token Meter, and command services this bundle requires. A custom profile must provide those services itself.

### From a pinned GitHub commit

The repository is private and the package is not published to an npm registry. Git and pnpm `11.7.0` must already have GitHub credentials. Pin a reviewed commit instead of installing a moving branch; `-w` is required because a DSH profile is a pnpm workspace root:

```sh
dsh plugin --profile web add -w github:dsh-external/dsh-agent-budget#<reviewed-commit>
```

The repository commits its `lib/` runtime entries, so installation does not need permission to execute a dependency build script. Inspect the composed entries, then boot the profile:

```sh
dsh --profile web --dump-config
dsh --profile web
```

### From a local checkout

From this repository root, link the checkout into a profile. The committed `lib/` directory must match `src/`:

```sh
dsh plugin --profile web add -w .
dsh --profile web --dump-config
dsh --profile web
```

Create and inspect the first tree-wide hard budget from the authenticated human command path:

```text
/budget set 3 tree hard 2h
/budget
```

Token amounts use millions, so `3` means 3,000,000 Tokens. See the complete [`/budget` command reference](docs/command.md) for additions and deadline extensions.

Remove the bundle and its profile dependency with:

```sh
dsh plugin --profile web remove -w @deepseek-ai/dsh-agent-budget
```

## Bundle contents

[`cordis.patch.yml`](cordis.patch.yml) loads the budget service and `/budget` command. The bundle disables model-facing budget tools and gives direct human control to [`@deepseek-ai/dsh-agent-budget/command`](docs/command.md). It deliberately does not create a second shared invariant registry; manual compositions can mount the package's invariant companions against an existing registry. Its host profile must provide a Storage backend, `ctx.storageDomain`, `ctx.tokenMeter`, and the shared command service.

## Manual composition

Use manual composition only when the bundle defaults are not appropriate. Load a Storage backend and `ctx.storageDomain` before the budget plugin. The JSON backend below is one local choice; another Storage Domain backend can replace it without changing this package. Add `@deepseek-ai/dsh-invariants` only when the host does not already provide `ctx.invariants`.

```yaml
- name: '@deepseek-ai/dsh-storage'
- name: '@deepseek-ai/dsh-storage-json'
  config:
    root: './.dsh/state'
- name: '@deepseek-ai/dsh-storage-domain'
  config:
    backend: json
- name: '@deepseek-ai/dsh-token-meter'
- name: '@deepseek-ai/dsh-invariants'
- name: '@deepseek-ai/dsh-agent-budget'
  config:
    fallbackMaxOutputTokens: 8192
    guardedToolNames: [subagent, subagent_fork, workflow, ralph]
    modelTools: true
- name: '@deepseek-ai/dsh-agent-budget/invariant'
```

`fallbackMaxOutputTokens` is required and must be a positive safe integer. For a loop-built budgeted request with no `maxTokens`, the plugin writes this ceiling into `agent/request`, making the amount reserved at `llm/stream` explicit and reconstructable in `request/header`. An attributed direct `llm/stream` call receives the same ceiling before provider resolution. The plugin does not guess a provider default or treat an unknown ceiling as zero.

`warnRatio` and `warnMaxOutputTokens` form one optional output-convergence tier; `criticalRatio` and `criticalMaxOutputTokens` form a stricter optional tier. A tier activates when remaining Tokens divided by the total Token limit falls strictly below its ratio. The active tier replaces `maxTokens` with the smaller of the request's current ceiling and the configured tier ceiling, so it never raises a caller's limit. Each tier is all-or-nothing, and when both exist the warning ratio and ceiling must both exceed the critical values. Deadline-only accounts are not clamped.

`guardedToolNames` lists model-facing tools that start resource-owning work. After a hard account becomes exhausted, expired, or uncertain, `tools/pre-execute` rejects those names before their bodies run. This protects the standard tool route; a trusted plugin calling a Workflow or Subagent service directly does not pass through the tool policy.

`modelTools` controls whether `set_agent_budget` and `get_agent_budget` are present in the model tool registry. It defaults to `true` for manual compositions that intentionally let a top-level agent handle a user's direct request to create a budget. Set it to `false` when a human command owns budget control. This package's bundle does so, which keeps balances and budget tool schemas out of model requests and their reusable prefix cache.

`managementCommandName` is optional and has no default. Set it only when the composition provides that exact lowercase human command; hard Token and deadline refusals then include command-specific recovery guidance. Without it, the service returns a truthful generic failure instead of naming a command that may not exist.

## Budget semantics

| Item | Rule |
|---|---|
| Scope | `session` charges only the bound root; `tree` also binds descendants announced later with `session.header.parentSession` |
| Token total | `inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens`; `reasoningTokens` is already included in output and is not added again |
| Deadline | `wallTimeMs` is converted once to an absolute `deadlineAt`; restart and reload do not extend it |
| Soft | Records reservations and usage but does not refuse work |
| Hard | Refuses a provider attempt when `spent + reserved + estimated input + max output` exceeds the limit, the deadline passed, or earlier dispatched usage is uncertain |
| Missing usage | Retains the reservation as `uncertain`; it is never settled as zero |
| Crash recovery | Any leftover `reserved` or `dispatched` attempt becomes `uncertain` when the domain reopens |
| Creation recovery | A failed root-binding write rolls back its new account; if both writes fail or the process stops between them, startup removes only the pristine unreferenced account residue |

“Hard” means hard request admission, not an exact billing guarantee. Input is the provider-neutral estimate from `ctx.tokenMeter`; a provider can tokenize differently, and a dispatched request may incur usage that never reaches DSH. The plugin therefore reports `accuracy: reported | estimated | uncertain` instead of presenting a false exact percentage.

Every account mutation uses one Storage Domain table record's serialized `update()` path. Concurrent local requests reevaluate the latest `spent + reserved` value, so only requests that fit can reserve. A separate durable `SessionId -> BudgetId` table retains tree ownership across process restarts.

Account creation reports both the binding failure and a failed account rollback. Startup deletes an unbound account only when it has never been referenced, reserved, settled, or otherwise revised; any non-pristine account without its root binding fails plugin initialization as corruption.

## Service API

`ctx.agentBudget` exposes the policy service. Ordinary integrations create and inspect accounts; integrations that own provider attempts use the explicit lifecycle methods.

```ts ignore-check
const view = await ctx.agentBudget.create(agent, {
  scope: 'tree',
  enforcement: 'hard',
  tokenLimit: 200_000,
  wallTimeMs: 30 * 60_000,
})

ctx.agentBudget.get(agent)

const reservation = await ctx.agentBudget.reserve({
  sessionId: agent.id,
  provider: 'deepseek-official',
  model: 'deepseek-v4-flash',
  purpose: 'conversation',
  estimatedInputTokens: 12_000,
  maxOutputTokens: 8_000,
})

await ctx.agentBudget.increase(agent, {
  additionalTokens: 1_000_000,
  additionalWallTimeMs: 15 * 60_000,
})
```

An account cannot be replaced or reset. Only its exact root Agent can increase its Token limit or extend its deadline. Additional capacity can restore exhausted or expired admission, but it never clears uncertain usage. `markDispatched()`, `settle()`, `release()`, and `markUncertain()` are idempotent for an attempt that is no longer present, allowing cleanup paths to converge without double charging.

## Development and verification

`lib/` is the checked-in Git installation artifact. The project `.npmrc` selects the private `@deepseek-ai/*` scope; pnpm 11 reads its `${NPM_TOKEN}` authentication mapping from the trusted user-level `~/.npmrc`. Set `NPM_TOKEN`, run `pnpm install --ignore-scripts`, then run `pnpm run check`. The SDK packages are pinned to the reviewed `0.0.1-rc.2` set. Do not link a DSH source checkout into this repository. After changing `src/`, review the generated `lib/` diff and keep the runtime entries and declarations aligned.

Run the deterministic Token policy eval without an API key:

```sh
pnpm run test:eval
```

The eval drives the public service against durable JSON storage. Its seven scenarios cover exact-limit admission, a one-Token overrun, concurrent reservations, one shared descendant-tree account, soft-limit continuation, fail-closed missing usage, and a root-only additive grant that reopens exhausted admission. `npm test` adds service, command, invariant, recovery, lifecycle, clamp, and Loader-composition coverage.

## Model Experience

### `set_agent_budget`

#### What the model sees

The tool creates the first budget for the calling top-level agent. It succeeds only inside that exact live agent's active driver and only when the current open turn contains a host-attested `{ kind: 'user' }` message. Plugin-generated context, a child agent, a direct registry call, or a later model decision cannot grant itself more capacity. Existing accounts cannot be increased, replaced, or reset through the tool. The model supplies `scope`, `enforcement`, and at least one of `token_limit` or `wall_time_ms`; the result contains status, totals, remaining tokens when bounded, deadline when present, and accuracy.

##### Successful creation result

```markdown
{"active":true,"budget_id":"budget-…","root_session_id":"main","scope":"tree","enforcement":"hard","token_limit":200000,"spent_tokens":0,"reserved_tokens":0,"remaining_tokens":200000,"status":"active","accuracy":"reported"}
```

#### Token effect

When `modelTools` is enabled, the stable schema is present on every request. Each call retains its small fixed-shape arguments and result in Session history. When it is disabled, this tool contributes no schema or call history.

#### KV Cache effect

Append-only tool calls and results follow the reusable request prefix. Balance changes do not rewrite earlier prompt content.

### `get_agent_budget`

#### What the model sees

The tool returns the budget bound to the exact calling agent, or `{ "active": false }` when none exists. It is read-only and requires the same live-driver identity check so one agent cannot query another session by guessing an ID.

##### No-budget result

```markdown
{"active":false}
```

#### Token effect

When `modelTools` is enabled, the stable schema is present on every request. Each query retains one compact status object in Session history. When it is disabled, this tool contributes no schema or call history.

#### KV Cache effect

Append-only tool calls and results follow the reusable request prefix. The plugin does not rewrite the system prompt on settlement; admission failures instead become terminal logged stream errors.

## Known Limitations and Deferred Work

- Accounting is atomic only inside one Harness process. Two processes must not write the same account until Storage Domain has a transactional or compare-and-set backend suitable for cross-process counters.
- Calls without `sessionId`, sessions that predate the plugin without a binding, and external child agents with no local Session are not attributed.
- Input tokens are estimated before dispatch. Exact provider count-token APIs and versioned price tables are deferred; monetary, organization-wide, periodic, and paid-tool budgets are not implemented.
- Standard Workflow/Subagent model tools are guarded, but trusted direct service calls can bypass that route. Strict tree admission needs provider-attempt IDs plus Subagent and Workflow pre-start seams.
- A deadline stops new work; it does not forcibly kill an already-dispatched provider call or an uncooperative tool.
- Existing accounts can only be increased or extended by their exact root Agent. Lower, replace, pause, reset, close, and uncertain-usage reconciliation are not implemented. Missing usage remains fail-closed for hard budgets.
