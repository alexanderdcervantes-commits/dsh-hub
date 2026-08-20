# dsh-mobile-remote

**Your phone's WeChat becomes the remote control for your DeepSeek Harness agent.**

[English](README.md) | [中文](README.zh.md)

Scan a QR code to bind a WeChat bot, then drive your dsh agent from WeChat over any network (4G / any WiFi): send commands, assign tasks, receive results, browse directories with `/ls` — plus **two-way file transfer**, **proactive notifications**, and **multi-session switching**.

- Full-permission mode: the agent can use every tool without confirmation (a `strict` escape hatch is reserved via `permissionMode`)
- Voice messages: never stored or transcribed; replies「无法识别语音消息」(voice message not recognized)
- Messages transit Tencent iLink servers (WeChat has no third-party API) — **not end-to-end encrypted**; see "Risks & Boundaries"

## Why this plugin

Compared with other dsh WeChat bridges (`dsh-weixin`, `dsh-chatnode-wechat`, `dsh-im-bridge`, …):

1. **Protocol fidelity**: every wire detail was verified line-by-line against Tencent's official openclaw-weixin SDK v2.4.6 (notes and reference sources in `docs/`) — outbound `aes_key` encoding, the two separate media-type numbering schemes, and the CDN upload/download flows all match the official SDK. Both inbound AES key encodings (base64 of raw bytes / base64 of hex) are supported, with explicit errors on bad keys (no silent truncation)
2. **Two-way file transfer**: inbound images/files/videos are downloaded, decrypted and saved automatically (stable naming to prevent crash-replay duplicates + plaintext MD5 verification + 100 MB cap); outbound via the `/send` command or a `[[send-file:path]]` line in the model's reply — both share a single allowlist path check (symlink escapes, out-of-root paths and directories are rejected)
3. **Proactive notifications**: a `weixin_send` model tool (text + file) plus completion notifications for unbound sessions (rule-based dedup against double-send). Expired session tokens (`-14`) return an exact message, the health panel degrades and prompts a re-scan, and re-scanning while running **hot-rotates credentials** without a restart
4. **Multi-session remote control**: `/sessions` listing + `/switch` with number/title dual semantics; when a session is taken over by another chat, the previous chat is notified — no cross-window output mixing
5. **Reliability engineering** (rare among peers): an exactly-once processing pipeline (queue + cursor atomically persisted), an at-least-once delivery outbox with crash recovery, a global processing limiter (8) + download semaphore (3) + backpressure throttling, drain re-entrancy mutexes and cursor identity checks, redundant credential persistence; **182 automated tests green**, strict typecheck, and a zero-value-import gate for host packages
6. **Observability**: a `/health` endpoint (allowlisted fields, no internal identifiers), a three-state status bar on the login page (running / missing credential / stopped + reason), and a `gateway.log` file log (1 MB rotation, 0600)
7. **Clear security boundaries**: the allowlist is the only usage boundary, the login page is loopback-only, error texts never leak keys or paths, and `weixin_send` file sending is constrained by the same path allowlist as `/send`

## Install

```bash
# 1. Install the plugin into the web profile
npx @deepseek-ai/dsh plugin --profile web add dsh-mobile-remote

# 2. Start (or restart) dsh web
dsh web
```

## QR login

1. With `dsh web` running, open `http://127.0.0.1:3080/mobile-remote-weixin/login` in a browser **on this machine**
2. Scan the QR code with WeChat and confirm (if WeChat shows a numeric code, enter it on the page)
3. Once confirmed, message the bot from WeChat

The login page shows a gateway status bar (green = running / yellow = missing credential / red = stopped + reason); `GET /mobile-remote-weixin/health` returns a health snapshot (loopback-only, no internal identifiers).

## Commands

| Command | Effect |
|---|---|
| `/status` | Session state + session id + workspace |
| `/new` | Unbind current session; next message starts a new one |
| `/stop` | Stop the running task |
| `/reply <text>` | Follow up on the current task |
| `/sessions` | Last 10 sessions (current binding marked ⭐) |
| `/switch <number-or-title>` | Switch session: pure digits resolve by `/sessions` number first, fall back to title match |
| `/切换聊天窗口：<title>` | Always match by title (use this for titles that are pure digits) |
| `/send <file-path>` | Send a file from the workspace/inbox to WeChat |
| `/ls [path]` | List a computer directory |
| `/workspace` | Show the current workspace |
| `/help` | Show the command list again |

## File transfer

- **Inbound**: images/files/videos sent from WeChat are downloaded, decrypted and saved to `<workspace>/.wechat-inbox/<date>/` (name = original + message hash, stable naming prevents crash-replay duplicates; `maxMediaBytes` cap, 100 MiB default). The model sees a `[received file] <absolute path>` hint and can continue with vision tools.
- **Outbound**: `/send <path>` sends directly; the agent can also put a single `[[send-file:path]]` line in its final reply (the line itself is never shown to the user). Paths must be inside the workspace or the inbox directory (one shared check; symlink escapes and out-of-root paths are rejected).
- Voice messages stay rejected: not downloaded, not stored.

## Proactive notifications

- **`weixin_send` tool**: agents in WeChat sessions can push text/files to WeChat (to the bound chat window; falls back to `notifyChatId` when unbound). Disable with `enableWeixinSendTool: false`.
- **Completion notifications**: configure `notifyChatId` + `notifyOnTurnEnd: true`, and when a task finishes in a session **not bound** to WeChat, a `✅ Task complete: session「title」` push goes to the notification target (bound sessions are never double-notified; deduped when the tool already pushed this turn).

## Configuration (all optional)

Environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `WEIXIN_BOT_TOKEN` | none | Login token (auto-saved after QR login; normally not needed) |
| `WEIXIN_ALLOWED_USERS` | the scanner | Allowed user ids, comma-separated |
| `WEIXIN_ALLOWED_GROUPS` | empty | Allowed group ids (groups need user+group match) |
| `WEIXIN_BOT_API_BASE` | `https://ilinkai.weixin.qq.com` | iLink gateway |
| `WEIXIN_CDN_BASE` | `https://novac2c.cdn.weixin.qq.com/c2c` | Media CDN |
| `WEIXIN_MAX_MESSAGE_CHARS` | 3500 | Reply chunk length |
| `WEIXIN_MAX_MEDIA_BYTES` | 100 MiB | Media size cap |
| `WEIXIN_PERMISSION_MODE` | `full` | `full` = full permission; `strict` = reserved escape hatch |
| `WEIXIN_DSH_WORKSPACE` | auto | Default workspace for new WeChat sessions (this var > explicit config > dsh current workspace > process cwd) |

cordis config keys:

| Key | Default | Meaning |
|---|---|---|
| `inboxDir` | '' (=workspace/.wechat-inbox) | Inbox directory; out-of-root values fall back with a warning |
| `enableWeixinSendTool` | `true` | Master switch for the weixin_send tool |
| `notifyChatId` | '' | Notification target / tool fallback (Web sessions can also push once set) |
| `notifyOnTurnEnd` | `false` | Push completion notifications for unbound sessions |
| `logDir` | '' (=state dir) | Gateway log directory (`gateway.log`, 1 MB rotation) |
| `statePath` | `~/.dsh/mobile-remote-weixin/gateway-state.json` | Gateway state file |

## Health & logs

- Health snapshot (`/health`): running state, poll activity, consecutive error count, binding counts, backlog, credential presence, start-failure reason — allowlisted fields only, never chat/session ids or progress.
- File log: `gateway.log` (append-only, 0600, 1 MB single-generation rotation, silent degradation on write failure), tee'd to the dsh logger.

## Risks & boundaries (please read)

- **Full-permission mode**: no human in the loop; the allowlist is the only boundary — **only add your own WeChat account**.
- **`weixin_send` outbound surface**: the tool is visible to in-scope agents; injected inbound messages could convince the model to push workspace text/files to WeChat. `filePath` is constrained by the same allowlist as `/send`, but text content is not path-checked — do not use in untrusted groups.
- **Privacy**: messages transit Tencent iLink servers (not end-to-end encrypted); decrypted media lands in the workspace `.wechat-inbox`.
- **Account coexistence**: driving the same WeChat account with another iLink client (e.g. OpenClaw) will steal messages — disable one of them.
- **Credentials**: the token is stored locally (credentials service + managed fallback file, 0600); a leak equals account control.
- **Platform risk**: iLink is an undocumented bot API that may drift; rule-breaking use risks a ban — at your own risk.

## Limitations & not-supported (honest disclosure)

- **No voice recognition**: voice messages always get「无法识别语音消息」(not downloaded/transcribed/stored) — a deliberate design decision
- **No multimodal pipeline**: images/files are only saved to disk with a path hint for the model; the plugin does not parse content (pair with a vision tool such as `vision_analyze`)
- **No scheduled tasks**: no cron-style "do X every day"
- **No remote approval buttons**: full-permission mode means no human-in-the-loop confirmations and no approve/reject interaction in WeChat; `strict` mode is a reserved escape hatch (approval flow not implemented)
- **Depends on an undocumented protocol**: iLink may drift and break features; misuse risks a ban
- **Single account binding**: one credential set per dsh instance; multiple WeChat accounts need multiple profile instances (no built-in multi-instance management)
- **No content-level file dedup**: resending the same file in different messages lands duplicate copies (only crash replays of the same message are deduplicated)
- **Chinese-only commands and copy**: slash commands, help text and prompts are Chinese; no English/i18n
- **No graphical settings panel**: all configuration is via environment variables / cordis patch (the login page only offers QR scan, a status bar and the health endpoint)
- **Requirements**: Node ≥ 22.12, a dsh web profile, and a WeChat account that can scan-bind an iLink bot

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## License

MIT
