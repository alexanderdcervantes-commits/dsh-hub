# dsh-plugin-muapi

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that gives the agent a `muapi_generate` tool for [MuApi](https://muapi.ai) — a unified API for 100+ image, video, audio, and 3D generation models (Flux, Veo 3, Kling, Seedance, Suno, and more) behind a single `x-api-key`.

## Install

```sh
dsh plugin add @dsh-plugin/dsh-plugin-muapi
```

Then, in Settings → muapi, set your API key credential (create one at [muapi.ai/access-keys](https://muapi.ai/access-keys)).

## What it does

Registers one tool, `muapi_generate`:

- `model` — a MuApi model slug, e.g. `flux-schnell-image` or `kling-v2-1-image-to-video`. Browse the full catalog at [muapi.ai/playground](https://muapi.ai/playground); each model's exact parameters are documented at `https://muapi.ai/playground/{model}/llms.txt`.
- `input` — that model's parameter object, e.g. `{ "prompt": "a serene mountain lake at dawn" }`.

The tool submits the job (`POST https://api.muapi.ai/api/v1/{model}`), polls `GET https://api.muapi.ai/api/v1/predictions/{request_id}/result` until it completes or fails, and returns the output URLs.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `tool.enabled` | `true` | Expose the tool to the agent. |
| `tool.apiKeyEnv` | — | Credential reference for your MuApi API key. |
| `tool.baseUrl` | `https://api.muapi.ai/api/v1` | API base URL. |
| `tool.pollIntervalMs` | `3000` | Delay between result polls. |
| `tool.timeoutMs` | `600000` | Max time to wait for a job to complete. |

## License

MIT
