# DSH-dseyes   给 DeepSeek Harness 装上「眼睛」

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/dsh-dseyes)](https://www.npmjs.com/package/dsh-dseyes)
[![DSH](https://img.shields.io/badge/DeepSeek%20Harness-plugin-blueviolet)](https://github.com/deepseek-ai/deepseek-harness)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](package.json)

**中文** | [English](README.en.md)

**DSH-dseyes** 让 DeepSeek Harness 的纯文本模型（DeepSeek）拥有**原生图片上传体验**：

在 Web GUI 聊天框里**粘贴或拖入一张图片**，可以像正常 AI 聊天那样：
1. 图片作为**附件**显示缩略图（聊天历史里保留原图，可点击放大）；
2. 发送后，host 端自动用**智谱 GLM 免费视觉模型**（`glm-4v-flash` → `glm-4.6v-flash` → `glm-4.1v-thinking-flash` 自动降级链）识别图片内容；
3. DeepSeek 收到的是图片的文字描述——它会基于图片内容直接回答你。

不需要任何额外命令、不需要手动转文字、不需要改模型。

> **原理**：DSH 原本在 `session.prompt` 的图片准入检查里会拒绝带图消息（DeepSeek 适配器声明 `inputModalities: ["text"]`，报 `MODEL_DOES_NOT_SUPPORT_IMAGES`）。DSH-dseyes 在 host 端做两件事：
> 1. **放行准入**——让图片以附件形式真正进入会话（所以缩略图、历史、点击放大全都正常）；
> 2. **LLM 调用前自动替换**——在消息发给 DeepSeek 之前，把图片内容块替换成 GLM 读图后的文字描述。DeepSeek 永远只收到文字，但会话里保留原图。

## 特性

- 🖼️ **原生上传体验**：粘贴/拖拽图片 → 缩略图附件 → 发送 → DeepSeek 直接理解图片内容。
- 🆓 **零成本**：智谱 `glm-4v-flash` 是免费模型，注册即用。
- 🔒 **Key 不落地浏览器**：GLM API key 只存在本机环境变量 / secrets 文件里，由 host 端持有。
- 🔁 **自动降级链**：主模型失败自动依次尝试 `glm-4.6v-flash`、`glm-4.1v-thinking-flash`。
- 🗂️ **图片留档**：原图保存在会话里（缩略图 + 点击放大），文字描述用于模型理解。
- ⚡ **结果缓存**：同一张图多次出现在上下文时复用第一次的读图结果，不重复消耗。
- 🩺 **一键自检**：`GET /dsh-dseyes/diag` 返回 key 与智谱连通性。

## 安装

### 前提

一个**智谱 GLM API key**（免费）：

1. 注册/登录 [open.bigmodel.cn](https://open.bigmodel.cn)；
2. 「API Keys」→ 新建并复制（格式 `id.secret`，`glm-4v-flash` 免费，无需付费）。

配置 key（任选其一，优先级从高到低）：

```sh
# 方式 1：进程环境变量
set GLM_API_KEY=你的key          # 当前会话
setx GLM_API_KEY "你的key"       # 永久（Windows 用户级）

# 方式 2：secrets 文件（与 dsh-media-skills 共用，推荐——立即生效）
# 新建 %USERPROFILE%\.dsh\secrets\media-tools.env，内容一行：
GLM_API_KEY=你的key
```

> 兼容：`ZHIPU_API_KEY` 与 `GLM_API_KEY` 等价；Windows 上还会实时读注册表
> `HKCU\Environment\GLM_API_KEY`。

### 安装插件

```sh
# 推荐：从 npm 一键安装（已发布为 dsh-dseyes）
dsh plugin --profile web add dsh-dseyes

# 或本地开发：把本仓库目录加入 profile
cd %USERPROFILE%\.dsh\profiles\web
pnpm add "file:D:\路径\DSH-dseyes"
# 然后在 package.json 的 dsh.profile.bundles 里追加 "dsh-dseyes"
```

然后**重启 DSH Web GUI**（完全退出并重新打开）。

## 使用

1. 在聊天输入框**粘贴**（Ctrl+V）或**拖入**一张图片——输入框上方出现缩略图附件栏。
2. 输入问题（可选），按发送。
3. DeepSeek 会自动理解图片内容并回答。

聊天历史里保留原图（点击可放大查看）。

## 实际效果

粘贴一张动漫插画，问「这张图里是什么？」：

```
🖼️ [图片附件缩略图] 这张图里是什么？请简要回答

🤖 DeepSeek：
根据图片描述，这是一张像素风格的动漫插画，主体是一个蓝发双马尾的可爱女孩，
她睁着大眼睛、表情可爱，正在吃一个黄色的食物（可能是冰淇淋或蛋糕）。
她位于画面中央，服装以白色和黑色为主、带金色小装饰，衣服上有一个小鲸鱼图案。
```

> 图片本身作为附件保留在聊天历史中（可点击放大），DeepSeek 基于 host 端
> GLM-4V-Flash 自动生成的图片描述回答——你感知不到中间的读图过程。

## 故障排查

读图失败时（比如没配 key），DeepSeek 收到的消息会包含 `[图片内容无法识别：原因]`
说明文字，对话不会中断。想自查 key 与智谱连通性，本机浏览器打开：

```
http://127.0.0.1:<dsh端口>/dsh-dseyes/diag
```

返回示例：`{"ok":true,"diag":{"keyFound":true,"apiStatus":200,"apiOk":true}}`

## 工作原理

```
用户粘贴/拖拽图片
      │  (Web GUI 原生：缩略图附件)
      ▼
session.prompt（带 image part）
      │  ┌────────────────────────────────────────────┐
      │  │ DSH-dseyes（host 半）                       │
      │  │ ① patch llm.resolveModelInfo               │
      │  │    → 模型声明支持 image → 准入放行          │
      │  │    → 图片保存进会话（缩略图 + 历史）        │
      │  │ ② patch llm.streamWithRegistration         │
      │  │    → LLM 调用前把 image block               │
      │  │      换成 GLM-4V-Flash 读图文字             │
      │  └────────────────────────────────────────────┘
      ▼
DeepSeek 收到纯文本描述 → 基于图片内容回答
```

- **图片进会话**：patch `llm.resolveModelInfo` 让路由模型声称 `inputModalities: ["text","image"]`，DSH 的图片准入（`session.prompt`）因此放行，图片被 durable 保存并显示。
- **读图替换**：patch `llm.streamWithRegistration`（`llm.stream` 与 `prepareCall().stream` 的共同咽喉），在每次 LLM 调用前把消息里的所有图片内容块替换成 GLM 读图文字（`【图片内容】…`），替换失败降级为说明文字，对话不中断。

## 开发 / 构建

```sh
npm install        # 或 pnpm install（安装 rollup 构建依赖）
npm run build      # 产出 lib/index.js
npm run watch      # 监听改动自动重建
```

## 配置项

| 环境变量 | 说明 |
|---|---|
| `GLM_API_KEY` / `ZHIPU_API_KEY` | 智谱 key（必填） |
| `~/.dsh/secrets/media-tools.env` | 可选 secrets 文件，与 dsh-media-skills 共用 |

## 隐私

- 图片只发送给智谱官方 API（open.bigmodel.cn），用于识别内容。
- Key 永不写入本仓库、不进入浏览器。
- 读图结果只在模型请求中使用，不上传任何第三方。

## License

MIT
