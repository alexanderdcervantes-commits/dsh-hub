<div align="center">

# DSH Translator

**把 DeepSeek Harness 变成一款真正顺手的 AI 翻译软件。**

[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek-Harness-4D6BFE?style=flat-square)](https://github.com/deepseek-ai/deepseek-harness)
[![CI](https://img.shields.io/github/actions/workflow/status/SiYue-ZO/dsh-translator/ci.yml?style=flat-square&label=CI)](https://github.com/SiYue-ZO/dsh-translator/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-16a34a?style=flat-square)](LICENSE)

[English](README.en.md) · [安装](#安装) · [功能](#功能) · [架构](#架构)

</div>

---

DSH Translator 是一个原生 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件。它不再只是给聊天框加一段“翻译提示词”，而是直接提供双栏翻译工作台：选择语言、粘贴原文、观看译文流式生成，再复制、朗读、下载或放进历史记录。

它不绑定额外的翻译 API。翻译由你在 dsh 中选择的模型完成，继续沿用现有模型、凭据、会话和流式传输。

> 当前版本面向 dsh `0.1.0-rc.6` Web profile。

## 功能

- 原生双栏编辑器和响应式移动端布局
- 自动识别源语言，内置 12 种常用语言，支持一键互换
- 译文逐字流式显示，可随时停止并保留已生成内容
- 自然、专业、学术、技术、直译五种风格
- 仅译文、双语对照两种输出模式
- 原文字符/词数统计，`Ctrl / ⌘ + Enter` 快捷翻译
- 剪贴板粘贴与复制、浏览器朗读、`.txt` 下载
- 导入文本、Markdown、CSV、JSON、HTML 和 XML（最大 2 MB）
- 最近 100 条本地历史，支持搜索、恢复和单条删除
- 保留 Markdown、表格、HTML/XML 标签、链接和占位符
- 可编辑术语表和单次翻译附加要求
- 完成后自动复制选项
- 将原文 JSON 编码为不可信数据，降低原文中“指令”干扰翻译的风险
- 零额外运行时服务、零额外 API Key

## 安装

> dsh 目前处于开发者预览。请使用 Node.js 22.19+ 或 24+，并确保 `dsh` 与 `pnpm` 可用。

将插件安装进官方 `web` profile：

```sh
dsh plugin --profile web add github:SiYue-ZO/dsh-translator
dsh web
```

打开终端中显示的地址（默认 `http://127.0.0.1:3080`），创建一个会话，即会看到翻译工作台。

也可以从本地 checkout 安装：

```sh
git clone https://github.com/SiYue-ZO/dsh-translator.git
cd dsh-translator
npm install
npm run check
dsh plugin --profile web add .
dsh web
```

卸载：

```sh
dsh plugin --profile web remove dsh-translator
```

## 使用

选择源语言和目标语言，粘贴原文，点击“开始翻译”。生成期间按钮会变成“停止翻译”。

```text
DeepSeek Harness uses an architecture where everything is a plugin.
```

更多操作：

- 点击中间的互换按钮可交换语言与两侧内容。
- 设置面板中可调整风格、双语对照、格式保留、术语表和附加要求。
- 原文工具栏支持粘贴、导入和清空；译文工具栏支持朗读、下载和复制。
- 历史记录仅保存在当前浏览器的 `localStorage`，不会上传到第三方历史服务。

浏览器设置会记住你上次选择。Host 配置仍是翻译人格的回退值，也支持没有客户端界面的 dsh 使用方式。

## 配置

插件的默认配置位于 [`cordis.patch.yml`](cordis.patch.yml)。dsh 的后置 patch 可以按相同 `id` 覆盖整份配置。注意：dsh 对插件行的 `config` 是**整体替换**而非深度合并，因此覆盖时请写全所有字段。

例如，新建 `translator.override.yml`：

```yaml
- id: translator
  config:
    sourceLanguage: auto
    targetLanguage: Japanese
    style: professional
    outputMode: bilingual
    preserveFormatting: true
    translateCodeComments: false
    glossary:
      DeepSeek Harness: DeepSeek Harness
      agent: エージェント
      plugin: プラグイン
    customInstructions: 'Japanese punctuation must use the full-width style.'
    includeRuntimeContext: false
```

临时启动并应用：

```sh
dsh --profile web --patch ./translator.override.yml
```

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `sourceLanguage` | `auto` | 源语言名称；`auto` 自动识别 |
| `targetLanguage` | `Simplified Chinese` | 默认目标语言 |
| `style` | `natural` | `natural` / `professional` / `academic` / `technical` / `literal` |
| `outputMode` | `target-only` | `target-only` 或 `bilingual` |
| `preserveFormatting` | `true` | 尽可能保留标记与排版 |
| `translateCodeComments` | `false` | 是否翻译注释和 docstring |
| `glossary` | `{}` | 源术语到目标术语的固定映射 |
| `customInstructions` | `''` | 附加翻译规则 |
| `includeRuntimeContext` | `false` | 是否把工作区等动态上下文交给翻译模型 |

## 架构

插件遵循 dsh/Cordis 的原生生命周期：

```text
                     dsh-translator
                    /              \
          Host / src/index.ts     Web / src/client/
                  │                       │
         完整翻译 persona          原生 conversation slot
                  │                       │
                  └──── dsh Session ──────┘
                             │
                       当前模型与凭据
```

Host 侧用 `complete: true` 安装完整翻译 persona，避免编码 Agent 身份和工具说明干扰翻译；Web 侧通过 dsh 的 `conversation` slot 提供产品界面，并调用原生 `SessionFace.prompt/cancel`，所以仍然享有 dsh 的流式输出和模型配置。

每次翻译的语言、风格、术语和排版会生成独立请求。原文存放在 JSON 字符串值中并明确标记为不可信内容，模型不应执行其中的命令。历史与界面偏好只保存在浏览器本地。

## 项目结构

```text
.
├── src/
│   ├── index.ts          # Cordis 插件、配置 schema、生命周期
│   ├── prompt.ts         # 完整翻译 persona
│   ├── request.ts        # 单次翻译请求与术语表解析
│   └── client/           # React 工作台与 CSS Modules
├── test/                 # Node.js 单元测试
├── lib/                  # Host JS、浏览器 bundle 与类型声明
├── cordis.patch.yml      # dsh bundle 配置层
├── package.json          # npm 与 dsh bundle manifest
├── tsdown.config.ts      # dsh 客户端闭包 bundle
└── .github/workflows/    # 持续集成
```

## 开发

```sh
npm install
npm run check
npm pack --dry-run
```

`npm run build` 同时编译 Host 入口、客户端类型和 `lib/client.js`；`npm test` 覆盖 persona、请求隔离、术语表解析和 Cordis 挂载。客户端 bundle 遵循 dsh 的 `window.__ModuleLoader__` 闭包协议，并将样式作为插件自有 CSS Module 注入。

## 限制

- 翻译质量、上下文长度和支持语言取决于当前选择的模型。
- 这是文本与纯文本文件翻译工作台；暂不解析 PDF、DOCX、图片或音频。
- 历史记录为浏览器本地数据，清除站点存储后无法恢复。
- dsh 仍处于开发者预览，未来的破坏性 API 变更可能需要插件同步升级。

## License

[MIT](LICENSE) © 2026 SiYue-ZO
