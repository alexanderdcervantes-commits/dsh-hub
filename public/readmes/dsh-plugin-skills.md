# dsh-plugin-skills

**English** | [中文](README.zh.md)

Agent skills for building and testing **DeepSeek Harness** plugins — from scaffolding a new plugin package to choosing the right test tiers, entirely inside an agent session.

## What's inside

| Skill              | What it does                                                                                                                                                                                                                                                              |
| --------------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `dsh-write-plugin` | Scaffolds a plugin end to end: pick the right shape (tool / LLM adapter / hook / service / config), walk the package checklist (package.json invariants, tsconfig registration, README + Model Experience, verify gates), with a self-contained reference file per shape. |
| `dsh-test-plugin`  | Picks the right test tiers for a plugin change: unit, per-file coverage gate, real-API e2e, keyless snapshots, web browser snapshots — and when each is *required*, including real-entry-path and built-bin smoke coverage.                                               |

Both skills are **fully self-contained**: no external docs or other skills needed at runtime — everything required is written inside the skill.

## Install

Copy the skill folders into your project's agent skills directory:

```sh
cp -r dsh-write-plugin dsh-test-plugin <your-project>/.agents/skills/
```

Claude Code projects usually symlink `.claude/skills` to `.agents/skills`; if yours does not:

```sh
ln -s ../.agents/skills <your-project>/.claude/skills
```

That's it. The agent picks the skills up automatically (the skill catalog hot-refreshes on disk changes) — just ask it to *write a plugin* or *test this plugin change*, or invoke a skill by name.

## Requirements

**Runs in any mainstream agent product** — the skills are plain `SKILL.md` Markdown directories with no product-specific glue, so they work wherever an agent can read skill instructions: Codex, Claude Code, DeepSeek Harness, Cursor, Windsurf, Gemini CLI, GitHub Copilot, Cline, Roo Code, OpenHands, Aider, Devin, and more.
