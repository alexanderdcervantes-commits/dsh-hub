# dsh-chinese-mode

DeepSeek Harness Web 全局中文模式插件：在输入框左侧提供一个紧凑的「中文」胶囊开关，开启后向**任意 preset** 的 system prompt 注入语言要求。

> 简体中文是默认文档语言。英文版见 [README.en.md](README.en.md)。

## 功能

- **全局且持久化**：开关存于宿主侧设置（`dsh-chinese-mode` 命名空间），对所有会话生效。
- **无条件注入**：开启即注入，不做「已有中文」检测；注入位置在 persona 之前。
- **分区域语言开关**：回复、思考、工具三块区域各自开关——开启=中文，关闭=英文（正向指令，实测有效）。
- **设置页**：在 dsh 设置中提供「中文模式」配置页（总开关、区域开关、锚定关键词与行为）。文案由内置默认值管理，避免手动填写污染 system prompt。
- **输入框胶囊开关**：输入框旁常驻紧凑「中文」开关，使用双字标签与微型胶囊清晰表达状态；开启时为浅蓝选中态，关闭后保留中性状态并可一键重新启用。设置页可独立隐藏该开关。
- **任意 preset 均生效**（complete persona 除外，DSH 机制限制，见「原理」）。
- **锚定兼容**：默认关闭；启用后锚定 preset 晋升后思考用英文、回复/工具仍按设定（首轮由 preset 的 tool-bootstrap 自行锚定，插件 section 会被过滤）。关闭时无视锚定，按常规设定。
- **关闭即移除**：关闭总开关后从后续组装中移除该 section；不翻译历史消息，也不插入可见聊天内容。

## 安装

插件市场上架后可一键安装，或命令行：

```bash
dsh plugin --profile web add github:dawnliming/dsh-chinese-mode
```

安装后重启 `dsh web`；输入框左侧的「中文」胶囊开关可直接切换语言注入，是否显示该开关可在设置页控制。

## 设置字段

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `false` | 总开关；关闭后完全不注入，输入框状态键保留为关闭状态。 |
| `showInputSwitch` | `true` | 是否显示输入框左侧的「中文」胶囊开关；独立于总开关。 |
| `replyChinese` | `true` | 回复区域语言：开=中文，关=英文。 |
| `thinkingChinese` | `true` | 思考区域语言：开=中文，关=英文。 |
| `toolsChinese` | `true` | 工具/界面区域语言：开=中文，关=英文。 |
| `textReply` / `textThinking` / `textTools` | 各区域默认中文文案 | 内置中文文案（英文文案内置对应英文版）；设置页不提供编辑，避免污染。 |
| `anchoredPresetKeywords` | `liangshen, 梁神, anchored, 锚定` | 视为锚定模式的 preset 名称关键词（逗号分隔，设置页可编辑）。 |
| `anchoredMode` | `false` | 默认关闭；启用后锚定 preset 下思考用英文，回复/工具按设定。 |

> 旧版单个 `text` 字段会在升级后自动作为「回复文案」保留。

## 原理

宿主侧通过官方 `systemPrompt.section()` 把 `dsh-chinese-mode:language` 注册为系统提示的一个 section（`order` 为负，排在 persona 之前），`text` 是每次组装实时计算的函数：总开关关闭时返回空串、渲染时自动丢弃。锚定判断通过 DSH 的 `resolveSessionPreset(session)` 读取最新的 `agent-preset/selected` 事件，而不是只读取会话创建时的 header；因此空白会话切换 preset 后也会使用当前选择。锚定 preset 的首轮会被其 `tool-bootstrap` 按 section 名过滤掉、晋升后自动恢复，因此天然兼容锚定。**限制**：DSH 会在 waterfall 结束后把 complete persona 强制恢复为唯一 section，故本插件对 complete persona 不生效（这是 DSH 机制限制，非插件缺陷）。客户端渲染绑定到 `dsh-chinese-mode` 设置命名空间的「中文」胶囊开关。

## 开发

- 宿主：`lib/index.js`
- 客户端：`lib/client.js`（ModuleLoader bundle，修改后需重新构建）
- 本地安装到 profile（`file:` 依赖）：

```bash
cd ~/.dsh/profiles/web
pnpm add file:../../plugins/dsh-chinese-mode
# 并在 package.json 的 dsh.profile.bundles 加入 "dsh-chinese-mode"（或让 dsh 自动 reconcile）
```

## License

MIT
