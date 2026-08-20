# dsh-start

> **English** | [**中文**](README.zh.md)

A one-click launcher for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) Web on macOS. Stop typing `dsh web` by hand — start, stop, and check the server from a single command, or build a Dock-able **DSH.app** that behaves like a normal macOS application.

## Features

- **One command, four modes** — `dsh-start` (foreground, logs visible, Ctrl+C to stop), `dsh-start -d` (daemon, logs to `~/.dsh/web.log`), `dsh-start stop`, `dsh-start status`.
- **Duplicate-launch guard** — if the server is already up (default port 3080), it just opens the browser instead of starting a second instance.
- **Auto-open browser** — polls the port after launch and opens `http://127.0.0.1:3080` once ready (both foreground and daemon modes).
- **Normal-app feel (DSH.app)** — `scripts/build-dsh-app.sh` compiles a stay-open launcher app at `~/Applications/DSH.app`: double-click to start, Cmd+Q (with a confirmation dialog) to stop. Re-clicking the Dock icon ensures the server is running and opens the browser.
- **Permission-safe by design** — the app delegates the server process to Terminal (which has full file-access context), avoiding the macOS sandbox/TCC `EPERM` failures that occur when a bare app spawns `dsh` directly.

## Install

### From npm (recommended)

```sh
npm install -g dsh-start
dsh-start            # start in foreground
dsh-start status     # is it running?
```

### From source

```sh
git clone https://github.com/zhengjy01/dsh-start.git
cd dsh-start
./bin/dsh-start      # same CLI
```

### Build the Dock app (optional)

```sh
dsh-start --build-app        # same as scripts/build-dsh-app.sh
# or
./scripts/build-dsh-app.sh   # needs python3 + Pillow for the icon
```

## Usage

| Command | What it does |
| --- | --- |
| `dsh-start` | Start in the foreground; Ctrl+C stops the server |
| `dsh-start -d` | Start in the background (window can close); log at `~/.dsh/web.log` |
| `dsh-start stop` | Stop the running server (found via the port) |
| `dsh-start status` | Show whether the server is running and its URL |
| `dsh-start --build-app` | Build/refresh `~/Applications/DSH.app` |

The port defaults to `3080` (the `dsh web` default); override with the `DSH_PORT` environment variable.

## How it works

- `scripts/start-dsh.sh` checks the port first. Already running → open the browser. Otherwise it launches `dsh web` in the foreground (or `nohup`'d in daemon mode) and watches for readiness.
- `scripts/DSH.applescript` is a stay-open AppleScript app (`osacompile -s`): `run`/`reopen` ensure the server is up and open the browser; `quit` asks for confirmation and runs `start-dsh.sh stop` before exiting.
- The build script generates the icon with Pillow, compiles the app, patches `Info.plist`, and registers it with LaunchServices.

## Troubleshooting

- **`EPERM: operation not permitted` when launching from the app** — this is a macOS permission-context issue: run `dsh-start --build-app` (v2 app delegates to Terminal), or start via `dsh-start` in your own terminal.
- **Sessions "missing" after a restart** — session data is never deleted; it lives in `~/.dsh/sessions`. If the app-spawned server crashed at boot (see `~/.dsh/web.log`), start from the terminal instead and the sidebar repopulates.
- **First launch of DSH.app** — macOS may ask "DSH wants to control Terminal"; click Allow (one-time).

## License

[MIT](LICENSE) © zhengjy01
