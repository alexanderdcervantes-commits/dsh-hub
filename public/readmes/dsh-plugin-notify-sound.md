# dsh-plugin-notify-sound

English | [中文](README.zh.md)

A DeepSeek Harness (DSH) plugin for the **Web UI**: play a customizable ringtone when a task
finishes — **per workspace** — and an attention sound whenever something needs a human.

## Features

### Completion sounds (per workspace)

- Plays when a session turn finishes (`running: true → false`) or a background job completes.
- The sound is resolved per workspace: a workspace-specific override wins, otherwise the default.
- Three sound sources:
  - **Built-in synthesized sounds** — 6 options (Ding / Chime / Bell / Complete / Success / Mute),
    generated live with Web Audio, no audio files required.
  - **Voice announcement (TTS)** — the browser speaks a custom phrase (e.g. “我做完啦！”, “All done!”)
    using a system Chinese voice; voice and rate are configurable.
  - **Custom audio** — upload any MP3/WAV/etc. file.

### Attention sounds (when a human is needed)

The following events **always** ring (they are not affected by the “quiet current session” option):

| Event | Detection | Default sound |
|---|---|---|
| Approval request | session `pendingInteraction: approval` | generic attention sound |
| User question | `pendingInteraction: question` | generic attention sound |
| Plan review | `pendingInteraction: plan-review` | generic attention sound |
| Goal blocked | goal projection enters `blocked` | generic attention sound |
| Background task failure | job status `failed` | Bell (dedicated failure sound) |

Each kind can override the generic attention sound, or use a shared TTS phrase
(e.g. “需要你的确认” / “Your confirmation is needed”).

### Settings panel (Settings → 通知铃声 / Notification Sounds)

Master switch, “quiet when viewing the current session”, default completion sound,
per-workspace completion sounds, generic + per-kind attention sounds, voice settings
(voice / rate / preview / refresh), per-row preview and custom-audio upload.

## Install

Requires a DSH version with bundle-plugin support (`dsh.profile.bundles` + `dsh.bundle.patch`)
and `pnpm` on PATH (`corepack enable` or `npm i -g pnpm`).

```sh
# One command: pnpm installs the package and adds it to the profile's bundle layer
dsh plugin --profile web add dsh-plugin-notify-sound

# Restart the server (or refresh the page), then open Settings → 通知铃声
```

Other profiles work the same way: `dsh plugin --profile <name> add dsh-plugin-notify-sound`.

### Manual install (without pnpm)

1. Copy this package and its runtime deps (`@deepseek-ai/schemastery`,
   `@deepseek-ai/cosmokit`, `@standard-schema/spec`) into
   `$DSH_HOME/profiles/web/node_modules/`.
2. Append `"dsh-plugin-notify-sound"` to `dsh.profile.bundles` in
   `$DSH_HOME/profiles/web/package.json`.
3. Restart `dsh web`.

## Configuration storage

- The browser half persists its configuration in **localStorage** (key
  `dsh-notify-sound:config`), sanitizing every read and filling defaults.
- The host half also registers the `dsh-plugin-notify-sound` settings namespace: on rc.6 the
  settings API allowlist (`WEB_SETTINGS_NAMESPACES` in `dsh-host-apiproxy`) does not expose
  third-party namespaces to browsers, so the client does not depend on `settingsScope` today;
  the registration keeps the migration path open for future releases.

## Development

```sh
npm test      # 50+ assertions across host and client halves (Node only, no browser needed)
npm run check # syntax check
```

Layout:

- `lib/index.js` — host half: registers the settings namespace (schema + defaults)
- `lib/client.js` — browser bundle: completion/attention event detection, sound engine
  (Web Audio / TTS / Audio), settings panel
- `lib/types/index.d.ts` — host-side type declarations
- `cordis.patch.yml` — bundle patch layer (inserts the `notify-sound` row)
- `tools/` — tests and verification scripts (not shipped in the npm package)

## Publish

```sh
npm login                       # npm account (2FA recommended)
npm publish --access public
```

## License

[MIT](LICENSE)
