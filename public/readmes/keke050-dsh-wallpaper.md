# dsh-wallpaper

Set a custom background wallpaper for the DeepSeek Harness desktop app.

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

English | [中文](README.zh.md)

## Features

- **Presets** — 6 built-in gradient wallpapers (aurora, ocean, sunset, forest, night, sakura), plus a "none" option.
- **Custom image URL** — paste any `http(s)` image URL.
- **Upload** — pick a local PNG / JPG / GIF / WebP (≤ 10MB); it is stored on the host and survives restarts.
- **Opacity slider** — controls how strongly the wallpaper shows through the UI, from hidden (0%) to dominant (100%). At 100% the base background, cards and even the message bubbles become translucent so the wallpaper fills the whole window.
- Durable: config and the uploaded image live in `$DSH_HOME/storages/wallpaper/`, served at a stable `/dsh-wallpaper/image` path, so nothing is lost when the desktop app rebinds its random loopback port.

## Install

```sh
dsh plugin --profile web add github:keke050/dsh-wallpaper
```

Then restart DeepSeek Harness. Open **Settings → 壁纸 / Wallpaper**.

## Usage

1. Pick a preset, paste an image URL, or upload a local image.
2. Drag the opacity slider to taste — higher means the wallpaper is more visible.
3. Click **Remove wallpaper** to restore the default background.

## How it works

- The host half registers three loopback HTTP routes (`/dsh-wallpaper/config`, `/dsh-wallpaper/upload`, `/dsh-wallpaper/image`) and persists the wallpaper to `$DSH_HOME/storages/wallpaper/`.
- The client half renders the settings section and injects CSS that puts the wallpaper on `body` and makes the app's background surfaces translucent (by overriding `--dsw-alias-bg-*` / `--dsw-specific-*` design tokens), so the wallpaper shows through the conversation area, not just the sidebar.

## License

MIT
