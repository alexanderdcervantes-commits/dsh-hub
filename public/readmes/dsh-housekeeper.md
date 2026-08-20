# 🧹 dsh-housekeeper — Environment Housekeeper

[中文说明](README.zh.md) · [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin

Keep your agent's hands clean: **toolchain inventory, safe one-click cache cleanup, and machine rules (AGENTS.md) editing** — all inside the DSH Web GUI settings. Zero runtime dependencies, one command install.

- 📋 **Toolchain inventory** — auto-detects node/pnpm/git/gh/ffmpeg/Edge/Chrome locations and versions
- 🗑️ **Honest cache cleanup** — scans the `.tmp` and cache directories agents leave behind: size / file count / mtime, 4000-file truncation markers, 30-day-untouched highlighting, click-to-expand content preview, check and delete
- 🛡️ **Whitelist protection** — only project `.tmp` dirs and cache-root children are deletable; `..` escapes, symlink escapes, and system paths are rejected, with a realpath re-check before every delete
- 📝 **Machine rules editor with a safety net** — read/write `~/.dsh/AGENTS.md` (the global rules every agent session loads), **auto-backup of the previous version on every save**, one-click restore, live on save
- 🌍 **Configurable** — scan roots default per platform (Windows: `D:\github` / `D:\environment\cache`), editable in the panel, overridable via env vars
- 🤖 **Agent tools** — `housekeeper_report` (inventory + disk report) and `housekeeper_clean` (same whitelist, max 10 paths per call)

## Install

```sh
dsh plugin --profile web add dsh-housekeeper
```

Restart `dsh web`, then **Settings → Plugins → 环境管家**.

Requirements: DSH web profile, Node ≥ 22.

## Security model

- All routes accept loopback clients only (403 otherwise)
- **Cleanup whitelist** — a path is deletable only when ALL hold:
  - under `<projects-root>\<repo>\ .tmp\`, or a direct child of `<cache-root>\`
  - normalized path stays inside the whitelist root (no `..`)
  - `realpath` still lands inside the whitelist root (no symlink escapes)
  - the whitelist roots and repo dirs themselves are never deletable
- The rules endpoint reads/writes `$DSH_HOME/AGENTS.md` only; the path is fixed
- No telemetry, no external network calls

## How it works

```
GUI settings ──fetch──▶ /housekeeper/state|clean|rules (loopback) ──▶ host plugin
                          ├─ probe: candidate paths + PATH lookup + versions
                          ├─ scan: rule-driven walk with sizes (4000-file cap)
                          ├─ clean: whitelist + realpath check, then rm
                          └─ rules: read/write $DSH_HOME/AGENTS.md (64KB cap)
```

## Develop

```sh
pnpm install
node build.mjs         # esbuild → lib/index.js (host ESM) + lib/client.js (ModuleLoader bundle)
node tests/core.mjs    # 21 whitelist/scan/clean sandbox tests, no real environment needed
```

MIT licensed. Issues and ideas welcome.
