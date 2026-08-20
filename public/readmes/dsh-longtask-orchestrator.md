# dsh-longtask-orchestrator

**长任务编排插件**：Codex 当管理层（规划/打分/审核），DSH 当执行层，Kimi 当补充层（视觉验收/摘要/交叉验证）。

## 架构

```
长任务 ──► Codex 规划（codex_plan）──► 子任务清单（含验收标准/依赖）
              │
              ▼
          DSH 执行（agent 自己的工具 / subagent）
              │
              ▼
        Codex 打分（codex_score，7/10 及格）── 不过 → 按建议重做（最多 3 次）
              │ 通过
              ▼
        Kimi 补充（kimi_summarize 压缩 / kimi_review 交叉验证 / kimi_call 视觉验收）
              │
              ▼
        Codex 终审（codex_review）──► Kimi 摘要 ──► 最终报告
```

## 工具（9 个，全局注册）

| 工具 | 作用 |
|---|---|
| `codex_call(prompt, cwd?, model?)` | 底层 Codex 桥（只读沙箱、自动代理、串行队列） |
| `kimi_call(prompt, image_path?, model?)` | 底层 Kimi 桥（文本/视觉） |
| `codex_plan(task, context?)` | Codex 拆解计划 → JSON 子任务清单 |
| `codex_score(task, criteria, result)` | Codex 打分 0-10 + 修改建议 |
| `codex_review(plan, results)` | Codex 终审 |
| `kimi_summarize(text, max_chars?)` | 大结果摘要压缩 |
| `kimi_review(result, criteria)` | Kimi 交叉验证（第二意见） |
| `orchestrate_state(action, state?)` | 状态文件读写（read/save/clear） |
| `longtask_begin(goal, context?)` | 初始化长任务：Codex 规划 + 写入 state.json |

## 其他组成部分

- **skill `longtask-orchestrator`**：循环模板，长任务时自动触发
- **模型组「DeepSeek + 长任务编排」**：delegating adapter，选中后每轮注入编排提示

## 配置

| 项 | 默认 | 说明 |
|---|---|---|
| codex 二进制 | `/Applications/ChatGPT.app/Contents/Resources/codex`（不存在则回退 PATH 的 codex） | `ORCHESTRATE_CODEX_BIN` 可覆盖 |
| 代理 | 自动检测 macOS 系统代理（scutil） | 子进程会带上 HTTPS_PROXY/HTTP_PROXY |
| Kimi | 复用 `~/.dsh/vision.env`（VISION_API_KEY/BASE_URL/MODEL） | `ORCHESTRATE_KIMI_*` 可覆盖 |
| 状态目录 | `<工作区>/.orchestrate` | `ORCHESTRATE_STATE_DIR` 可覆盖 |

## 安装

```sh
dsh plugin --profile web add link:/绝对路径/dsh-longtask-orchestrator
```

重启 `dsh web` 生效。

## 使用

1. 新会话，切到「DeepSeek + 长任务编排」模型组（或直接提出长任务，skill 自动触发）
2. `longtask_begin(goal)` 初始化 → 按计划的子任务逐个执行 → `codex_score` 打分 → 迭代
3. 全部通过 → `codex_review` 终审 → 报告

## 注意事项

- Codex 走 ChatGPT 订阅额度，与 Codex++ 共用登录态 → codex 调用已串行化，长任务期间尽量少用 Codex++
- Codex 不可用时任务会暂停并提示，不会用 Kimi 顶替规划/评审
