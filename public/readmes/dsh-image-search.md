# dsh-image-search

多引擎反向图片搜索聚合器，为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 而生。

Multi-engine reverse image search aggregator for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

把一张公网图片 URL，一键转成 Google Lens / 百度识图 / Yandex / TinEye / Bing 视觉搜索 / 搜狗识图 / SauceNAO / IQDB / Ascii2d 的搜索链接——纯 URL 构造，零网络请求，零依赖。

Turn one public image URL into search links for Google Lens / Baidu / Yandex / TinEye / Bing Visual Search / Sogou / SauceNAO / IQDB / Ascii2d — pure URL construction, zero network calls, zero dependencies.

## 为什么需要它 / Why

视觉生态里已经有 OCR 和 UI 还原，**但没有插件做多引擎反向图片搜索聚合**——没有任何东西能把 Google Lens / 百度 / Yandex / TinEye / SauceNAO / IQDB / Ascii2d 一次配齐。

The vision ecosystem has OCR and UI restoration, but **nobody aggregates multi-engine reverse image search** — nothing puts Google Lens / Baidu / Yandex / TinEye / SauceNAO / IQDB / Ascii2d together in one call. This plugin is the aggregation wedge: 一次提交，全网溯源。

## 特性 / Features

- **`image_search_urls`** — 返回 JSON 数组 `[{ id, name, group, url }]`，每个引擎一条搜索链接。可按 `engines`（逗号分隔 id）或 `group`（`通用` / `插画/动漫`）过滤。
- **`image_search_engines`** — 返回按分组归类的全部 9 个引擎（含模板与是否编码），用于发现引擎 id。
- **`image_search_best`** — 返回人类可读的 Markdown 摘要：一行总览 + 每个引擎一条可点击链接。
- 纯 URL 构造，**不发起任何实际抓取请求**——安全、零依赖、可离线运行。
- 零构建步骤——纯 ESM，发布即运行时代码。无 `prepare` 脚本，无需构建权限。

## 安装 / Install

```bash
# from npm
dsh plugin --profile myprofile add dsh-image-search

# from GitHub (lock the commit for supply-chain hygiene)
dsh plugin --profile myprofile add github:zimai233/dsh-image-search#<sha>
```

## 用法 / Usage

用自然语言让 agent 执行：

> "帮我用这张图搜一下源头：https://example.com/img.png —— 先列出所有引擎的搜索链接"

Agent 会调用 `image_search_urls`：

```json
{
  "imageUrl": "https://example.com/img.png"
}
```

返回示例（截取）：

```json
[
  { "id": "google", "name": "Google Lens", "group": "通用", "url": "https://lens.google.com/uploadbyurl?url=https%3A%2F%2Fexample.com%2Fimg.png" },
  { "id": "saucenao", "name": "SauceNAO", "group": "插画/动漫", "url": "https://saucenao.com/search.php?url=https://example.com/img.png" }
]
```

也可以限定引擎 / 分组：

```json
{
  "imageUrl": "https://example.com/img.png",
  "engines": "google,saucenao",
  "group": "插画/动漫"
}
```

## 工具参考 / Tool Reference

| Tool | 参数 Parameters | 返回 Returns |
|---|---|---|
| `image_search_urls` | `imageUrl` (required), `engines?`, `group?` | JSON 数组 `[{ id, name, group, url }]` |
| `image_search_engines` | — | 按 `group` 分组的 JSON，含模板与 `encode` 标志 |
| `image_search_best` | `imageUrl` (required), `engines?` | Markdown：总览行 + 每个引擎一条链接 |

### 引擎表 / Engines

| id | name | group | encode |
|---|---|---|---|
| `google` | Google Lens | 通用 | ✓ |
| `baidu` | 百度识图 | 通用 | ✓ |
| `yandex` | Yandex | 通用 | ✓ |
| `tineye` | TinEye | 通用 | ✓ |
| `bing` | Bing 视觉搜索 | 通用 | ✓ |
| `sogou` | 搜狗识图 | 通用 | ✓ |
| `saucenao` | SauceNAO | 插画/动漫 | ✗ |
| `iqdb` | IQDB | 插画/动漫 | ✗ |
| `ascii2d` | Ascii2d | 插画/动漫 | ✗ |

`encode` 为 true 的引擎走 query-string 参数（图片 URL 需 `encodeURIComponent` 编码）；为 false 的引擎走路径式参数（需原样 URL）。

## 开发 / Development

```bash
npm install
npm test          # node:test 直接跑纯核心函数 buildEngineUrls / groupEngines
npm run pack      # dry-run publish (pnpm pack equivalent)
```

## 许可证 / License

MIT
