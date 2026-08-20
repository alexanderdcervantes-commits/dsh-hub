# hermes-dsh-collab

**Hook DeepSeek Harness into your Hermes pipeline: automated dispatch, execution, and verification — with quality gates that don't trust self-reports.**

![MIT](https://img.shields.io/badge/license-MIT-green)
![DSH](https://img.shields.io/badge/DSH-0.1.0--rc.6-orange) [![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com/)
[![dsh-plugin](https://img.shields.io/badge/GitHub-dsh--plugin-0969da?style=flat-square)](https://github.com/topics/dsh-plugin)
![Hermes](https://img.shields.io/badge/Hermes-ready-9B30FF?style=flat-square)

> 简体中文版见 [README.zh.md](README.zh.md)

Your AI assistant can work all day. The question is whether you can walk away.

This skill makes it safe to: Hermes writes the dispatch spec, DSH executes it, Hermes verifies it — and you only step in when a quality gate actually fails. Distilled from a real 14-day pipeline (30 commits, 7/7 stages shipped without rework).

**Dependencies:** DSH 0.1.x (headless profile) + any orchestrator agent (built and tested with Hermes).

---

## Why this exists

Hermes is your personal assistant. DSH is a capable executor. The gap is the **operating contract** between them: what a good dispatch spec looks like, which model tier to use for which stage, who is allowed to commit, and how verification actually happens.

Most pipelines skip that contract and pay for it in rework. Recent work ([COPE](https://arxiv.org/abs/2504.02095)) shows planner/executor separation works — but only when the executor's behavior is controlled. This skill encodes those controls, from a pipeline where they were tested:

- **Model-tier routing** — Flash (`reasoning: max`) for routine stages, Pro for multi-file refactors and long synthesis, qwen for vision. When in doubt: try Flash once — rework means escalate.
- **Spec 3 iron rules** — Plan first · test first (TDD red→green) · scope declaration. A spec missing any of these is not shippable.
- **Git single-writer** — only the orchestrator commits. The executor never touches git, so history stays linear and auditable.
- **Quality gates owned by the orchestrator** — full test suite + build + diff-vs-scope audit + real browser walkthrough. Self-reports are not evidence.
- **Write-back via cwd** — `cd <project> && dsh --profile headless "task"` writes straight back. No /tmp mirrors, no patch handoffs.
- **Pitfalls with receipts** — every entry is a real incident: patch config *replaces* whole sections (not deep-merge), qwen rejects `reasoning: max`, vision patches don't change the main model, stale backend processes invalidate green tests…

## Quick start

```bash
# via dsh plugin (bundle — recommended)
dsh plugin --profile headless add github:Cavan-Ou/hermes-dsh-collab

# or copy the skill pack directly (lightweight, any profile)
git clone https://github.com/Cavan-Ou/hermes-dsh-collab
cp -r skills/hermes-dsh-collab "$DSH_HOME/skills/"   # default: ~/.dsh/skills/
```

Either way, the next DSH session loads it automatically (bundle registers a skill provider; the copy is picked up by the skills scanner).

Verify with three checks:

1. A new session lists `hermes-dsh-collab` in its skills
2. Say *"write me a dispatch spec"* — the skill triggers on the scenario
3. Ask *"can the executor git commit?"* — it says **no**, and explains why (single-writer rule)

## What's inside

```
skills/hermes-dsh-collab/
├── SKILL.md                      # judgment guide: blocking rules → decision tables → What NOT to do
└── references/                   # loaded on demand; keeps the guide lean
    ├── spec-template.md          # copyable dispatch-spec template (3 iron rules + no-commit clause)
    ├── model-routing.md          # tier table, patch mechanics, and the 3 patch traps
    ├── quality-gates.md          # 4-step gate commands + rework/escalation chain
    └── pitfalls.md               # canonical list of 10 real incidents (symptom → cause → fix)
```

Shaped like DeepSeek's own repo skills (see `.agents/skills` in [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)): guidance rather than a checklist · points at sources of truth instead of restating them · a dedicated "What NOT to do" section.

> **Install forms:** both supported — bundle (`dsh plugin add`, official distribution path, verified on DSH 0.1.0-rc.6) and direct copy to `$DSH_HOME/skills/` (lightweight, no build).

## Observed results

| Result | Evidence |
|---|---|
| **Quality gates catch systemic errors automatically** | In one long-synthesis run (74 design docs, ~600K tokens), verification surfaced **3 inverted negative-features** and a "universe feature" (hairline borders: 78–100% across all five style families) — mistakes that would take hours of manual review and would likely slip through |
| Routine stages on Flash ship without rework | 3/3 stages — TDD red→green, all gates green, real-browser walkthrough passed |
| The skill changes behavior | Live session: after loading, DSH refuses to commit and restates the single-writer rule with reasons |

**Where you (the human) step in:** only on the escalation chain — a quality gate fails, or the same stage retries twice. Everything else runs unattended.

## Documentation

- `SKILL.md` — the judgment guide itself (read this first)
- `REPORT.md` — build report: design decisions, self-test methodology (isolated `DSH_HOME` verification), open items

**Roadmap:** bundle packaging (`dsh plugin add` support) · per-workspace failure isolation · live routing-table refresh from the observations card · English mirror of references

> **Portability note:** the skill's "sources of truth" point at workspace-specific paths (e.g. `~/.dsh/profiles/headless/*.patch.yml`). The rules are portable — update the paths to match your workspace.

## Contributing

This skill is meant to grow from real use. Hit a pitfall not listed here? Open an issue with the incident (symptom → root cause → fix). PRs welcome in Chinese or English.

## License

MIT

---

*Built by running a real pipeline, not by reading docs.*
