# dsh-chat-index-rail

对话右侧悬浮"输入目录"——DeepSeek Harness (DSH) Web UI 插件。每条用户输入一根横条：悬停预览开头文字，点击平滑定位到对应消息，滚动时当前横条高亮。纯客户端插件，无宿主逻辑、无需批准、重启不丢。

> Chat input index rail for DeepSeek Harness (DSH) Web UI: one bar per user message on the right edge; hover to preview, click to jump, active bar follows your scroll. Client-only, no host half, no approval needed, survives restarts.

---

## 简介 / About

在长对话里上下翻找某条输入很痛苦。本插件在对话窗口右侧悬浮一条"目录"：**每一次你输入的内容 = 一根横条**，按对话顺序纵向排列。悬停看预览、点击即定位、滚动跟高亮，再长的上下文也能一眼跳到想找的那条输入。

> Tired of scrolling forever to find that one message in a long conversation? This plugin adds a floating rail on the right edge of the chat window: **each user input is one horizontal bar**, in conversation order. Hover to preview, click to jump, and the bar of the message you are currently reading stays highlighted.

## 功能特性 / Features

- 窗口右侧（距右缘 14px、垂直居中）悬浮目录条，每条用户输入一根横条
- 悬停横条 → 气泡显示 `#seq · 第 N 条` + 前 **15** 字预览（不足 15 字全显示，超长加 …）
- 鼠标移入气泡 → 展开到前 **40** 字（气泡加宽，超高内部滚动）
- 点击横条 → 聊天区平滑滚动定位到对应消息
- 滚动聊天时，当前视口顶部附近的输入对应横条**高亮**（品牌色）
- 只收录真正的人类输入：压缩记录、插件注入的上下文不会混入目录

> - A floating rail sits at the right edge (14px margin, vertically centered); each user message gets one bar.
> - Hover a bar → tooltip shows `#seq · #N` + first **15** chars (full text when shorter, `…` when longer).
> - Move the mouse into the tooltip → expands to **40** chars.
> - Click a bar → the chat smoothly scrolls to that message.
> - While scrolling, the bar of the message near the top of the viewport is highlighted in the brand color.
> - Only genuine human inputs are indexed — compaction records and plugin-injected context never pollute the rail.

## 效果预览 / Screenshots

> 目录条外观示意（右侧竖排小横条，悬停弹出预览气泡）：
>
> ```
>            ┌─────────────────────────┐
>            │ #102 · 第 3 条           │   ← 悬停气泡（15 字预览）
>            │ 调整到比如 15 / 40…      │
>            └─────────────────────────┘
>   ┌──────┐  ▬▬▬▬
>   │      │  ▬▬▬▬▬▬▬▬▬▬▬             ← 高亮 = 当前视口位置
>   │ 对话  │  ▬▬▬▬
>   │ 区域  │  ▬▬▬▬
>   └──────┘  ▬▬▬▬                     ← 悬浮目录条（右侧 14px）
> ```

> 实际效果截图：把截图保存为 `docs/screenshot.png` 后，取消下面一行的注释即可显示。
> To show a real screenshot, save it as `docs/screenshot.png` and uncomment the line below.

<!-- ![chat-index-rail](https://raw.githubusercontent.com/Mobai-read/dsh-chat-index-rail/217cb0ffdf07dc03aab3312677cac84059c898d8/docs/screenshot.png) -->

## 安装 / Installation

### 方式 A：npm 安装（推荐）/ Via npm (recommended)

```powershell
# 在 profile 目录（如 C:\Users\<you>\.dsh\profiles\web）执行
# run inside your DSH profile directory (e.g. C:\Users\<you>\.dsh\profiles\web)
npm install dsh-chat-index-rail
```

在 profile 的 `package.json` 追加 / then add to your profile `package.json`:

```json
"dsh": {
  "profile": {
    "bundles": [ "...existing entries...", "dsh-chat-index-rail" ]
  }
}
```

在 profile 的 `cordis.patch.yml` 追加 / and append to `cordis.patch.yml`:

```yaml
- id: chat-index-rail
  name: dsh-chat-index-rail
```

重启 DSH 生效 / restart DSH.

### 方式 B：手动复制 / Manual copy

把包目录复制到 `$DSH_HOME/profiles/<active>/node_modules/dsh-chat-index-rail/`，同样更新 profile `package.json`（dependencies + bundles）和 `cordis.patch.yml`，重启生效。

> Copy the package folder into `$DSH_HOME/profiles/<active>/node_modules/dsh-chat-index-rail/`, update the profile `package.json` (dependencies + bundles) and `cordis.patch.yml` the same way, then restart.

## 使用说明 / Usage

打开任意会话，右侧即出现目录条：

1. 悬停横条看预览（15 字）
2. 鼠标移入气泡展开全文预览（40 字）
3. 点击横条跳转到对应输入
4. 滚动聊天时，当前位置对应横条高亮

> Open any session and the rail appears on the right. Hover to preview (15 chars), move into the tooltip to expand (40 chars), click to jump, and follow the highlight while scrolling.

## 兼容性 / Compatibility

- 依赖 DSH Web UI 的产品稳定锚点（shipped ChatView 自身也在使用）：
  - 插槽 / slots：`shell.overlay`（框架级悬浮层）、`conversation.session.header.utilities`（会话级数据源）
  - 标准 props：`useSession`（聊天快照 `s.chat.nodes` / `s.chat.order`）
  - DOM 锚点 / anchors：`[data-conversation-scroll]`（滚动容器）、`[data-chat-anchor-key]`（消息行锚点）、`[data-chat-flow-kind]`
- 在 DSH Web（rc6 时代）验证通过；DSH 大版本更新如导致插槽/锚点变化，需要同步适配
- Verified against DSH Web (rc6 era); adapt if a major DSH update changes these contracts.

## 开发 / Development

- `lib/index.js` — 宿主半：空挂载（纯客户端插件）/ host half: empty mount (client-only plugin)
- `lib/client.js` — 浏览器束（`window.__ModuleLoader__.load` 格式）/ browser bundle
- 数据流：会话作用域数据源经 `useSession` 提取 {key, seq, preview} 纯标量 → 包内 registry → 悬浮条订阅渲染
  > Data flow: a session-scoped source extracts plain {key, seq, preview} scalars via `useSession` → package registry → the rail subscribes and renders.
- 升级：修改 `lib/` 后覆盖 profile 同名目录 → 重启生效
  > Upgrade: overwrite the profile copy after editing `lib/`, then restart.

## 更新日志 / Changelog

- **v0.1.1** — 元数据补全：`package.json` 增加 `repository` / `homepage` / `bugs` 字段，npm 页面可直达 GitHub 仓库
- **v0.1.0** — 初始版本 / initial release
  - 两级预览（15 / 40 字）、点击定位、滚动高亮 / two-stage preview (15/40), click-to-jump, scroll highlight
  - 修复：tip 索引越界渲染崩溃（列表收缩/清空时剪除悬停提示）/ fix: stale tooltip index no longer crashes render
  - 宽限期定时器走浏览器原生（静态版）；动态沙箱版需用 `ctx.timeout` / native timers in the static bundle (dynamic sandbox needs `ctx.timeout`)

## 许可证 / License

MIT
