# dsh-selection-followup

选中 DSH 聊天回复中的任意文字，浮出「**追问 / 复制**」气泡：
一键把选中内容作为引用填入输入框，**问题由你自己输入**；或一键复制。

## 安装

```sh
dsh plugin --profile web add "github:zzx-dear/dsh-selection-followup"
# 或本地开发：
dsh plugin --profile web add link:/path/to/dsh-selection-followup
```

重启 dsh web 后生效。

## 用法

1. 在任意聊天回复里**用鼠标选中一段文字**
2. 选区下方浮出气泡：
   - **追问** — 把 `「选中内容」` 填入输入框并聚焦，你在引用后面**输入你的问题**，回车发送
   - **复制** — 复制选中文字到剪贴板
3. Esc / 点击别处 / 滚动页面，气泡消失

不写死任何提问模板——引用是给 AI 的上下文，问题是你的话。

## 实现说明

- 纯客户端插件：主机侧无逻辑（`lib/index.js` 仅为可安装性存在）
- 选中文字在 `mouseup` 时快照保存，点按钮不会丢选区
- 输入框定位用结构钩子（`[data-composer-seat]` / `[data-composer-card]`）并回退到可见 textarea；
  写入用原生 value setter + `input` 事件，兼容 React 受控输入框
- 追问引用上限 2000 字；只在会话区（`[data-conversation-scroll]`）内触发，
  输入框内选字不触发

## FAQ

**Q: 气泡不出来？**
A: 确认选中发生在会话区内（输入框里选字不触发）；老版本 web 没有
`data-conversation-scroll` 时会退化为「非输入控件内即可触发」。

**Q: 追问填入后没生效？**
A: 写入走原生 value setter + `input` 事件；若某版本输入框换了结构，
请在 issue 里附上 `document.querySelector("[data-composer-seat], [data-composer-card]")`
的结构信息。

**Q: 引用的选中内容太长？**
A: 上限 2000 字，超长自动截断。

## License

MIT
