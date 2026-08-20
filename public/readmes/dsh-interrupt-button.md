# dsh-interrupt-button

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

A green **interrupt button** beside the DeepSeek Harness send box. While the
agent is running, one click **silently interrupts** it in the background —
no simulated user message appears in the transcript. The agent then stops its
current work, **summarizes what it has done** as an assistant message, and asks
you: *"Do you have any new requirements or suggestions?"* — waits for your
reply, and merges your new requirements with the old ones before continuing.

When the agent is idle, clicking the button opens a dialog where you can
**customize the interrupt prompt** (the model-facing instruction sent on the
next interrupt), save it, or send it immediately.

## Features

- 🟢 Green button in the composer tool row, right beside the send button
- ⏸ **Strong pause**: aborts the active turn (model request / tool calls),
  kills background jobs and terminals owned by the agent, interrupts child
  agents, and disarms an armed goal so automatic continuation stops; queued
  messages are preserved (`keepInbox`)
- 💬 The agent replies as an assistant message: stops, summarizes its
  progress in a few sentences, and asks for your new requirements
- ✎ **Customizable interrupt prompt**: edit the model-facing instruction in a
  dialog (available when nothing is active); save it, or save & send
  immediately
- 🌗 Theme-aware dialog (light/dark via DSH theme tokens)

## Install

```sh
dsh plugin --profile web add guo-ziao/dsh-interrupt-button
```

Or via npm:

```sh
dsh plugin --profile web add dsh-interrupt-button
```

## How it works

The host half registers one loopback HTTP route (`POST /dsh-interrupt-button/interrupt`).
On press it performs a strong pause — `agent.cancel({ kind: 'user' }, { keepInbox: true })`
to abort the active turn, `jobs.kill` / `terminals.kill` for background work,
`subagents.interrupt` for child agents, and `goals.disarm` for an armed goal —
then `agent.steer(...)` with a plugin-source (`notice` form) message, so the
transcript shows a system-style context row instead of a fake user message and
the model produces the short summary and the question itself. When nothing is
active, the handler returns `nothingActive` and the browser half opens the
prompt editor instead.

## Default interrupt prompt

The following instruction is sent to the agent when you have not customized
it (short thinking, brief summary, and the exact closing question):

> 【用户按下了“打断”按钮】
> 用户刚刚按下了打断按钮，立即执行以下操作，不得继续当前任务：
> 1. 立即停止并结束当前一切工作：停止思考、停止工具调用、停止后台任务。
> 2. 用不超过三句话简短总结你到目前为止的进展，只讲结果，不展开过程。
> 3. 回复的最后一句必须原样是：“你有什么新的要求和建议吗？”
> 4. 然后停下等待用户回复；用户给出新要求或建议后，将新要求与旧要求融合，再继续工作。
> 不要长篇分析，直接简洁回复。

## Development

```sh
npm run check   # syntax-check both halves
```

## License

[MIT](./LICENSE)
