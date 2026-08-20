<div align="center">

<img src="https://raw.githubusercontent.com/maple-pwn/paperlab/2792dc632634835f81b2d1cac27daa2a28bf4491/docs/assets/logo.svg" width="120" alt="PaperLab logo">

# PaperLab

**Overleaf 式论文迭代修改工作台，AI 引擎是 DeepSeek Harness 插件。**

[English](README.en.md) · [快速开始](docs/快速开始.md) · [架构](docs/architecture.md) · [贡献指南](CONTRIBUTING.md)

[![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![npm](https://img.shields.io/npm/v/dsh-paperlab?style=flat-square)](https://www.npmjs.com/package/dsh-paperlab)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-%E2%9C%93-4D6BFE?style=flat-square)](https://github.com/topics/dsh-plugin)
[![stars](https://img.shields.io/github/stars/maple-pwn/paperlab?style=flat-square)](https://github.com/maple-pwn/paperlab)

</div>

在浏览器里编辑 LaTeX、看真实排版的 PDF、选中任意文字写批注；点一下按钮，DeepSeek Harness 的 agent 就会按批注逐条改写论文、验证编译、提交 git——所有修改都有 diff、可回滚、可导出。

<img src="https://raw.githubusercontent.com/maple-pwn/paperlab/2792dc632634835f81b2d1cac27daa2a28bf4491/docs/assets/screenshot.png" alt="PaperLab 界面截图" width="100%">

## ✨ 功能

| 🖥 界面 | 📄 批注 | 🤖 AI 修订 |
|---|---|---|
| Overleaf 式三栏布局，面板可拖动 | 在 PDF 上**选中任意文字**写意见 | 基于 dsh agent：读批注 → 唯一匹配编辑 → 编译检查 → git 提交 |
| 源码**编辑即自动保存、自动编译** | 黄色高亮精确落位（页面坐标） | **宽屏轨迹**直播思考过程 / 工具调用 / 输出，带计时与 LIVE 状态 |
| 真实 PDF 渲染（公式图表排版一致） | 「定位」红窗展示**修改前原文** | 工作台内切换模型 / **思考强度** / 编排模式 |

| 📜 版本管理 | 📦 工程能力 |
|---|---|
| 每个项目即 git 仓库，AI 修订自动 checkpoint | 一键导出：源文件（含批注）/ PDF / git 历史 |
| 历史浏览、任意 diff、一键 revert 回滚 | 自动识别 XeLaTeX / 尊重 latexmkrc，多编译引擎降级链 |

## 🔄 工作流

<img src="https://raw.githubusercontent.com/maple-pwn/paperlab/2792dc632634835f81b2d1cac27daa2a28bf4491/docs/assets/workflow.svg" alt="PaperLab 工作流" width="100%">

## 🏗 架构

PaperLab 的 **AI 执行引擎完全运行在 DeepSeek Harness 里**，工作台从不直接调用模型 API：

| 部分 | 技术 | 职责 |
|------|------|------|
| `web/` | React + Vite + PDF.js | 三栏界面、PDF 选中批注、轨迹大视图、历史/导出 |
| `server/` | FastAPI | 项目管理、LaTeX 编译、批注与 git 版本管理、静态托管 |
| `plugin/` | DeepSeek Harness bundle（TypeScript） | 论文修改工具 + HTTP 触发端点 + 模型/预设设置代理 |

```
浏览器 ⇄ FastAPI ──(127.0.0.1:3923)──▶ dsh-paperlab 插件 ──▶ dsh agent loop
                                                    │
                                    dsh LLM 适配器（凭据/路由/思考强度）
```

详见 [docs/architecture.md](docs/architecture.md)。

## 🚀 快速开始

前置：Node.js ≥ 20、pnpm ≥ 10、Python ≥ 3.11、git、DeepSeek Harness（`dsh`）。LaTeX 可选。

```bash
git clone https://github.com/maple-pwn/paperlab.git
cd paperlab
./start.sh                # 或 make start
```

`start.sh` 自动：装依赖 → 构建 → 安装插件到 dsh profile → 启动 dsh → 启动工作台。
浏览器打开 **http://127.0.0.1:8210**。

> 🔑 **模型凭据属于 dsh**：在 dsh Web UI（http://127.0.0.1:3080）「模型」页配置即可，PaperLab 不接触任何 API key。

## 📦 安装插件

仓库根即符合官方规范的 dsh bundle（`dsh.bundle` + `cordis.patch.yml` + 预构建 `lib/`）：

```bash
dsh plugin --profile paperlab add dsh-paperlab                     # npm
dsh plugin --profile paperlab add github:maple-pwn/paperlab        # GitHub
dsh plugin --profile paperlab add .                                # 本地开发
```

> ⚠️ 安装插件等于运行第三方代码：请先阅读源码，并在不保存密钥的环境中试用。

## 🧪 测试

```bash
make test
# server: pytest · web: tsc + vite build · plugin: tsc + tsup + 工具单测
```

## 📄 许可证

[MIT](LICENSE) © 2026 PaperLab contributors

## 🔗 社区

- 加入 [DeepSeek Harness 插件生态](https://github.com/topics/dsh-plugin)（topic: `dsh-plugin`）
- 问题与建议：提交 [Issue](https://github.com/maple-pwn/paperlab/issues)
