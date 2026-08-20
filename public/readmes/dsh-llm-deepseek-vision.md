# dsh-llm-deepseek-vision

> 给 DeepSeek Harness 的纯文本模型装上"眼睛"的视觉插件。
> Vision-augmented adapter plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

它让**纯文本**模型能够"看"图片：每个附加的图片先交给另一个**视觉模型**描述成文字，再由纯文本模型基于描述进行推理。推理模型永远不需要直接处理图片字节——另一个模型是它的眼睛。默认文本推理与图片描述都跑在 OpenCode Zen Go（`opencode-go`）。

## 工作原理 / How it works

- 注册一个额外的 provider 路由：**DeepSeek (Vision)**（`deepseek-vision`），对外广告与 DeepSeek 目录相同的模型 id（`deepseek-v4-flash` / `deepseek-v4-pro`），但声明 `[text, image]` 输入。
- **不带图片的请求**：零开销，直接透传给文本推理路由（默认 `opencode-go`）。
- **带图片的请求**：配置的视觉模型把每张图描述成文字（`[Image #N description: …]`），图片块被描述替换，纯文本模型再作答。

## 快速开始 / Quick start

### 1. 安装插件

**推荐（一键安装）**——插件已发布到 npm，声明了 `dsh.bundle` manifest：

```bash
dsh plugin --profile web add @deepseek-ai/dsh-llm-deepseek-vision
```

**或从源码安装**：

```bash
git clone https://github.com/NagasakiSoyo-ui/dsh-llm-deepseek-vision.git
cd dsh-llm-deepseek-vision
npm install
npm run build
```

然后把构建产物接入你的 Harness 部署。如果你在 Harness monorepo 中开发，将本目录放入 `packages/llm/llm-deepseek-vision` 并执行 `pnpm install` 即可。

### 2. 在组合配置中挂载

在 Harness 的插件组合配置（如 profile 的 `cordis.patch.yml`）中添加：

```yaml
- id: llm-deepseek-vision
  name: '@deepseek-ai/dsh-llm-deepseek-vision'
  config:
    # 提供视觉模型的 provider 路由
    visionProvider: opencode-go
    # 该路由上的视觉模型 id —— 即"眼睛"
    visionModel: mimo-v2.5
    # 给视觉模型的指令
    visionPrompt: 'Describe the attached image in detail…'
    # 单次视觉描述的输出上限
    visionMaxTokens: 1024
    # 实际进行推理的纯文本路由
    delegateProvider: opencode-go
    # 该路由对外广告的模型目录；默认镜像 DeepSeek 目录
    models:
      - id: deepseek-v4-flash
        name: DeepSeek-V4-Flash
        contextWindow: 1000000
      - id: deepseek-v4-pro
        name: DeepSeek-V4-Pro
        contextWindow: 1000000
```

### 3. 前置条件 / Prerequisites

- **视觉 provider 路由必须存在**，且其模型被声明为支持图片输入（`input: [text, image]`）。
  对 pi-ai 路由（`settings.yaml` 的 `llm-pi-ai:` 段），给模型条目加上图片模态：

  ```yaml
  llm-pi-ai:
    providers:
      {
        opencode-go:
          {
            api: openai-completions,
            baseURL: https://opencode.ai/zen/go/v1,
            models:
              [
                { id: mimo-v2.5, input: [text, image] },
                # ...
              ]
          }
      }
  ```

- 视觉模型的 provider 必须能完成认证（在凭据库中配置它的 `apiKeyEnv`）。
- Harness 必须挂载持久化附件服务（`dsh-base` 已内置）。

> 💡 提示：`mimo-v2.5` 是 OpenCode Zen Go 目录上最便宜的文图模型（输入/输出 0.14/0.28，与 `deepseek-v4-flash` 同价）。`kimi-k3` 要贵得多（3/15）。

### 4. 使用 / Usage

在模型选择器中选 **DeepSeek (Vision)** 和一个模型 id（`deepseek-v4-flash` / `deepseek-v4-pro`），然后在消息中附加图片。想设为会话默认，把 `agent-default-model` 指向它：

```yaml
agent-default-model:
  provider: deepseek-vision
  model: deepseek-v4-flash
```

## 配置项 / Configuration reference

| 字段 | 默认值 | 说明 |
|---|---|---|
| `visionProvider` | `opencode-go` | 提供视觉模型的 provider 路由 |
| `visionModel` | `mimo-v2.5` | 视觉模型 id（必须支持 `[text, image]` 输入） |
| `visionPrompt` | 内置默认提示词 | 给视觉模型的描述指令 |
| `visionMaxTokens` | 无 | 单次视觉描述输出上限 |
| `delegateProvider` | `opencode-go` | 接收文字请求并推理的路由 |
| `models` | DeepSeek 目录镜像 | 该路由广告的模型目录 |

## 注意事项 / Notes

- 视觉描述**每轮都会重新生成**：会话日志里如果包含图片，每轮都会重新描述；回放一个视觉轮次会重新运行视觉模型。
- 视觉模型必须**能被其 provider 路由解析**；手写声明的 pi-ai 路由条目若未声明推理能力，会被按"可关闭思考"处理（发送 `off`）。

## 开发 / Development

```bash
npm run build   # tsc 编译到 lib/
npm test        # vitest 单元测试（含视觉/委托双路由桩）
```

## 许可 / License

[MIT](./LICENSE) © 2026 NagasakiSoyo-ui
