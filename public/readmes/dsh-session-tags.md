# dsh-session-tags

DeepSeek Harness (DSH) 会话标签（host + client 一体包）。

## 功能

- **设置 → 会话标签**：为会话添加/删除标签（chip 形式，自动去重、单标签 ≤32 字符）
- **tag 搜索**：在会话标签分区内用 `tag:xxx` 按标签搜索会话并直接打开
- 存储独立于会话日志/查询管线：`$DSH_HOME/session-tags.json`

## 安装

```bash
dsh plugin --profile web add github:tuogusa/dsh-session-tags
```

**兼容 Profile**：`web`（DSH Web GUI）。



然后按 `dsh` 引导添加 `pnpm-workspace.yaml` 的 allowBuilds 条目，重启 DSH 并 `Ctrl+Shift+R` 刷新浏览器。

## 结构

- `lib/index.js` — 主机侧：`GET /api/session-tags`、`POST /api/session-tags/set`
- `lib/client.js` — 浏览器侧：设置 → 会话标签 分区

## License

MIT
