# dsh-exam-countdown

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供的**中国考试倒数日**插件。

内置 64 场中国主要考试（高考、考研、国考、四六级、教资、CPA、法考、一建、软考、护士执业……），
把纯日期计算封装成两个 agent 可调用的工具。日期一旦过去，自动顺延到下一年（循环滚动）；
四六级等按「每年 6 月/12 月第二个周六」、JLPT 按「每年 7 月/12 月第一个周日」精确计算。

纯 ESM，零构建步骤 —— 发布的 npm 包本身就是运行时代码。

## 为什么需要它

DSH 生态里 **教育 / 考试类目非常单薄**：现成的插件多集中在工具链、媒体与设计领域，
没有任何一个提供中国考试的日程数据与倒数计算。这个插件补上了这块空白：
把「考程」网页应用（`china-exam-countdown`）的数据与日期数学移植为服务端工具，
agent 可以直接回答「高考还有多少天」「下一次 CPA 是什么时候」这类问题。

## 功能特性

- **64 场内置考试**，覆盖 9 大分类：升学考试、公务员、英语考试、教师资格、会计金融、法律工程、医学健康、计算机、其他
- **精确规则日期**：`2nd-sat`（第二个周六）与 `1st-sun`（第一个周日）由纯日期数学计算
- **循环滚动**：日期已过自动顺延到下一年同一天，`days >= 0` 只返回未过期的场次
- **灵活查询**：按 `id` 精确查找、按名称关键字模糊搜索、按分类筛选，结果按临近排序
- **两个工具**：`exam_countdown`（倒数查询）+ `exam_categories`（分类清单）
- 零构建、零 DOM/localStorage —— 纯服务端数据 + 日期数学

## 安装

```bash
# 从 npm
dsh plugin --profile myprofile add dsh-exam-countdown
```

## 使用

直接用自然语言让 agent 查询，例如：

> 「高考还有多少天？」

agent 会调用 `exam_countdown`，例如：

```json
{
  "id": "gaokao"
}
```

返回：

```json
[
  {
    "id": "gaokao",
    "name": "高考",
    "cat": "升学考试",
    "dateLabel": "6月7日",
    "days": 327,
    "nextOccurrence": "2027-06-07"
  }
]
```

再如：

> 「帮我看看最近要考的英语类考试，列出 5 个」

```json
{
  "query": "英语",
  "limit": 5
}
```

> 「有哪些考试分类？」

agent 调用 `exam_categories`，返回各分类及其考试数量，用来发现 `category` 参数的合法取值。

## 工具参考

| 工具 | 参数 | 说明 |
|---|---|---|
| `exam_countdown` | `id` (string, 可选) — 精确 slug，如 `gaokao`、`kaoyan`、`cpa`、`cet-6`；`query` (string, 可选) — 名称/id/备注子串匹配；`category` (string, 可选) — 分类名；`limit` (number, 可选, 默认 10) | 返回 JSON 数组，每项 `{ id, name, cat, dateLabel, days, nextOccurrence }`，按剩余天数升序，仅含未过期场次 |
| `exam_categories` | 无 | 返回 `[{ category, count }]`，按考试数量降序 |

### 可用的 `id`（64 场）

`gaokao` `zhongkao` `kaoyan` `kaoyan-2` `chengkao` `zikao-4` `zikao-10` `zsb` `guokao` `shengkao`
`wendui` `xuanxiao` `shiye` `cet-6` `cet-12` `tem4` `tem8` `pets-3` `pets-9` `putonghua`
`jlpt-7` `jlpt-12` `topik` `jzb-3` `jzb-9` `jzm-1` `jzm-5` `chuji` `gaoji` `zhongji`
`cpa` `sws` `jjs` `zcpg` `sjs` `yinhang` `jijin` `zq` `fakao-k` `fakao-z`
`yjzs` `ejzs` `zjzs` `xf` `jzs` `ytjg` `jl` `zx` `gh` `yishi-b`
`yishi-j` `hushi` `yaoshi` `weish` `sg` `rk-5` `rk-11` `ncre-3` `ncre-9` `catti-6`
`catti-11` `chuban` `zhuanli` `daoyou`

### 日期说明

- 固定日期的考试按全国统一日期收录；时间不固定的（如考研、省考、事业单位）使用历年典型日期
- 四六级 = 每年 6 月 / 12 月第二个周六；JLPT = 每年 7 月 / 12 月第一个周日，由程序精确计算
- **所有日期仅供参考，最终以各考试主办方官方公告为准**

## 开发

```bash
npm install
npm test          # 纯核心逻辑测试（ruleDate / nextOccurrence / queryExams / 数据集）
```

## License

MIT

---

# dsh-exam-countdown

Chinese exam countdown for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

A port of the [考程 / china-exam-countdown](https://github.com/zimai233/china-exam-countdown)
app into a DSH tool plugin: the 64-exam dataset and the pure date math, exposed as
agent-callable tools. No UI, no DOM — just data + countdown computation on the server side.

## Why

The DSH plugin ecosystem's **education category is thin**: most plugins target
tooling, media and design. None provide Chinese exam schedules or countdown math.
This plugin fills that gap so agents can answer questions like "how many days until
gaokao?" or "when is the next CPA exam?" directly from conversation.

## Features

- **64 built-in exams** across 9 categories: 升学考试, 公务员, 英语考试, 教师资格, 会计金融, 法律工程, 医学健康, 计算机, 其他
- **Exact rule dates**: `2nd-sat` (second Saturday) and `1st-sun` (first Sunday) computed by pure date math (CET-4/6, JLPT)
- **Rolling recurrence**: once a date passes it rolls to the same date next year; only upcoming (`days >= 0`) results are returned
- **Flexible queries**: exact `id`, substring `query` against name/id/note, or `category` filter, sorted by days ascending
- **Two tools**: `exam_countdown` + `exam_categories`
- Zero build step — pure ESM, the published package is the runtime code

## Install

```bash
# from npm
dsh plugin --profile myprofile add dsh-exam-countdown
```

## Usage

Ask the agent in natural language:

> "How many days until gaokao?"

The agent calls `exam_countdown` with:

```json
{ "id": "gaokao" }
```

Result:

```json
[
  {
    "id": "gaokao",
    "name": "高考",
    "cat": "升学考试",
    "dateLabel": "6月7日",
    "days": 327,
    "nextOccurrence": "2027-06-07"
  }
]
```

More examples:

> "List 5 English-language exams coming up soon"

```json
{ "query": "英语", "limit": 5 }
```

> "Which exam categories do you have?"

The agent calls `exam_categories`, which returns each category with its exam count —
use it to discover valid `category` values.

## Tool Reference

| Tool | Parameters | Description |
|---|---|---|
| `exam_countdown` | `id` (string, optional) — exact slug e.g. `gaokao`, `kaoyan`, `cpa`, `cet-6`; `query` (string, optional) — substring match against name/id/note; `category` (string, optional) — category name; `limit` (number, optional, default 10) | Returns a JSON array of `{ id, name, cat, dateLabel, days, nextOccurrence }` sorted by days ascending, upcoming only |
| `exam_categories` | — | Returns `[{ category, count }]` sorted by count descending |

### Available `id`s (64)

`gaokao` `zhongkao` `kaoyan` `kaoyan-2` `chengkao` `zikao-4` `zikao-10` `zsb` `guokao` `shengkao`
`wendui` `xuanxiao` `shiye` `cet-6` `cet-12` `tem4` `tem8` `pets-3` `pets-9` `putonghua`
`jlpt-7` `jlpt-12` `topik` `jzb-3` `jzb-9` `jzm-1` `jzm-5` `chuji` `gaoji` `zhongji`
`cpa` `sws` `jjs` `zcpg` `sjs` `yinhang` `jijin` `zq` `fakao-k` `fakao-z`
`yjzs` `ejzs` `zjzs` `xf` `jzs` `ytjg` `jl` `zx` `gh` `yishi-b`
`yishi-j` `hushi` `yaoshi` `weish` `sg` `rk-5` `rk-11` `ncre-3` `ncre-9` `catti-6`
`catti-11` `chuban` `zhuanli` `daoyou`

### Dates

- Fixed-date exams use the national unified date; flexible ones (考研, 省考, 事业单位) use typical dates from recent years
- CET-4/6 = 2nd Saturday of June / December; JLPT = 1st Sunday of July / December — computed exactly
- **All dates are for reference only — always confirm with official announcements**

## Development

```bash
npm install
npm test          # runs the pure-core tests (ruleDate / nextOccurrence / queryExams / dataset)
```

## License

MIT
