# dsh-content-lab · 内容工坊

给 DeepSeek Harness 装上"内容生产流水线"：选题 → 标题 → 文案 → 排期。

面向做自媒体 / AI 副业 / 内容营销的人。全部工具在插件内直接调用 LLM，不依赖任何外部 API。

## Tools

| 工具 | 作用 |
| --- | --- |
| `content_topic_generator` | 按领域 × 平台生成爆款选题（含切入角度、钩子、理由） |
| `content_title_rewriter` | 标题改写，支持悬念/数字/情绪/反差/疑问风格 |
| `content_post_writer` | 按平台生成完整文案（小红书/公众号/抖音/B站） |
| `content_calendar` | 生成 N 天内容排期表 |

## Install

```sh
dsh plugin --profile web add dsh-content-lab
```

## Configure

默认使用 `deepseek-official` provider 和 `deepseek-v4-flash` 模型。在 profile 的
`cordis.patch.yml` 里按 `id: content-lab` 覆盖：

```yaml
- id: content-lab
  name: dsh-content-lab
  config:
    provider: deepseek-official
    model: deepseek-v4-flash
```

每个工具还接受可选的 `model` 参数做单次覆盖。

## Design

- **零外部依赖**：工具用原生 JSON-Schema 注册（`ctx.tools.register`），LLM 调用用
  `ctx.llm.stream()` + 手建消息，不需要解析任何 `@deepseek-ai/*` 包。
- 输出走"结构化 JSON 规范值 + 可读渲染"，模型只负责生成，工具负责保证格式。
- 模型偶尔会吐脏 JSON，`parseJsonLoose` 会做宽松解析，失败时原样返回文本。

## Roadmap

- v1：配图提示词生成 + AI 配图（接图像 API）
- v2：模板包（小红书美妆号 / 电商带货 / 知识付费等垂类模板）
- v3：定时批量出稿（配合 DSH schedule 能力）
