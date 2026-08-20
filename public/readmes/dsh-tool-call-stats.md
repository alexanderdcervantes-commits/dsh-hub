# dsh-tool-call-stats

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

A tiny community plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`).

It records every committed **tool call** in the current harness process and exposes a `tool_stats` tool, so the model (or you) can ask at any point:

> Which tools were used, how often did they fail, and where did the time go?

Not to be confused with the token/cost trackers in the ecosystem (`dsh-token-stats`, `dsh-usage-report`, ...) — this plugin counts **tool-call dispatches**, not tokens. Also unrelated to `dsh-tool-stat` (a descriptive-statistics math tool).

> **Status**: built and verified end-to-end against the dsh v0.1 developer preview (headless profile, live DeepSeek session): both event listeners record real dispatches and `tool_stats` returns the table below. Upstream interfaces may still change during the preview.

Example output (from the verification run):

```
tool  calls  errors  avg_ms
----  -----  ------  ------
bash  1      0       23
read  1      0       8
```

## How it works

Everything in dsh is a plugin, and this one is deliberately minimal — three seams, ~100 lines, no build step:

- `tools/execute` (waterfall): wraps each dispatch to record its start time, then delegates via `next()`.
- `tools/result` (observer): counts each committed result per tool name and accumulates duration; `result.isError` drives the error counter.
- `ctx.tools.register(defineTool(...))`: exposes `tool_stats`, which returns a canonical JSON array (`output.schema`) and renders a plain-text table for the model.

All state is in-memory and process-local. Nothing is persisted; restarting dsh resets the counters. When the plugin is unloaded, Cordis disposes both listeners and the tool automatically — no manual cleanup code.

## Install

### Into a profile (recommended)

```sh
dsh plugin --profile <name> add github:disyli/dsh-tool-call-stats
```

pnpm ≥ 10 will ask you to allow the package before running install scripts (this package has none, but the prompt may still gate the git install). Follow the hint dsh prints, then re-run `add`.

Verify the layer and start:

```sh
dsh --profile <name> --dump-config   # shows a "# == dsh-tool-call-stats" layer
dsh --profile <name>
```

### As a local overlay (source checkout)

From a deepseek-harness checkout, point a patch at the local file:

```yaml
# stats.cordis.yml
- insert:
    - id: tool-stats
      name: '/absolute/path/to/dsh-tool-call-stats/index.js'
```

```sh
pnpm dsh web --patch ./stats.cordis.yml
```

## Use

Ask the agent things like:

- "Use tool_stats to show tool usage so far."
- "Which tool failed the most in this session?"

## Limitations

- Process-local only: counters reset on restart and are not shared across sessions.
- Calls aborted before the registry commits a result are not counted (their timing entries are garbage-collected after 10 s).
- Built against the dsh v0.1 developer preview; upstream interfaces may change ("THERE WILL BE COMPATIBILITY-BREAKING CHANGES").

## License

MIT
