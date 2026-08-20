<h1 align="center">dsh-opencode-usage</h1>

<p align="center">OpenCode Go plan usage display for the DSH web GUI — a persistent badge under the composer shows <b>rolling / weekly / monthly</b> usage percents and reset countdowns; click to expand a card; agents can query the balance via the <code>opencode_go_usage</code> tool.</p>

Official DSH bundle plugin. Install with one command:

```
dsh plugin --profile web add github:vinyumao/dsh-opencode-usage#<ref>
```

**English** | [中文](README.zh.md)

## Capability surface

| Tool | Description |
| --- | --- |
| `opencode_go_usage` | Query OpenCode Go plan balance in chat: used percent + reset countdown for the three windows (no arguments) |

| UI capability | Description |
| --- | --- |
| Persistent badge | One line under the composer input: `OpenCode Go：滚动用量 0% · 每周用量 0% · 每月用量 0%`, auto-refreshing on a configurable interval |
| Usage card | Click the badge to expand: progress bars for the three windows + used percent + per-second reset countdown + instant refresh + an `opencode` link that opens the web usage dashboard in a new tab |
| Config form | Fill in API key / Base URL / refresh interval / web usage URL right in the card; saved immediately |
| Bilingual UI | 中文 / English — every string follows the global DSH locale (Settings → General → Language), and the card footer has a built-in 中文 / English toggle that switches the whole GUI |
| Key reuse | API key defaults to the `OPENCODE_GO_API_KEY` environment variable — the same one the DSH opencode-go model provider config uses (`apiKeyEnv` in `settings.yaml`), so it usually works with **zero configuration** |

## How it works

Usage comes from the OpenCode Go subscription quota endpoint:

```
GET https://opencode.ai/zen/go/v1/usage
Authorization: Bearer <API_KEY>     # the regular Anthropic-compatible API key
```

Example response:

```json
{
  "usage": {
    "rolling": { "status": "ok", "percent": 0, "resetsAt": "2026-…Z" },
    "weekly":  { "status": "ok", "percent": 0, "resetsAt": "2026-…Z" },
    "monthly": { "status": "ok", "percent": 0, "resetsAt": "2026-…Z" }
  }
}
```

> ⚠️ **Unverified**: this endpoint is **not part of the official public documentation** — it was surfaced by the [cc-switch community](https://github.com/farion1231/cc-switch/issues/6433) (issue includes a verification script). The response shape may change as opencode evolves; this plugin parses defensively (both `usage.`-prefixed and bare windows, both `resetsAt` and numeric `resetsInSeconds` forms), so please defer to the live response if the structure changes.

The browser never talks to the upstream directly: every request goes through the host process's `/api/dsh-opencode-usage/*` routes (same-origin fetch), so **the API key never enters the browser**.

### About OpenCode Zen

This plugin is **Go-plan specific** — it shows the subscription quota windows, which only exist for OpenCode Go. OpenCode Zen is a separate **pay-as-you-go** gateway (prepaid balance, per-token billing) and has **no equivalent API-key-authenticated balance endpoint**: the official feature request ([anomalyco/opencode#10448](https://github.com/anomalyco/opencode/issues/10448), "Add Zen balance API endpoint") is still open, and community tools that show Zen balances rely on brittle browser-cookie scraping of the workspace billing page (e.g. [CodexBar](https://github.com/steipete/CodexBar/blob/main/docs/opencode.md)). If a public Zen balance API ships, this plugin can add a `plan` option to consume it.

## Installation

> **Zero runtime SDK imports**: the host half imports **no `@deepseek-ai/*` packages at runtime** — the agent tool is written in the raw registrable shape `ctx.tools.register` accepts (standard JSON Schema in `output.schema`, plain `render`/`execute`), instead of being built with `defineTool` from `@deepseek-ai/dsh-tools`. That is what makes a git vendoring install (`dsh plugin add github:...`, which clones into a workspace `vendor/` dir) work out of the box: Node never has to resolve `@deepseek-ai/*` from the plugin's own `node_modules`, because the plugin never imports them. (Earlier revisions imported `defineTool`; if you hit `ERR_MODULE_NOT_FOUND` for `@deepseek-ai/dsh-tools`, update to the latest ref.)

### Method 1: one `dsh plugin` command (recommended)

From anywhere:

```sh
dsh plugin --profile web add github:vinyumao/dsh-opencode-usage#<ref>
```

`package.json` declares `dsh.bundle.patch`, so the install automatically joins the profile's `dsh.profile.bundles` layer stack and mounts `cordis.patch.yml`. Then **restart `dsh web`** — the badge appears under the composer.

> A git install fetches source; this plugin is pure source (`index.mjs` / `client.js`, no build step), so it works right away with no `prepare` script. If pnpm asks for an `allowBuilds` permission, copy the package key it prints into the profile's `pnpm-workspace.yaml` and retry. For reproducible installs, pin `<ref>` to a commit SHA (`#<sha>`).

### Method 2: manual wiring

1. Add to the profile's `package.json` `dependencies`:
   ```json
   "@chen-001/dsh-opencode-usage": "github:vinyumao/dsh-opencode-usage#<ref>"
   ```
2. Run `pnpm install` in the profile directory.
3. Confirm `dsh.profile.bundles` contains the package (`dsh plugin` reconciles automatically); or add to the profile's `cordis.patch.yml`:
   ```yaml
   - insert:
       - id: opencode-usage
         name: '@chen-001/dsh-opencode-usage'
   ```
4. **Restart `dsh web`** — the badge appears under the composer.

### Installation guide for AI agents

When an AI assistant installs this on the user's behalf, follow these steps:

1. **Confirm the dsh CLI**: `dsh --version`. In a source checkout, use `pnpm dsh ...` instead.
2. **Install** (pin `<ref>` to the latest commit SHA):
   ```sh
   dsh plugin --profile web add github:vinyumao/dsh-opencode-usage#<ref>
   ```
   - First use initializes the profile (auto-bundles `@deepseek-ai/dsh-base`).
   - If pnpm refuses to run a git dependency's prepare script, add the printed package key to `allowBuilds` in `$DSH_HOME/profiles/web/pnpm-workspace.yaml` and re-run.
3. **Verify the layer stack**: `dsh --profile web --dump-config` should show a `# == @chen-001/dsh-opencode-usage` layer (with the `opencode-usage` row).
4. **Restart web**: quit the running `dsh web` process and start it again.
5. **Smoke test**: open the DSH web GUI — the `OpenCode Go：…` badge should appear under the composer; ask the agent to run the `opencode_go_usage` tool, which should return the three windows.
6. **Troubleshooting**: if the badge shows "query failed", check whether `OPENCODE_GO_API_KEY` is set, or click the badge and fill in the API key in the config form.

## Uninstall

The same `dsh plugin` command that installed it removes it: it runs `pnpm remove` in the profile directory and automatically drops the plugin from the `dsh.profile.bundles` layer stack (so no manual `cordis.patch.yml` / bundles editing is needed):

```sh
dsh plugin --profile web remove @chen-001/dsh-opencode-usage
```

Then **restart `dsh web`** — the badge disappears, and the `/api/dsh-opencode-usage/*` routes, the `opencode_go_usage` tool, and the agent announcement are unloaded.

### Optional cleanup

- **Config file**: the API key is stored in plaintext at `~/.dsh/dsh-opencode-usage.json` (mode 0600). If you do not plan to reinstall, delete it: `rm ~/.dsh/dsh-opencode-usage.json`. (The key may also be referenced by the DSH opencode-go model provider through the `OPENCODE_GO_API_KEY` environment variable — that configuration is independent of this plugin.)
- **allowBuilds entry**: if the install required adding the printed package key to the profile's `pnpm-workspace.yaml` `allowBuilds`, that entry can be removed as well.

### Manual fallback

If `dsh plugin` is unavailable, remove the dependency and the bundle row by hand in the profile directory (`~/.dsh/profiles/web`):

1. `pnpm remove @chen-001/dsh-opencode-usage`
2. Delete the `"@chen-001/dsh-opencode-usage"` row from `dsh.profile.bundles` in `package.json`
3. Restart `dsh web`

### Verify

- `dsh --profile web --dump-config` should no longer list a `# == @chen-001/dsh-opencode-usage` layer.
- After the restart, the `OpenCode Go：…` badge is gone.

## Configuration

API key resolution order: plugin config file → `OPENCODE_GO_API_KEY` environment variable → none.

| Config | Default | Description |
| --- | --- | --- |
| `apiKey` | env var | Stored to `~/.dsh/dsh-opencode-usage.json` (mode 0600) when filled in via the card's config form |
| `baseUrl` | `https://opencode.ai/zen/go` | Upstream gateway base; `/v1/usage` is appended automatically |
| `refreshSeconds` | `300` | Badge auto-refresh interval (seconds, min 10) |
| `webUsageUrl` | *(empty)* | Web usage dashboard opened by the card's `opencode` button, e.g. `https://opencode.ai/workspace/<workspace-id>/go`. Workspace IDs are account-specific — configure your own rather than copying someone else's; empty hides the button |
| `enabled` / `announceToAgent` | `true` | Master switch / whether to announce the plugin to agents |

Optional file-based config:

```json
// ~/.dsh/dsh-opencode-usage.json
{ "apiKey": "sk-…", "baseUrl": "https://opencode.ai/zen/go", "refreshSeconds": 300, "webUsageUrl": "https://opencode.ai/workspace/<workspace-id>/go" }
```

## Agent tool

`opencode_go_usage` (no arguments) returns:

```
OpenCode Go 用量（https://opencode.ai/zen/go）
滚动用量：0%，重置于 3 小时 20 分钟
每周用量：0%，重置于 2 天 9 小时
每月用量：0%，重置于 30 天 22 小时
抓取时间：…
```

## Security

- `/api/dsh-opencode-usage/*` is loopback-only (with same-origin checks); a LAN-exposed deployment cannot leak the proxied key.
- The API key is stored in plaintext at `~/.dsh/dsh-opencode-usage.json` (0600) — the same trust model as the dsh-ssh credential store.
- The config read endpoint only returns `hasApiKey` / `apiKeySource`; the key itself never leaves the host.

## Plugin management

Manage installed plugins with the [plugin-registry](https://github.com/vlln/plugin-registry) **console** (a browser panel): manage the profile plugin install state (bundle layer stack + insert rows + enable/disable) without hand-editing config. Install:

```
dsh plugin --profile web add github:vlln/plugin-registry/packages/plugin/console
```

## Development

```sh
node tests/sanity.mjs   # pure-logic checks (parse/format/config store), no dsh runtime needed
node tests/routes.mjs   # route-layer integration (loopback fence/method guards/JSON bodies)
```

## Known limitations

- The badge hangs in the composer dock (visible when a session is open); it is hidden when no session is active.
- The usage endpoint is not officially documented; the shape may change (see "How it works").
- The config form's key input is "append/overwrite" semantics: saving with an empty key keeps the current key; to fall back to the environment variable, edit the config file and remove the `apiKey` field.

## License

[MIT](LICENSE)
