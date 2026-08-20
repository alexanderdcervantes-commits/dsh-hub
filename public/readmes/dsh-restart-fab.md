# dsh-restart-fab

A floating **one-click restart button** for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web GUI.

Pinned to the bottom-right corner of the page: one click arms a confirmation,
a second click restarts DeepSeek Harness **in place** — the page shows a
full-screen "restarting" overlay and automatically reloads onto the new host
once it is back up. No manual refresh, no second tab, no launcher script.

![button](https://img.shields.io/badge/dsh-plugin-web-blue) ![platform](https://img.shields.io/badge/platform-windows%20%7C%20macos%20%7C%20linux-lightgrey) ![license](https://img.shields.io/badge/license-MIT-green)

## Features

- **Fully self-contained** — the restarted host is relaunched with the *exact
  same command line* that started the current one (`node …/bin.js web --port N`),
  preserving workspace, port, profile and flags. No dependency on any launcher
  script (`DSH启动器.exe`, shell wrappers, etc.).
- **Cross-platform** — Windows (force kill via `taskkill`), macOS/Linux
  (graceful `SIGTERM` then `SIGKILL`).
- **Fast** — the old process is killed ~1.6 s after you confirm; the new host
  starts immediately.
- **Clean UX** — full-screen overlay with a spinner and elapsed timer while
  restarting; the page polls the host every second and reloads itself the
  moment the new host responds. A "refresh now" fallback appears after 60 s.
- **Sessions survive** — DeepSeek Harness persists sessions, so your
  conversations resume automatically after the restart.
- **Same-origin only** — the restart route rejects requests from other origins.

## Install

Once published, install into the `web` profile with one command:

```sh
# from npm (once the package is published)
dsh plugin --profile web add dsh-restart-fab

# or straight from GitHub (works even before the npm release)
dsh plugin --profile web add github:miisaka19800/dsh-restart-fab
```

Then **restart DeepSeek Harness once** (close the console window / stop the
process and start it again) — from then on the button is always there.

### Install from a local checkout (development)

```sh
dsh plugin --profile web add /path/to/dsh-restart-fab
```

The profile keeps a `link:` dependency, so edits to this folder are live after
the next restart.

### Uninstall

```sh
dsh plugin --profile web remove dsh-restart-fab
```

## How it works

```
button (2nd click) ──POST /dsh-restart-fab/restart──▶ server route
                                                        │ spawns detached helper
                                                        │   node restart-helper.mjs <pid> <relaunch-spec-json>
helper:  sleep 1.6s ──▶ kill server process ──▶ sleep 400ms ──▶ relaunch
                                                              (same argv, same cwd)
                                                              Windows: new visible console
                                                              (close it to stop; child processes
                                                               attach to it — no stray popups)
         ──▶ poll new host ──▶ exit
page:    overlay + poll /dsh-restart-fab/ping every 1s
         ── boot id changed? ──▶ location.reload() on the new host
```

- `GET /dsh-restart-fab/ping` — health check; reports the host `boot` id
  (`<pid>-<timestamp>`). The page reloads when it changes.
- `POST /dsh-restart-fab/restart` — same-origin only; schedules the restart
  through `lib/restart-helper.mjs`, spawned as a **detached, hidden** child so
  it survives however the server dies. It kills the server process, relaunches
  the same command line, and exits once the new host answers.

## Project layout

| path | purpose |
|---|---|
| `client/client.js` | hand-authored CJS bundle, injected into the `shell.overlay` slot (bottom-right button + restart overlay), zh/en locale |
| `lib/index.js` | server-side cordis plugin: `ping` + `restart` routes on the `webServer` service |
| `lib/restart-helper.mjs` | detached helper: kill + relaunch (cross-platform) |
| `cordis.patch.yml` | profile bundle patch that inserts the plugin entry |

No build step — plain ESM server code and a hand-authored client bundle.

## Security

The restart route only accepts same-origin POSTs (the page served by the host
itself). Restarting stops the current `dsh web` process and starts a new one —
anything running inside it (including model sessions) is interrupted, then
resumed from persistence.

## License

MIT
