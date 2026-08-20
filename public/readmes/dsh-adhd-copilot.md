# dsh-adhd-copilot

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 打造的行为教练技能插件——把 ADHD 用户从"想做但动不了"带到"带走一个最小行动"。

> dsh 生态中**唯一一个 ADHD 聚焦的行为教练插件**：行为 / 心理健康分类目前是空的，本插件填补了这个空白。

不要求自律，而是通过降低启动成本、提供外部结构、陪伴执行和即时反馈，把复杂任务转化为可带走的最小行动。核心原则：**永远只推动下一步，不要求完成全部。内容质量永远高于格式。**

## 为什么

AI 很擅长做计划——但对 ADHD 大脑来说，计划本身就是问题的一部分。

三条驱动理念（来自源技能的 SKILL.md + 11 个 references）：

1. **永远只推动下一步**。从不要求完成整个任务。
2. **可带走行动**。每条回复给出用户能独立执行的最小动作，不需要回到聊天框；反馈循环全可选。
3. **质量地板**。内容质量 > 格式；规则与好答案冲突时，规则让路。

DSH 插件生态还没有任何行为 / 心理健康方向的插件。本插件把一套经过实战打磨的 ADHD 教练方法论完整打包成可安装、可调用、零构建的插件。

## 功能

- **`adhd_breakdown` 工具** —— 扫描任务 + 状态信号（启动困难 / 过载 / 分心 / 时间误估 / 没动力 / 自责 / 不知道怎么选），按 **状态优先级「情绪 > 结构 > 启动」** 路由到 8 个模块（M1-M8），返回结构化的**单一下一步行动**拆解：
  - `module` / `moduleName` —— 命中的模块
  - `nextAction` —— 30 秒内能做的下一步
  - `whyNow` —— 为什么是这一步（绑定模块的认知事实）
  - `timeboxEstimate` —— 具体分钟估时（不用"一会儿"）
  - `energyRequired` —— 这一步需要的能量等级
  - `steps` —— 1-3 步（每步 <60 秒），绝不一次抛完整清单
  - 完整技能内容：`skills/adhd-copilot/SKILL.md` + `references/*.md`（11 个文件，**原样打包**，这是插件本身交付的价值）
- **Pre-flight 门**：无任务信号 → 保持静默，零干扰；请求很小 → 直接回答，不套流程。
- **信号模糊** → 给 A-G 自助菜单（用户自选 = 掌控感 + 防误判）。
- **输出纪律**：首行是行动、编号步骤 ≤3、结尾一个 30 秒内能做的下一步、表扬绑定具体胜利、绝不假扮计时器。
- 零构建、零运行时依赖 —— 纯 ESM，发布即运行。

## 安装

```bash
# from npm
dsh plugin --profile myprofile add dsh-adhd-copilot

# from GitHub（锁定 commit，供应链卫生）
dsh plugin --profile myprofile add github:zimai233/dsh-adhd-copilot#<sha>
```

## 用法

直接用自然语言跟 agent 说：

> "我拖着不写周报，两周了，帮我开始。"

> "好多事情堆着，脑子乱成一团，不知道先做哪个。"

> "我又没做完，我怎么这么差。"

Agent 会调用 `adhd_breakdown`，拿到类似这样的结构化拆解：

```json
{
  "module": "M1",
  "moduleName": "任务破碎机 (Task Breaker)",
  "nextAction": "打开与「周报」相关的文件或页面（30 秒内）",
  "whyNow": "启动最难：第一个动作必须明显、微小、现在就能做。一次只给 1-3 步，每步 <60 秒，跑完再要。",
  "timeboxEstimate": "第一步 <60 秒；本轮 2 步，跑完再要下一步",
  "energyRequired": "低（仅需打开文件）",
  "steps": ["打开与「周报」相关的文件或页面（30 秒内）", "写下这一行标题：「周报」"]
}
```

并渲染成符合输出纪律的教练回复：

> 周报，先别想完成。只做第一步：
> 1. 打开与「周报」相关的文件或页面（30 秒内）
> 2. 写下这一行标题：「周报」
>
> 每步 <60 秒。做完回复"完成"（可选，不阻塞）。你开始了，这一步就成了。

可选参数：`battery`（电量，M3 用）、`narrative`（叙事风格，M5 opt-in 用）、`estimatedMinutes`（你的估时，M6 用）、`parked` / `dropped`（稍后 / 废弃清单，M2 用）。

## 技能结构

`skills/adhd-copilot/` 里是完整的、可独立阅读的教练方法论：

| 文件 | 内容 |
|---|---|
| `SKILL.md` | 何时用、核心原则、状态路由表、输出纪律摘要、反模式、安全边界、发送前检查 |
| `references/core-workflow.md` | 五条认知事实、Pre-flight 门、五步流程、状态优先级、质量地板 |
| `references/state-scanner.md` | 状态路由表、A-G 自助菜单、懒加载用户档案 |
| `references/output-discipline.md` | 七条输出纪律 + 例外 + 发送前检查 |
| `references/M1-task-breaker.md` | 启动困难 → 一次 1-3 步，每步 <60 秒 |
| `references/M2-external-brain.md` | 过载 → 现在区只留 1 件事 + 唯一 Next Action |
| `references/M3-dopamine-architect.md` | 没劲 → 按电量配菜单（开胃菜 / 主菜 / 配菜） |
| `references/M4-body-double.md` | 分心 / 要陪伴 → 自足启动指令，检查点可选 |
| `references/M5-interest-gamifier.md` | 兴趣游戏化（仅 opt-in） |
| `references/M6-time-auditor.md` | 时间误估 → 预计 vs 现实三部分 |
| `references/M7-adhd-reset.md` | 自责 → 停止评价 → 缩小目标 → 30 秒动作 |
| `references/M8-router.md` | 不知道怎么选 → 2-3 框架 + 陷阱标注 + 收敛 1 行动 |

## 开发

```bash
npm test          # node --test test/ —— 覆盖纯拆解逻辑、技能文件完整性与逐字拷贝校验
node --check src/index.js
```

## 诚实设计（Honest by design）

- **没有计时器**：AI 无法在执行期间出现；所有中途检查点可选。
- **不承诺跨会话记忆**：仅在平台有长期记忆时持久化。
- **零打扰**：无任务信号时完全静默。
- **安全边界**：这是执行辅助工具，不是医疗诊断或治疗工具；用户表现出情绪危机 / 自伤信号时，温和建议寻求专业帮助。

---

# dsh-adhd-copilot (English)

A behavioral coaching skill plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — it moves a user with ADHD from "I want to start but can't" to "here is one minimal action you can take away."

> The **only ADHD-focused behavioral coaching plugin in the dsh ecosystem**: the behavioral / mental-health category is empty, and this plugin fills the gap.

Instead of demanding willpower, it lowers the cost of starting, provides external structure, stays with you while you execute, and gives instant feedback — so complex tasks become a series of tiny actions you can actually take. Core principle: **always push only the next step, never require finishing everything. Content quality always beats format.**

## Why

AI is great at planning — but for ADHD brains, plans are part of the problem.

Three ideas drive everything (from the source skill's SKILL.md + 11 references):

1. **Always push only the next step.** Never require finishing the whole task.
2. **Takeaway actions.** Every reply gives a smallest action you can do on your own, without coming back to the chat. All feedback loops are optional.
3. **Quality floor.** Content quality > format. When a rule would hurt a good answer, the rule yields.

The dsh plugin ecosystem had no behavioral / mental-health entry. This plugin packages a battle-tested ADHD coaching methodology into an installable, callable, zero-build plugin.

## Features

- **`adhd_breakdown` tool** — scans the task + state signals (can't-start / overwhelm / distractible / time-misjudged / unmotivated / self-blame / can't-decide) and routes through the 8 modules (M1-M8) by the state priority **"emotion > structure > start"**, returning a structured **single-next-action** breakdown:
  - `module` / `moduleName` — the module hit
  - `nextAction` — the next step doable within 30 seconds
  - `whyNow` — why this step (the module's cognitive fact)
  - `timeboxEstimate` — concrete minute estimate (never "soon")
  - `energyRequired` — how much energy this step needs
  - `steps` — 1-3 steps (each <60 s), never a full list dumped at once
  - Full skill content: `skills/adhd-copilot/SKILL.md` + `references/*.md` (11 files, shipped **verbatim** — that is the deliverable value)
- **Pre-flight gate**: no task signal → stay silent, zero interference; tiny request → answer directly without the process.
- **Fuzzy signals** → offer the A-G self-service menu (user choice = agency + fewer misreads).
- **Output discipline**: first line is an action, numbered steps ≤3, ends with a 30-second next step, praise bound to concrete wins, never fakes a timer.
- Zero build, zero runtime dependencies — pure ESM, the published package is the runtime code.

## Install

```bash
# from npm
dsh plugin --profile myprofile add dsh-adhd-copilot

# from GitHub (lock the commit for supply-chain hygiene)
dsh plugin --profile myprofile add github:zimai233/dsh-adhd-copilot#<sha>
```

## Usage

Ask the agent in natural language:

> "I've been putting off my weekly report for two weeks, help me start."

> "Too many things piled up, my head is a mess, I don't know what to do first."

> "I failed again, why am I so bad at this."

The agent calls `adhd_breakdown` and gets a structured breakdown like:

```json
{
  "module": "M1",
  "moduleName": "任务破碎机 (Task Breaker)",
  "nextAction": "打开与「周报」相关的文件或页面（30 秒内）",
  "whyNow": "启动最难：第一个动作必须明显、微小、现在就能做。一次只给 1-3 步，每步 <60 秒，跑完再要。",
  "timeboxEstimate": "第一步 <60 秒；本轮 2 步，跑完再要下一步",
  "energyRequired": "低（仅需打开文件）",
  "steps": ["打开与「周报」相关的文件或页面（30 秒内）", "写下这一行标题：「周报」"]
}
```

Which renders into a discipline-compliant coaching reply:

> Weekly report — don't finish it yet. Just do the first step:
> 1. Open the file or page for the weekly report (within 30 seconds)
> 2. Write this line as the title: "Weekly report"
>
> Each step <60 s. Reply "done" when finished (optional, non-blocking). You started — this step is already won.

Optional parameters: `battery` (energy level, for M3), `narrative` (narrative style, M5 opt-in), `estimatedMinutes` (your own time estimate, for M6), `parked` / `dropped` (park / drop lists, for M2).

## Skill structure

`skills/adhd-copilot/` holds the complete, standalone coaching methodology:

| File | Contents |
|---|---|
| `SKILL.md` | When to use, core principles, state routing table, output discipline summary, anti-patterns, safety boundary, pre-send check |
| `references/core-workflow.md` | Five cognitive facts, pre-flight gate, five-step flow, state priority, quality floor |
| `references/state-scanner.md` | State routing table, A-G self-service menu, lazy user profile |
| `references/output-discipline.md` | Seven output disciplines + exceptions + pre-send check |
| `references/M1-task-breaker.md` | Can't-start → 1-3 steps at a time, each <60 s |
| `references/M2-external-brain.md` | Overwhelm → one thing + one Next Action in the now zone |
| `references/M3-dopamine-architect.md` | Unmotivated → energy-matched menu (appetizer / main / side) |
| `references/M4-body-double.md` | Distractible / needs company → self-contained launch instruction, checkpoints optional |
| `references/M5-interest-gamifier.md` | Interest gamification (opt-in only) |
| `references/M6-time-auditor.md` | Time misjudgment → estimate vs. reality in three parts |
| `references/M7-adhd-reset.md` | Self-blame → stop evaluating → shrink the goal → one 30-second action |
| `references/M8-router.md` | Can't decide → 2-3 frameworks + traps + converge to one action |

## Development

```bash
npm test          # node --test test/ — covers pure breakdown logic, skill-file integrity, verbatim-copy checks
node --check src/index.js
```

## Honest by design

- **No timers.** AI can't appear while you work; all mid-task checkpoints are optional.
- **No cross-session memory promises.** Persistence only if the platform has it.
- **Zero interference.** Completely silent when there's no task signal.
- **Safety boundary.** This is an execution aid, not medical care. On signs of crisis or self-harm, it gently suggests professional help instead of pushing tasks.

## License

MIT
