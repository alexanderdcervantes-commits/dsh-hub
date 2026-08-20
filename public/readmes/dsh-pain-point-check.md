# dsh-pain-point-check

中文版见 [README.zh.md](README.zh.md)

An enforced pain-point-check guard plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh).

Where the official [`repeat-tool-reminder`](https://github.com/deepseek-ai/deepseek-harness) is advisory — it nudges an agent that repeats the exact same call — this guard **vetoes**: after two non-converged experiments on the same problem it injects the three questions, denies non-investigative tool calls until the model answers them in its reply text, and blocks further same-direction shots.

## Why

An agent in "solution state" loses meta-cognition and keeps attacking the same problem — confirmation bias (designing experiments that support the current hypothesis), sunk cost (refusing to change direction), and narrative closure (wanting to finish the story). The gate forces a return to the blocker before the next shot, turning negative results into information.

## Install

The package is not on npm yet; install it straight from this repository:

```sh
npm install github:ICCuse/dsh-pain-point-check
# or: pnpm add github:ICCuse/dsh-pain-point-check
```

Then mount it in your profile composition. Add one row to your profile patch — for the web profile, `~/.dsh/profiles/web/cordis.patch.yml`:

```yaml
- id: pain-point-check
  name: 'dsh-pain-point-check'
  config:
    failureThreshold: 2
    repeatThreshold: 2
```

Restart the harness (`dsh web`) and the guard is live for every session.

## How it works

| Hook | Role |
|---|---|
| `tools/result` | Counts per-agent experiments on the current problem: failed (errored) calls and consecutive identical calls. |
| `agent/pre-step` | Resets the counters on a real user interjection (a new problem); while the gate is pending, appends the three-question check block to the next step. |
| `tools/pre-execute` | **Denies** every non-investigative call while the gate is pending (allowlist: `read`, `read_image`, `glob`, `grep`, `web_search`, `ask_user_question`, `skill`, `todo_write`). |
| `session/event` | Detects the three answers in the model's reply text (`卡点=… 排除=… 性价比=…`, English markers accepted) and lifts the gate. |

The three questions: is this blocker still the most critical one to solve? What did the last negative result actually rule out? Which path is the most cost-effective (not necessarily the cheapest)? If the model cannot name what the negative result excluded, it has no falsifiable hypothesis — the check text tells it to go write one instead of firing another shot.

## Config

| Field | Default | Meaning |
|---|---|---|
| `failureThreshold` | `2` | Failed calls that arm the gate. |
| `repeatThreshold` | `2` | Consecutive identical calls that arm the gate. |
| `allowlist` | investigation set | Tools still callable while pending. |

Both thresholds must be integers `>= 1`; a misconfiguration throws at plugin load.

## Development

`lib/` is prebuilt (built from the DeepSeek Harness monorepo toolchain). Tests:

```sh
npm install
npm test
```

The test suite drives a real agent loop against a scripted mock adapter (no network): arming, denial, allowlist, lifting, partial answers, resets, and fail-loud config validation.

## License

MIT
