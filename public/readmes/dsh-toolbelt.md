# dsh-toolbelt

中文 | [English](README.en.md)

八个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件，补上 harness 本体没有覆盖的能力：通用型 agent 人设、回复语言守卫、逐请求视觉回退、两个写入／执行守卫、跨 agent 记忆桥接、生图工具，以及 skill 内的 shell 命令替换。

每个插件都是独立的 Cordis 插件，各有自己的入口、自己的类型化 `Config`、自己的测试。只挂你需要的那几行。

> 基于 `@deepseek-ai/dsh@0.1.0-rc.6` 开发。harness 处于 developer preview 阶段，**一定会有**破坏性变更。

## 安装

### 从本地 checkout 安装

**必须先构建。** `dsh plugin add <路径>` 只是把目录链接过去，**不会**执行你的构建脚本；未构建的 checkout 会在启动时让整棵插件树失败，报 `loader entries failed to apply`：

```sh
git clone https://github.com/cking000bigdemon/dsh-toolbelt
cd dsh-toolbelt && npm install && npm run build && cd ..
dsh plugin --profile <名称> add ./dsh-toolbelt
```

### 直接从 GitHub 安装

**这一步注定要执行两次**，这是设计使然。git 安装拉取的是源码而非构建产物，所以本包通过 `prepare` 脚本自行构建，而 pnpm ≥10 在你显式授权之前拒绝运行它：

```sh
dsh plugin --profile <名称> add github:cking000bigdemon/dsh-toolbelt
# 报 ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED —— 把 pnpm 打印的那串确切的 key
# 复制进 $DSH_HOME/profiles/<名称>/pnpm-workspace.yaml：
#
#   allowBuilds:
#     dsh-toolbelt@https://codeload.github.com/...: true
#
# 然后重新执行同一条命令。
```

请如实看待这项授权：**它允许本包的代码在安装时于你的机器上执行，且不在 agent 的任何沙箱之内。** 建议锁定 commit（`github:cking000bigdemon/dsh-toolbelt#<sha>`），让后续推送无法悄悄改变实际运行的内容。

### 确认层已组合进去

```sh
dsh --profile <名称> --dump-config    # 找 "# == dsh-toolbelt"
```

## 默认安全

装好后**只有 `vision-fallback` 是启用的**。它是唯一不会给你惊喜的一行：除非你把图片发给一个读不了图的模型，否则它什么都不做。

其余七个会改 agent 人设、拦截工具调用、读取工作区之外的文件，或者执行 shell 命令。请在你自己 profile 的 `cordis.patch.yml` 里逐个显式开启：

```yaml
- id: language-guard
  disabled: false
  config:
    targetLanguage: zh
```

注意 patch 是**整体替换**目标行的 `config` 值，不做深合并，所以需要的键要全部重写一遍，不能只写你要改的那一个。

## 插件清单

| 插件 | 扩展点 | 作用 |
|---|---|---|
| `vision-fallback` | `agent/request` | 带图片的请求落在不支持图片输入的模型上时，**仅这一次请求**改由具备读图能力的模型承接。 |
| `general-agent-prompt` | `ctx.systemPrompt.section()` | 八个人设／纪律段落，取代「编码助手」身份。每段可取 `true` / `false` / 一段替换文本。 |
| `language-guard` | `llm/stream` + `agent/turn-stopping` | 在回复流式产出的过程中检测语言漂移，并在轮次边界处引导纠正。 |
| `python-workdir-guard` | `tools/pre-execute` | 拦截绕开项目 venv 去用全局 Python / pip 的 shell 调用，并给出模型可直接照做的理由。 |
| `windows-encoding-guard` | `fs/write-intent`、`fs/edit-intent` | 拦下带 Windows 编码陷阱的 PowerShell／Python 文件写入；另有四项较轻的问题只告警。 |
| `cross-agent-memory` | `ctx.systemPrompt.context()` | 把 Claude Code / Codex 的记忆文件作为**明确标注为不可信**的上下文注入。 |
| `image-generation` | `ctx.tools.register()` | `generate_image_gpt` 与 `generate_image_gemini`；返回保存路径，绝不返回 base64。 |
| `skill-shell-injection` | `ctx.skills.registerProvider()` | 在 SKILL.md 内容送进模型之前，先执行其中的 `` !`cmd` `` 与 ```` ```! ```` 代码块。 |

每个插件的源文件开头都有一段 doc comment，写明它的设计、配置与限制。启用前请先读那一段。

### 启用前值得知道的几件事

- **`vision-fallback` 不持有任何可变状态。** 「切换全局模型、用完再切回来」是最直觉的实现，而它是错的：图片会留在持久化历史里，下一次请求照样发给读不了图的模型。`agent/request` 只替换单次请求的调用配置，既更简单也更正确。
- **`general-agent-prompt` 的 `runtime` 段刻意不内置任何文案。** 只有部署方自己知道它捆绑了什么，而说错（比如「Python 已捆绑」）比什么都不说更糟，所以这一段只有在你传入字符串时才会出现，传 `true` 是惰性的。
- **`windows-encoding-guard` 默认在非 Windows 主机上也生效。** 陷阱属于**目标**解释器，所以在 Linux 上写出来的 `.ps1` 一样危险。它还顺带暴露了一个 dsh 自身的隐患：`dsh-fs-local` 用会剥掉 BOM 的 `TextDecoder` 解码，因此已有的 UTF-8 BOM 熬不过一次 edit。
- **`cross-agent-memory` 会读取你 home 目录下的文件**，并把第三方内容摆到模型面前。它以不可信数据的框架呈现，做了 XML 转义使得任何闭合标签都无法构造，并中和了 `{{…}}` 序列，避免记忆内容插值到提示词变量里。dsh 目前**没有** `isProjectTrusted()` 的等价物——`trustProject` 这个开关需要你自己接到真实的信任信号上。
- **`skill-shell-injection` 会执行文件里的命令。** 它只在受信 skill 根目录下这么做，按会话做幂等记忆（有副作用的命令一个会话只跑一次），并且绝不对命令输出做二次扫描。`SkillRegistry` 没有提供拦截「已注册 provider」的途径，因此本插件注册自己的 provider，并装饰一个通过配置传入的 provider 实例。

## 开发

```sh
npm install
npm test          # 342 个测试
npm run typecheck
npm run build
```

测试使用 harness 官方的 `@deepseek-ai/dsh-agent-loop-testkit` 与 stub 适配器，**零网络调用**，且只写入 `os.tmpdir()`。

## 现状与限制

- `image-generation` **从未在真实供应商上跑通过**——开发期间没有可用的生图凭据。请求构造与两种响应形态都有针对 stub `fetchImpl` 的测试覆盖，但真实的 `size`／`n` 接受度、以及各供应商的错误信封均未经证实。
- `language-guard` 的纠正状态保存在内存中，会话恢复后即重置；它不注册任何 slash 命令。
- `python-workdir-guard` 放行 `python -c '<程序>'`，也不解析 `P=pip; $P install x` 这类变量间接引用。
- 部分插件通过 `ctx.get()` 以结构化方式访问可选 seam（`shell`、`credentials`、`subprocess`、`attachments`、`workspace`），而非 `inject`，因此在未提供这些 seam 的部署里会退化为 no-op。把这些包声明为依赖即可换用真实类型。

## 许可

[MIT](LICENSE)
