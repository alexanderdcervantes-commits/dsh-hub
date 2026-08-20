# dsh-vision-LMstudio

English | [中文](README.zh.md)

Local LM Studio vision recognition plugin for the **DSH (DeepSeek Harness) Web GUI** —
recognize, describe, and OCR local images or clipboard screenshots with a local
vision model. All inference happens on your own machine; images never leave it.

## Features

- **Agent tools** (registered host-side, available in every session)
  - `lmstudio_vision` — recognize a local image file by absolute path
  - `lmstudio_clipboard` — recognize the current clipboard image (screenshot / copied image), no file path needed
  - `lmstudio_models` — list loaded models and mark the most recently loaded one (the auto-selected one)
- **Settings panel**: "Settings → LM Studio Vision" — configure server URL / model / default
  prompt / temperature / max tokens, refresh the model list, and one-click recognize a
  local image or the clipboard
- **Automatic model selection** — without an explicit `model`, the most recently loaded
  model is used (the first entry of the server's model list; the native `/api/v0/models`
  endpoint is filtered by `state`, so models that are JIT-visible but not loaded never
  get picked). No specific model is preset.
- **Persistent config** — `~/.dsh/dsh-lmstudio-vision.json` (atomic writes), shared by the
  panel and the agent tools

## Requirements

- DSH (DeepSeek Harness) with the web profile
- [LM Studio](https://lmstudio.ai/) with a vision model loaded and the local server started
  (Developer → Start Server, default port 1234)
- Windows for the clipboard tool (uses Windows PowerShell 5.1 `Get-Clipboard -Format Image`)

## Install

```
pnpm install
pnpm build
dsh plugin --profile web add link:<path-to-this-repo>/packages/dsh-lmstudio-vision
```

Then restart DSH (`dsh web`) and refresh the page. `dsh plugin` appends the package
to `dsh.profile.bundles` automatically (the package declares `dsh.bundle`).

## Configuration

Configurable from the settings panel or by editing `~/.dsh/dsh-lmstudio-vision.json`:

```json
{
  "baseUrl": "http://127.0.0.1:1234",
  "model": "",
  "prompt": "Describe this image in detail.",
  "temperature": 0.2,
  "maxTokens": 1024
}
```

Leave `model` empty to auto-select the most recently loaded model, or set an
explicit model id to override it.

## Repository layout

- `packages/dsh-lmstudio-vision/src/index.ts` — host half: LM Studio engine, API routes,
  agent tools, system-prompt announcement
- `packages/dsh-lmstudio-vision/src/client/` — browser half: the settings panel
- `packages/dsh-lmstudio-vision/cordis.patch.yml` — bundle patch plugin row
- `shared/tsdown.client.ts` — build preset (follows the dsh-web-ui `clientBundle` convention)

## License

[BSD-3-Clause](LICENSE)
