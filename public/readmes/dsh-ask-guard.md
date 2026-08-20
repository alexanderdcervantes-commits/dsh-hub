# dsh-ask-guard

Timeout guard for `ask_user_question` in DeepSeek Harness: a lost or
unanswered question resolves as a structured `ASK_TIMEOUT` instead of hanging
the turn forever.

## The problem

The question card is delivered to the browser over a single push on the mux
WebSocket. When the page is backgrounded, the laptop sleeps, or the connection
dies half-open, the frame is lost, the client never notices (no heartbeat), and
the tool waits forever — observed hangs of 6+ hours, recoverable only by
pressing Stop. Upstream report:
[deepseek-ai/deepseek-harness#1554](https://github.com/deepseek-ai/deepseek-harness/discussions/1554).

## What this plugin does

It registers a `tools/execute` wrapper that arms a cooperative deadline on
every `ask_user_question` dispatch (the same mechanism as the official
`dsh-tool-call-timeout-policy`, which only enforces budgets declared by tool
plugins — `ask_user_question` declares none).

- When the deadline wins, the waiting provider's abort handler fires: the web
  provider broadcasts `question/resolved cancelled`, so the stuck composer
  (if any) is cleaned up.
- The wrapper then replaces the normalized abort with a structured error result
  (`code: ASK_TIMEOUT`, `name: AskTimeoutError`) with a model-facing message, so
  the agent can end the turn gracefully instead of blocking.
- All other tools pass through untouched.

The timeout is **cooperative** (`@deepseek-ai/dsh-timeout` notifies via
`exec.signal`; the web user-questions provider honors the signal, so it
terminates for real).

## Install

```bash
dsh plugin --profile web add dsh-ask-guard
```

Restart `dsh web`. The plugin is a `dsh.bundle` package, so its patch row is
added to the profile composition automatically on reconcile.

Install from a git checkout instead:

```bash
dsh plugin --profile web add github:Q1hangL/dsh-ask-guard
```

## Config

| Field | Default | Meaning |
|---|---|---|
| `timeoutMs` | `300000` | Deadline for one `ask_user_question` call (ms). |

Tune it in the profile's `cordis.patch.yml`:

```yaml
- id: ask-guard
  config:
    timeoutMs: 600000
```

## Recovery note

A page refresh (F5) re-syncs pending questions — the host replays unanswered
questions to a reconnecting client. With this plugin, even without a refresh
the turn no longer hangs forever.

## Test

```bash
npm install
node --test
```

## License

MIT
