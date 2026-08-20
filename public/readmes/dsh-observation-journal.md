# dsh-observation-journal

**Zero-touch runtime telemetry for DeepSeek Harness: every session writes its own report card.**

![MIT](https://img.shields.io/badge/license-MIT-green)
![DSH](https://img.shields.io/badge/DSH-0.1.0--rc.6-orange)
[![dsh-plugin](https://img.shields.io/badge/GitHub-dsh--plugin-0969da?style=flat-square)](https://github.com/topics/dsh-plugin)

> 简体中文版见 [README.zh.md](README.zh.md)

A pure observer plugin (zero tools registered, zero LLM calls, zero agent involvement). When a session ends, it writes the run's facts — task, model tier, tools, failures, duration, status — into a human-readable journal with an auto-updated stats section.

## Why it exists

Failures have a recorder ([dsh-fail-logger](https://github.com/Areium/dsh-fail-logger)). Successes and run facts didn't. This is the sibling: **what happened** — not how to solve it, not what to remember. No tools, no injection, no retrieval. The harness writes passively; humans and projects read.

**What it is not** (boundaries, stated plainly):
| Plugin | Records | Injects back into agent? | Consumption |
|---|---|---|---|
| **this** | run facts (telemetry) | never | human/project file |
| dsh-task-planner | solutions ("how to solve") | yes (recall) | agent planning |
| dsh-mneme / dsh-memento / dsh-memory | agent memories | yes (retrieval) | agent context |
| dsh-fail-logger | failures | via skill | agent skill loading |

## 60-second verification

```bash
dsh plugin --profile headless add <repo-or-pkg>   # or copy the repo as a local bundle
dsh --profile headless "run any small task"
cat ~/.dsh/observations.md                        # a journal row + stats section appeared
```

## What the output looks like

The journal is the UI. A marker section that survives manual edits, plus an auto-stats block:

```markdown
<!-- OBS-JOURNAL:BEGIN -->
| time | sid | task | model | dur | turns | tools | calls | fail | status |
|---|---|---|---|---|---|---|---|---|---|
| 2026-08-14T21:42 | abe96e0f | 阅读 specs/s11-1.md 任务书 | deepseek-v4-pro(max) | 1242 | 1 | read:80,bash:12,edit:9,todo_write:4 | 106 | 0 | completed |
| 2026-08-15T03:04 | 9c1f3a | run any small task | deepseek-v4-flash(max) | 25 | 1 | bash:4,grep:2,glob:1 | 7 | 0 | completed |
<!-- OBS-JOURNAL:END -->

<!-- OBS-JOURNAL:STATS -->
- sessions: 2
- failure rate: 0.0%（0/113）
- top tools: read:80,bash:12,edit:9,todo_write:4,grep:2
- avg duration (s) by model: deepseek-v4-flash(max): 25, deepseek-v4-pro(max): 1242
<!-- OBS-JOURNAL:STATS:END -->
```

**raw sidecar** (`obsFile + '.jsonl'`, append-only): full fidelity — todo planning trace (≤5), complete tool counts, failed tools, full model id, full task description, normalized `task_hash`. This is the v2 material for LLM insight; it is TTL-decoupled from the card.

## Config (all optional, patch `config:` field)

| key | default | description |
|---|---|---|
| `obsFile` | `$DSH_HOME/observations.md` | journal path (point it at a project-level file) |
| `maxRows` | `200` | card keeps last N rows (raw sidecar unaffected) |
| `marker` | `OBS-JOURNAL` | section marker id, `[A-Za-z0-9-]` |
| `redact` | `[]` | extra redaction regexes (stacked on the built-in secret table) |
| `flushMs` | `300` | trailing debounce after turn/end |

Env: `OBS_FILE` overrides `obsFile`; `OBS_REPLAY=<session.jsonl>` replays real events (test/CI mode).

## Reliability

- 10-column card rows: one row per session — no lossy merging
- Task title escapes `|` and newlines; secrets redacted (same table as fail-logger)
- Cross-process write lock + stale lock reclaim; dispose fallback flushes sessions with no turn/end
- **Tested against real session logs**: 14/14 replay tests on 5 real .zstd fixtures (incl. a 2000+ event Pro long-synthesis session), field-by-field cross-checked against independent recomputation; 21-session full replay verified human sections byte-identical

## Development

```bash
node --check lib/index.js
node --test tests/test.mjs   # needs python3 + zstandard
```

## License

MIT
