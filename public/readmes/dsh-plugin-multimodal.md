# dsh-plugin-multimodal

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

DeepSeek Harness 官方线路是**纯文本**。Web 里贴图会被拒：`当前模型不支持图片`。

这个插件补的是**贴图准入**，不是视觉工具箱。

1. 主模型本身收图（Claude / GPT / 自建视觉网关）→ 原样把图交给模型，不转文字  
2. 主模型是纯文本（官方 DeepSeek）→ GUI 先收下图，sidecar 转成文字再发给主模型  
3. `see_image` 给磁盘上的截图用  

官方 PI adapter 已经会做第 1 步，不会做第 2 步：不支持就 `UNSUPPORTED_CONTENT`。Anionex 的 `dsh-vision-toolkit` 是另一条路：给 agent 一堆 `vision_*` 工具，要模型自己去调。本插件让**粘贴不被拒**。

对应需求：[Discussions #588](https://github.com/deepseek-ai/deepseek-harness/discussions/588) · 介绍帖：[Show and tell #1709](https://github.com/deepseek-ai/deepseek-harness/discussions/1709)

## 安装

```powershell
dsh plugin --profile web add github:shinjiyu/dsh-plugin-multimodal
```

本地路径：

```powershell
dsh plugin --profile web add D:\tempWorkspace\dsh-plugin-multimodal
```

然后**重启** `dsh web`。旧会话的工具表不会更新。

GitHub topic：`dsh-plugin`

## 配置

环境变量（不要把 key 写进仓库）：

| 变量 | 作用 |
|------|------|
| `DSH_VISION_BASE_URL` | 视觉接口，例如 `https://api.example/v1` |
| `DSH_VISION_API_KEY` | 该接口的 key |
| `DSH_VISION_MODEL` | 必须是**真能看图**的模型，例如 `glm-4.5v` |
| `DSH_VISION_PROMPT` | 可选。默认 OCR + 描述界面 |

没设 `DSH_VISION_*` 时回退 `OPENAI_BASE_URL` / `OPENAI_API_KEY`。`GLM-5.2-FP8` 这类文本模型**不能**当 sidecar。

也可以在 profile 的 `cordis.patch.yml` 里写：

```yaml
- id: dsh-plugin-multimodal
  name: dsh-plugin-multimodal
  inject: [llm, tools, attachments, systemPrompt]
  config:
    model: glm-4.5v
    apiKeyEnv: DSH_VISION_API_KEY
```

## 30 秒验收

1. 主模型仍用官方纯文本（或 PocketCity 文本模型）  
2. 配好一个真能看图的 sidecar  
3. 在 Web 里**粘贴一张报错截图**，问「红字说了什么」  
4. 过关：不再弹「当前模型不支持图片」，主模型能引用图上的字  

磁盘文件：让它调 `see_image`。

## 不要做

- 不要改 `runtime/` 或官方 DeepSeek adapter  
- 不要把 sidecar 指到 `deepseek-v4-flash` / 其它纯文本模型  
- 不要把它宣传成「视觉工具箱」——那是 toolkit 的词  

## 社区

微信群：**deepseek harness 讨论群（2群）**

扫码进群，用来分享和讨论插件。不是官方群。

![微信群二维码](https://raw.githubusercontent.com/shinjiyu/dsh-plugin-multimodal/b9b82a61859de52d1a1573b0119e91e5aced37e1/docs/community/wechat-group-2.jpg)

微信群码大约 7 天过期（本张到 **2026-08-23**）。过期后把新码覆盖 `docs/community/wechat-group-2.jpg` 即可。

宣发稿（Discussions / V2EX / 群公告）在 [`docs/PROMO.md`](docs/PROMO.md)。

## License

MIT
