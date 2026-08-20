# dsh-session-review

DSH Web 插件：在**输入框正上方**显示"本轮会话修改的文件"一行（默认收起，点击展开），右侧 **Review** 按钮在侧边栏打开针对**本次会话修改**的 review 面板。

三个能力全部挂在官方扩展点上，不改动 DSH 任何内置包：

| 功能 | 说明 |
| --- | --- |
| **输入框上方一行** | `conversation.input.dock` 槽位（order 15，位于 todo 与 queue 停靠条之间）：收起态显示 `本轮修改 N 个文件 +A −D`（收/展同一张卡片，默认收起，点击展开文件列表）；无修改时整行隐藏 |
| **Review 全部** | 收起态点击右侧 **Review 全部** → 在 better-sidebar 打开 Review 标签页，左侧列出本轮修改的全部文件，右侧显示选中文件的逐处 diff（默认选中最新修改的文件） |
| **单文件 Review** | 展开列表点击某个文件 → 打开/聚焦 Review 标签页并直接切到该文件的 diff（标签已打开时实时切换，不重复开标签） |
| **撤销 / 保存** | 标题栏：**撤销全部**（每个文件恢复到会话前状态，新建文件被删除）/ **保存全部**（保留全部修改并清空列表）；列表项：单个 **↩ 撤销** / **✓ 保存**。保存或撤销后该文件从列表消失，**再次编辑时自动回到列表** |
| **行数统计** | 标题栏与每个列表项都显示 `+增行 −删行`（绿色/红色），新建文件按全文件行数计为新增 |

**Review 的数据是"本次会话"精确的修改**：宿主订阅会话事件流，收集每个成功 `edit`/`write` 工具结果携带的 `meta.diffs`（`{path, oldText, newText}`）——即该工具调用实际替换的文本，**不依赖 git**（git worktree diff 会混入本会话之前未提交的改动，这里不会）。新建文件显示为"新建 + 全量新增行"。

## 安装

```sh
dsh plugin --profile web add /path/to/dsh-session-review
```

`dsh.bundle.patch` 声明会让 CLI 自动把本包追加进 profile 的 bundles（宿主半随之挂载），并以 link 方式安装（开发迭代无需重复 install）。然后**重启 DSH 桌面应用**并刷新页面。零运行时依赖，无 peer / 构建要求。

卸载：`dsh plugin --profile web remove dsh-session-review`。

开发迭代：改完代码运行 `scripts/deploy.sh`（同步 lib 到 profile 安装目录）后重启。

## 架构

```
┌ composer (ui-conversation, 不改) ──────────────────────────────┐
│ conversation.input.dock (order 15)                             │
│   [▸] 本轮修改 N 个文件 · M 处            [Review 全部]        │  ← 收起态
│   展开：文件列表（点击 → 单文件 review）                        │
└───────────────────────────────────────────────────────────────┘
                       │ POST /session-review/api/files.list     (轮询 4s / 会话切换 / 展开瞬间)
                       │ POST /session-review/api/files.diff
                       │ POST /session-review/api/files.read     (新建文件内容)
┌ 宿主半 lib/index.js ──────────────────────────────────────────┐
│ ctx.on("session/event") → tool/result 带 meta.diffs 且非错误    │
│   → 按会话累积 {absPath → [{tool, seq, time, oldText, newText}]}│
│ 首次读取某会话时，回放 ctx.sessions.get(id).events 重建状态      │
│   （页面刷新后列表自动恢复；seq 水位线去重，幂等）               │
│ 围栏 API：isTrustedApiRequest（loopback/trustedHosts + 同源）   │
└───────────────────────────────────────────────────────────────┘
┌ Sidebar Review 标签 (betterSidebar.registerTab, 惰性注册) ─────┐
│ 左：本轮修改文件列表（badge=新建/处数，↗ 在编辑器打开）          │
│ 右：选中文件逐处 diff（行级 LCS，绿=新增 红=删除 灰=上下文）     │
│ 打开逻辑：betterSidebar.openTab（meta 或选择store 聚焦单文件）  │
│ 降级：无 better-sidebar → workspaces.openPath 系统打开          │
└───────────────────────────────────────────────────────────────┘
```

- 客户端 bundle 以 `window.__ModuleLoader__.load` 约定注册，仅 `require("react")` 一个平台 external（全部 `React.createElement`，无 JSX 转换、无打包器）。
- 样式为一次性注入的 scoped CSS（`<style data-plugin="dsh-session-review">`），全部使用 `--dsw-*` 设计令牌与 `--ds-font-family-code`。
- Review 标签通过 `internal/service` 事件**惰性注册**：better-sidebar 缺席时插件不失败，仅 review 降级为系统打开方式。

## API（宿主，围栏后）

`POST /session-review/api/<method>`（浏览器信任围栏，与 /api 网关同构）：

- `files.list {sessionId, cwd?}` → `{root, files:[{path, name, abs, created, opCount, hunkCount, addLines, delLines, changedAt}]}`（按 changedAt 倒序，已保存/撤销的文件被排除）
- `files.diff {sessionId, path}` → `{root, path, created, hunks:[{tool, seq, time, oldText, newText, addLines, delLines, truncated}]}`
- `files.read {sessionId, path}` → `{kind:'text'|'binary', content?, truncated?, size?}`（新建文件内容，上限 512KB）
- `files.undo {sessionId, path}` → `{undone, mode:'reverted'|'deleted', path}`（反向应用全部 hunk 恢复会话前内容；新建文件删除；文件漂移/截断时拒绝并不做任何写入）
- `files.undoAll {sessionId}` → `{undone, results:[…], failed:[{path, error}]}`（逐文件撤销，单文件失败不影响其余）
- `files.save {sessionId, path}` / `files.saveAll {sessionId}` → `{saved}`（接受修改并从列表移除；再次编辑自动回到列表）

## 已知限制

- **非 `edit`/`write` 的修改不追踪**：bash 里的 sed/重定向等不会产生 `meta.diffs`，故不计入（此类改动可在 better-sidebar 的 git 标签查看 worktree 差异）。
- **撤销为反向应用 hunk**：按记录顺序倒序把每处 `newText` 替换回 `oldText`；文件在会话外被改动过（hunk 无法定位）或单处差异超过 64KB 被截断时，**拒绝撤销并提示**，不会写入半途结果。`replace_all` 造成的多处相同文本理论上可能定位偏差（尽力而为）。
- **子代理会话独立记账**：subagent 的编辑计入其自身会话，不并入父会话列表。
- **中断的工具调用**（无 result）不落库；pending 标记按 FIFO 上限清理。
- **容量上限**：每会话 200 文件 / 每文件 200 处 / 单处文本 64KB（超出置 `truncated`，UI 显示"已截断"且不可撤销该文件）。
- 大 diff 走退化路径（全部删除块 + 全部新增块），避免 LCS 内存爆炸。
