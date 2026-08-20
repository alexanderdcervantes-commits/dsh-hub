# dsh-token-cost

A DSH plugin that shows per-project LLM token usage and converts tokens to **RMB cost**, split into:

- **输入（未命中）** — uncached input tokens
- **命中** — cache-hit input tokens (`cacheReadTokens`)
- **输出** — output tokens

Costs are calculated from the model's standard price table (CNY per 1M tokens). Unknown models are listed with their token counts but no cost, so you can add/override prices without touching code.

## Features

- Reads local DSH session logs (`~/.dsh/sessions` or `$DSH_HOME/sessions`).
- Aggregates by **project** (the session `cwd`) and by **model**.
- Adds a 💰 button to the DSH web sidebar footer; the panel shows project totals and expandable model-level breakdown.
- Zero runtime npm dependencies: uses Node's built-in `node:zlib` Zstandard decoder.
- Loopback-only HTTP API (`/dsh-token-cost/*`).

## Install

Install the **subdirectory** `dsh-token-cost`, not the parent `dsh plugin` folder. The parent folder has no `package.json`, so installing it produces no sidebar button.

Use the absolute path (the path contains a space, so **quote it**):

```sh
dsh plugin --profile web add "file:/Users/dg/Documents/dsh plugin/dsh-token-cost"
```

Or, from inside this directory:

```sh
cd /Users/dg/Documents/dsh plugin/dsh-token-cost
dsh plugin --profile web add "file:$PWD"
```

If you previously installed the wrong folder, remove it first:

```sh
dsh plugin --profile web remove "dsh plugin"
dsh plugin --profile web add "file:/Users/dg/Documents/dsh plugin/dsh-token-cost"
```

Then restart `dsh web` and refresh the browser. A 💰 button appears at the bottom of the sidebar.

You can also use the included installer script:

```sh
./scripts/install.sh
```

## How it works

The host plugin scans every `session.jsonl.zstd` / `session.jsonl` under the DSH sessions directory. It replays:

- `session.cwd` → project
- `request/header` → current model
- `assistant/chunk { type: 'usage' }` and `assistant/message.usage` → input / cache-hit / output tokens

The same `(turn, step)` usage sample is de-duplicated (a later `assistant/message` replaces the earlier usage chunk), matching DSH's own token-meter accounting.

## Price table

Built-in DeepSeek official RMB prices (元 / 1M tokens):

| Model | Input (miss) | Cache hit | Output |
|---|---:|---:|---:|
| `deepseek-chat` / `deepseek-v4-flash` | 2 | 0.5 | 8 |
| `deepseek-reasoner` / `deepseek-v4-pro` | 4 | 1 | 16 |

You can override prices in the profile's `cordis.patch.yml` (a patch row replaces the whole `config`, so include every price you want to keep):

```yaml
- id: token-cost
  config:
    prices:
      deepseek-chat:
        input: 2
        hit: 0.5
        output: 8
      deepseek-reasoner:
        input: 4
        hit: 1
        output: 16
      deepseek-v4-flash:
        input: 2
        hit: 0.5
        output: 8
      deepseek-v4-pro:
        input: 4
        hit: 1
        output: 16
```

## API

- `GET /dsh-token-cost/api/stats` — full per-project/per-model JSON
- `GET /dsh-token-cost/api/prices` — active price table
- `GET /dsh-token-cost/healthz` — liveness

## License

MIT
