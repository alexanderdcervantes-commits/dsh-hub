# dsh-open-in-finder

DeepSeek Harness（`dsh web`）持久化插件：在聊天窗口顶部标题行添加一个文件夹小图标，**一键在 macOS Finder 中打开当前会话的工作目录**。

## 功能

- 标题行小图标（SVG 文件夹，跟随主题色，悬停高亮），紧挨标题/agent 预设
- 点击 → Host 调用 `open <路径>` 在 Finder 中打开当前会话的工作目录；成功时图标短暂变为 ✓
- 悬停显示将打开的完整路径
- 无工作区的会话自动隐藏图标
- 仅 macOS（依赖系统 `open` 命令）

## 安装

1. 把本目录链接进 dsh web profile 的模块目录：

   ```bash
   ln -sfn "$PWD" ~/.dsh/profiles/node_modules/@local/dsh-open-in-finder
   ```

2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 追加：

   ```yaml
   - insert:
       - id: open-in-finder
         name: '@local/dsh-open-in-finder'
   ```

3. **重启 `dsh web`**（客户端模块扫描需重启生效）。

## 工作原理

- **双端结构**：`lib/index.js` 是 Host 插件（注册 `webServer` 路由 `POST /fin/api/open`，通过 `subprocess` 执行 `open <path>`）；`lib/client.js` 是浏览器 bundle（`window.__ModuleLoader__.load(...)`），通过 `useWorkspaces` 找到包含当前会话的工作区并取其 `path`。
- **RPC**：Client 同源 `fetch` 调用 `/fin/api/open`。

## 许可证

MIT — see [LICENSE](./LICENSE)
