# better-reasoning-slider

[中文版](./README.zh.md)

A DeepSeek Harness WebUI plugin that replaces the composer's model/effort dropdown with a compact, theme-aware control:

- **Model picker** — click the model pill to switch models.
- **Reasoning effort slider** — drag to adjust effort (e.g. low / high / max) with visible tick nodes on the track.

The slider writes through the same per-session `ModelDirectory` as the official `@deepseek-ai/dsh-client-ui-model-selection` plugin, so the `/model` popup and the composer stay consistent.

## Features

- Official-style composer trigger: model name + current effort + chevron.
- Floating popup that stays inside the viewport.
- Model groups and descriptions from the existing model directory.
- Reasoning effort as a continuous slider with snap-to-node behavior.
- Nodes are rendered directly on the slider track and align with the thumb.
- Theme adaptive: uses DSH design tokens (`--dsw-specific-menu`, `--dsw-alias-*`, `--dsw-shadow-lv3`), so it follows light/dark Harness themes.
- No configuration file needed.

## Install

### From GitHub (recommended)

```sh
dsh plugin --profile web add github:vvvspec/better-reasoning-slider
```

Or with a full URL:

```sh
dsh plugin --profile web add https://github.com/vvvspec/better-reasoning-slider
```

Restart `dsh web` after installing.

### Local development

```sh
dsh plugin --profile web add file:/absolute/path/to/better-reasoning-slider
```

Restart `dsh web`.

## Usage

1. Open the Harness WebUI.
2. In the composer, click the model pill (e.g. the current model name).
3. A popup opens with:
   - The model list (grouped by provider).
   - The **Reasoning** slider below the model list.
4. Drag the slider thumb to the desired effort level.
   - The thumb snaps to the nearest available node when you release.
   - The selected effort is written to the current session and stays consistent with `/model`.

## How it works

- The plugin shadows the official `conversation.input.model` slot.
- It uses the same `modelDirectories` service as the official model selector.
- The slider maps a 0–1000 draft range to the model's available `reasoning.efforts` list.
- On release, it commits the nearest effort through `ModelDirectory.select()`.

## Requirements

- DeepSeek Harness Web profile.
- A model that exposes `reasoning.efforts` to see the slider. Models without reasoning efforts still show the model picker.

## License

MIT
