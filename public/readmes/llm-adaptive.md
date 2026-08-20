# llm-adaptive

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

Adaptive model routing plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Adds an `adaptive` provider to the model picker: every LLM request is classified by a flash classifier (low / medium / high / critical) and routed to the matching backend provider through config-driven chains.

## Features

- **Per-request complexity classification** — `deepseek-v4-flash` called directly (never through a proxy, no recursion).
- **Context-aware judging** — injects a rolling session-goal summary plus the recent turns into the classifier prompt (continuation / wrap-up / error-loop rules).
- **Sticky level protection** — a mid-task downgrade is held at the previous level unless the message carries explicit downgrade or wrap-up signals.
- **Config-driven routing chains** — chains come from `pool.json` → `routing.levels` (`$active` expands to the active provider, missing entries fall back to defaults); transport failures walk down the chain.
- **Classifier config from the pool** — URL / model / key reference read from the `classifier` section of `pool.json` (no hardcoded credentials).
- **Fail-open** — any classification failure degrades to `medium`; never blocks a request.
- **Observable** — every decision (level, cause: llm/sticky/cache) is written to the plugin log.
- **120s decision cache** — keyed by user-text head plus goal fingerprint.

## Requirements

- DeepSeek Harness (dsh)
- A model pool file at `~/.dsh/tools/cc-switch-sync/pool.json` with:
  - `classifier` section: `url`, `model`, `key_ref` (resolved against `~/.dsh/.credentials.yaml`, pool `api_key` as fallback)
  - `routing.levels`: `low` / `medium` / `high` / `critical` chains
- A DeepSeek API key for the classifier

The pool file is produced by the `cc-switch-sync` import tool (or can be authored by hand). The plugin reads it on every request, so pool edits take effect immediately.

## Install

```bash
dsh plugin add llm-adaptive
```

or, from a local checkout:

```bash
cd ~/.dsh/profiles/web && npx pnpm@10 install   # with "llm-adaptive": "file:plugins/llm-adaptive"
```

Restart the dsh web service, then select `adaptive（自动路由）` in the `/model` picker.

## Usage

1. Open `/model` and choose `adaptive（自动路由）`.
2. Every subsequent LLM request is classified (low/medium/high/critical) and routed to the first available provider of that level's chain.
3. Decisions are logged with `level=… cause=… chain=…` to `~/.dsh/hooks/plugin.log`.

The explicit level models (`low`, `medium`, `high`, `critical`) are also listed in the picker for direct selection.

## How it works

A custom `LlmAdapter` for the `adaptive` provider: `stream()` awaits classification (async generator), then forwards to the target backend via `ctx.llm.prepareCall` + `stream` (unified chunk protocol, passthrough). Request-level interception was chosen over proxy or request-layer hooks because dsh hot-swaps configuration and the prepared-call contract requires matching provider/model options.

## License

MIT
