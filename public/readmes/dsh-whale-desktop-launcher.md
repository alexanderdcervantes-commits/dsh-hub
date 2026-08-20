# DSH Whale Desktop Launcher

[中文](README.zh-CN.md) | English

<p align="center">
  <img src="https://raw.githubusercontent.com/HUITianYi/dsh-whale-desktop-launcher/326075f04a5b22d9b6e1d9a85f2ba418333460c4/assets/whale-girl.png" width="280" alt="Whale-girl desktop launcher icon">
</p>

A Windows desktop launcher plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It creates an icon-branded `DeepSeek Harness.exe` on the desktop, starts the local DSH Web service in the background when needed, and opens the UI in Microsoft Edge or Google Chrome app mode without tabs, an address bar, or ordinary browser toolbars.

## Features

- One click starts or reconnects to `dsh web` without opening a terminal window.
- Chromium `--app` mode provides a compact desktop-style window.
- The whale-girl PNG and multi-resolution ICO are bundled in the plugin.
- The current DSH executable, arguments, and working directory are captured when the bundle activates, so npm and source checkouts both work.
- Existing healthy servers are reused; a different service occupying the configured port fails visibly.
- The installer refuses to overwrite an unrelated desktop executable.
- No `preinstall`, `install`, `postinstall`, or `prepare` lifecycle scripts run during package installation.

## Requirements

- Windows 10 or Windows 11.
- DeepSeek Harness with the `web` profile.
- Microsoft Edge or Google Chrome.
- Node.js 22.19 or newer, as required by DSH.

## Install

Install the bundle into the Web profile:

```powershell
dsh plugin --profile web add github:HUITianYi/dsh-whale-desktop-launcher#v0.1.0
```

Restart `dsh web` once. Plugin activation writes the portable launcher configuration under `~/.dsh/whale-desktop-launcher/` and creates:

```text
Desktop\DeepSeek Harness.exe
```

Double-click the desktop application for later launches.

## Optional whale-maid skin

The launcher works with the related non-commercial [`Small-tailqwq/dsh-deep-whale`](https://github.com/Small-tailqwq/dsh-deep-whale) skin:

```powershell
git clone https://github.com/Small-tailqwq/dsh-deep-whale "$HOME\.dsh\plugins\dsh-deep-whale"
dsh plugin --profile web add "$HOME\.dsh\plugins\dsh-deep-whale\maid-atelier"
```

That skin has its own CC BY-NC-SA 4.0 license and attribution requirements.

## Uninstall

Remove the DSH bundle:

```powershell
dsh plugin --profile web remove dsh-whale-desktop-launcher
```

The plugin deliberately does not delete user-facing files on unload. Remove these manually if desired:

```text
%USERPROFILE%\Desktop\DeepSeek Harness.exe
%USERPROFILE%\.dsh\whale-desktop-launcher\
```

## Development

```powershell
npm run build:launcher
npm test
npm run pack:check
```

The prebuilt executable is committed under `assets/`, so installing from GitHub does not require build-script approval.

## Licenses

- Source code: [MIT](LICENSE).
- Whale-girl artwork: [CC BY-NC-SA 4.0](ASSET_LICENSE.md), non-commercial use only.

This is a community project and is not an official DeepSeek AI product.
