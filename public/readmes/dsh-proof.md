# dsh-proof

Independent read-only acceptance layer for the DeepSeek Harness.

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

Before each top-level turn closes, `dsh-proof` spawns a **read-only** verifier
subagent, collects its structured verdict, and steers any non-`pass` gaps back
into the driving agent. It is the harness's missing "is the agent actually
done" gate — no other plugin can substitute for it.

## Install

```sh
dsh plugin --profile <name> add github:EvilIrving/dsh-proof
```

Or, from a checkout:

```sh
dsh plugin --profile <name> add ./dsh-proof
```

The bundle patch inserts one plugin row (`dsh-proof`); it needs the
`subagents` service (the official `dsh-subagent` providers), which the base
profile already mounts.

## How it works

| Step | Mechanism |
|---|---|
| Intercept "about to close" | `agent/turn-stopping` (serial, awaited before the turn commits) |
| Spawn a read-only verifier | `ctx.subagents.start('spawn', …)` with `toolFilter.deny` + `outputSchema` |
| Block recursion | `delegationDepthOf(agent) > 0` filter + `maxDepth: 0` |
| Steer gaps back | `agent.inject(gap details)` + `agent.steer(followup)` on `fail` / `insufficient-evidence` |

The verifier inherits the parent's tool set and is narrowed by the deny list
(see [deny list](#deny-list)); it never sees a whitelist that could
accidentally hide a newly added read-only tool. A verifier that ends with
`stopReason !== 'completed'` or a missing `structured` result is treated as
"no objection", so a failed proof never fails the user's turn.

## Config

```ts
export interface Config {
  providerName: string          // default 'spawn'
  maxAttemptsPerTurn: number    // default 3
  denyTools: string[]           // default mutating-tool deny list
  verifierPrompt: string        // read-only acceptance instruction
  followupInstruction: string   // steering text after a failed verdict
}
```

Set any field from `cordis.yml`:

```yaml
plugins:
  dsh-proof:
    config:
      maxAttemptsPerTurn: 2
      denyTools: [write, edit, str_replace_editor, bash, run_code, subagent]
```

### Deny list

`toolFilter.deny` removes tools from the verifier's **inherited** full set.
`tools.restrict` validates every name loudly, so `denyTools` must name tools the
deployment actually registers. The default is
`write, edit, str_replace_editor, bash, run_code, subagent`, which keeps
read-only discovery tools (`read`, `read_image`, `glob`, `grep`) available. A
deployment that adds its own mutating tools must extend the list; a deployment
that forbids even shell/read access should switch to an explicit `allow`
whitelist (set `denyTools` and `verifierPrompt` to match, or extend the plugin
for an `allowTools` field).

## Model Experience

### Request context and condition

#### What the model sees

The top-level agent receives an injected user message listing the verifier's
gaps and evidence, followed by the configured `followupInstruction`. Only a
non-`pass` verdict injects anything; a passing turn adds nothing.

#### Token effect

Zero-direct effect on passing turns. A failing turn adds one bounded injected
message (gaps + evidence) plus the short follow-up line.

#### KV Cache effect

Append-only: the injected context and follow-up are appended as new user
messages, never rewriting earlier request tokens.

## Known Limitations and Deferred Work

- **Deny list must match the deployment's tools** — `tools.restrict` fails loud
  on unknown names, so a mismatched default blocks verifier startup. The exact
  mutating-tool set is deployment-specific and is resolved at first install.
- **No evidence normalization** — the verifier gathers evidence itself; this
  plugin does not re-implement diff/test/typecheck/lint. A deployment wanting
  specific evidence channels should extend `verifierPrompt`.
- **Best-effort spawn** — a provider that is absent or rejects the request
  degrades to a no-op (logged), rather than failing the user's turn.
