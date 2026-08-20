<p align="center">
  <img src="https://raw.githubusercontent.com/hanwuji1/dsh-web-launcher/7b2c49694f16225a84f6d88d7be0df6d15fa9fc5/assets/banner.svg" width="900" alt="dsh-web-launcher — one click. zero friction.">
</p>

<div align="center">

[![npm version](https://img.shields.io/npm/v/dsh-web-launcher?color=1d4ed8&label=npm)](https://www.npmjs.com/package/dsh-web-launcher)
[![GitHub Stars](https://img.shields.io/github/stars/hanwuji1/dsh-web-launcher?style=social)](https://github.com/hanwuji1/dsh-web-launcher/stargazers)
[![License](https://img.shields.io/github/license/hanwuji1/dsh-web-launcher?color=64748b)](LICENSE)
[![test](https://img.shields.io/github/actions/workflow/status/hanwuji1/dsh-web-launcher/test.yml?label=test)](https://github.com/hanwuji1/dsh-web-launcher/actions)

English · [中文](README.zh.md)

</div>

> **Stop typing. Stop navigating. Double-click the whale and you're in.**
>
> [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) is DeepSeek's open-source agent harness.
> Its Web UI is one command and one URL away from your work — this plugin removes both.

---

## 🐋 Overview

**Good tools disappear.**

Every time you open the DSH Web UI the old way, you perform the same ritual:

```
open terminal  →  type "dsh web"  →  wait for boot  →  open browser  →  type the URL  →  Enter
```

Six steps. Ten seconds. Every single time. Ten times a day, that's **a hundred minutes a month spent just *arriving* at your tools** — not doing the work. Friction like this doesn't sound like much per click, but it taxes you every time, forever. The tax is invisible, so it never gets questioned.

**Who is this for?** Anyone who uses the DSH Web UI more than once a day on Windows and wants the entry point to be a single double-click instead of a six-step ritual — end users, agent power users, and anyone tired of typing `http://127.0.0.1:3080` from memory.

This plugin exists to **delete that ritual**:

- 🖱️ **One click to be there.** Double-click the whale. The server boots, the browser opens, you're in. There is no step two.
- 🔁 **Idempotent by design.** Already running? It just opens the browser. Double-click it ten times — nothing breaks, no port conflicts, no duplicate servers.
- 🕳️ **Invisible complexity.** The launcher script lives in `%LOCALAPPDATA%`, off your desktop. All you see is one clean app icon.
- 🌍 **Works anywhere.** The launcher is pure ASCII — it parses correctly under GBK, UTF-8, or any Windows codepage, on any machine.
- 🤖 **Agent-native.** A `web_launcher` model tool lets the agent itself install, open, or check the UI — the entry point becomes part of the workflow, not a detour from it.

> *"The best interface is no interface — the second best is one click."*

## ✅ Compatibility

| | |
|---|---|
| dsh | Verified on `0.1.0-rc.6` (web profile); installs via the standard `dsh plugin add` flow (`dsh.bundle` manifest) |
| Node | `^22.19 \|\| >=24` (as declared in `engines`) |
| Platforms | Windows 10/11 for the desktop shortcut; the `web_launcher` tool's `status` / `open` actions work on any platform |
| Last verified | 2026-08-15 (dsh `0.1.0-rc.6`, plugin install + unit tests) |

## 📦 Install / Upgrade / Uninstall

Requires a `dsh` profile (e.g. the `web` profile).

**Install**

```sh
# from npm
dsh plugin --profile web add dsh-web-launcher

# or straight from GitHub
dsh plugin --profile web add github:hanwuji1/dsh-web-launcher
```

**Upgrade**

```sh
dsh plugin --profile web update dsh-web-launcher
```

**Uninstall**

```sh
dsh plugin --profile web remove dsh-web-launcher
```

Then delete the leftovers: the `DeepSeek Harness Web.lnk` shortcut on your
desktop and the `%LOCALAPPDATA%\dsh-web-launcher` folder.

**No dsh yet?** Standalone PowerShell install:

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1        # default port 3080
powershell -ExecutionPolicy Bypass -File install.ps1 -Port 8080
```

## 🚀 Quick start

1. Install the plugin (see above).
2. (Re)start `dsh web` once — the plugin activates on boot and places the **DeepSeek Harness Web** app on your desktop.
3. Double-click the app → the server starts, polls until ready, and the browser opens.
4. Reproducible check: ask any agent in a session to call `web_launcher` with action `status` — expect `running: true` and the URL `http://127.0.0.1:3080`.

Minimal configuration (optional) — see [Configuration](#configuration) for the full table.

## 🤖 web_launcher tool

| Action | Effect |
|---|---|
| `install` | (Re)create the launcher and the whale-icon app shortcut (Windows) |
| `open` | Open the Web UI in the default browser |
| `status` | Report whether the DSH Web server is running |

## ⚙️ Configuration

Override the plugin row in your profile's `cordis.patch.yml` (e.g. `~/.dsh/profiles/web/cordis.patch.yml`). A patch replaces the whole row config, so restate the keys you keep:

```yaml
- id: dsh-web-launcher
  config:
    autoInstall: true          # create/refresh the launcher on activation (default true)
    createShortcut: true       # also create/refresh the app shortcut (default true)
    port: 3080                 # Web UI port (default 3080)
    shortcutName: Start-DSH-Web.cmd              # launcher file name (default)
    linkName: DeepSeek Harness Web.lnk           # app shortcut name (default)
    launcherDir: ""            # launcher folder; empty = %LOCALAPPDATA%\dsh-web-launcher
    desktopDir: ""             # desktop folder; empty = auto-detect
```

No environment variables and no secrets are involved.

## 🔐 Permissions & data

| Area | What the plugin does |
|---|---|
| Files written | `Start-DSH-Web.cmd` under `%LOCALAPPDATA%\dsh-web-launcher`; `DeepSeek Harness Web.lnk` on the desktop |
| Files read | None of your data — only its own template and icon inside the package |
| Processes | Spawns `powershell.exe` (WScript.Shell) to create the shortcut; the launcher spawns `dsh web` under your user account |
| Network | Loopback only: probes `http://127.0.0.1:<port>` for status; `open` delegates to the OS default browser |
| Credentials | None — never reads, stores, or sends credentials |

## 🔧 How it works

```
┌───────────────────────────┐   ┌───────────────────────────────┐
│  DeepSeek Harness Web     │──▶│  cmd /c Start-DSH-Web.cmd     │
│  (desktop .lnk, whale ico)│   │  (hidden in %LOCALAPPDATA%)   │
└───────────────────────────┘   └───────────────┬───────────────┘
                                                │
                        ┌───────────────────────┼───────────────────────┐
                        ▼                       ▼                       ▼
                 where dsh?             port listening?          start dsh web
                 (friendly error)      (open browser)           (poll → open browser)
```

- **`cordis.patch.yml`** — declares the `dsh.bundle` manifest; `dsh plugin add` auto-reconciles it into the profile's bundle stack.
- **`lib/launcher.js`** — template rendering (pure ASCII), desktop/launcher directory resolution, port probing (`fetch` + timeout), `.lnk` creation via `WScript.Shell`.
- **`lib/index.js`** — Cordis plugin (`name` / `inject: ['tools']` / `Config` schema) + the `defineTool`-based `web_launcher` tool.
- **`tools/make-icon.mjs`** — regenerates the multi-size `whale.ico` (SVG → PNG → PNG-in-ICO) from the official Harness favicon silhouette.
- **`tools/make-banner.mjs`** — regenerates this README's hero banner.

## 🩺 Troubleshooting

| Symptom | Cause & fix |
|---|---|
| `transport failure for /api/...: HTTP 403` | The **browser-trust fence** rejected a cross-origin call. Open DevTools → Network → the failed request → copy its `Origin` header. If it is not `http://127.0.0.1:3080`, something else is calling the local API — a browser extension (e.g. local-model/translate tools), a leftover tab, or an embedded iframe. Disable it or close that page. `--trusted-host` does **not** relax the Origin check. |
| `EADDRINUSE` / port already bound | Another instance is running — the launcher detects the listening port and just opens the browser. To use a different port, set `port` in `cordis.patch.yml`. |
| `dsh` not found when double-clicking | Install the CLI first: `npm install -g @deepseek-ai/dsh` |
| Desktop icon missing or generic | Run `web_launcher` with action `install` to recreate the shortcut and icon |
| Where are the logs? | The launcher console shows `dsh web` output; profile state lives under `~/.dsh` |

**Rollback**: `dsh plugin --profile web remove dsh-web-launcher` and delete the two files listed under [Uninstall](#-install--upgrade--uninstall) — the plugin leaves nothing else behind.

## 🛠️ Development

- **No build step** — plain ESM JavaScript in `lib/`; zero runtime dependencies beyond the dsh peer packages.
- **Tests**: `npm test` (node:test — no third-party dependencies needed).
- **Regenerate assets**: `node tools/make-icon.mjs` and `node tools/make-banner.mjs` (need `sharp`; set `SHARP_PATH` to its `node_modules` when not installed locally).
- **Release**: bump `version` in `package.json` → `npm publish` → `git push`. The `dsh.bundle` manifest means `dsh plugin update` picks up new versions.
- **Contributing**: PRs welcome — open an issue first for larger changes.

## ❓ FAQ

**Q: Will this run my commands as admin?** No. The launcher runs `dsh web` with your normal user permissions.

**Q: Does it interfere with the running server?** No. It detects the listening port and skips straight to the browser.

**Q: Why is the launcher a `.cmd` and not an exe?** Zero dependencies, no build chain, trivially auditable — 60 lines you can read before running.

**Q: Non-Windows?** The tool stays registered (`status`/`open` work anywhere); the desktop shortcut is Windows-only by design.

## ⭐ Support

If this plugin saves you even a few seconds a day, **star the repo** — it helps other people find it, and it tells the maintainer the friction tax was worth deleting.

[![GitHub Stars](https://img.shields.io/github/stars/hanwuji1/dsh-web-launcher?style=social)](https://github.com/hanwuji1/dsh-web-launcher/stargazers)

Found a bug or want a feature? [Open an issue](https://github.com/hanwuji1/dsh-web-launcher/issues) — PRs welcome.

## 🗂️ Project layout

```
dsh-web-launcher/
├── lib/                  # plugin code (ESM, zero runtime deps)
│   ├── index.js          # Cordis plugin + web_launcher tool
│   ├── launcher.js       # template, shortcut, status, browser helpers
│   └── template.cmd.txt  # the ASCII launcher template
├── icons/                # whale.ico + multi-size PNGs (generated)
├── assets/               # banner.svg, favicon.whale.svg (icon source)
├── tools/                # icon/banner generators (sharp)
├── tests/                # node:test unit tests
└── install.ps1           # standalone install (no dsh required)
```

## 📜 License & security

MIT — see [LICENSE](LICENSE).

To report a security issue **privately**, use the repository's **Security** tab
(GitHub Security Advisory) instead of a public issue.
