# dsh-session-nav

DeepSeek Harness (DSH) 会话对话快捷导航（host + client 一体包）。

## 功能

- **右侧半透明触发按钮**：贴对话文字列右边缘（四角圆角），随布局动画（详情面板开合/侧边栏拖动/窗口缩放）平滑跟随
- **hover 弹出提问列表**：显示当前会话**全部历史提问**（含被 compaction 折叠的，不依赖 DSH 渲染窗口），可上下滚动；打开时自动把「当前提问」滚动到列表中央；顶部固定显示会话名字与提问总数
- **点击跳转**：窗口内的提问直接平滑跳转；窗口外的提问自动逐页加载更早历史后跳转（带进度提示，视口不跳动）
- **性能**：host 端对 live Session 做内存增量遍历 + 持久化索引（`$DSH_HOME/session-nav-questions.json`）+ 客户端缓存 + `afterSeq` 增量同步——正常路径无磁盘 IO、无日志全量扫描

## 安装

```bash
dsh plugin --profile web add github:tuogusa/dsh-session-nav
```

**兼容 Profile**：`web`（DSH Web GUI）。

然后按 `dsh` 引导添加 `pnpm-workspace.yaml` 的 allowBuilds 条目（git 依赖的 prepare 脚本需要放行），重启 DSH 并 `Ctrl+Shift+R` 刷新浏览器。

## 结构

- `lib/index.js` — 主机侧：`GET /api/session-nav/questions`（完整历史提问列表，内存增量 + 持久化索引）
- `lib/client.js` — 浏览器侧：注册官方 slot `conversation.session.header.utilities`，渲染右侧悬浮导航

## License

MIT
