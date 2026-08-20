# dsh-plugin-remote

Remote access gateway for the DeepSeek Harness (DSH) Web GUI — login auth + HTTP/WebSocket reverse proxy to the loopback DSH server.

[中文](README.zh.md) · MIT

## Install

```sh
dsh plugin --profile web add dsh-plugin-remote && dsh web
```

> Note: this is a DSH (DeepSeek Harness) plugin — install it into a profile through `dsh plugin` (or the profile's dependencies) so the gateway and its settings panel activate; a plain `npm i` alone does not wire it in.

## Screenshots

| Login | Settings → Remote Access |
|---|---|
| ![login](https://raw.githubusercontent.com/siberiah2o/dsh-plugin-remote/fc25e22ad8f901846770ef64b545c415d4d8b181/docs/screenshot-login.png) | ![settings](https://raw.githubusercontent.com/siberiah2o/dsh-plugin-remote/fc25e22ad8f901846770ef64b545c415d4d8b181/docs/screenshot-settings-panel.png) |

## Features

- **Login-gated remote access**: scrypt credentials + HttpOnly session cookie; HTTP/WebSocket reverse proxy with Host/Origin rewriting — no `--trusted-host` needed
- **White-themed login page** (shadcn/ui, mobile-friendly) with the DeepSeek Harness brand
- **Settings panel** (DSH GUI → Settings → Remote Access):
  - Remote-access whitelist (IP / CIDR; loopback always allowed; hot-reloaded)
  - Account password changes (old sessions revoked immediately)
  - Request log: every request persisted to per-day JSONL shards, download + 1/3/7-day retention rules
- **Localized zh/en**, follows the GUI language
- **Zero-install Windows desktop projection**: the plugin starts its bundled
  x64 native helper automatically; no .NET, FFmpeg, driver, or separate agent
  installation is required
- **Interactive remote desktop** in Settings → Remote Access, including
  pointer input, keyboard input, and weak-network/balanced/sharp profiles
- Zero runtime dependencies (node:http/https); the Next.js login app lives inside `gateway/`

## Usage

- Open `http://<server-ip>:4080` — the first visit creates the only account
- Manage accounts: `node lib/remote-passwd.mjs add|set-password|list|del <username>`
- Data lives under `$DSH_HOME/plugin-data/dsh-plugin-remote/` (`users.json`, `whitelist.json`, `logs/`)

## Windows desktop

On Windows 10/11 x64, the plugin launches `native/windows-x64/dsh-remote-host.exe`
after the gateway becomes ready. It connects back with a random process-local
authentication token that is never written to disk. Only logged-in gateway
users can open the viewer/control channel.

The v1 transport sends independently decodable JPEG frames and drops frames for
slow viewers instead of building a latency queue. H.264 hardware encoding and
WebRTC/UDP can replace this transport later without changing the UI or control
protocol.

Windows secure desktops (UAC prompts, sign-in, and locked sessions) cannot be
captured or controlled. Set `config.desktop: false` to disable projection.

### Development verification

```powershell
npm run native:build
npm run gateway:build
npm run test:desktop
```

## License

MIT
