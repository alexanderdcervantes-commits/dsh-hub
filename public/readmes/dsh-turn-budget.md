# dsh-turn-budget

English | [中文](README.zh.md)

Advisory turn step-budget reminders for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

Opt-in advisory step-budget reminders: when an agent turn exceeds a configured step count, the plugin appends a source-attributed reminder telling the model to wrap up. Advisory only — it never rejects or rewrites a step, so it cannot deadlock the loop. Default compositions leave it disabled; opt in through a profile overlay.

Companion to [`@deepseek-ai/dsh-turn-meta`](../context/turn-meta/README.md) (per-step metadata); a second first-plugin-style example in the guard group.

## Config

```yaml
- id: turn-budget
  name: '@deepseek-ai/dsh-turn-budget'
  config:
    maxSteps: 12    # optional step budget per turn; default 12
    remindEvery: 4  # optional cadence after the budget; default 4
    enabled: true   # optional master switch; default true
```

`maxSteps` and `remindEvery` must be positive safe integers; any other value fails plugin load. With defaults, steps 13, 17, 21, … get one reminder each.

## Reminder semantics

The plugin prepends an `agent/pre-step` listener and delegates first. It derives the current step from the durable session log (turn/start + step/start), so reminders survive resume and replay. When the derived step exceeds `maxSteps` by a multiple of `remindEvery`, it appends one sourced `UserMessage`; rejection or an in-budget step records nothing.

Each reminder uses the exact snapshot source `{ kind: 'plugin', plugin: 'turn-budget', form: 'snapshot', sections: [{ name: 'turn-budget', text: <same text> }] }`. The `./invariant` companion validates that shape, checks the named step against the open step boundary, and fails any reminder at or below its budget.

## Model Experience

### What the model sees

One line per cadence step past the budget:

```markdown
[turn-budget] turn=<turn> step=<step> exceeds the <maxSteps>-step budget. Wrap up the remaining work now: prefer one decisive action and finish the turn.
```

### Token effect

One short line per cadence step accumulates until compaction shadows it.

### KV Cache effect

None: the reminder carries no state that later preparation steps depend on.

## Known Limitations and Deferred Work

- The budget is per turn; there is no per-session budget yet. Add one by scanning `turn/start` counts the same way `dsh-turn-meta` counts prior turns.
- Reminders are advisory text only; a hard stop would need a separate guard policy.
