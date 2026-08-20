# @jhp830901/dsh-memoria

memoria 记忆后端插件：把 [memoria](https://github.com/jiayan-xu/memoria)（向量 + 图记忆层）接入 DeepSeek Harness (dsh)，让 dsh agent 会话可以**记住**和**回忆**。

- 4 个工具：`memoria_observe` / `memoria_remember` / `memoria_search` / `memoria_recall`
- 自动写入：每轮对话结束自动 `observe` 沉淀；用户肯定反馈（不错/很好/good/赞…）自动 `remember`（importance=5）
- 配置热重载：改 `~/.dsh/settings.yaml` 的 `memoria:` section 免重启生效
- 命名空间隔离：所有读写强制落在配置的 namespace（默认 `dsh-test`），不碰其他业务数据

## 使用前提

⚠️ **本插件是 memoria 的前端，不是记忆存储本身**。使用前需要：

1. **自建并运行 memoria 服务**（默认连接 `http://127.0.0.1:9003`）：memoria 是独立的开源项目（[jiayan-xu/memoria](https://github.com/jiayan-xu/memoria)，Rust 向量 + 图记忆服务）。没有该服务时工具会报连接失败。
2. **准备 badge token**：memoria 工具调用要求 `register_agent` 签发的 badge token（admin key 不能直连），见下文「获取 memoria badge token」。以环境变量 `MEMORIA_AGENT_KEY` 提供（不落盘）。

装完发现工具报 `Connection refused` / `HTTP 200 but auth failed`，先检查这两项。

## 安装

前置：`@deepseek-ai/dsh` CLI 与 pnpm。

```sh
# 安装（自动挂载，无需手动改 profile）——两种源任选
dsh plugin --profile web add github:jiayan-xu/dsh-memoria
# 或 npm 源：
dsh plugin --profile web add @jhp830901/dsh-memoria

# 启动 dsh web 即可使用
dsh web
```

## 配置

插件默认连 `http://127.0.0.1:9003`（本地 memoria）。可配置项：

| 项 | 默认 | 说明 |
|---|---|---|
| `baseURL` | `http://127.0.0.1:9003` | memoria 服务地址 |
| `agentId` | `dsh-memoria` | memoria agent 身份（需已注册） |
| `apiKeyEnv` | `MEMORIA_AGENT_KEY` | 环境变量名，值 = memoria badge token |
| `namespace` | `dsh-test` | 记忆命名空间（隔离边界） |
| `autoWrite` | `true` | 自动写入开关 |

推荐用 settings section 覆盖（热重载）：

```yaml
# ~/.dsh/settings.yaml
memoria:
  baseURL: http://127.0.0.1:9003
  namespace: my-namespace
  autoWrite: true
```

agentKey **不要落盘**，用环境变量：

```sh
export MEMORIA_AGENT_KEY=<badge-token>
```

### 获取 memoria badge token

memoria 的工具调用要求 X-Agent-Key 为 `register_agent` 签发的 badge token（admin key 不能直连）。未注册时先注册：

```sh
# 用 admin key 注册 agent（示例），返回 badge 有效期 1 年
curl -X POST http://127.0.0.1:9003/mcp -H 'Content-Type: application/json' \
  -H 'X-Agent-Id: dsh-memoria' -H 'X-Agent-Key: <ADMIN_KEY>' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"register_agent","arguments":{"agent_id":"dsh-memoria","display_name":"dsh-memoria plugin","namespace":"dsh-test"}}}'
```

## 使用

```
用户：记住一个重要事实：我的仓库密码是 42
用户：我之前记住的仓库密码是什么？   → 命中回忆
```

## 验收用例

1. **写入**：`memoria_remember {content, namespace}` → `{"status":"remembered","id":...}`
2. **召回**：`memoria_search {query, namespace}` → 语义 + 关键词多信号命中
3. **隔离**：其他 namespace 检索本插件数据 → 授权拒绝/空结果

## 开发

```sh
npm install -D typescript @types/node --legacy-peer-deps
bash scripts/build.sh   # 产出 lib/（Windows 下依赖 junction，见 scripts/build.sh 注释）
```

## License

BSD-3-Clause
