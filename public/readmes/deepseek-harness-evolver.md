# plugin-evolve

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

官方 [创造模式](https://www.deepseek.com/harness/) 的原话是：检查当前运行时、**在内存中试验 Cordis 插件**，并据此组合和创作新的模式。架构是 [一切皆插件](https://github.com/deepseek-ai/deepseek-harness)。

这个控制器是补充，不是替代。官方已经把热挂（`ctx.plugin`、可逆副作用）做完了。我们补的是试验之后的闭环：信号 → 提案 → 校验 → 本进程挂上 → 打分 → **固化到盘上或回滚**。重启还在。

不是「已经自动自进化」。不会改 agent-loop / session / loader。

Host-agnostic **controller** for evolving tool plugins, plus a DeepSeek Harness bundle that live-mounts a passing trial into the current process.

状态机：

```
signals → analysis → abstract → stage → validate → mount → score → solidify | rollback
                         ↘ rejected
```

CLI `mount` 只写盘。dsh 插件的 `evolve_mount` 还会 `ctx.plugin`，新工具立刻出现在本轮会话里。

## Install

```bash
npm install plugin-evolve
```

Node >= 18. 零运行时依赖。

## Library

```ts
import { createController } from "plugin-evolve";

const evolve = createController({ root: process.cwd() });
await evolve.init();

const advice = await evolve.recordSignals([
  { kind: "tool_error", payload: { tool: "bash" } },
]);
const report = await evolve.analysis();
// report.ready = points that should be evolved now
if (advice.shouldPropose || report.ready.length > 0) {
  const draft = await evolve.abstract(); // or { stage: true }
  await evolve.stage({
    manifest: draft.manifest,
    files: { "plugin.js": draft.source },
    signalKind: draft.signalKind,
  });
}
await evolve.validate();
await evolve.mount();

// next process:
const { evolved, trial } = await evolve.loadout();
for (const plugin of [...evolved, trial].filter(Boolean)) {
  await import(plugin.entryPath);
}

await evolve.score({ samples: 10, successDelta: 2, retryDelta: -1 });
await evolve.solidify({ confirm: true }); // first 3 keeps need confirm
```

## CLI

```bash
npx plugin-evolve init --root .
npx plugin-evolve analysis
npx plugin-evolve abstract
npx plugin-evolve abstract --point tool_error:web_fetch --stage
npx plugin-evolve signal --kind tool_error --json "{\"tool\":\"bash\"}"
npx plugin-evolve stage ./examples/retry-on-429 --signal-kind tool_error
npx plugin-evolve validate
npx plugin-evolve mount
npx plugin-evolve score --samples 10 --success-delta 2 --retry-delta -1
npx plugin-evolve solidify --confirm
npx plugin-evolve loadout
npx plugin-evolve events --tail 20
npx plugin-evolve rollback
```

所有命令默认打印 JSON。

## Layout

```
<workspace>/.evolve/
  state.json
  events.jsonl          # append-only
  mounted.json          # at most one in-flight trial
  candidates/<trialId>/
  abstracts/<pluginId>/   # last abstracted draft
  evolved/<pluginId>/v<n>/
```

同时最多一个 trial。候选必须是扁平目录：`manifest.json` + 入口 + 可选 README/LICENSE。

## Manifest

```json
{
  "id": "retry-on-429",
  "kind": "tool",
  "purpose": "Retry idempotent HTTP calls after a 429 response",
  "inject": ["tools"],
  "entry": "plugin.js",
  "constraints": { "network": false, "shell": false }
}
```

入口必须导出 `apply`。控制器**不执行**这段代码，只做静态检查。

## Policy

| 规则 | 默认 |
|---|---|
| 只允许 `kind: "tool"` | 是 |
| 允许的 `inject` | `["tools"]` |
| `network` / `shell` | 必须 false |
| 体积 | 32 KiB |
| 禁止 | `fs` / `net` / `http` / `child_process` / `eval` / `new Function` |
| 禁止的 id | `session` `loader` `agent-loop` `evolve` `controller` `plugin-evolve` |
| 打分通过 | `samples >= 10` 且 `successDelta > 0` 且 `retryDelta <= 0` |
| 人工确认 | 前 3 次 `solidify` 必须 `confirm: true` |
| 停滞 | 同一 `signalKind` 连续失败 3 次后拒绝再 stage |

## DeepSeek Harness plugin

This package is a `dsh.bundle`. Install it into a profile and the model gets `evolve_*` tools. `evolve_mount` calls `ctx.plugin` so the new tool is live in the current process.

```bash
dsh plugin --profile web add github:shinjiyu/deepseek-harness-evolver
dsh plugin --profile headless add github:shinjiyu/deepseek-harness-evolver
```

本地路径也可以：`dsh plugin --profile web add D:\tempWorkspace\plugin-evolve`

Then, in a workspace:

```bash
dsh --profile headless "web_fetch 连续 429。用 evolve_signal 记两次，evolve_status 看是否该提案，再 evolve_stage 一个只 inject tools 的重试插件，validate、mount，用新工具打 10 次，evolve_score 后 evolve_solidify confirm=true"
```

Model-facing tools: `evolve_analysis` `evolve_abstract` `evolve_status` `evolve_signal` `evolve_stage` `evolve_validate` `evolve_mount` `evolve_score` `evolve_solidify` `evolve_rollback`.

`evolve_analysis` / CLI `analysis` 读最近 32 条 signal，按 `kind` + `payload.tool` 聚成进化点：`ready` 可提案，`watching` 还不够两次，`blocked_trial` 已够但有进行中的 trial，`stagnant` 被锁。

`evolve_abstract` / CLI `abstract` 从 ready 点抽出一个只 inject tools 的插件草稿（manifest + plugin.js），写到 `.evolve/abstracts/<id>/`。`--stage` / `stage:true` 会直接送进 trial。

Workspace state is `<cwd>/.evolve/`. Override with `PLUGIN_EVOLVE_ROOT` or plugin config `root`.

## What this is not

- 不是 EvoMap/evolver，也不连 Hub
- 不会改 agent-loop / session / loader
- 会按信号点抽象出小工具插件草稿，但不会改 agent-loop / 不会替你改业务工程

## Case: HTTP 429

模拟宿主里 `web_fetch` 连续 429。控制器建议写工具插件；宿主挂上 `examples/retry-on-429` 后按它的 backoff 再打 10 次，用真实成功率打分并固化。

```bash
npm run case:429
```

## Develop

```bash
npm install
npm test
```

Repo: [shinjiyu/deepseek-harness-evolver](https://github.com/shinjiyu/deepseek-harness-evolver) · 介绍帖：[Show and tell #1720](https://github.com/deepseek-ai/deepseek-harness/discussions/1720)
