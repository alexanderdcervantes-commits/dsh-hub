# dsh-unread-dot

<p align="center"><sub><a href="README.en.md">English</a> · 中文</sub></p>

> DeepSeek Harness（DSH）插件：最小化/切走时，在 macOS Dock 图标上显示**未读红点**，并在会话完成/需要你处理时播放**水泡提示音**。回到应用自动清除。

![license](https://img.shields.io/badge/license-MIT-2EA44F?style=flat)
![platform](https://img.shields.io/badge/platform-macOS-4493F8?style=flat)
![api](https://img.shields.io/badge/built%20on-Badging%20API-08C?style=flat)

<p align="center"><img src="https://raw.githubusercontent.com/Bing-Bryan/dsh-unread-dot/c6dbc1dae83928f10f4f713f5fcfc7423babefd9/assets/dock-badge.png" width="280" alt="Dock 未读红点效果：运行中=红点，跑完=数字"></p>

基于 Chrome **Badging API**（`navigator.setAppBadge` / `navigator.clearAppBadge`）实现——不依赖任何 macOS 系统设置，不需要通知权限，没有横幅打扰。

> ⚠️ **使用前提**：请先在 Chrome 中打开 DSH Web，通过浏览器菜单 **「更多 → Cast, save and share → 安装应用 / Install…」** 把它封装成一个独立的 macOS 应用（PWA）——`setAppBadge` 只对已安装的 Web App 生效。

## 效果

| 场景 | Dock 图标 | 声音 |
| --- | --- | --- |
| 会话正在运行（你不在时） | 🔴 红点（无数字）= 还在干活 | 静音 |
| 会话跑完（你不在时） | 🔴 红色数字 +1 = 结果在等你 | 🔊 水泡音 |
| 会话需要你处理 | 🔴 红色数字 +1 | 🔊 水泡音（每段离开期一次） |
| 回到应用 | 自动清除 | — |

## 为什么用 Badging API

本插件完全构建在 [Badging API](https://developer.chrome.com/docs/capabilities/web-apis/badging-api) 之上，用它的三种状态编码「是否/何种新信息」：

```js
navigator.setAppBadge(3)   // 红色数字角标：3 个未读结果
navigator.setAppBadge()    // 无数字红点：有会话正在运行
navigator.clearAppBadge()  // 清除：回到应用，已读
```

- **无权限、无横幅、无系统设置**：角标是系统级常驻标记，网页直接调用即可
- **点 vs 数字**：数字 = 未读结果计数，纯点 = 运行中（这是 Badging API 能表达的最清晰差异）
- 兼容性：需将 DSH Web 安装为 PWA（Chrome「安装网页应用」），Chrome 81+ 支持该 API；Chrome 152+ 起角标/通知会正确归属到 Web App 自身

## 安装

1. 安装插件包到你的 DSH profile（以 `web` 为例）：

   ```sh
   dsh plugin --profile web add github:Bing-Bryan/dsh-unread-dot
   ```

2. 在 profile 的 `package.json` 的 `dsh.profile.bundles` 中追加：

   ```json
   "dsh": {
     "profile": {
       "bundles": [ "...", "dsh-unread-dot" ]
     }
   }
   ```

3. 重启 `dsh web`，设置 → **Dock 角标与通知** 即可配置。

## 设置项

| 设置 | 默认 | 说明 |
| --- | --- | --- |
| Dock 角标 | 开 | 总开关：跑完/等你处理时显示数字角标，回到应用清除 |
| 运行中显示活动点 | 开 | 最小化期间有会话在生成回复时，显示无数字红点 |
| 提示音（水泡） | 开 | 完成/需要处理时播放内置水泡声（bubble.mp3，0.4s） |
| 测试提示音 | 按钮 | 立即播放一次水泡音验证声音 |

## 工作原理

1. 插件订阅 DSH 的会话列表（`sessions.list`），维护**未读/已读**状态：回到应用（窗口聚焦）时，当前所有待处理状态标记为已读
2. 最小化/切走期间，**新发生**的完成/等待事件才点亮角标与提示音（旧事件不会累计重复计数）
3. 运行中的会话只显示**活动点**（红点），不进入数字计数
4. 提示音用 `Audio` 播放内嵌的 MP3（base64），跨窗口锁保证多个窗口同时打开时只响一次

## 兼容性

- macOS Chrome（安装为 PWA / 「Install page as app」）
- 角标：`setAppBadge` 需在已安装的 Web App 上下文中生效
- 无服务器端依赖，纯客户端插件，HMR 热更新零重启

## 许可

MIT © 2026 Bing-Bryan

内置音效 `bubble.mp3` 基于 [Pixabay 音频：Nature bubble in water](https://pixabay.com/sound-effects/nature-bubble-in-water-422579/) 剪辑制作（Pixabay 许可：免费商用、无需署名）。
