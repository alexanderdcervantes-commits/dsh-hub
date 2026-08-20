# dsh-tool-generate-image

[English](./README.en.md) | 中文

给 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/deepseek-harness) 的纯文本模型一个 **`generate_image`** 工具：用自然语言描述想要的图片，模型调用工具，经 [Antigravity CLI（`agy`）](https://antigravity.google) 让 Google Gemini 画出来，保存到输出目录并返回文件路径。

生成的图片**会直接内联显示在对话里**，同时**持久化保存到磁盘**——重启后文件仍在，不像纯内存方案那样重启就 404。

![生成效果示例：坐在蓝色沙发上的橘猫](https://raw.githubusercontent.com/zclDragon/dsh-tool-generate-image/0d75d26888fc4272ee3d294cd4ac3549a896b86e/assets/demo-cat-sofa.png)

## 说明

这是**模型侧工具**——由模型在任务中按需调用（"给第 3 节画个示意图，存好，我引用路径"），而不是聊天侧的自动生图 + 展示。

- 底层走本机 `agy` 的 `generate_image` 工具 + `gemini-3.1-flash-image` 图像模型（免费 Google 账号，无需 API key）。
- 生成结果从 `~/.gemini/antigravity-cli` 递归收割（agy 落盘位置不固定：`scratch/`、`brain/<会话>/`、`.tempmediaStorage/` 都有可能出现；也可能产出 SVG 矢量图），复制到可配置的输出目录后返回绝对路径。
- **对话内联显示**：图片字节存进程内存，经宿主 web server 上一个回环-only 路由（默认 `/generate-image`）以 markdown 引用形式返回，模型把这一行复制进回复即渲染；内存上限 200 张 / 128MB，重启即清（磁盘副本不受影响）。
- 零运行时依赖：node 内置模块，不改 dsh 源码。

## 安装

```sh
dsh plugin --profile web add dsh-tool-generate-image
```

安装后**重启 web 应用**，模型即可调用 `generate_image` 工具。

## 使用

装好后不用记任何命令。正常对话，直接让模型画图即可，例如：

```text
画一只戴着工程师帽、坐在工作台前写代码的柴犬，卡通风格，16:9
```

模型会调用 `generate_image`，把图存到输出目录（默认 `~/.dsh/generated-images`），并把文件路径 + 内联显示引用返回给你——模型把这行 markdown 复制进回复，**图就直接显示在对话里**：

![生成效果示例：写代码的柴犬程序员](https://raw.githubusercontent.com/zclDragon/dsh-tool-generate-image/0d75d26888fc4272ee3d294cd4ac3549a896b86e/assets/demo-shiba-dev.jpg)

双保险：对话内联显示是**内存态**（重启后旧引用 404，无所谓），而图已**真实保存到磁盘**，重启后文件路径依然有效、可以继续引用。

## 配置

插件 `apply(ctx, config)` 读取（web profile 的 `cordis.patch.yml` / 设置层注入）：

| 键 | 默认 | 含义 |
| --- | --- | --- |
| `model` | `gemini-3.7-flash-medium` | 驱动生成的对话模型（实际图像由后台 `gemini-3.1-flash-image` 渲染） |
| `outputDir` | `~/.dsh/generated-images` | 生成图保存目录 |
| `timeoutMs` | `300000` | 单次生成超时 |
| `toolName` | `generate_image` | 注册的工具名（与宿主其他工具撞名时可改） |
| `agy` | `agy` | agy 可执行文件 |
| `effort` | — | 可选 `low` / `medium` / `high`，传给 agy `--effort` |
| `inlinePath` | `/generate-image` | 内联显示路由前缀（挂在宿主 web server 上，回环-only） |
| `displayHost` | 自动用 `http://127.0.0.1:<webServer.port>` | 内联 markdown 里用的图片基址；仅当需要改时设置 |

工具参数：`prompt`（必填，自然语言描述）、`fileName`（可选，输出文件名，默认时间戳）。

返回：`ok`、`images`（磁盘绝对路径，持久）、`markdown`（内联显示引用，内存态，可能为空）、`message`。

## 工作原理

```
模型："画一只柴犬"
  └─ generate_image 工具 execute()
       └─ spawn agy -p "<prompt>" --dangerously-skip-permissions \
                 --model <model> --print-timeout <Ns>
            └─ agy 调用 generate_image 工具 → gemini-3.1-flash-image 渲染
       └─ 对 ~/.gemini/antigravity-cli 递归 mtime 快照，找出新图
       └─ 复制到 outputDir（持久）
       └─ 字节存入内存 store → markdown ![图](http://127.0.0.1:<port>/generate-image/raw/<id>)
  └─ 返回 { ok, images: [绝对路径], markdown, message }
       └─ 模型把 markdown 行复制进回复 → DSH 前端渲染 → 图显示在对话里
```

`--dangerously-skip-permissions` 是必需的：agy 的 print 模式不带它时工具调用会被静默跳过，图永远画不出来。

> ⚠️ **安全说明**：该参数意味着一个完整的 agent CLI（agy）在**关闭权限确认**的状态下运行。提示词经 `spawn` 参数数组传递、不经过 shell，因此没有注入面；但使用前请知悉——agy 会以其已登录账号的权限直接执行工具调用。

## 注意事项

- **前置**：需要安装并登录 Antigravity CLI（`curl -fsSL https://antigravity.google/cli/install.sh | bash`，然后 `agy` 登录一次）。
- **配额波动**：免费档图像服务偶发 `503 MODEL_CAPACITY_EXHAUSTED` / `429 RESOURCE_EXHAUSTED`，属瞬时错误，稍后重试即可。
- **仅 Web profile 测试过**。
- **重启生效**：装/卸插件需重启 web 应用。

## 开发 / 测试

```sh
node test/harvest.mjs                                  # 收割逻辑单元测试
node test/inline.mjs                                   # 内联路由单元测试（含真实 http 往返）
node test/standalone.mjs "一只柴犬" /tmp/out            # 端到端（真实调 agy 生图）
```

## 许可证

[Apache-2.0](./LICENSE)
