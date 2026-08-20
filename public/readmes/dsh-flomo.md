# dsh-flomo

> **English** | [**中文**](README.zh.md)

Send notes, memos, and summaries straight into [flomo](https://flomo.app) (浮墨笔记) from DeepSeek Harness. Configure your flomo API URL or API Key once, then any agent can record ideas via the `flomo_send` tool.

## Features

- **Settings panel** — configure the API URL / API Key from the web GUI: Settings → Flomo. Save, test, clear, and a quick-send box.
- **flomo_send** — write a memo with optional tags (`tags` become `#tags`), supporting `#tag`, `**bold**`, and `![](https://raw.githubusercontent.com/zhengjy01/dsh-flomo/f58a481aebcd2486e1f14af4853c3cc24eba0360/image-url)` inline syntax.
- **flomo_config** — set `apiKey` (newer key format) or `webhookUrl` (the API URL from the flomo settings page, typically `https://flomoapp.com/iwh/<token>/`); `reset: true` clears the credential.
- **flomo_status** — report whether the plugin is configured and where the credential lives, without echoing the full key.
- Credential persisted to `~/.dsh/dsh-flomo.json` with mode `0600`.
- System-prompt announcement so agents know when to use the plugin.

## Install

```sh
# after publishing to GitHub (repo tagged with the `dsh-plugin` topic)
dsh plugin --profile web add github:zhengjy01/dsh-flomo

# local development
dsh plugin --profile web add link:/path/to/dsh-flomo
```

Restart `dsh web`. The plugin needs no build step — `lib/index.js` is plain ESM.

## Configuration

Get your API URL at <https://flomoapp.com/mine?source=incoming_webhook>. Then either paste it into the plugin's `cordis.patch.yml` config, or let the agent configure it for you:

```text
帮我配置 flomo，API URL 是 https://flomoapp.com/iwh/xxxx/
```

The agent calls `flomo_config` with your `webhookUrl` (or `apiKey`) and persists it to `~/.dsh/dsh-flomo.json` (mode `0600`). From then on:

```text
把这句话记到 flomo：#ideas
```

> The flomo API URL is a credential: anyone with it can write memos to your flomo. Keep it private; use `flomo_config(reset: true)` to clear it if it leaks.

## Notes

- Sending uses Node's built-in `fetch` (Node 22+), no extra dependencies.
- The web settings panel talks to the host through the loopback-only `/api/dsh-flomo` route family.
- Respects flomo's content syntax: `#tag`, `**bold**`, `![](https://.../image.png)`.

## License

MIT
