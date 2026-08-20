# dsh-tool-orchestrate

English | [中文](README.zh.md)

Declarative task-DAG orchestration for DeepSeek Harness. This optional Cordis plugin registers a model-facing `orchestrate_tasks` tool, validates a bounded directed acyclic task graph before anything starts, and executes it through the existing `ctx.workflowEngine`.

This is an independent community plugin and is not an official DeepSeek package.

The package-owned worker script executes deterministic topological layers. Model-authored ids, prompts, dependency ids, schemas, provider names, model names, and upstream results are passed only as JSON data; none is interpolated into JavaScript source.

## Install

```sh
dsh plugin --profile web add dsh-tool-orchestrate
```

Replace `web` with the profile you want to extend. The package declares a DSH bundle manifest, so installation adds its `tool-orchestrate` Cordis row automatically. This project distributes prebuilt releases through npm; installing directly from the GitHub repository is not supported.

The plugin expects a DeepSeek Harness deployment that already provides:

- `ctx.tools`
- `ctx.systemPrompt`
- `ctx.workflowEngine`, normally supplied by `@deepseek-ai/dsh-workflow-worker-thread`
- a subagent provider selected by the workflow engine

## Manual Cordis configuration

Normally no manual configuration is needed after `dsh plugin add`. For a custom composition, add:

```yaml
- id: tool-orchestrate
  name: 'dsh-tool-orchestrate'
```

The standard DSH base bundle already loads `workflow-worker-thread`. A custom composition must provide `ctx.workflowEngine`; if it disables the workflow engine, re-enable it explicitly in a later patch layer.

## Model input

`orchestrate_tasks` accepts:

- `meta`: normalized `name` and `description`;
- `tasks`: a non-empty array of tasks with lowercase kebab-case `id`, `title`, and normalized `prompt`;
- optional `dependsOn`, `provider`, `model`, and object-rooted `outputSchema` per task.

Each completed task returns its child's text or structured value. A failed child becomes `{ status: 'failed', error: 'subagent_failed' }`; a task blocked by failed or skipped direct dependencies becomes `skipped` with deterministic `blockedBy` ids. Results keep the original task-array order, with aggregate counts and a top-level `completed`, `partial`, or `failed` status.

## API key ownership

This plugin does not own or store an API key. Child tasks use the host deployment's existing LLM route and credential source: for example `DEEPSEEK_API_KEY` in the process environment, a host credential provider, or another configured route. Subagents inherit the same credential configuration as the parent composition unless a task selects a different provider/model route.

Do not place API keys in prompts, `cordis.yml`, source code, or GitHub Actions logs. Prefer environment variables or your deployment's credential mechanism.

## Config

| Key | Default | Meaning |
|---|---|---|
| `toolName` | `orchestrate_tasks` | Model-facing tool name. |
| `maxTasks` | `64` | Maximum tasks per call. |
| `maxDependencies` | `16` | Maximum direct dependencies per task. |
| `maxPromptChars` | `32768` | Maximum normalized characters per task prompt. |
| `maxResultChars` | `50000` | Rendered canonical-JSON ceiling. |

All numeric limits must be positive safe integers; `toolName` must be a non-empty normalized string.

## Development

```sh
pnpm install
pnpm run typecheck
pnpm run check
```

Publishing is performed from a clean checkout through the manually triggered `Publish to npm` GitHub Actions workflow. Maintainers must configure its `npm` environment and `NPM_TOKEN` secret first.
