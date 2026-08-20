# dsh-stage-gate

> Stage-gate governance tools for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

Model-callable stage gates: create an acceptance checklist, verify it with evidence, and get a clear **PASS / BLOCK** conclusion — a governance layer for agents that run multi-phase work. State is in-memory, scoped per session.

**English** | [中文](./README.zh.md)

## What it does

Registers four tools on `ctx.tools`:

| Tool | Purpose |
|------|---------|
| `gate_open(gateId, title, stage?, items)` | Create a stage gate with its full acceptance checklist (status `open`). |
| `gate_check(gateId, items)` | Verify the gate: send the ENTIRE item list (whole-value replacement); each item carries `met`/`unmet`/`n/a` and optional `evidence`. The gate is `blocked` while any item is `unmet`, `passed` when all are `met`/`n/a`. |
| `gate_list()` | List every gate in the session with its lifecycle status. |
| `gate_close(gateId, reason?)` | Close a gate (`closed`). A closed gate rejects further `gate_check` unless `allowReopen` is set. |

## Lifecycle

```
open → in_review → passed   (all items met/n/a)
  │                  │
  │                  └── blocked   (any item unmet) → (allowReopen) → open
  └────────────────────────────→ closed (gate_close)
```

- `status` on the gate is the lifecycle state machine.
- `conclusion` on the latest `gate/check` records the most recent verification result.

## Install

```sh
dsh plugin --profile web add dsh-stage-gate
dsh web
```

The tools become model-visible in the Web UI. Model keys and a DeepSeek provider must already be configured (see the [DeepSeek Harness Web UI guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)).

## Configuration

`allowReopen` (default `true`): whether a `gate_check` on a `closed` gate is accepted. When `false`, checking a closed gate throws `Error: gate "<id>" is closed`.

Override in your profile's `cordis.patch.yml`:

```yaml
- id: tool-stage-gate
  config:
    allowReopen: false
```

## How it works

![Architecture diagram](https://raw.githubusercontent.com/changingwang/dsh-stage-gate/e5f46123542c78d28823340651549f9b8f7a33b4/docs/diagram.md)

Gate state is kept **in memory**, scoped per agent session (`gate_open` /
`gate_check` / `gate_close` mutate an in-memory map keyed by session + gate id).

This package deliberately does **not** write custom session events
(`gate/*`). DeepSeek Harness's session persistence refuses to reload a log
containing an event type outside its known-event whitelist unless the event is
marked `ignorable`, and `Session.append` has no API to set that marker. Custom
plugin events would make sessions **unloadable after restart** — see
[`docs/BUG-2026-08-17-session-log-pollution.md`](docs/BUG-2026-08-17-session-log-pollution.md).

**Trade-off:** gate state resets when the harness restarts. This is the correct
cost for an out-of-repo plugin until the harness opens a registration surface
for downstream plugin events.

## Development

```sh
pnpm install
pnpm test       # vitest (14 tests)
pnpm typecheck  # strict tsc
pnpm build      # emit lib/
```

## Compatibility

- Requires DeepSeek Harness `>=0.1.0-rc.5`.
- Web profile only (tools are model-facing).
- Gate state is in-memory and resets on harness restart (see How it works).

## License

MIT © 2026 [changingwang](https://github.com/changingwang)
