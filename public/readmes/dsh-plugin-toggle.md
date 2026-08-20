# dsh-plugin-toggle

English | [中文](README.zh.md)

A DeepSeek Harness (DSH) **plugin switchboard** for the web GUI.

Open **Settings → Plugins → Plugin Switch**. Every loaded plugin is a card with:

- a short description (from that package's `package.json` `description`)
- enabled / disabled + fiber phase (running / pending / failed / …)
- **Start / Stop** (runtime only — does **not** rewrite `cordis.yml`)
- fuzzy search (name / module / id / description; subsequence match)

Core / surface plugins (`webserver`, `connection`, `session`, `agent`, …) are marked **Core** and cannot be stopped from this UI, so the page cannot take itself down.

## Install

```sh
dsh plugin --profile web add github:DamonKoy/dsh-plugin-toggle
```

Restart `dsh web`, then open **Settings → Plugins → Plugin Switch**.

Or add the repo as a profile dependency and include the bundle:

```json
{
  "dependencies": {
    "dsh-plugin-toggle": "github:DamonKoy/dsh-plugin-toggle"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-plugin-toggle"]
    }
  }
}
```

Then `pnpm install` in the profile directory and restart `dsh web`.

## What you get

| Feature | Notes |
|---|---|
| Plugin cards | Title, entry id, description, enabled tag, phase |
| Categories | Grouped sections (core / UI / theme / tools / fun / other), collapsible |
| Sorting | Within a group: togglable plugins first, then by status (running first), then name |
| Fuzzy search | Tokens match as substring or subsequence across fields incl. category |
| Start / Stop | `entry.update({ disabled })` — runtime only, no `tree.write()` |
| Core guard | Surface/runtime entries cannot be stopped (id- and module-name-based); others need a two-step confirm |
| Usage history | Every toggle is persisted to `~/.dsh/dsh-plugin-toggle.jsonl` (last 1000), shown in a collapsible “使用记录” section |
| Persistence | Installed as a composition plugin — survives `dsh web` restarts |

## HTTP API (same origin)

| Method | Path | Role |
|---|---|---|
| `GET` | `/plugin-toggle/list` | `{ entries: [...] }` |
| `GET` | `/plugin-toggle/logs` | `{ records: [...] }` (recent usage history, newest first) |
| `POST` | `/plugin-toggle/set` | `{ entryId, enabled }` → `{ ok, entry? \| message? }` |

`POST` is same-origin only.

## Layout

```
dsh-plugin-toggle/
  lib/index.js          Host: list + set routes over the Cordis Loader
  client/client.js      Client: Settings tab (ModuleLoader factory)
  cordis.patch.yml      Bundle insert (`id: plugin-toggle`)
```

The client `exports.inject` is the **service** name `slots` (not a package name). Using package names here parks the client fiber forever.

## License

MIT
