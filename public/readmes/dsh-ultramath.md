<div align="center">

**dsh-ultramath** — UltraMath 数学建模竞赛多 Agent 求解插件

[![npm](https://img.shields.io/npm/v/dsh-ultramath)](https://www.npmjs.com/package/dsh-ultramath)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](package.json)
[![dsh](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4FC08D)](https://github.com/deepseek-ai/deepseek-harness)

</div>

# dsh-ultramath

UltraMath 数学建模竞赛多 Agent 求解插件：bundle 主形态（`dsh.bundle.patch` → `cordis.patch.yml` 装载 node 半侧），纯 node 半侧，无浏览器 UI，不改 DSH 核心源码。

## 安装

```bash
dsh plugin --profile web add github:Andiii208/dsh-ultramath
```

安装后新建会话，预设选择器会出现「UltraMath」主控与 4 个单阶段角色预设。

## 特性

- **UltraMath 主控 + 4 角色预设**：主控 `UltraMath`（唯一入口，自包含全流程）+ 数学家/工程师/作家/审稿人（单阶段手动切入），启动时幂等同步到 `~/.dsh/.agent-presets/`。
- **33 篇模型库技能**：`skills/模型库/` 33 个技能文档（28 篇单源搬运 + 5 篇新增），由根 `SKILL.md` 经 `触发词索引.md` 按需指向，不注册进 catalog 避免刷屏。
- **全流程阶段**：读题 → 框架设计（Phase 0）→ 推导（Phase 1）→ 编码（Phase 2）→ 验算（Phase 2.5）→ 论文（Phase 3）→ 审稿（Phase 4），主控预设一次跑通，可随时单阶段切入/续跑。

## 工作原理

- node 半侧在主机启动时把 `presets/` 下 5 个预设目录（`ultramath` + `ultramath-{mathematician,engineer,writer,reviewer}`）幂等同步到 `~/.dsh/.agent-presets/`：字节相同则跳过，并校验 `agent.cordis.yml` 结构（缺 name / name 前缀非法 / 重复 id 视为失败）。
- 通过 `systemPrompt` 区块向模型公告插件存在性与边界。
- 技能文档随 npm 包分发（`skills/**` 在 `files` 白名单内）。

## 开发与验证

```bash
npm ci
npm test            # lib 单测（node:test，12 例）
npm run check       # 包结构校验（frontmatter / 触发词索引完整性 / presets）
node scripts/validate-package.mjs --pack   # npm pack 内容核验（发布前置）
```

## 相关仓库

- [Andiii208/UltraMath](https://github.com/Andiii208/UltraMath)：领域权威源（5 角色 Prompt、模型库、论文规范），本插件是其 DSH 发布镜像。
