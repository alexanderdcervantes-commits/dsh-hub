# dsh-task-planner

Task planning with **experience muscle-memory** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`).

Give a task → the agent recalls **past similar solutions** (condition reflex), evaluates whether they fit, and produces a dynamic plan matched against its capabilities — **never hard-coded combos**. Every plan auto-drafts a lesson into the experience library; when the task closes, the agent updates the outcome. The more you work, the smarter the reflex.

## Features

- 🧠 **Experience library** (`task_memory save/recall/list`): persistent lessons as plain Markdown with signature keywords. Recall uses a 2–3-char sliding-window tokenizer, so "weekly report" still hits a "daily report" lesson.
- ⚡ **Condition-reflex planning** (`plan_task`): recall → LLM evaluates fit (reuse & improve, or explain why not and plan fresh) → decomposed steps with capability matching → risks → next actions.
- 🤖 **LLM-driven, not rule-driven**: the model decides what to use per task; the plugin only supplies context (past experiences + optional capability catalog).
- ✍️ **De-AI deliverable standard**: any textual output step (docs/sheets/slides/copy/scripts) must include a humanize-then-review pass before delivery.
- 🗂️ **Auto-persist**: `plan_task` drafts the lesson automatically (status: `draft`); the agent marks it `verified` with the outcome at loop close.
- 🔒 **Zero keys, zero absolute paths**: everything is configurable; the experience library lives in `~/.dsh/planner-lessons` by default.

## Install

```sh
dsh plugin --profile web add github:<your-user>/dsh-task-planner
```

or copy the repo and add it as a local bundle:

```sh
dsh plugin --profile web add /path/to/dsh-task-planner
```

## Config (optional, in your profile's `cordis.patch.yml`)

```yaml
- id: dsh-task-planner
  name: dsh-task-planner
  config:
    lessonsDir: /path/to/your/lessons   # default: ~/.dsh/planner-lessons
    capabilityFile: /path/to/capability-map.md  # optional catalog fed to the LLM
```

Point `capabilityFile` at a markdown catalog of your skills/plugins (e.g. an awesome list) and `plan_task` will match each step against it.

## Usage

- `plan_task { task, goal?, constraints? }` — plan before starting complex work.
- `task_memory save { task, plan, outcome }` — persist a lesson (auto-called by plan_task for the draft).
- `task_memory recall { task }` — condition-reflex lookup.
- `task_memory list` — show all lessons.

### Lesson lifecycle

1. `plan_task` writes a draft lesson (`status: draft`) automatically.
2. When the task closes, the agent updates it with the outcome (`status: verified`).
3. A lesson reused successfully 3× → promote to a formal skill. A lesson rejected 2× → mark obsolete.

## Notes

- Requires the `llm`, `shell`, `tools` services (all present in the standard harness).
- The model call uses the harness default model (`agentDefaultModel`); reasoning models need a generous `maxTokens` (8k is used internally).
- Lessons are plain Markdown — human-editable, greppable, portable.

## License

MIT
