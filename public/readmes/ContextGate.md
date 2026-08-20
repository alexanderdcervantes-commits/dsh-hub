# ContextGate

> 上下文闸门 · A context-folding gate plugin for [DeepSeek Harness](https://github.com/deepseek-ai/dsh) (DSH) / [Cordis](https://github.com/cordiverse/cordis)

ContextGate 是一个部署在 LLM 请求瀑布（waterfall）中的闸门插件：它观测每一次 LLM 请求的上下文规模，当历史消息超出阈值时，由 **LLM gatekeeper**（小模型）逐条判断中间历史与当前任务的相关性，只保留相关消息，把无关历史**折叠为一条摘要**后重发请求——把上下文长度控制在窗口内，显著节省 token。

```
请求 → [ContextGate 闸门] ──超阈值?── 否──→ 直通
                          │
                          是
                          ↓
              LLM gatekeeper 逐条判断相关性
              ├─ 高置信（≥0.85）→ 自动折叠
              ├─ 低置信 → UI 询问用户（折叠/不折叠）
              └─ 失败/超时 → 回退规则折叠（head + 摘要 + tail）
                          ↓
              重发请求（仅一次，带逃逸标记）
```

## 特性

- **瀑布闸门**：监听 `llm/stream` 事件，在请求进入模型路由前拦截，天然与 DSH 的 agent/compaction 流程兼容。
- **LLM gatekeeper（Phase 2）**：超阈值后调用小模型（自动选择轻量模型，可用 `gatekeeper.model` 指定）对候选历史逐条输出 `keep / confidence` 判断；drop 项最低置信度 ≥ `confidence` 阈值则自动折叠，否则经 UI 询问用户确认。
- **规则折叠回退（Phase 1）**：gatekeeper 不可用/失败/超时时，回退到 "head + 摘要 + tail" 规则折叠，保证闸门始终可用。
- **fail-open**：闸门内部任何异常都不会阻塞请求——直接放行原请求，绝不卡死 harness。
- **防递归**：重发请求与 gatekeeper 自身调用都带逃逸标记（`WeakSet`），不会被再次折叠；辅助调用（如 compaction / session-title，带 `purpose` 的请求）直接直通。
- **token 估算**：优先使用 DSH 的 `tokenMeter` 服务精确估算，不可用时回退到字符数 / 3 的启发式估算。
- **运行观测**：注册 `contextgate_status` 工具，模型可随时查看请求数、折叠次数、gatekeeper 统计（自动/确认/拒绝/回退）、节省的 token 等。

## 工作原理

1. 每次 LLM 请求（`llm/stream`）到达时，闸门检查它是否属于目标会话（默认仅当前会话）。
2. 估算请求消息总 token 数；未超阈值（默认 12000）则原样直通，零开销。
3. 超过阈值后，把消息拆分为 `head`（任务陈述）+ `mid`（候选历史）+ `tail`（最近消息）。
4. **gatekeeper 判断**：把最新用户请求 + 头部任务陈述 + 截断后的候选列表（每条 150 字符）发给小模型，要求输出 JSON 判定每条候选的 `keep` 与 `confidence`。
5. **决策**：drop 项最低置信度 ≥ 0.85 → 自动折叠；否则弹出 UI 问题询问用户（折叠 / 不折叠）；用户拒绝则原样直通。
6. **折叠**：保留 `head` + 被判定相关的候选原文 + `tail`，无关候选替换为一条结构化摘要消息；系统提示追加说明"历史已被临时折叠、完整内容仍在会话日志中"。
7. 重发折叠后的请求（带逃逸标记，只折叠一层），并记录统计。

折叠摘要示例：

```
[ContextGate 折叠摘要] 82 条中间历史消息（约 73058 tokens）经 AI 判定与当前任务无关，已折叠。
其余 6 条相关历史已保留。完整历史仍保存在会话日志中，如需查看请明确要求恢复。
```

## 安装

ContextGate 是一个标准的 Cordis 插件对象（`{ name, inject, apply }`），DSH 中以动态插件运行：

**方式一：动态插件（推荐，DSH Web 会话内）**

将 `src/index.js` 中的 `module.exports = { ... }` 内容作为插件代码，通过 DSH 的动态插件工具（`cordis_define` + `cordis_run`）定义并激活，插件 ID 前缀建议使用 `ctxg`。

**方式二：作为本地插件文件加载**

```bash
npm install contextgate
# 或将本仓库 clone 后放入 DSH 的 plugins 目录
```

在 DSH 的 `cordis.yml` 中声明：

```yaml
plugins:
  contextgate:
    path: ./node_modules/contextgate
```

> 注意：`apply(ctx)` 中使用 `harness` 全局对象注册模型工具，请确保 DSH 运行时版本支持 `harness.registerTool` / `harness.defineTool`；若运行时未提供，可删除工具注册段（`harness.registerTool(...)` 块），闸门本身不受影响。

## 配置

在 `apply(ctx)` 开头的 `CONFIG` 对象中调整：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 总开关 |
| `thresholdTokens` | `12000` | 估算 token 超过此值才触发 |
| `keepHead` | `1` | 保留开头 N 条消息（通常是任务陈述） |
| `keepRecent` | `8` | 保留最近 N 条消息 |
| `gatekeeper.enabled` | `true` | 是否启用 LLM gatekeeper（false = 始终规则折叠） |
| `gatekeeper.model` | `undefined` | 显式指定 gatekeeper 模型；未指定时自动选择（优先 flash/light/lite/mini/turbo，回退当前模型） |
| `gatekeeper.confidence` | `0.85` | 高置信阈值：drop 项最低置信度 ≥ 此值才自动折叠 |
| `gatekeeper.maxTokens` | `800` | gatekeeper 输出上限 |
| `gatekeeper.timeoutMs` | `15000` | gatekeeper 调用超时（超时回退规则折叠） |
| `gatekeeper.truncate` | `150` | 每条候选消息发送给 gatekeeper 前的截断字符数 |
| `gatekeeper.askHuman` | `true` | 低置信时询问用户；false = 低置信直接按规则折叠 |

## 状态查询

插件注册了 `contextgate_status` 工具，模型可调用以查看运行状态：

```json
{
  "targetId": "session-xxx",
  "enabled": true,
  "gatekeeperEnabled": true,
  "requests": 42,
  "folded": 3,
  "foldedMsgs": 152,
  "savedTokens": 96720,
  "gated": 3,
  "autoFolded": 2,
  "confirmedFolded": 1,
  "declined": 0,
  "gkFallback": 0,
  "last": { "provider": "deepseek", "model": "deepseek-v4", "msgs": 210, "tokens": 84210, "time": 1730000000000 }
}
```

| 字段 | 含义 |
| --- | --- |
| `gated` | gatekeeper 调用次数 |
| `autoFolded` | 高置信自动折叠次数 |
| `confirmedFolded` | 用户确认折叠次数 |
| `declined` | 用户拒绝折叠次数 |
| `gkFallback` | gatekeeper 失败/超时回退规则折叠次数 |

## 开发路线

- **Phase 0 · 观测** ✅ 请求级观测与统计工具
- **Phase 1 · 规则折叠** ✅ 阈值触发的规则压缩（head + 摘要 + tail）
- **Phase 2 · LLM gatekeeper** ✅ 小模型相关性判断 + 置信度自动折叠 + UI 人工确认 + 失败回退（当前版本）
- **Phase 3 · 规划中** ⏳ 语义摘要生成、自适应阈值、多会话支持、UI 面板

## License

[MIT](./LICENSE)
