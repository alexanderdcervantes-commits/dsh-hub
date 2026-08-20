# AICC Main Brain for DeepSeek Harness

`@cola1018/dsh-aicc-zhunao` is a public DeepSeek Harness (DSH) preset for a
main-brain workflow. It combines a delegation-first persona, a root-session
execution gate, and a portable `aicc-law` skill for task boundaries, evidence,
and safety checks.

## Install

Install the published package into the DSH profile you use:

```sh
dsh plugin --profile web add @cola1018/dsh-aicc-zhunao
```

Restart the profile if DSH reports that a restart is required.

## Use

Select **AICC Main Brain** as the agent preset. The root session will plan,
delegate, and synthesize; direct write, edit, PowerShell, and Bash tool calls
are denied at the execution layer. Child agents remain available for bounded
implementation tasks.

Before dispatching or closing work, load the bundled `aicc-law` skill. Its rules
are intentionally general so the package does not depend on a private task
system, local filesystem layout, account, memory store, or business context.

## Included files

- `preset.yml` — preset name and description
- `agent.cordis.yml` — DSH bundle patch and orchestration composition
- `main-brain-gate.js` — root-session execution gate
- `skills/aicc-law/SKILL.md` — portable operating rules

## License

[MIT](LICENSE)
