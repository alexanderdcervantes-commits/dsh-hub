# dsh-plugin-scout

A DeepSeek Harness plugin + skill that scouts the DSH ecosystem: it surveys the
core [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) repo and
every repository tagged [dsh-plugin](https://github.com/topics/dsh-plugin),
discovers harnesses related to your goal, and judges whether each is worth
trying.

## What it does

Before you build a new harness or adopt someone else's, plugin-scout answers two
questions:

1. What already ships in the core harness, so you do not rebuild it?
2. Which community plugins are related to my goal, and are they worth trying?

It produces a short candidate table with one verdict per candidate — TRY / WATCH /
SKIP — plus the evidence behind each verdict. It only scouts and judges:
installing a chosen plugin is find-plugins' job, and building a new one is
make-dsh-plugin's job.

## Install

As a bundle (published to npm or installed from git):

    dsh plugin add https://github.com/<owner>/dsh-plugin-scout

The bundle registers the plugin-scout skill automatically.

Or install only the skill by copying its directory:

    cp -R skills/plugin-scout "$DSH_HOME/skills/"

## Usage

Ask DSH things like:

- "Is there a harness for X in the ecosystem? Should I try it?"
- "Before I build a Y plugin, what already exists?"
- "Survey the dsh-plugin topic and judge what is worth adopting for my goal."

The skill runs two deterministic scripts:

- scripts/survey-harness.mjs — lists deepseek-harness packages and the locally
  installed official packages.
- scripts/search-topic.mjs — lists public, non-archived, non-fork repos tagged
  dsh-plugin, with pagination.

It then narrows to the relevant candidates, inspects their README, package.json
and file tree, and applies references/judgment-rubric.md to reach each verdict.

## License

MIT
