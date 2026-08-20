# dsh-bloub-mood

**动态心情图标** — DeepSeek Harness (DSH) 的会话感知动画形象：favicon、侧边栏字标、首页标题随会话状态播放 bloub 引擎原生小剧场动画，16 种表情可点击切换，形状 / 颜色 / 文字全部在设置页自定义。

灵感来自 [bloub](https://bloub.vercel.app/)（bloub, avatar SVG animé · [GitHub](https://github.com/jeremy-prt/bloub)）。本插件把它的表情与动画引擎接到 DSH 的会话状态机上——**扫一眼标签页，就知道 agent 在干活、在等你、还是做完了**。

## 效果预览

**设置页 · 心情图标 / Mood**：表情（16 种）/ 形状（8 种）/ 颜色（12 种）/ 文字（4 处）四层自定义，顶部实时大预览与 iOS 风格启停开关：

![设置页 · 表情选择](https://raw.githubusercontent.com/Yuuhann1999/dsh-bloub-mood/19487c437a5557e9af75ac80e102f0093e485560/docs/settings-v2-expressions.png)

![设置页 · 形状与颜色](https://raw.githubusercontent.com/Yuuhann1999/dsh-bloub-mood/19487c437a5557e9af75ac80e102f0093e485560/docs/settings-v2-full.png)

**实际效果**：侧边栏字标 ⚫ Yuuhann [工作台]，首页标题与徽章自定义：

![实际应用效果](https://raw.githubusercontent.com/Yuuhann1999/dsh-bloub-mood/19487c437a5557e9af75ac80e102f0093e485560/docs/app-in-action.png)

## 小剧场（v2.0 引擎原生动画）

自动状态播放从 bloub 引擎逐帧渲染的 **GIF 小剧场**（透明背景，官网导出管线直出）：

| 状态 | 触发 | 小剧场 |
|---|---|---|
| 执行中 | 会话 `running` | 思考转圈 → **彗星冲刺** → 思考 |
| 等你输入 | `pendingInteraction` | 瞪眼 → 警觉 → **通知弹跳** |
| 完成待读 | `completed` | 惊叹 → 通知 → **爆散庆祝** |
| 空闲 | 以上都不是 | 呼吸 → 眨眼 → **六边形变身** |
| 困倦 | 空闲超 2 分钟 | 沉睡 |

优先级：等你输入 > 执行中 > 完成待读 > 空闲。多会话任一命中即触发。

## 点击交互

点击界面上的任何黑球 → **随机切换 16 种表情之一**（平静 / 专注 / 惊讶 / 兴奋 / 开心 / 大笑 / 生气 / 难过 / 害怕 / 怀疑 / 困惑 / 好奇 / 得意 / 羞怯 / 无趣 / 困倦），每个表情带原生 180 帧眨眼动画；下一次会话状态变化自动回归小剧场。设置页「表情」区可指定**默认表情**（空闲时的脸）。

## 安装

```bash
dsh plugin --profile web add dsh-bloub-mood
```

（npm 安装；也可 GitHub 源 `dsh plugin --profile web add github:Yuuhann1999/dsh-bloub-mood`）

重启 `dsh web`，刷新页面，在 **设置 → 心情图标** 挑造型。

## 可配置项

| 配置 | 选项 | 默认 |
|---|---|---|
| 启用开关 | iOS 滑动开关，停用即完全恢复官方原样 | 启用 |
| 表情 | 16 种（默认表情；点击随机覆盖全池） | 平静 |
| 形状 | 圆形 / 卵石 / 圆角方 / 胶囊 / 三角 / 六边形 / 云朵 / 水滴 | 圆形 |
| 颜色 | 墨黑 / 棕 / 红 / 橙 / 琥珀 / 绿 / 青绿 / 蓝 / 紫 / 玫粉 / 灰 / 奶油 | 墨黑 |
| 主字标 | 侧边栏展开时的名字 | Yuuhann |
| 侧栏徽章 | 名字后的胶囊标签，留空隐藏 | 工作台 |
| 首页标题 | 输入框上方大标题，留空保留官方文案 | （空） |
| 首页徽章 | 标题旁胶囊标签，留空隐藏 | 预览版 |

配置存于 localStorage，刷新与重启保持。

**双轨素材**：墨色时自动状态播放引擎 GIF 小剧场；切换颜色或点击表情时走 128 个表情 SVG 轨道（可染色、原生眨眼）。

## 特性

- **引擎原生动画**：40 个 GIF 小剧场从 bloub 官网导出管线逐帧渲染（真 Chrome + puppeteer 驱动），透明背景，深浅色主题皆宜
- **favicon 动画**：标签页图标跟随状态变化
- **侧边栏 / 首页 / wordmark 全位替换**：含 SVG 内部手术（鲸鱼 → 动图、字母 → 自定义文字、HARNESS 徽章 → 自定义）
- **React 共存**：内联 style + 孤儿清扫 + attribute 监听三重自愈，折叠侧栏、路由切换不丢效果
- **即插即用**：纯客户端插件，无宿主行为、无 API key、零网络请求

## 换素材（开发者）

- 表情 SVG：jsdom 程序化导出（见仓库 `export-one.mjs`）
- 剧本 GIF：puppeteer 驱动官网时间线导出（透明背景）
- 重新构建：`node build.mjs` 内嵌全部素材
- 发版：`npm version` → push → `npm publish`

## 致谢

- [bloub](https://bloub.vercel.app/) — 动画引擎与素材（[jeremy-prt/bloub](https://github.com/jeremy-prt/bloub)，MIT）
- [dsh-web-attention-badge](https://github.com/Luaphes/dsh-web-attention-badge) — 状态→favicon 先例
- dsh-dream-skin — 设置页注入模式参考

## License

MIT
