<div align="center">

# KoboldCpp for DeepSeek Harness

**`dsh-koboldcpp-hands`** — give your DeepSeek Harness agent a pair of local hands.

[![version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/MicroHEROX/dsh-koboldcpp-hands)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-339933)](https://nodejs.org)
[![harness](https://img.shields.io/badge/DeepSeek%20Harness-0.1.0--rc.8-4D6BFE)](https://github.com/deepseek-ai/deepseek-harness)

**[English](README.md) · [中文](README.zh-CN.md)**

</div>

A third-party **tool plugin** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that lets the **online model** (your main conversation model) hand repetitive, token-cheap labor to a **local KoboldCpp** (llama.cpp) server — plain text work *and* vision work (image analysis / OCR / comparison).

The main model stays where your deployment puts it. When it decides a job is better done locally, it calls:

- **`koboldcpp_run`** — run one prompt on the local text model (batch rewrites, name translations, string munging, short summarization, extraction).
- **`koboldcpp_vision`** — send images to a local multimodal model (OCR, image analysis, multi-image comparison) with structured report templates.

The plugin manages the local server lifecycle: it launches **your** KoboldCpp binary with **your** `.kcpps` launch config (which owns the GPU backend, model, `mmproj`, port), waits for the model to load, and stops the server on an idle timeout and/or harness exit. An externally started KoboldCpp is reused and **never** killed.

---

## What it does

- **Two model-facing tools** registered on the harness tool registry (`ctx.tools`), following the official `dsh-tools` contract (`defineTool`, canonical JSON values, pure render/presenters, `exec.signal` forwarding).
- **On-demand server lifecycle**: first tool call spawns `exePath` with your `kcppsPath` + `--port`, polls `/v1/models` until healthy, self-heals if the server dies, and stops per `stopBehavior` (`exit` / `idle` / `never`). Windows process-**tree** termination (`taskkill /T`) because KoboldCpp relaunches itself as a child process.
- **Text + vision wire support**: non-streaming OpenAI-compatible chat-completions; images sent as the standard multimodal `content` array.
- **Three image sources** for the vision tool: local file paths, `data:`/`http(s):` URLs, or the images attached to the current conversation (read through the harness attachment service). **Note:** the conversation-attachment source requires a main model that declares image input — with a text-only main model only `image_paths` / `image_urls` work (see [current limitation](#current-limitation-text-only-main-models--images-arrive-by-link-or-local-path-only)).
- **Structured vision prompts** structured, machine-verifiable report contracts: `analyze` (8-section report), `ocr` (character-exact), `compare` (multi-image, 5-section) — plus a fidelity rule for the online model (relay verbatim, never invent, preserve uncertainty).
- **Live config**: a `llm-koboldcpp:` section in the harness user-settings document overrides the plugin config without a restart; `KOBOOLDCPP_EXE` / `KOBOOLDCPP_KCPPS` env fallbacks.
- **Safe ownership**: external KoboldCpp processes are reused, never touched; only servers the plugin spawned are stopped.

## What it does NOT do

- Does **not** replace the harness LLM provider — the online model stays the main model; the local model is only reached through the two tools.
- Does **not** decide GPU backends, model paths, or templates for you. Everything about the KoboldCpp launch lives in **your `.kcpps` file** (backend `usecuda`/`usevulkan`/`usecpu`, `model_param`, `mmproj`, port). No probing, no auto-flags.
- Does **not** modify any DeepSeek Harness file; it is a pure add-on plugin.
- Does **not** bundle or host GGUF / `mmproj` model files — bring your own.
- Does **not** use streaming or an API key (local server; no credentials involved).
- Does **not** run inside the harness process as a service — it spawns a separate KoboldCpp process only when needed.

## Requirements

| Item | Requirement |
| --- | --- |
| Node.js | ≥ 20 |
| DeepSeek Harness | installed (`npx @deepseek-ai/dsh web` or a source checkout) |
| KoboldCpp binary | `koboldcpp.exe` (NVIDIA/CUDA) or `koboldcpp-nocuda.exe` (AMD/Vulkan), any release with `/v1/chat/completions` |
| GGUF model | your own; vision additionally needs a multimodal GGUF **and its `mmproj`** (set `"mmproj"` in the kcpps) |

## Install

Inside your harness project (the directory whose `cordis.yml` / `cordis.patch.yml` composes your deployment):

```sh
npm install dsh-koboldcpp-hands
```

The package ships a `dsh.bundle` manifest, so **the plugin row is inserted automatically** by the harness loader — you only need the config overrides below. From a source checkout of the harness you can instead point the plugin row directly at a clone of this repo (plain-dependency install, row not auto-inserted):

```yaml
- insert:
    - id: koboldcpp-tool
      name: '../dsh-koboldcpp-hands'
```

## Configure

You own the launch settings. After an npm install the row already exists with defaults; **override it by id from your profile `cordis.patch.yml` without `insert`** (an `insert` with the same id crashes the loader with `duplicate loader entry id`):

```yaml
- id: koboldcpp-tool
  name: 'dsh-koboldcpp-hands'
  config:
    baseURL: 'http://127.0.0.1:5001'                     # must match the port in your kcpps
    exePath: 'C:\path\to\koboldcpp-nocuda.exe'           # your binary (CUDA or Vulkan build)
    kcppsPath: 'C:\path\to\your-model.kcpps'             # your launch config: backend + model + mmproj + port
    autoStart: true
    stopBehavior: idle
    idleStopMinutes: 30
```

(For a plain-dependency install — git/local row, no bundle — use `- insert:` with the same row instead.)

The launched command is exactly:

```
koboldcpp-nocuda.exe "C:\path\to\your-model.kcpps" --port 5001
```

Full config reference (all 17 fields with defaults): [docs/api.md](docs/api.md) §1.2.

## Using the tools

### `koboldcpp_run` — text

| param | type | required | meaning |
| --- | --- | --- | --- |
| `prompt` | string | yes | instruction/text sent as a user message |
| `system` | string | no | optional system instructions |
| `temperature` | number | no | sampling temperature (0–2) |
| `max_tokens` | integer | no | output cap (default `maxTokens`) |
| `stop` | string[] | no | stop sequences |

Returns `{ text, reasoning?, model, usage, elapsedMs }`.

### `koboldcpp_vision` — images / OCR

| param | type | required | meaning |
| --- | --- | --- | --- |
| `mode` | `analyze`/`ocr`/`compare` | no | built-in prompt template (default `analyze`) |
| `prompt` | string | no | custom instruction (overrides the template) |
| `image_paths` | string[] | no | local images (png/jpg/jpeg/webp/gif/bmp, ≤20 MB each) |
| `image_urls` | string[] | no | `data:image/...` or `http(s)://` URLs |
| `temperature` | number | no | sampling temperature (lower for OCR, ~0.2) |
| `max_tokens` | integer | no | output cap |
| `stop` | string[] | no | stop sequences |

Image sources resolve in order: explicit `image_paths` + `image_urls` → the most recent image(s) attached to the conversation → clear error. `compare` sends 2–4 images in ONE request for joint reasoning.

Returns `{ text, reasoning?, model, images, usage, elapsedMs }`.

> Vision requires a multimodal GGUF **and its `mmproj` projector** in the kcpps. Without `mmproj` the request completes but the model cannot see the image.

## Current limitation: text-only main models — images arrive by link or local path only

**In the current release (plugin 0.1.0, harness 0.1.0-rc.8), when your main model is text-only, `koboldcpp_vision` can only receive images through the two explicit channels: `image_paths` (local file paths) and `image_urls` (online / `data:` links).** The conversation-attachment source is unavailable in that setup — and this is a hard limit of the harness, not of this plugin:

1. When you paste or drop an image while a text-only model is selected, dsh **rejects the message before it ever enters the session** with `attachment-error / MODEL_DOES_NOT_SUPPORT_IMAGES` (the UI shows "当前模型不支持图片，请切换支持图片的模型"). The check lives in `dsh-host-apiproxy`: the selected model's declared input modalities (from the pi-ai model catalog) must include `image`; a model catalogued as `input: ["text"]` (e.g. `deepseek-v4-flash` / `deepseek-v4-pro` on the `opencode-go` route) is refused.
2. Even if an image part got through, `dsh-llm-pi-ai`'s streaming adapter rejects image content for the same text-only models (`UNSUPPORTED_CONTENT`), and subagent continuation sessions block images in the browser client entirely.
3. Because the message is refused before it is durably attached, the "most recent conversation-attachment" source has nothing to read — unlike OpenCode / Pi, dsh does **not** currently turn a pasted image into a temporary file path for text-only models.

**Workarounds that work today:**

- Ask the model to call `koboldcpp_vision` with `image_paths: ["C:\\...\\photo.png"]` — any path readable by the harness process.
- Or pass an online link: `image_urls: ["https://example.com/photo.png"]` (also `data:` URLs).
- Or switch the main model to one whose catalog entry declares image input (e.g. `minimax-m3`, `qwen3.7-plus`, `kimi-k2.6`, `kimi-k3`, `grok-4.5` on the `opencode-go` route) — the conversation-attachment source then works automatically.

Tracked upstream in [deepseek-harness discussion #1378](https://github.com/deepseek-ai/deepseek-harness/discussions/1378) (request: allow image attachments for text-only models and deliver them to tools as links/paths). This section will be updated when the harness relaxes the restriction.

## Roadmap

**Possible / planned directions:**

- More vision modes and prompt templates (document layouts, table extraction).
- Multi-model `autoswapmode` support (kcpps-level; the wire `model` field is already configurable).
- Publishing to the npm registry and the `dsh-plugin` topic.
- Batch jobs: drive many local calls from one agent turn.

**Deliberately NOT planned:**

- Automatic GPU/backend detection or flag injection — **your kcpps is authoritative** by design.
- Becoming an LLM provider adapter — the plugin stays a tool; the online model stays the main model.
- Streaming responses — tool calls get the full answer in one round trip (simpler and sufficient).
- Bundling model files (`gguf`/`mmproj`) or modifying DeepSeek Harness itself.

## Uninstall

Removing the plugin is as clean as installing it:

1. **Remove the plugin row** from your profile `cordis.patch.yml` (or `cordis.yml`):
   ```yaml
   # delete this block
   - insert:
       - id: koboldcpp-tool
         name: 'dsh-koboldcpp-hands'
   ```
2. **Restart the harness** (or let HMR reload if you edit the config live). The two tools (`koboldcpp_run`, `koboldcpp_vision`) are unregistered automatically — the online model no longer sees them.
3. **Server lifecycle** after removal:
   - `stopBehavior: exit` — the plugin stops its spawned KoboldCpp when the harness shuts down gracefully.
   - `stopBehavior: idle` — the server stops after the idle window.
   - `stopBehavior: never` — the server keeps running; stop it yourself (e.g. `taskkill /PID <pid> /T /F` on Windows).
   - An externally started KoboldCpp is **never** touched.
4. **No residue**: the plugin writes nothing into the harness, leaves no lingering processes on graceful shutdown, and creates no config files of its own. If you installed it via npm, remove it with `npm uninstall dsh-koboldcpp-hands`.

### Removing the plugin package itself

- **Installed via npm** — one command removes the package from your project:
  ```sh
  npm uninstall dsh-koboldcpp-hands
  ```
- **Installed from a git clone** (profile row points at the checkout) — remove the profile row, then delete the checkout:
  ```powershell
  Remove-Item -Recurse -Force C:\path\to\dsh-koboldcpp-hands
  ```
  ```sh
  rm -rf /path/to/dsh-koboldcpp-hands
  ```

## Version & compatibility

| Component | Version |
| --- | --- |
| This plugin | `0.1.0` |
| DeepSeek Harness | `0.1.0-rc` series (tested against npm `@deepseek-ai/*` `0.1.0-rc.8`) |
| Node.js | ≥ 20 |
| KoboldCpp | any release exposing `/v1/chat/completions` |

Peer dependencies (runtime): `@deepseek-ai/cordis ^4.0.1`, `@deepseek-ai/dsh-tools`/`dsh-llm`/`dsh-session`/`dsh-attachment`/`dsh-settings`/`dsh-launch-environment` `>=0.1.0-rc.2`, `@deepseek-ai/schemastery ^3.18.1`.

## Development

```sh
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest run (45 tests: unit, tool, integration, Loader composition)
npm run build       # tsc -> lib/
```

Tests include a REAL-composition tier (app boot → Cordis Loader → `cordis.yml`) per the harness testing policy, and a real-machine scenario driver (`tests/real-driver.mjs`) for autostart / reuse / not-running behaviors.

## Documentation

| doc | content |
| --- | --- |
| [docs/engineering.md](docs/engineering.md) | structure, plugin contract, commands, test tiers |
| [docs/api.md](docs/api.md) | authoritative API reference (Config, tools, classes, error codes) |
| [docs/glossary.md](docs/glossary.md) | standard terminology |
| [docs/solutions.md](docs/solutions.md) | pitfalls, troubleshooting, methodology |

## Credits & thanks

- **[DeepSeek AI](https://github.com/deepseek-ai/deepseek-harness)** — the DeepSeek Harness platform this plugin plugs into, and the reference implementations (`dsh-llm-deepseek`, `dsh-tool-todo`) that define the patterns we follow.
- **[LostRuins / KoboldCpp](https://github.com/LostRuins/koboldcpp)** — the excellent local llama.cpp server with an OpenAI-compatible API that makes all of this possible.
- **[Cordis](https://github.com/cordiverse/cordis)** — the plugin runtime that powers the harness.
- The open-source models and quantizers (llama.cpp ecosystem, GGUF) that run locally on your machine.

## License

[MIT](LICENSE). Not affiliated with DeepSeek AI or LostRuins; `dsh` and `koboldcpp` are trademarks of their respective owners.
