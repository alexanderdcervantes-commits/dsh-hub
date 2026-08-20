# dsh-opencode-usage

DeepSeek Harness（`dsh web`）持久化插件：在聊天窗口顶部标题行显示 **opencode.ai 额度用量进度**（5 小时 / 本周 / 本月），毛玻璃详情面板，实时重置倒计时，支持按模型渠道（Provider）过滤显示。

## 功能

- **标题行进度组件**：三个迷你进度条 + 百分比（`5h` / `7d` / `30d`），颜色随用量变化（<60% 绿、60–85% 黄、>85% 红），跟随主题配色
- **输入框同心圆**（可选，默认开启）：在输入框工具行右侧（模型名左侧）显示三层同心圆——最内层月、中间层周、最外层 5 小时额度，最大圈与上下文圈等大（14px）；圆环按真实百分比绘制（0% 不画弧、100% 无端帽凸起、低百分比保持比例）；点击弹出与上下文圆环**同款样式**的详情弹窗：5h / 周 / 月 三行，每行一条等长绝对值进度条 + 百分比 + 重置时间
- **毛玻璃详情面板**：点击标题行组件展开，每个窗口一行进度条，始终显示全部窗口，倒计时每秒实时跳动，点面板外自动收起（`Esc` 亦可）
- **渠道过滤**：实时读取当前会话的模型 Provider（渠道），只在配置的渠道中显示组件，切换渠道即时响应
- **设置页**（设置 → OpenCode 用量）：Workspace ID、完整 Auth Cookie、刷新间隔、显示哪些窗口、输入框同心圆开关、渠道过滤；配置持久化到 `~/.dsh/ocu-config.json`（0600），重启不丢
- **总开关**：可整体启用/禁用标题行组件

## 安装

1. 把本目录链接进 dsh web profile 的模块目录（让 loader 能解析）：

   ```bash
   ln -sfn "$PWD" ~/.dsh/profiles/node_modules/@local/dsh-opencode-usage
   ```

2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 追加：

   ```yaml
   - insert:
       - id: opencode-usage
         name: '@local/dsh-opencode-usage'
   ```

3. **重启 `dsh web`**（客户端模块扫描需重启生效）。

## 使用

设置 → **OpenCode 用量**：填入 Workspace ID 和完整 Auth Cookie（浏览器打开 opencode.ai，从开发者工具复制 `auth` cookie），点"测试连接"。

## 工作原理

- **双端结构**：`lib/index.js` 是 Host 插件（Cordis plugin），`lib/client.js` 是浏览器 bundle（`window.__ModuleLoader__.load(...)`，由 `package.json` 的 `dsh.client` 声明发现）。
- **RPC**：Client 通过同源 `fetch` 调用 Host 注册的 `webServer` 路由：`GET/POST /ocu/api/config`、`POST /ocu/api/usage`。
- **数据源**：Host 用 `subprocess` 跑 `curl` 抓取 `https://opencode.ai/workspace/{workspaceId}/go`，解析页面内嵌的 `lite.subscription.get` 数据（`rollingUsage` / `weeklyUsage` / `monthlyUsage`，含 `usagePercent` 与 `resetInSec`）。
- **渠道过滤**：Client 通过 `modelDirectories` 服务读取当前会话的模型 Provider。

## 安全

- **切勿把 auth cookie 或 workspace ID 提交到仓库**。源码默认值为空，实际值只存在于 `~/.dsh/ocu-config.json`（0600）。
- API 路由仅监听本机 dsh 服务，请勿在不可信环境暴露。

## 许可证

MIT — see [LICENSE](./LICENSE)
