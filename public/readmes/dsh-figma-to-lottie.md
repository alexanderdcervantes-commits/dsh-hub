# dsh-figma-to-lottie

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 打造的 Figma/SVG → Lottie 动画编译器。

将 SVG 路径与关键帧数据编译成自包含的 `.lottie.json` 文件——直接在 agent 对话中完成，无需任何设计工具。

## 为什么需要它

DSH 插件生态**没有设计工具桥接层**（虽然有 Figma MCP，但没有插件能把设计数据编译成动画资产）。本插件填补了这个空白：它把 SVG→Lottie 的编译管道——路径解析、贝塞尔进出切线转换、关键帧缓动——提炼成两个可被 agent 调用的工具。

## 功能特性

- **`lottie_compile_shape`** — 将 SVG 路径 `d` 字符串解析为 Lottie 形状值 `{ i, o, v, c }`，带正确的贝塞尔切线。编译完整动画前，可先检查任意 SVG 路径的转换结果。
- **`lottie_compile`** — 从紧凑的图层规格组装完整的 Lottie 5.7.4 JSON 文档：矩形（支持渐变填充）、路径、图片（base64 内嵌）、文字，每层均支持透明度 / 上滑关键帧动画。
- 零构建步骤——纯 ESM，发布即运行时代码。无需 `prepare` 脚本，无需构建授权。

## 安装

```bash
# 从 npm 安装
dsh plugin --profile myprofile add dsh-figma-to-lottie

# 从 GitHub 安装（建议锁定 commit，供应链更安全）
dsh plugin --profile myprofile add github:zimai233/dsh-figma-to-lottie#<sha>
```

## 使用

用自然语言告诉 agent：

> "编译一个 3 秒的加载动画：345×414 画布，浅灰背景，10 根蓝色柱子在 x=215.5 处以 0.48/0.24/0.4/1.4 的缓动上滑，每根错开 100ms。写入 ./loading.lottie.json"

agent 会调用 `lottie_compile`，传入类似这样的规格：

```json
{
  "frame": { "w": 345, "h": 414, "bg": "#f3f4f6", "name": "loading" },
  "fps": 60,
  "durationMs": 3000,
  "layers": [
    { "type": "rect", "id": "bar-1", "x": 215.5, "y": 112, "w": 57, "h": 13, "r": 6.5,
      "gradient": ["#61adf8", "#8fd1fa"], "slideUp": 15, "startMs": 0 },
    { "type": "rect", "id": "bar-2", "x": 215.5, "y": 137, "w": 57, "h": 13, "r": 6.5,
      "gradient": ["#61adf8", "#8fd1fa"], "slideUp": 15, "startMs": 100 }
  ]
}
```

产出的 Lottie JSON 可直接用于 iOS / Android / Web（LottieWeb、lottie-ios、lottie-android）。

## 图层规格参考

| 字段 | 类型 | 说明 |
|---|---|---|
| `frame.w` / `frame.h` | number | 画布尺寸（像素，必填） |
| `frame.bg` | hex 字符串 | 可选背景色 |
| `fps` | number | 帧率，默认 60 |
| `durationMs` | number | 动画总时长（必填） |
| `bezier` | {p1x,p1y,p2x,p2y} | 可选缓动曲线，默认为上滑缓动 |

### 图层类型

| 类型 | 字段 |
|---|---|
| `rect` | `x`、`y`、`w`、`h`、`r?`、`fill?`、`gradient?: [c1,c2]`、`slideUp?`、`opacity?`、`startMs?`、`endMs?` |
| `path` | `d`（SVG 路径）、`x?`、`y?`、`fill?`、`opacity?` |
| `image` | `path`（绝对文件路径，PNG 以 base64 内嵌）、`x`、`y`、`w`、`h` |
| `text` | `text`、`x`、`y`、`size`、`color?`、`font?` |

## 开发

```bash
npm install
npm test          # 对 buildLottie + svgPathToLottie 运行纯核心测试
npm run pack      # 打包预检（相当于 pnpm pack）
```

## 许可证

MIT

---

# dsh-figma-to-lottie

Figma/SVG → Lottie animation compiler for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

Turn SVG paths and keyframe data into self-contained `.lottie.json` files — directly from your agent conversation, no design tool required.

## Why

The DSH plugin ecosystem has **no design-tool bridge** (the Figma MCP exists, but no plugin compiles design data into animation assets). This plugin fills that gap: it extracts the SVG→Lottie compilation pipeline — path parsing, bezier in/out tangent conversion, keyframe easing — into two agent-callable tools.

## Features

- **`lottie_compile_shape`** — parse an SVG path `d` string into a Lottie shape value `{ i, o, v, c }` with correct bezier tangents. Inspect how any SVG path translates before compiling a full animation.
- **`lottie_compile`** — assemble a complete Lottie 5.7.4 JSON document from a compact layer spec: rects (with gradient fills), paths, images (base64-embedded), and text, each with per-layer opacity/slide-up keyframe animation.
- Zero build step — pure ESM, the published package is the runtime code. No `prepare` script, no build permission needed.

## Install

```bash
# from npm
dsh plugin --profile myprofile add dsh-figma-to-lottie

# from GitHub (lock the commit for supply-chain hygiene)
dsh plugin --profile myprofile add github:zimai233/dsh-figma-to-lottie#<sha>
```

## Usage

Ask the agent in natural language:

> "Compile a 3-second loading animation: 345×414 frame, light gray background, 10 blue bars at x=215.5 that slide up with a 0.48/0.24/0.4/1.4 ease, staggered 100ms apart. Write it to ./loading.lottie.json"

The agent calls `lottie_compile` with a spec like:

```json
{
  "frame": { "w": 345, "h": 414, "bg": "#f3f4f6", "name": "loading" },
  "fps": 60,
  "durationMs": 3000,
  "layers": [
    { "type": "rect", "id": "bar-1", "x": 215.5, "y": 112, "w": 57, "h": 13, "r": 6.5,
      "gradient": ["#61adf8", "#8fd1fa"], "slideUp": 15, "startMs": 0 },
    { "type": "rect", "id": "bar-2", "x": 215.5, "y": 137, "w": 57, "h": 13, "r": 6.5,
      "gradient": ["#61adf8", "#8fd1fa"], "slideUp": 15, "startMs": 100 }
  ]
}
```

The result is a ready-to-play Lottie JSON for iOS / Android / Web (LottieWeb, lottie-ios, lottie-android).

## Layer Spec Reference

| Field | Type | Description |
|---|---|---|
| `frame.w` / `frame.h` | number | Canvas size in px (required) |
| `frame.bg` | hex string | Optional background fill |
| `fps` | number | Frames per second, default 60 |
| `durationMs` | number | Total animation length (required) |
| `bezier` | {p1x,p1y,p2x,p2y} | Optional easing curve, defaults to slide-up ease |

### Layer types

| Type | Fields |
|---|---|
| `rect` | `x`, `y`, `w`, `h`, `r?`, `fill?`, `gradient?: [c1,c2]`, `slideUp?`, `opacity?`, `startMs?`, `endMs?` |
| `path` | `d` (SVG path), `x?`, `y?`, `fill?`, `opacity?` |
| `image` | `path` (absolute file path, PNG base64-embedded), `x`, `y`, `w`, `h` |
| `text` | `text`, `x`, `y`, `size`, `color?`, `font?` |

## Development

```bash
npm install
npm test          # runs the pure-core tests against buildLottie + svgPathToLottie
npm run pack      # dry-run publish (pnpm pack equivalent)
```

## License

MIT
