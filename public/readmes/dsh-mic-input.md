# dsh-mic-input

**Microphone voice input for the DeepSeek Harness (DSH) Web UI — in the browser, no server, no keys.**

> 中文说明见 [README.zh.md](README.zh.md)

A pure client plugin that adds a **microphone button** to the composer tool row of the DSH Web GUI. Click to start dictating; recognized speech is transcribed live into the input box. Everything runs in your browser through the built-in **Web Speech API**:

- **Microsoft Edge** → Microsoft Azure speech service
- **Google Chrome** → Google/Chrome speech service

Zero server components, zero API keys, zero model downloads. Audio never leaves the browser (except to the browser's own speech service).

## Features

- **Mic button** in the composer tool row (right side, next to send) — click to start/stop; red pulsing ring while listening
- **Live transcription** — interim results fill the input while you speak
- **No duplicated text** — the draft is always rebuilt from the text that was in the input when recording started, and interim echo prefixes are deduplicated (fixes the classic "重复文字" bug of Web Speech plugins)
- **Auto-continue on silence** — if the browser stops listening after a pause, the plugin silently reconnects and keeps the session (up to 6 silent ends), so long sentences are not cut off
- **Smart punctuation** (default) — auto-completes sentence-ending punctuation: `？` after 吗/呢 questions, `！` after 吧/啊/呀/哦/嘛/啦/哇/哈, `。` otherwise (English: `.`); modes: 自动补全 / 保留原样 / 去除
- **Language selection** — 跟随系统 (auto, follows browser language) / 中文 (zh-CN) / English (en-US); wrong language matching is the #1 cause of garbled recognition
- **Auto-send** — optional: submit the message automatically when dictation ends
- **Settings row** under 设置 → 通用 → 语音输入
- **Clear errors** — permission-denied / network errors show bilingual hints on the button tooltip

## Install

```sh
dsh plugin --profile web add github:QT-Chen/dsh-mic-input
```

or from npm (prebuilt, no build approval needed):

```sh
dsh plugin --profile web add dsh-mic-input
```

Restart `dsh web` (or refresh the page), then click the **mic button** to the right of the input box. The first time you use it, the browser asks for microphone permission — allow it (127.0.0.1 / localhost is a secure context, so it works).

> Note: if you installed from the GitHub source, pnpm ≥ 10 may ask you to allow the build once (`allowBuilds`). The npm install has no such step.

## Usage tips

- Recording starts a session; **click the button again to stop and keep the transcript** in the input (auto-send only if enabled)
- If recognition produces gibberish, check the language setting — it must match what you speak (system language ≠ spoken language is the usual cause)
- Recognition quality is bounded by the browser's built-in engine; Edge (Azure) and Chrome (Google) may differ noticeably

## Privacy

No server, no storage: audio is processed by the browser's speech service (Microsoft/Google), and only the resulting text ever enters DSH. Nothing is written to disk by this plugin.

## License

MIT
