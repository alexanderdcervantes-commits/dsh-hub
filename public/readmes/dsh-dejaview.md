# dsh-dejaview

English | [中文](README.zh.md)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that
registers one model-facing tool, **`check_plugin_novelty`**. Before the agent
builds a dsh plugin, the tool asks the question behind
[DejaView](https://github.com/jiang4wqy/dejaview) — *"has someone already made
this?"* — narrowed to the dsh ecosystem.

Given a plugin idea, it searches three public sources — the
[awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
registry, the [`dsh-plugin`](https://github.com/topics/dsh-plugin) GitHub topic,
and npm packages tagged `dsh-plugin` — ranks existing plugins by IDF-weighted
lexical similarity (rare, distinctive terms count for more than ecosystem-common
ones), and returns each candidate with the evidence behind its score plus
DejaView's six-dimension verdict guidance. **The plugin retrieves and scores; the harness's own model
reads the evidence and delivers the ruling** — so it needs no extra API key and
no LLM provider of its own.

## Relationship to DejaView

DejaView is a web app that answers "is this project already built?" with an
evidence-first pipeline and three report tones (镀金 / 毒舌 / 彩虹). `dsh-dejaview`
ports that one question, and the six-dimension + three-tone framing, into a dsh
tool scoped to the plugin ecosystem. The retrieval and scoring are reimplemented
here in TypeScript; the verdict framing is handed to the model as guidance.

## The tool

`check_plugin_novelty` — provide at least one of:

| Argument   | Type       | Meaning                                            |
|------------|------------|----------------------------------------------------|
| `idea`     | `string`   | One-line description of the plugin you want to build. |
| `name`     | `string`   | Proposed plugin name, if you have one.             |
| `keywords` | `string[]` | Salient capability keywords.                       |

It returns a JSON value with: the normalized `query`, a `verdict_hint`
(`likely-exists` \| `adjacent` \| `looks-novel` \| `inconclusive`),
`best_similarity`, a `confidence` in the retrieval coverage, source `counts`, a
ranked `candidates` array (each with `name`, `url`, `source`, `category`,
`similarity`, `bucket`, and the `signals` that produced the score),
`uncovered_terms` (idea terms the closest match does not cover — a starting
point for differentiation), any `degradations`, the six-dimension
`verdict_guidance`, and a `disclaimer`.

The registry is read from the awesome-dsh-plugin **README in a single request**
(full-recall over every listed plugin), with a git-tree scan as a fallback; the
response is cached in-process for a few minutes so repeated checks in one session
do not refetch.

Example (live registry result for "replace the turn-status label with rotating
phrases"):

```text
verdict_hint = likely-exists   best_similarity = 1.0
  100% [near-duplicate/registry] 01Virex/dsh-status-rotator — Replaces the "Deep diving..." turn-status label ...
   47% [adjacent/registry]       alingalingling/ui-status-label — Customize the "deep diving" thinking status label ...
```

When the harness `systemPrompt` service is present, the plugin also contributes
one short guidance line (`tool:check_plugin_novelty`) so the agent knows to run
this check before building a plugin. It is added through an optional inject, so a
headless profile without that service still loads.

## Scope and honesty

- Evidence covers **only** the awesome-dsh-plugin registry and the `dsh-plugin`
  GitHub topic **at query time**. A miss means "not found within this search",
  not proof of novelty.
- If retrieval degrades (rate limit, network), the tool returns what it has, a
  `degradations` note, and lowers confidence rather than failing the call.
- Network access is limited to GitHub's public REST API and the raw file host.
  It sends no credentials and reads no local files.

## Requirements

The DeepSeek Harness (`engines.dsh >= 0.1.0-rc.6`) supplies
`@deepseek-ai/dsh-tools` and `@deepseek-ai/cordis` at load time. They are
intentionally **not** listed as installable dependencies: their standalone npm
graph is not cleanly installable, so this package builds against local type
shims (`src/dsh-shims.d.ts`) and marks those specifiers external. The prebuilt
`lib/` is committed so a direct Git install loads without a build step.

## Install into a profile

```sh
git clone https://github.com/jiang4wqy/dsh-dejaview.git
cd dsh-dejaview
pnpm install          # dev tools only; harness packages are provided at runtime
pnpm run check        # typecheck + tests + build

dsh plugin --profile dejaview add .
dsh --profile dejaview --dump-config | grep dsh-dejaview
dsh --profile dejaview
```

Remove it with:

```sh
dsh plugin --profile dejaview remove dsh-dejaview
```

## Development

```text
src/index.ts        # plugin entry: registers check_plugin_novelty on ctx.tools
src/fingerprint.ts  # idea → normalized token/phrase fingerprint
src/sources.ts      # fetch candidates: awesome-dsh registry + dsh-plugin topic
src/score.ts        # explainable lexical similarity + bucketing
src/rubric.ts       # DejaView six-dimension + three-tone verdict guidance
src/novelty.ts      # orchestration (pure apart from injected fetchers)
src/dsh-shims.d.ts  # local type shims for the harness-provided packages
tests/              # node:test unit tests (run on native TS, no extra runtime)
scripts/smoke.ts    # manual live check against public GitHub
```

- `pnpm run typecheck` — `tsc --noEmit`
- `pnpm run test` — `node --test tests/*.test.ts`
- `pnpm run build` — `tsdown` → `lib/`
- `node scripts/smoke.ts` — live end-to-end check

## Discoverability

Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to the repo
(metadata, not a file):

```sh
gh api --method PUT repos/jiang4wqy/dsh-dejaview/topics \
  -H 'Accept: application/vnd.github+json' \
  -f 'names[]=dsh-plugin'
```

## License

[MIT](LICENSE) © jiang4wqy
