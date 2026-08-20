# 🪄 dsh-ultra-ui · Ultra UI

[English](README.en.md) | 中文

> 参考 Codemini 交互的 DeepSeek Harness Web UI 增强：只负责把所有 Tool Call 展示为紧凑、可展开、可回放的折叠行。

**状态** Preview · **版本** 0.1.1 · **分支** `main`

## ✨ 特性

- 📦 折叠任意 Tool Call，包括第三方插件新增的工具。
- 👀 折叠状态仍显示工具名和有用的参数摘要。
- 🔍 展开查看准确参数、结果、错误和轨迹检查操作。
- 🔄 只从已记录的 call/result block 派生状态，实时展示与会话回放一致。
- 🧠 不增加模型工具、系统提示或请求 token。

## 🚀 快速开始

```sh
dsh plugin --profile web add github:havingautism/dsh-ultra-ui
dsh web
```

## 🧪 如何验证

打开 DSH Web，让模型调用任意工具，例如读取文件、执行命令或使用第三方插件工具：

1. Tool Call 应默认显示为一行紧凑摘要；
2. 点击或按 Enter/空格可展开参数与结果；
3. 运行中、成功和失败状态应分别显示；
4. 展开后可跳转到轨迹检查对应调用；
5. 重新打开会话时，折叠行内容应与实时展示一致。

## 🛠️ 工作方式

Harness 的 Tool 树会把每个根调用和子调用送入 `tool.call.presentation`。Ultra UI 占用这个展示层，直接使用会话里已记录的工具名、参数、结果和错误渲染折叠行，不维护业务工具白名单，所以第三方插件新增的 Tool 也使用同一套 UI。

## 🧪 验证与开发

```sh
npm run verify
```

本仓库提交了可直接安装的 `lib/`；运行 `npm run verify` 可检查发布产物语法。

## ⚠️ 已知限制

- Harness 需要提供 single 类型的 `tool.call.presentation` slot；旧版没有该 slot 时插件不会接管展示。
- 一个 Session 中只能有一个插件占用该展示 slot。
- 摘要优先读取 `title`、`question`、`query`、`path` 和 `command` 等常见参数；未知参数回退到已记录 JSON 的开头。
