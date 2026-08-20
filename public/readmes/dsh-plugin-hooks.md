# dsh-plugin-hooks

DeepSeek Harness 插件:把 **Claude Code 风格的 lifecycle hooks** 带到 DSH —— 配置驱动的 shell 命令,在模型工具调用前后自动执行。

## 背景

DSH 0.1.0-rc.6 没有 hooks 能力,但架构已经预留了接缝:`tools/pre-execute` / `tools/post-execute` 两个有序 waterfall,以及 shell 服务"通过 stdin 给命令喂 JSON payload"的词汇表(见 `@deepseek-ai/dsh-shell`)。这个插件以**纯外部插件**形式补上这块空白,设计对齐官方预留接口:

- `pre-tool` hook:匹配的工具执行**前**运行;命令非零退出 → **阻止**该工具调用(等价 Claude Code PreToolUse 返回 error);
- `post-tool` hook:工具结果落地后运行;退出码只记录,不改变工具结果。

## 配置

JSON 配置,来源二选一或叠加:

1. **文件**(默认 `$DSH_HOME/hooks.json`):
```json
{
  "hooks": [
    {
      "id": "lint-after-edit",
      "event": "post-tool",
      "tools": ["edit", "write"],
      "command": "npm run lint -- --quiet",
      "timeoutMs": 30000
    },
    {
      "id": "guard-prod",
      "event": "pre-tool",
      "tools": ["bash", "pwsh"],
      "command": "node guard.js"
    }
  ]
}
```
2. **内联**(挂载 config,追加在文件 hooks 之后):
```yaml
- id: hooks
  name: dsh-plugin-hooks
  config:
    configFile: C:/path/to/hooks.json   # 可选
    hooks:
      - id: always-deny-db
        event: pre-tool
        tools: [bash]
        command: "node deny-db.js"
```

字段:`id`(必填、唯一)、`event`(`pre-tool` | `post-tool`)、`tools`(可选,默认全部)、`command`(必填)、`timeoutMs`(可选)、`enabled`(默认 true)。

## 安装

```bash
dsh plugin --profile web add dsh-plugin-hooks
```

挂载:

```yaml
- insert:
    - id: hooks
      name: dsh-plugin-hooks
```

## Hook 命令收到的数据

命令通过 **stdin** 收到一行 JSON payload:

```json
{ "event": "PostToolUse", "hookId": "lint-after-edit", "toolName": "edit",
  "args": { "path": "a.js" }, "sessionId": "s_xxx", "cwd": "C:/repo",
  "result": { "isError": false, "exitCode": 0, "error": null }, "durationMs": 123 }
```

环境变量:`CLAUDE_PROJECT_DIR`(会话 cwd)、`DSH_HOOK_EVENT`、`DSH_HOOK_ID`、`DSH_SESSION_ID`。`pre-tool` payload 无 `result`/`durationMs` 字段。

## 命令

- `/hooks` — 列出已配置 hooks + 最近 20 次运行记录(含退出码/错误摘要)
- `/hooks-reload` — 重新读配置文件,热加载,无需重启

## 设计说明

- 通过 `ctx.on("tools/pre-execute"|"tools/post-execute")` 接入 Cordis waterfall;`pre-tool` 非零退出时返回 `{ kind:"deny", reason }` 阻断调用(与 dsh-tools 的 deny 决策契约一致,见 `prepareExecution`)。
- 钩子命令经 `ctx.shell.run` 执行(自动套用沙箱策略与超时),payload 走 stdin、cwd 走 env —— 与 DSH 为 hooks bridges 预留的 shell 词汇表一致。
- 配置解析/匹配/payload 构建全部在 `lib/config.js` 纯函数里,`npm test` 零依赖。
- hook 运行**不会递归触发工具事件**(shell 是服务调用,不是工具调用)。

## 诚实边界

- hook 命令是**受信任的 host 配置**(等同 Claude Code hooks):能读写任何 host 能访问的东西,只在可信 profile 启用。
- `pre-tool` 命令会阻塞工具执行(超时/退出码决定放行与否);`post-tool` 命令失败只记录,不影响结果。
- v1 只支持工具生命周期事件;Stop / SessionEnd 类 hook 需要会话事件订阅,官方尚未暴露,留待后续。
- 若 `ctx.shell` 未挂载,插件照常加载但 hook 不会运行(启动时在 `/hooks` 里提示)。

## 本地开发

```bash
cd plugins/dsh-plugin-hooks
npm test          # node --test,零依赖
```

接线集成测试(真实 Cordis + mock shell,验证 allow/deny 语义与 payload):见仓库根 `test-wiring.mjs`。
