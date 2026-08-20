# dsh-wash-calendar

用于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的周期性习惯打卡日历。

把「上次洗护日期 + 间隔天数」变成四个可被 Agent 直接调用的工具：下一次提醒、区间排期、单日校验、文字建议。无需任何前端页面，直接在对话中管理所有周期性健康习惯。

## 为什么

DSH 插件生态中 **health/habit（健康/习惯）分类是空的**——没有任何插件能帮 Agent 计算周期性的习惯排期。本插件填补了这个空缺：它把洗护日历的日期数学（ISO 日期辅助、间隔推算、排期枚举）提炼为四个工具，覆盖「下次啥时候、这段区间内有哪些天、某天是不是、现在该怎么办」四个问题。

## 功能

- **`habit_next`** — 计算今天之后的下一次习惯日，返回 `{ nextDate, daysUntil }`。
- **`habit_schedule`** — 枚举某段日期区间内所有计划中的习惯日（含首尾）。
- **`habit_check`** — 校验某一天是否是排期日，并给出距上次的天数 `{ scheduled, daysSince }`。
- **`habit_advice`** — 直接返回一句中文建议：「今日洗护」「距下次洗护还有 N 天」「已逾期 N 天，建议尽快」。
- 零构建步骤——纯 ESM，发布的包就是运行时代码。无 `prepare` 脚本、无需构建权限。

## 安装

```bash
# 从 npm 安装
dsh plugin --profile myprofile add dsh-wash-calendar

# 从 GitHub 安装（锁定 commit，保障供应链卫生）
dsh plugin --profile myprofile add github:zimai233/dsh-wash-calendar#<sha>
```

## 用法

用自然语言告诉 Agent：

> 「我上次洗护是 2026-08-01，每 4 天一次。今天该不该洗？下次是哪天？帮我列出 8 月剩下的排期。」

Agent 会依次调用：

```json
// habit_check
{ "dateISO": "2026-08-14", "lastDate": "2026-08-01", "interval": 4 }
// -> {"scheduled":false,"daysSince":13}

// habit_next
{ "lastDate": "2026-08-01", "interval": 4, "today": "2026-08-14" }
// -> {"nextDate":"2026-08-17","daysUntil":3}

// habit_schedule
{ "lastDate": "2026-08-01", "interval": 4, "startISO": "2026-08-14", "endISO": "2026-08-31" }
// -> ["2026-08-17","2026-08-21","2026-08-25","2026-08-29"]

// habit_advice
{ "lastDate": "2026-08-01", "interval": 4, "today": "2026-08-14" }
// -> "已逾期 9 天，建议尽快"
```

洗护之外的场景同样适用：浇花、喂鱼、换药、锻炼、大扫除……任何「上次时间 + 固定间隔」的周期性习惯。

## 工具参考

| 工具 | 参数 | 返回 |
|---|---|---|
| `habit_next` | `lastDate` (string, 必填), `interval` (number, 必填, 1-7), `today?` (string, 默认今天) | `{ nextDate, daysUntil }` |
| `habit_schedule` | `lastDate`, `interval`, `startISO`, `endISO` (均必填) | 排期 ISO 日期数组 |
| `habit_check` | `dateISO`, `lastDate`, `interval` (均必填) | `{ scheduled, daysSince }` |
| `habit_advice` | `lastDate`, `interval`, `today?` (默认今天) | 纯文本建议 |

日期一律使用 `YYYY-MM-DD` ISO 格式；`interval` 表示相邻两次之间的天数（1-7）。

## 开发

```bash
npm install
npm test          # 对纯函数核心运行 node:test 测试
npm run pack      # 预演发布（等价于 pnpm pack）
```

## License

MIT

---

# dsh-wash-calendar

Recurring habit scheduling calendar for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

Turn a "last occurrence + interval" pair into four agent-callable tools: next reminder, range schedule, single-day check, and plain-text advice — for any recurring health/habit routine, directly from your conversation.

## Why

The **health/habit category is empty in the DSH plugin ecosystem** — no plugin helps an agent compute recurring habit schedules. This plugin fills that gap: it extracts the wash-calendar's date math (ISO date helpers, recurrence computation, schedule enumeration) into four tools answering "when is next", "which days in this range", "is this day one", and "what should I do now".

## Features

- **`habit_next`** — next occurrence strictly after today, returning `{ nextDate, daysUntil }`.
- **`habit_schedule`** — every scheduled date inside an inclusive range.
- **`habit_check`** — is a given date a scheduled occurrence, plus days since the anchor.
- **`habit_advice`** — a short text recommendation: "今日洗护" (wash today), "距下次洗护还有 N 天" (N days to go), or "已逾期 N 天，建议尽快" (overdue by N days).
- Zero build step — pure ESM, the published package is the runtime code. No `prepare` script, no build permission needed.

## Install

```bash
# from npm
dsh plugin --profile myprofile add dsh-wash-calendar

# from GitHub (lock the commit for supply-chain hygiene)
dsh plugin --profile myprofile add github:zimai233/dsh-wash-calendar#<sha>
```

## Usage

Ask the agent in natural language:

> "My last wash was 2026-08-01, every 4 days. Should I wash today? When is next? List the remaining August schedule."

The agent calls:

```json
// habit_check
{ "dateISO": "2026-08-14", "lastDate": "2026-08-01", "interval": 4 }
// -> {"scheduled":false,"daysSince":13}

// habit_next
{ "lastDate": "2026-08-01", "interval": 4, "today": "2026-08-14" }
// -> {"nextDate":"2026-08-17","daysUntil":3}

// habit_schedule
{ "lastDate": "2026-08-01", "interval": 4, "startISO": "2026-08-14", "endISO": "2026-08-31" }
// -> ["2026-08-17","2026-08-21","2026-08-25","2026-08-29"]

// habit_advice
{ "lastDate": "2026-08-01", "interval": 4, "today": "2026-08-14" }
// -> "已逾期 9 天，建议尽快"
```

Works for far more than washing: watering plants, feeding fish, refilling medication, exercising, cleaning — any recurring "last time + fixed interval" habit.

## Tool Reference

| Tool | Parameters | Returns |
|---|---|---|
| `habit_next` | `lastDate` (string, required), `interval` (number, required, 1-7), `today?` (string, default today) | `{ nextDate, daysUntil }` |
| `habit_schedule` | `lastDate`, `interval`, `startISO`, `endISO` (all required) | Array of scheduled ISO dates |
| `habit_check` | `dateISO`, `lastDate`, `interval` (all required) | `{ scheduled, daysSince }` |
| `habit_advice` | `lastDate`, `interval`, `today?` (default today) | Plain-text recommendation |

All dates use `YYYY-MM-DD` ISO format; `interval` is the days between consecutive occurrences (1-7).

## Development

```bash
npm install
npm test          # runs node:test against the pure core
npm run pack      # dry-run publish (pnpm pack equivalent)
```

## License

MIT
