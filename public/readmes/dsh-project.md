# dsh-project

DeepSeek Harness 的「项目」插件：把**多个文件夹 + 多个会话 + 一份共享记忆/指令**收敛到一个项目实体，作为叠加层补齐 DSH 缺失的"项目"概念（不改内核）。

## 能力

- **收纳性**：侧边栏「项目」入口 → 项目树（项目 → 文件夹 → 会话）。一个项目可挂多个文件夹（每个自动注册为工作区），会话可拖入/移出。
- **项目内新建会话**：在项目的任意文件夹里一键新建会话（复用 `workspaces.connectWorkspace`）。
- **记忆互通**：项目级 `PROJECT.md` 共享记忆——本项目所有会话开始时**整体注入**；agent 用 `project_memory_write` 工具追加、`project_context` 读概览。
- **项目指令**：项目级 `AGENTS.md` 注入本项目每个会话的 system-prompt 段（热重载）。
- **工具**：`project_memory_write`、`project_context`。

## 架构

| 半 | 文件 | 说明 |
|---|---|---|
| host | `index.js` | cordis 插件：`/api/dsh-project/*` 路由、工具注册、`project:context` system-prompt 段 + `agent/pre-step` 记忆注入、公告 |
| host | `store.js` | `ProjectStore`：`~/.dsh/projects/<id>/`（project.json + AGENTS.md + PROJECT.md），原子写 |
| browser | `client.js` | ModuleLoader bundle：侧边栏入口（DOM 注入）+ center-column 项目面板（独立 React 根）+ `fetch` API |

## 数据模型

```
~/.dsh/projects/<id>/
├── project.json   # { id, name, description, folders:[{path,workspaceId}], sessionIds, archived, ... }
├── AGENTS.md      # 项目指令（注入系统提示）
└── PROJECT.md     # 项目共享记忆（会话开始整体注入）
```

## 注入

- `project:context` system-prompt 段（`text` 为函数，按 `context.scope`（agent）动态渲染当前项目）：项目名/简介/文件夹/AGENTS.md。
- `agent/pre-step`：把 `PROJECT.md` 快照 prepend 到会话第一条用户消息。

## 安装

本地插件，参考 DSH 插件装载约定（`cordis.patch.yml` + profile node_modules 解析）：

1. 让 `dsh-project` 可被 profile 解析（如 `file:../dsh-project` 依赖或 node_modules 软链）。
2. 在 profile 的 `cordis.patch.yml` 加：
   ```yaml
   - insert:
       - id: project
         name: 'dsh-project'
   ```
3. 重启 DSH web（`dsh web`）。

## 限制 / 已知取舍

- 会话**显式**归属项目（在「项目」面板创建/加入），不按目录自动推断。
- `PROJECT.md` 为整体注入（无向量检索），保持精简；结构化检索留待 v2。
- v1 不做项目级 MCP/技能/默认模型/跨会话子任务派发。
