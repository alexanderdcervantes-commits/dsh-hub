# dsh-model-router

[中文说明](./README.zh.md) · [English + 中文 paired documentation / 中英配套文档](#a-note-from-the-maintainer--维护者的话)

[![CI](https://github.com/superboy911/dsh-model-router/actions/workflows/ci.yml/badge.svg)](https://github.com/superboy911/dsh-model-router/actions/workflows/ci.yml)
[![version / 版本](https://img.shields.io/badge/version-0.2.2-blue)](./package.json)
[![License / 许可证: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%5E22.19.0%20%7C%7C%20%3E%3D24.0.0-brightgreen)](#requirements--运行要求)

`dsh-model-router` is a thin routing-policy plugin for DeepSeek Harness (DSH). DSH still owns providers, credentials, model catalogs, modalities, and retries. This plugin adds deterministic keyword routing, a default-off allowlisted `model_route` tool, and an isolated `image_gen` channel.

`dsh-model-router` 是 DeepSeek Harness（DSH）的薄路由策略插件。模型提供方、凭据、模型目录、模态能力和重试仍由 DSH 管理；本插件只增加确定性的关键词路由、默认关闭的白名单 `model_route` 工具，以及隔离的 `image_gen` 生图通道。

The DSH **Models** page remains the one and only provider configuration entry. / DSH **模型**页面仍是唯一的模型提供方配置入口。

> Current release / 当前版本：v0.2.2，verified with / 已验证 DSH 0.1.0-rc.6。`image_gen` is Beta / 仍为 Beta。Video, audio, and 3D are not implemented / 视频、音频和 3D 尚未实现。

## A note from the maintainer / 维护者的话

This is my first open-source repository and I am still learning plugin design, testing, security, documentation, and project maintenance. The current version is usable and tested, but it is not presented as a mature or perfect solution. Mistakes, rough edges, and better architectural choices may still exist.

这是我第一次维护开源仓库。我还在学习插件设计、测试、安全、文档和项目维护。当前版本已经可以使用并有自动化测试，但我不会把它包装成成熟或完美的方案；代码里仍可能存在错误、粗糙之处，或者更好的架构选择。

Experienced DSH, TypeScript, security, model-routing, and documentation contributors are especially welcome. A small issue, review comment, reproduction, documentation fix, or pull request is already a meaningful contribution. Please explain the reason when proposing a change so I can learn from it too.

非常欢迎熟悉 DSH、TypeScript、安全、模型路由和技术文档的朋友参与。无论是一个 Issue、一条审查意见、一份复现记录、一次文档修正，还是一个 Pull Request，都很有价值。提出修改时也欢迎说明原因，让我能跟着一起学习。

- [How to contribute / 如何参与](./CONTRIBUTING.md)
- [Open roadmap / 公开路线图](./ROADMAP.md)
- [Code of conduct / 社区行为准则](./CODE_OF_CONDUCT.md)

## What it does / 能做什么

| Capability / 能力 | Behavior / 实际行为 |
|---|---|
| Native model catalog / 原生模型目录 | Reads active and dormant providers from DSH; never duplicates text adapters. / 读取 DSH 中启用及休眠的提供方，不重复注册文字模型适配器。 |
| Keyword rules / 关键词规则 | Ordered, first match wins; no match changes nothing. / 按顺序匹配，首次命中即停；未命中不改动会话。 |
| Subagent routing / 子代理路由 | Installs DSH model selection only after a validated subagent rule hit; listeners are removed on plugin disposal. / 仅在子代理规则命中并通过校验后安装 DSH 模型选择，插件卸载时清理监听器。 |
| Exact validation / 精确校验 | Validates provider, model, and optional reasoning effort before writing a session header. / 写入会话模型头之前校验提供方、模型和可选推理强度。 |
| `model_route` | Off by default and limited to explicit allowlist entries. / 默认关闭，只能切换到明确加入白名单的模型。 |
| `image_gen` Beta | Isolated OpenAI-compatible image endpoint; HTTPS required except loopback HTTP; result downloads are tightly restricted. / 隔离的 OpenAI 兼容生图端点；除本机回环 HTTP 外必须使用 HTTPS，并严格限制结果下载。 |
| Unauthenticated media / 无认证媒体 | An empty credential reference sends no Authorization header. / 凭据引用留空时不会发送 Authorization 请求头。 |
| Kimi K3 output guidance / Kimi K3 输出约束 | Adds K3-only prompt guidance; never hides or relabels response blocks. / 仅给 K3 增加提示约束，不猜测、不隐藏、不重标响应块。 |
| V1 migration / V1 配置迁移 | Migrates in memory and persists V2 only after an explicit save. / 只在内存中迁移，用户明确保存后才持久化 V2。 |

The router does not call another model to guess which model to use. It executes deterministic rules configured in **Settings → Model Hub / 设置 → 模型中枢**.

路由器不会再调用一个模型去“猜”应该选谁，而是执行你在**设置 → 模型中枢**中配置的确定性规则。

## Model purchase strategy / 模型购买策略

The included example uses five models as a cost-aware starting point, not as a universal benchmark or purchasing requirement:

示例中的五个模型只是一套兼顾成本的起点，不代表通用排行榜，也不要求贡献者必须购买：

| Model / 模型 | Suggested role / 建议职责 | Cost idea / 成本思路 |
|---|---|---|
| DeepSeek V4 Flash | Default, daily questions, lightweight analysis / 默认模型、日常问答、轻量分析 | Handles most traffic first / 优先承接大多数请求 |
| DeepSeek V4 Pro | Architecture, difficult reasoning, important review / 架构、复杂推理、重要审查 | Route only difficult work / 只把高难任务升级过去 |
| Kimi K3 | Product design, frontend direction, visual/content planning / 产品设计、前端方向、视觉与内容策划 | Call when design keywords match / 设计类关键词命中时调用 |
| Qwen3.7 Plus | Coding implementation, structured tool work, engineering tasks / 代码实现、结构化工具工作、工程任务 | Call for coding and execution / 编码和执行型任务按需调用 |
| Doubao Seedream 5.0 Lite / 豆包 Seedream 5.0 Lite | Image generation only / 只负责生图 | Explicit tool call; no idle text cost / 明确调用工具才产生生图成本 |

The principle is “cheap default, targeted upgrade, explicit media call.” Prices and model availability change, so always check the provider’s current official page before purchasing.

原则是“低成本模型做默认、复杂任务定向升级、媒体模型明确调用”。价格和模型可用性会变化，购买前请以各提供方当期官网为准。

See [Model strategy and routing boundaries / 模型策略与路由边界](./docs/model-strategy.md) for details.

## Requirements / 运行要求

- DeepSeek Harness 0.1.0-rc.6
- Node.js `^22.19.0` or / 或 `>=24.0.0`
- pnpm 11 for development or rebuilding / 仅开发或重新构建时需要 pnpm 11

## Install from GitHub / 从 GitHub 安装

```bash
git clone https://github.com/superboy911/dsh-model-router.git
cd dsh-model-router

# Optional: reproduce the committed build. / 可选：复现仓库中的构建产物。
corepack enable
pnpm install --frozen-lockfile
pnpm build

# Install into the DSH web profile. / 安装到 DSH web profile。
npm exec @deepseek-ai/dsh -- plugin --profile web add --force "$PWD"
```

Restart DSH Web after installation, then open **Settings → Model Hub / 设置 → 模型中枢**. If you start DSH manually / 安装后重启 DSH Web；手动启动命令如下：

```bash
npm exec @deepseek-ai/dsh -- web
```

## Seedream image channel / Seedream 生图通道

Store the real key in DSH Credentials under the reference `VOLCENGINE_ARK_API_KEY`. Never paste the key into this file. / 请把真实密钥保存在 DSH Credentials 中，引用名使用 `VOLCENGINE_ARK_API_KEY`；不要把密钥值写进本文件。

```yaml
model-router:
  mediaProviders:
    - id: volcengine-seedream
      name: Doubao Seedream 5.0 Lite / 豆包 Seedream 5.0 Lite
      capabilities: [image_gen]
      adapter: openai-images
      baseUrl: https://ark.cn-beijing.volces.com/api/v3
      credential: VOLCENGINE_ARK_API_KEY
      models:
        - doubao-seedream-5-0-lite-260128
      allowedResultHosts:
        - ark-acg-cn-beijing.tos-cn-beijing.volces.com
      defaultSize: 1920x1920
```

The conversation header shows the text model orchestrating the tool call; the `image_gen` result records the actual image provider and model. / 会话头显示的是负责调度工具的文字模型，`image_gen` 工具结果才记录真正的生图提供方和模型。

## Routing example / 路由示例

```yaml
model-router:
  schemaVersion: 2
  enabled: true
  matchCase: false
  rules:
    - id: architecture-review
      enabled: true
      keywords: [architecture, refactor, 架构, 重构]
      target:
        provider: deepseek-official
        model: deepseek-v4-pro
        reasoningEffort: high
  agentSwitch:
    enabled: false
    allow: []
```

No match changes nothing: the current manual selection or DSH default continues to govern the session. / 未命中不改动会话：继续使用当前手动选择，或由 DSH 默认模型接管。

## Development and verification / 开发与验证

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm check:secrets
pnpm build
pnpm pack:dry
```

`accept:models` makes real paid provider calls and is intentionally excluded from CI. / `accept:models` 会真实调用外部模型并可能产生费用，因此不会在 CI 中运行。

## Documentation / 文档

- [Configuration / 配置参考](./docs/configuration.md) · [中文](./docs/configuration.zh.md)
- [Architecture / 架构说明](./docs/architecture.md) · [中文](./docs/architecture.zh.md)
- [Model strategy / 模型策略](./docs/model-strategy.md)
- [Sanitized example / 脱敏示例](./examples/providers.example.json)
- [Security / 安全策略](./SECURITY.md) · [中文](./SECURITY.zh.md)
- [Contributing / 参与贡献](./CONTRIBUTING.md) · [中文](./CONTRIBUTING.zh.md)
- [Changelog / 更新记录](./CHANGELOG.md) · [中文](./CHANGELOG.zh.md)
- [MIT license / MIT 许可证](./LICENSE) · [非正式中文译文](./LICENSE.zh-CN.md)

## Security boundaries / 安全边界

- Never commit keys, DSH settings, signed media URLs, local absolute paths, or generated artifacts. / 不得提交密钥、DSH 设置、签名媒体地址、本机绝对路径或生成产物。
- Media API endpoints require HTTPS; only loopback development endpoints may use HTTP. / 媒体 API 端点必须使用 HTTPS；只有本机回环开发端点可以使用 HTTP。
- Result downloads require HTTPS and pass host, redirect, DNS, size, and magic-byte checks. / 生图结果必须使用 HTTPS，并经过域名、重定向、DNS、大小和文件魔数校验。
- Credential references may reach the settings page; credential values do not. / 设置页可以看到凭据引用名，但看不到凭据值。
- The CodeQL workflow runs after the repository is public. A private repository requires separately enabled GitHub Advanced Security, which this project does not enable automatically. / 仓库公开后 CodeQL 工作流会运行；私有仓库需要另行启用 GitHub Advanced Security，本项目不会自动开启该功能。

Please report suspected vulnerabilities privately through [GitHub Security Advisories](https://github.com/superboy911/dsh-model-router/security/advisories/new). / 疑似漏洞请通过 [GitHub Security Advisories](https://github.com/superboy911/dsh-model-router/security/advisories/new) 私下报告。
