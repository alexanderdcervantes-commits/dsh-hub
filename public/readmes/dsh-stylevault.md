# StyleVault（`dsh-stylevault`）

[English](README_EN.md) | [中文](README.md)

DeepSeek Harness 的经典主题合集：30 套开源配色、完整的 Style Settings 面板、配置可以导出分享。

作者：**Rocky** · 反馈/建议：[@WeWill_Rocky](https://x.com/WeWill_Rocky)

## 为什么做这个

起因很小：我在 VS Code 里用 Catppuccin，终端里用 Nord，Obsidian 里用 Rosé Pine，开了 DSH 想换个颜色，翻了一圈社区，没有我熟悉的那几个经典方案，就自己写了。

做着做着发现，光有预设不够。DSH 里代码块、Diff、思考流、工具输出这些表面，换一套配色后对比度参差不齐——同一套 Nord，代码区清楚了，思考流可能灰成一片。所以没停留在"换色"，而是把这些表面逐个调过：代码高亮、Diff 增删行、状态色、圆角、字体。走的是 Obsidian 那套 Minimal / Style Settings 的路子：默认干净，想折腾也折腾得动。

还有一个朴素的需求：我调好的主题想给别人用，别人调完也想发给我。所以做了导出/导入，一份 JSON 就能把配色、字体、圆角整个搬走。

这是我的个人项目，会持续维护。但 DSH 还在快速迭代（官方自己都说会有破坏性变更），某天某个界面细节变了，欢迎提 issue，我看到会修。

## 功能

### 30 套预设，深色浅色都有

面板里可以按「全部 / 深色 / 浅色」筛选，每张预设卡片带 6 个关键色预览。下面按深浅分组列出，`id` 是控制台切换用的名字（`__STYLEVAULT__.set('nord')`）。

**深色（21 套）**

| 预设 | id | 一句说明 |
|---|---|---|
| Catppuccin Mocha | `catppuccin-mocha` | Catppuccin 家族最深一档，柔和高饱和紫调，**默认预设** |
| Catppuccin Macchiato | `catppuccin-macchiato` | 同家族次深，暖紫灰，低对比耐看 |
| Catppuccin Frappé | `catppuccin-frappe` | 同家族偏浅的深色，柔和雾感 |
| Nord | `nord` | 北欧极简冰蓝，程序员经典，长会话友好 |
| Tokyo Night | `tokyo-night` | 东京夜景，深蓝紫，夜色霓虹感 |
| Tokyo Night Storm | `tokyo-night-storm` | 同系列风暴版，背景比 Night 略浅 |
| Gruvbox Dark | `gruvbox-dark` | 复古暖褐，Vim 社区经典 |
| Everforest | `everforest-dark` | 森系低对比，绿调护眼 |
| Solarized Dark | `solarized-dark` | Ethan Schoonover 的经典科学配色 |
| Graphite | `graphite` | 石墨灰极简 |
| Dracula | `dracula` | 吸血鬼经典，紫粉绿高识别 |
| One Dark | `one-dark` | Atom 编辑器经典深色 |
| Rosé Pine | `rose-pine` | 玫瑰松，柔和粉紫 |
| Kanagawa | `kanagawa` | 《神奈川冲浪里》灵感，日式浮世绘配色 |
| Ayu Dark | `ayu-dark` | Ayu 系列暗色，橙色 accent 点缀 |
| GitHub Dark | `github-dark` | GitHub 官方深色 |
| Monokai | `monokai` | Monokai Pro，高对比代码配色 |
| Night Owl | `night-owl` | 夜猫子，深蓝紫，专注氛围 |
| Horizon | `horizon` | 高对比暖色，界面醒目 |
| Material Darker | `material-darker` | Material 风格更深一档 |
| OLED Black | `oled-black` | 纯黑背景，OLED 屏幕省电 |

**浅色（9 套）**

| 预设 | id | 一句说明 |
|---|---|---|
| Catppuccin Latte | `catppuccin-latte` | Catppuccin 家族浅色，奶油底 |
| Nord Light | `nord-light` | Nord 雪风暴（Snow Storm）浅色版 |
| Gruvbox Light | `gruvbox-light` | 复古暖褐浅色，纸感 |
| Everforest Light | `everforest-light` | 森系浅色，米绿底 |
| Solarized Light | `solarized-light` | 经典浅色，米黄底 |
| Paper | `paper` | 纸张白浅色极简 |
| Rosé Pine Dawn | `rose-pine-dawn` | Rosé Pine 浅色版 |
| Ayu Light | `ayu-light` | Ayu 浅色 |
| GitHub Light | `github-light` | GitHub 官方浅色 |

### Style Settings 面板

Settings → StyleVault，所有调整即时生效、刷新保留：

- **颜色**：15 项 live 可调——Accent、背景 Base / Layer 1 / Layer 2、文字主色 / 次级、边框、代码底色、Success / Warning / Error、侧栏、气泡、输入框、新会话按钮
- **字体**：UI 与代码可分别切换字体，也可以直接填自定义 font-family。详见下方字体清单
- **字号**：UI 与代码各自独立的 5 档缩放（大 → 小），保持官方比例（侧栏 14 / 对话 16 / 轨迹 12–13），不会把界面压变形
- **圆角**：0–16px 滑杆，0 强制全局直角
- **我的方案**：把当前微调另存为方案，可重命名、删除、设为默认
- **导入 / 导出 / 分享**：导出当前状态为 JSON 配置包，或一键复制分享文案（别人粘贴导入即用）

#### 字体清单

**UI 字体（16 款）**

| 字体 | 说明 |
|---|---|
| System | 系统默认字体，不额外加载 |
| SF / PingFang | `-apple-system` + PingFang 等系统栈 |
| Inter | 无衬线，界面标配 |
| Roboto | Android 风格无衬线 |
| Source Sans 3 | Adobe 开源无衬线 |
| IBM Plex Sans | IBM 企业风格无衬线 |
| DM Sans | 几何现代无衬线 |
| Manrope | 圆润现代无衬线 |
| Nunito | 圆角友好无衬线 |
| Atkinson Hyperlegible | 高可读性字体（视觉障碍友好） |
| Noto Sans SC | 中文无衬线，CJK 覆盖 |
| Source Serif 4 | Adobe 开源衬线 |
| Lora | 衬线，阅读感强 |
| Merriweather | 衬线，粗体醒目 |
| Literata | 衬线，Google Play Books 同款 |
| Crimson Pro | 衬线，出版风格 |

**代码字体（14 款）**

| 字体 | 说明 |
|---|---|
| System Mono | 系统等宽默认 |
| JetBrains Mono | 开发者最爱，JetBrains 出品 |
| Fira Code | 含编程连字（ligatures） |
| Source Code Pro | Adobe 开源等宽 |
| IBM Plex Mono | IBM 等宽 |
| Cascadia Code | 微软出品，含连字 |
| Inconsolata | 经典等宽 |
| Ubuntu Mono | Ubuntu 风格等宽 |
| Space Mono | 复古几何等宽 |
| Roboto Mono | Roboto 等宽版 |
| Hack | 社区常青等宽 |
| Victor Mono | 斜体手写风等宽 |
| SF Mono* | macOS 系统自带（标「本机」） |
| Maple Mono* | 需系统已安装（标「本机」） |

> 标「本机」的字体需系统已安装，不做网络加载；其余字体经 Google Fonts / jsDelivr 在线加载，离线环境会自动回退到系统字体栈。

### 可读性专项

面向长 Agent 会话调的对比度，随预设和你的微调一起生效：

- 代码块（Shiki 高亮 token 映射）、Diff 增删行、思考流、工具 / 终端输出、轨迹表、错误摘要
- 状态色（成功 / 警告 / 错误）与轨迹强调色同步

### 其他

- **官方 ThemeService 集成**：只覆盖 `--dsw-alias-*` 语义 token，不碰布局，和官方 Appearance 不冲突
- **刷新自动恢复**：当前预设持久化，重启 `dsh web` 后自动还原
- **中英双语**：面板跟随 DSH 语言（`navigator.language`）——中文环境显示中文，英文环境显示 English
- **控制台 API**：`__STYLEVAULT__` 全局对象，见下方

## 安装

```bash
# 本地开发（link 模式）
dsh plugin --profile web add link:/path/to/dsh-stylevault
# 从 GitHub 安装
dsh plugin --profile web add github:GptsApp/dsh-stylevault
```

重启 `dsh web` 或硬刷新。

> 仓库：https://github.com/GptsApp/dsh-stylevault

## 预览

| Nord（深色） | Nord Light（浅色） |
|---|---|
| ![Nord dark](https://raw.githubusercontent.com/GptsApp/dsh-stylevault/b627f3a40c86cee9016d3749368479c08b5443b9/docs/screenshots/preview-dark-nord.png) | ![Nord light](https://raw.githubusercontent.com/GptsApp/dsh-stylevault/b627f3a40c86cee9016d3749368479c08b5443b9/docs/screenshots/preview-light-nord.png) |

## 使用

1. 打开 **Settings → StyleVault**
2. 点选预设卡片（带 6 色预览）
3. 在颜色 / 字体 / 质感区 live 微调
4. **另存为我的方案** → 导出 / 复制分享

### 设置面板

![StyleVault 设置面板](https://raw.githubusercontent.com/GptsApp/dsh-stylevault/b627f3a40c86cee9016d3749368479c08b5443b9/docs/screenshots/settings-1.png)

![StyleVault 设置面板](https://raw.githubusercontent.com/GptsApp/dsh-stylevault/b627f3a40c86cee9016d3749368479c08b5443b9/docs/screenshots/settings-2.png)

![StyleVault 设置面板](https://raw.githubusercontent.com/GptsApp/dsh-stylevault/b627f3a40c86cee9016d3749368479c08b5443b9/docs/screenshots/settings-3.png)

### 控制台 API

```js
__STYLEVAULT__.list()                    // 全部预设（id/name/深浅/标签/预览色）
__STYLEVAULT__.set('nord')               // 切换预设
__STYLEVAULT__.override({ '--dsw-alias-brand-primary': '#ff7b72' })  // 改单个 token
__STYLEVAULT__.setFonts({ code: '"JetBrains Mono", monospace' })     // 字体
__STYLEVAULT__.setFonts({ uiScale: 2 })  // 字号档位 1–5
__STYLEVAULT__.setOptions({ radius: '10px' })  // 圆角
__STYLEVAULT__.export('My Nord Soft')    // 导出配置 JSON
__STYLEVAULT__.copyShare()               // 复制分享文案
__STYLEVAULT__.import(jsonOrString)      // 导入配置
__STYLEVAULT__.saveScheme('通勤深色')     // 另存为我的方案
__STYLEVAULT__.schemes()                 // 我的方案列表
__STYLEVAULT__.renameScheme(id, '新名字')
__STYLEVAULT__.deleteScheme(id)
__STYLEVAULT__.setDefaultScheme(id)      // 设为默认（开机自动恢复）
__STYLEVAULT__.useOfficial('system')     // 完全回到官方主题
__STYLEVAULT__.tokens()                  // 当前生效的全部 token
```

## 和官方主题的关系

StyleVault 在底层用官方 ThemeService：只覆盖 `--dsw-alias-*` token，不碰布局，所以和官方 Appearance 不冲突。刷新后会自动恢复当前预设。想完全回到官方主题，控制台执行：

```js
__STYLEVAULT__.useOfficial('system')
```

## 已知边界

- DSH 还在 developer preview，token 或界面结构变了可能需要小幅适配；升级前可以先看官方 release notes
- 个别界面元素（如部分输入框）依赖 DSH 内部生成的 class 名，官方改版后可能偶发字体不生效——不会崩，但可能需跟进

## License

MIT。调色板来自各开源项目，本仓库只做 token 映射。

有问题或想法？[@WeWill_Rocky](https://x.com/WeWill_Rocky)，或直接在仓库开 issue。
