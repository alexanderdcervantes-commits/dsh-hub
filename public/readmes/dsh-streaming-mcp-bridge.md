# dsh-streaming-mcp-bridge

DeepSeek Harness 社区插件：把 Harness 的实时 `session.event` / `session.status`
流桥接给外部客户端，解决 ACP 只能返回最终结果、看不到思考/工具过程的问题。

- MCP 模式：Streamable HTTP，`dsh_run_stream` 执行任务时发送
  `notifications/progress`。
- ACP 模式：供 cc-connect / Feishu 使用，把思考、工具、状态实时推给飞书。
- Feishu 展示：每条状态、思考、工具调用/结果使用独立代码块，最终回答放在代码块外。

## 安装

作为 DSH bundle 插件安装到 Web profile：

```bash
dsh plugin --profile web add dsh-streaming-mcp-bridge
```

也可以固定使用 GitHub Release：

```bash
dsh plugin --profile web add github:yabolee-kkk/dsh-streaming-mcp-bridge#v0.1.0
```

或者从本地 checkout 安装：

```bash
dsh plugin --profile web add /path/to/dsh-streaming-mcp-bridge
```

安装后启动 DSH Web：

```bash
dsh web
```

MCP 默认监听：

```text
http://127.0.0.1:3477/mcp
```

建议设置 Bearer token：

```bash
export DSH_STREAMING_MCP_TOKEN="your-secret-token"
```

## 配置

可通过 profile 的 `cordis.patch.yml` 覆盖：

```yaml
- id: dsh-streaming-mcp-bridge
  config:
    host: 127.0.0.1
    port: 3477
    authTokenEnv: DSH_STREAMING_MCP_TOKEN
    workspace: /home/you/workspace
    provider: deepseek-official
    model: deepseek-v4-flash
```

## MCP 验证

```bash
curl -X POST http://127.0.0.1:3477/mcp \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'
```

拿到 `Mcp-Session-Id` 后，先打开 GET SSE 流，再调用 `dsh_run_stream`，即可看到
`notifications/progress`。

## ACP / Feishu 模式

cc-connect 的 `dsh` 项目可以直接使用：

```toml
[projects.agent]
type = "acp"

[projects.agent.options]
work_dir = "/home/you/workspace"
cmd = "<node>"
args = [
  "<path-to-package>/bin/acp.js",
  "--workspace",
  "/home/you/workspace"
]
```

ACP 模式需要可用的 Harness JSON-RPC runtime。默认使用
`DSH_HARNESS_HOME` 下的源码路径，或通过 `DSH_JSONRPC_BIN` / `DSH_CORDIS_CONFIG`
指定运行环境。

## 安全

- MCP 默认只监听 `127.0.0.1`，不要直接暴露到公网。
- 使用 Bearer token 鉴权。
- `dsh_run_stream` 会让 Harness 执行真实任务，只对可信用户开放。

## License

MIT

## Development

```bash
npm ci
npm test
npm run check
```

## Plugin Market

`dsh-market` reads its catalog from `awesome-dsh-plugin`. See
[docs/market-submission.md](docs/market-submission.md) for submission details.
