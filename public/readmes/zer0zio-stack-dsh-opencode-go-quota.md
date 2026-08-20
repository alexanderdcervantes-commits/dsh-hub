# dsh-opencode-go-quota

DeepSeek Harness（DSH）Web 插件：右下角常驻一枚**静态胶囊「余额」**，点击展开后
立即按**当前选择的模型提供方**拉取并显示：

- **plan 型提供方**（订阅制，如 OpenCode Go）：显示「限额」与滚动 / 本周 / 本月限额进度。
- **tokens 型提供方**（预充值余额，如 `deepseek-official`）：显示「余额」与充值/赠送明细，
  并按 DeepSeek V4 定价表估算 **今日 / 本周 / 本月消费金额**，同时显示本机 token 用量。

限额与余额直接来自提供方 API；消费金额由「会话日志中的 token 用量 × 定价表」估算，
因为 DeepSeek 官方没有消费明细接口。

胶囊不轮询、不订阅模型切换，始终只显示「余额」二字；卡片**默认折叠**，
每次展开时立即读取当前选中模型并请求一次数据，再次展开会重新请求。
任一 plan 窗口达到 `rate-limited` 时卡片内以红色提示「已达限额」。

## 截图 / Screenshots

| DeepSeek 余额和用量 | OpenCode Go 限额 |
| --- | --- |
| ![DeepSeek 余额和用量](https://raw.githubusercontent.com/zer0zio-stack/dsh-opencode-go-quota/99b164636d0e3405d98673f11cbeff74bee938af/assets/screenshot-deepseek-balance.png) | ![OpenCode Go 限额](https://raw.githubusercontent.com/zer0zio-stack/dsh-opencode-go-quota/99b164636d0e3405d98673f11cbeff74bee938af/assets/screenshot-opencode-go-limit.png) |

## 当前提供方如何判定

浏览器半把 `useSessions` 里的当前 `sessionId` 传给 Host，Host 按以下顺序解析提供方/模型：

1. 客户端 `ctx.modelDirectories` 显式传入的当前选择（模型切换后立即生效）；
2. 当前会话 live agent 的 `session.requestHeader()`；
3. 该会话 live agent 的创建选项；
4. 持久化会话日志里最后一次 `request/header` 或 `request/context`；
5. `ctx.agentDefaultModel`（DSH 设置里的默认模型提供方）。

模型切换后无需刷新：卡片每次展开都重新读取客户端当前选择并请求 Host，
因此展开瞬间显示的就是当前选中提供方的最新数据。

## 安装

### 从 GitHub 安装源码

```powershell
git clone https://github.com/zer0zio-stack/dsh-opencode-go-quota.git
dsh plugin --profile web add .\dsh-opencode-go-quota
```

### 本地开发

在本目录执行：

```powershell
dsh plugin --profile web add .
```

安装完成后**重启** `dsh web`（插件清单在启动时读取，正在运行的实例不会热加载新插件）。

## 配置

安装时 `cordis.patch.yml` 插入一行，内置适配器：

| 提供方 | kind | 数据源 | 凭据 |
|---|---|---|---|
| `opencode-go` | `plan` | `https://opencode.ai/zen/go/v1/usage` | `OPENCODE_GO_API_KEY` |
| `deepseek` | `tokens` | `https://api.deepseek.com/user/balance` | `DEEPSEEK_API_KEY` |
| `deepseek-official` | `tokens` | `https://api.deepseek.com/user/balance` | `DEEPSEEK_API_KEY` |

顶层字段：

| 字段 | 默认值 | 说明 |
|---|---|---|
| `refreshMs` | `30000` | 接口返回的建议刷新间隔；前端已不轮询，仅在每次展开时请求一次 |
| `requestTimeoutMs` | `10000` | 单次上游请求超时 |
| `maxResponseBytes` | `65536` | 上游响应体上限 |

DeepSeek V4 定价已按用户提供的
`deepseek_markdown_20260815_c4af7f.md` 内置在代码中，单位为 **元 / 百万 tokens**：

- `deepseek-v4-flash` / `deepseek-v4-pro`；
- 2026-08-17 00:00 前按 **原定价**；
- 之后按 **高峰时段**（9:00–12:00、14:00–18:00）/ **空闲时段** 计价；
- 输入按 `cacheReadTokens`（缓存命中）与 `inputTokens`（缓存未命中）分别计费，
  `cacheWriteTokens` 按缓存未命中处理；输出按 `outputTokens` 计费。

需要覆盖定价时，可在 profile 的 `cordis.patch.yml` 按 `id: opencode-go-quota`
覆盖整行配置并重写 `providers.<id>.pricing`，字段形如：

```yaml
pricing:
  deepseek-v4-pro:
    effectiveAt: 2026-08-17T00:00:00
    peakHours:
      - start: 9
        end: 12
      - start: 14
        end: 18
    original:
      cacheHit: 0.025
      cacheMiss: 3.0
      output: 6.0
    offPeak:
      cacheHit: 0.15
      cacheMiss: 4.5
      output: 13.5
    peak:
      cacheHit: 0.30
      cacheMiss: 9.0
      output: 27.0
```

- `kind: plan` 要求 `usageUrl` 返回 `usage.rolling|weekly|monthly`（OpenCode Go 格式）。
- `kind: tokens` 要求 `balanceUrl` 返回 `{ is_available, balance_infos: [...] }`（DeepSeek 官方格式）。
- `currency` 指定余额/消费币种偏好；省略时选第一行非零余额。

## 工作原理

- **Host 半**（`lib/index.js`）：注入 `webServer`、`credentials`、
  `sessionPersistence`、`agents`、`agentDefaultModel`。收到查询后，提供方 API
  调用与本地 `assistant/message.usage` 增量合并**并行**执行（客户端已给出
  provider/model 时 API 请求立即发出，不等日志折叠）；随后按事件时间用定价表
  计费。API key 只在本进程内解析，`redirect: 'error'` 拒绝跟随重定向，凭据
  不会转发到其他来源，也绝不发给浏览器。
- **Client 半**（`lib/client.js`）：注册到 `shell.overlay`；折叠时只渲染
  「余额」胶囊。点击展开的**同一事件里**同步读取 `modelDirectories` 快照并
  立即发起 `GET /plugins/opencode-go-quota/usage?sessionId=<current>&provider=…&model=…`，
  不经过渲染后的 effect 排队；不设置任何定时器，也不订阅模型切换事件。

上游错误映射为 `MISSING_CREDENTIAL`、`UNAUTHORIZED`、`NOT_ENTITLED`、
`UPSTREAM_RATE_LIMITED`、`TIMEOUT`、`UNSUPPORTED_PROVIDER` 等结构化错误。

## 限制

- 仅适用于 **web** profile；headless 中该行因缺少 `webServer` 保持 pending。
- 限额与余额是 API 原值；消费金额是定价表 × 本机 token 用量的**估算**，
  不含折扣、税费、跨币种差异或插件启动前已删除的会话日志。
- token 用量按 Host 本地时区分桶；高峰/空闲时段也按事件发生时的 Host 本地小时判定。
