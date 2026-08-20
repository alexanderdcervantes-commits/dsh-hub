# dsh-windtunnel 🌪️

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

[![tests](https://img.shields.io/badge/windtunnel-10%2F10-green)]() · 安装：`dsh plugin --profile <name> add github:BotonJ/dsh-windtunnel`

**DSH 插件风洞** — 给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件作者的契约回归测试舱：**剧本适配器驱动真实管线**，零 API key、零网络、确定性、可进 CI。

> 核心手法：被测插件不在乎是真模型还是剧本决定调用它。把"决策"换成剧本（进程内 `registerAdapter` 注册脚本化 LLM 适配器），把"管线"留成真的——agent loop、工具注册表、参数校验、执行、渲染、事件流、持久化全部真实运行。

## 它测什么（v1）

| 层 | 内容 |
|---|---|
| **L0 加载** | overlay 层出现在 `--dump-config`；**双行重挂载探针**（两行指向同一源文件 → 同一模块实例二次 apply → 非幂等插件当场暴露）；非 ctx 足迹快照（globalThis/监听器/timer/fd，post-mount vs exit 差分） |
| **L1 契约** | schema 子集过真实注册表校验；`presentCall`/`presentResult` 对畸形输入的软校验契约（fuzz）；`render` 全量性；声明了 `timeoutMs` 的取消响应 |
| **L2 行为** | 剧本页产出类型化 tool-call → 真实注册表执行 → **会话事件序列断言**（`tool/call`/`tool/result`/`turn/end` + 内容谓词） |
| **L3 注入** | 缺参故障（可预测失败而非崩溃）；**并发重入**（一页多调用经 `Promise.allSettled` 真实并发执行） |

**边界声明（重要）**：风洞是**契约回归网，不是效用测试床**——它证明"当工具以参数 X 被调用时管线正确产出事件流"，不证明"真模型会主动、正确地调用工具"（那是真模型双盲实测的领域）。剧本直接产出类型化 tool-call 块，绕过了"模型输出→调用解析"层。

## 执行模型

被测 bundle 永远跑在**隔离子进程**里（最小 headless profile + `--patch` overlay），风洞宿主只做编排与断言：

- 崩溃隔离：被测插件崩了，子进程死，风洞活着收尸出报告
- 干净基线：泄漏检测无宿主噪声（chokidar/socket/keep-alive 漂移）
- 事件回传走 windtunnel 自有 IPC（`%%WT%%` stdout JSON 行），**绝不解析 dsh 内部存储格式**
- 子进程内禁用真实网络适配器（overlay `disabled: true`）——物理上无法出网

## 使用

CLI（CI 友好）：

```sh
node bin/windtunnel.mjs cases --timeout 90000 --md report.md
# 退出码：0=全过，1=有失败
```

bundle（对话内跑）：装进 profile 后对 DSH 说"帮我跑一下插件风洞"，模型调用 `windtunnel_run` 工具。

写一个用例（`cases/xxx.case.mjs`）——**用例路径一律以 `import.meta.url` 相对解析，不硬编码绝对路径**；`cases/` 里测 sentinel 的用例依赖姊妹仓库 `../dsh-plugin-sentinel`：

```js
export default {
  name: 'my-plugin-basic',
  profile: 'headless',
  disableRows: ['llm-deepseek'],      // 子进程禁真适配器，剧本接管路由
  tools: ['my_tool'],                 // L1 契约检查目标
  sutPatch: [{ id: 'sut', name: '/abs/path/to/plugin/index.js' }],
  script: [
    { toolCalls: [{ name: 'my_tool', arguments: { x: 1 } }] },
    { text: 'done' },
  ],
  expect: [
    { event: 'tool/call', where: { name: 'my_tool' } },
    { event: 'tool/result', where: {}, contentContains: ['expected text'] },
    { event: 'turn/end', where: { 'reason.kind': 'completed' } },
  ],
}
```

**负向用例**：加 `expectFail: true`——该用例预期"违约被捕获"。此时**红是正确结果**（抓到了 L1 违约/断言失败，用例通过），绿反而意味着风洞漏检（用例失败）。`cases/ignore-cancel.case.mjs` 即范例：SUT 声明 `timeoutMs` 却无视 signal，`cancel-settle` 必须红。

## 狗食化验收（DoD 已达成）

风洞的第一个被测对象是姊妹项目 [dsh-plugin-sentinel](https://github.com/BotonJ/dsh-plugin-sentinel)：**首次运行即抓到 2 处 L1 契约违约**（`render` 对 null/undefined 非全量，compaction 重投影面会崩）→ 修复 → 全绿。

随后**用风洞测风洞**：新增 5 个用例（崩溃隔离 / 足迹泄漏 / 多步链 / 取消契约 / 缺失注入）时，抓到风洞自身一个真 bug——L1 取消契约检查的 finding 是异步的，子进程在 `execute()` 永不 settle 之前退出，违约被吞掉（假绿）。修复为**硬截止竞速 + once 守卫**，`ignore-cancel` 负向用例现在必须红。`cases/` 共 10 个用例（含 `test/fixtures/` 下 5 个 SUT 插件）全绿。

## 已知局限（诚实清单）

- 效用缺口：测不出工具 description 的可引发性（v2 方向：便宜模型 × N 次采样的触发率统计）
- 双行重挂载是重挂载周期的代理测法（同模块实例 × 二次 apply）；HMR 卸载/重挂的完整周期在 v2
- 足迹快照是 best-effort（标记为 footprint 而非 leak）
- rc 期 dsh 违约变更可能先打到风洞自身；只依赖公开表面（dump-config / 工具注册 / 会话事件名）
- 被测插件在子进程中以全权限执行——**先过 sentinel 静态安检，再进风洞**（先审后测流水线）

## 开发

```sh
node --test test/engine.test.mjs   # 引擎自测
node bin/windtunnel.mjs cases      # 狗食套件（需要本机装有 dsh CLI）
```

MIT License.
