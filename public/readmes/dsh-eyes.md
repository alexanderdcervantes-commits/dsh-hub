# dsh-eyes

<div align="center">

**中文** · [English](./README.en.md)

</div>

给 DeepSeek Harness 里的**纯文本大模型**（如 DeepSeek）装上「随时可用的眼睛」：图片粘贴/附件后留在后台，模型自己在需要时调用 `view_image` 工具去看图（底层走**任意 OpenAI 兼容视觉接口**，默认百炼 Qwen），就像模型**原生具备多模态**一样。

## 快速体验：上传图片，自然丝滑

不需要开关、不需要手动调用工具——**直接 `Ctrl+V` 粘贴一张截图**，像发普通消息一样提问即可。DeepSeek 会在思考里自然地决定「我要看这张图」，自己调用 `view_image`，然后直接给出结构化回答，一气呵成：

![dsh-eyes 演示：粘贴截图 → 思考 → 调用 view_image → 结构化回答](https://raw.githubusercontent.com/Leeminjing/dsh-eyes/b645e41dd6afeba06c58414914a77a150d49fe1a/assets/demo.png)

> 上图实拍：粘贴一张 MSN 截图，问「介绍这个页面的布局」。注意中间的 `Think → Tool call · view_image → Think` 过程——识别不是被强行塞进第一步，而是模型在需要时自己决定看图；视觉提取与最终回答无缝衔接，就像 DeepSeek **原生具备多模态**一样丝滑。

## 解决的问题

DeepSeek 是纯文本模型，Harness 默认不允许给「当前模型不支持图片」的会话发送带图消息。本插件：

- 让带图消息**能通过发送准入**并被持久化保存；
- 在把消息交给主模型**之前**把图片剥离成一句引用说明；
- 注册 `view_image` 工具，主模型**随时**调用它看图，视觉模型提取描述/OCR 文字后交给主模型继续回答。

## 安装

```bash
# 1) 安装插件（github 方式，也可以换成 npm 包名）
dsh plugin --profile web add github:Leeminjing/dsh-eyes

# 2) 配置 API Key（Windows；换成你所用视觉提供商的 key）
setx VISION_API_KEY "sk-你的key"

# 3) 配置视觉模型（必填，换成你账号里可用的视觉模型）
setx VISION_MODEL "qwen-vl-plus"

# 4) 配置接口端点（默认百炼；换其他 OpenAI 兼容提供商时必改）
setx VISION_ENDPOINT "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

# 5) 重启 dsh，让环境变量生效
```

> `setx` 只对**新启动的进程**生效，所以配置后要重启 dsh。
> 模型名与端点因提供商而异：百炼用 `qwen-vl-plus`/`qwen-vl-max`，OpenAI 用 `gpt-4o`，OpenRouter 用 `qwen/qwen2.5-vl-72b-instruct` 等。详见下表。

## 使用

1. 在会话里**粘贴一张图片**（Ctrl+V）或拖拽/点附件；
2. 发一句问题，例如「这张图里写了什么？」；
3. 主模型收到的是「图片引用说明」，它需要看图时会自动调 `view_image(attachment_id=…)`；
4. `view_image` 用视觉模型提取图片内容，主模型基于这些文字回答。

你可以在后续任意一轮继续追问同一张图（「再看一下图里第二行的数字」），图片一直留在后台，可反复查看。

## 工作原理

```
粘贴图片 + 提问
   │
   ▼
发送准入 ──(1) 把目标模型标记为“支持图片”── 图片持久化(生成 attachment_id)
   │
   ▼
请求派发前 ──(2) 剥离图片：image 块 → 【图片N attachment_id=…】引用说明，登记到本会话分片
   │
   ▼
主模型收到纯文本(引用说明 + 你的问题)
   │   主模型决定看图时
   ▼
调用 view_image(attachment_id) ──(3) 读字节 → base64 → 调视觉接口
   │
   ▼
视觉模型返回描述/OCR 文字
   │
   ▼
主模型基于文字作答
```

三个环节：

1. **准入放行**：包装 `llm.resolveModelInfo`，让目标主模型声明 `inputModalities: ['text','image']`，使带图消息能通过 Host 的发送准入检查并被保存。
2. **图片剥离**：包装 `llm.streamWithRegistration`，在请求派发给模型前把每个 `image` 块（含嵌套在 `tool-result` 里的）换成带序号的引用说明（`【图片N attachment_id=…】`），并按 `sessionId` 分片登记 `attachment_id → ImageAttachmentRef`。构造**新的 options 对象**传下去（原对象可能被冻结）。
3. **`view_image` 工具**：按单个 `attachment_id`、或 `attachment_ids` 数组一次看多张（或本地 `image_path`）读出图片字节，转成 `data:` URL，POST 到配置的视觉接口（按 `VISION_API_STYLE` 自动选用 **Chat Completions 或 Responses** 协议），返回文本（多图时带【图片N】分段）。

## 配置

| 配置项 | 环境变量 | 默认值 |
| --- | --- | --- |
| API Key | `VISION_API_KEY` | （必填） |
| 视觉模型 | `VISION_MODEL` | （必填，无默认） |
| 接口端点 | `VISION_ENDPOINT` | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| API 风格 | `VISION_API_STYLE` | `auto`（按端点路径自动判断） |
| 目标主模型 | —（代码内 `targetProvider`） | `deepseek-official` |
| 本地图片大小上限（`image_path`） | —（代码内 `maxImageBytes`） | 15 MB |

> 粘贴/附件图片的大小受 Harness 附件存储限制（默认 5 MB），与上表「本地文件」上限无关。

> **同时支持 Chat Completions 与 Responses API**：`VISION_API_STYLE` 取值 `auto`（默认）/ `chat` / `responses`。
> - `auto`：按端点路径自动识别——`.../chat/completions` → Chat Completions，`.../responses` → Responses API；裸 base URL 默认 Chat Completions 并自动补全路径。
> - `chat` / `responses`：强制指定，插件会把端点路径自动归一化到对应协议。
> 请求体与响应解析都随风格切换（`messages`/`image_url` ↔ `input`/`input_image`），对使用方式完全透明，切换无需任何改动。

**常见 OpenAI 兼容视觉提供商：**

| 提供商 | 端点 | 模型示例 |
| --- | --- | --- |
| 阿里云百炼 | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | `qwen-vl-plus` / `qwen-vl-max` |
| OpenAI | `https://api.openai.com/v1/chat/completions` | `gpt-4o` / `gpt-4o-mini` |
| Moonshot | `https://api.moonshot.cn/v1/chat/completions` | `moonshot-v1-8k-vision-preview` |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `qwen/qwen2.5-vl-72b-instruct` |

也可在 `cordis.patch.yml` 里给该行传 `config`（会覆盖默认值 / 环境变量）：

```yaml
- insert:
    - id: dsh-eyes
      name: dsh-eyes
      config:
        apiKey: sk-xxx          # 同 VISION_API_KEY
        model: qwen-vl-plus     # 同 VISION_MODEL
        # endpoint, targetProvider, maxImageBytes 同理
```

## 已知限制与说明

- **两个内部包装点**：因为 Harness 目前**没有公开的扩展点**用于「发送准入的图片能力判断」和「派发前剥离图片」，本插件直接包装了 `llm.resolveModelInfo` 与 `llm.streamWithRegistration` 两个方法。副作用是：纯文本主模型会在模型选择器里**显示为支持图片**（这是有意为之，才能放行带图消息）。
- **主模型自动适配**：任何纯文本主模型（不限 provider）都会被自动保护；本身原生支持图片的多模态主模型不受干预，图片直接原生通过。
- **视觉接口**要求 OpenAI 兼容（Chat Completions 或 Responses API）；Anthropic / Gemini 的原生接口不直接支持，需走它们的 OpenAI 兼容网关。
- **会话隔离与持久化**：图片引用索引按 `sessionId` 分片（一个会话只能查看自己的附件），并持久化到 `.dsh/attachments/v1/dsh-eyes-index.json`（启动时读回、新图落盘）。因此即使上下文被压缩、或进程重启，模型仍能通过 `attachment_id` 查看历史图片。
- API Key 请用环境变量 / 凭证服务管理，**不要硬编码进仓库**。

## License

[MIT](./LICENSE)
