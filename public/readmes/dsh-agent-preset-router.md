# dsh-agent-preset-router

**自动模式 (Auto Mode)** — an AI pre-judgment layer for [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/DeepSeek-Harness).

Adds a selectable **自动模式 / Auto** agent preset. When you start a **new** session in Auto mode and send your first request, a flash-class model first judges which built-in agent preset fits your intent — 标准模式 (standard) / PTC 模式 (code) / 极简模式 (minimal) / 创造模式 (cordis) — then **switches and executes automatically, with no confirmation**. A glowing info bar above the input shows the decision for 3 seconds and dismisses itself.

```
你发送需求 ──► Flash 分类 ──► 自动切换 preset 并执行（无需确认）──► 决策提示条 3 秒后自动消失
```

> **Why "per new session"?** DSH fixes a session's agent preset the moment the session produces anything (its first `turn/start`). Re-routing *inside* one session after the first message is a platform-level lock (`agent-preset-locked`). Auto Mode therefore routes every **new** session's **first** message — the flash judgment happens before anything is sent, so the session is still blank and the preset can be switched. Once routed, the session is pinned to the chosen preset, exactly like a session you created directly in that preset.

## Features

- ✨ **Selectable Auto preset** — appears as 自动模式 in the preset picker (new session), with a compact toolset as a safety net if routing is ever unavailable.
- 🤖 **Flash pre-judgment** — a `deepseek-v4-flash` classifier scores the request against the four built-in presets and returns `preset` + `reason` + `confidence`.
- ⚡ **Judge and run** — the session is switched to the recommended preset and the message is sent immediately, no confirmation; an animated info bar (moving gradient diffuse glow, futuristic styling) shows the routed decision above the input and auto-dismisses after 3 seconds.
- 🛡️ **Honest fallbacks** — on any classifier failure the session falls back to a configured default preset (standard) and tells you so, instead of silently mis-routing.
- 🔌 **Zero config to start** — the classifier reuses the session's own provider/model (falls back to your first registered provider), so it works out of the box.

## Install

Requires DSH with the web app installed. Install into your web profile — from npm when published, or directly from GitHub:

```bash
# npm (once published)
dsh plugin --profile web add dsh-agent-preset-router

# or straight from this repository
dsh plugin --profile web add "https://github.com/CTWCTW9999/dsh-agent-preset-router"
```

(If you develop locally: `dsh plugin --profile web add <path-to-this-repo>`.)

Restart the web app (or reload the GUI page) so the new bundle row and preset are picked up.

### Verify

- The preset picker for a new session now lists **自动模式**.
- The installed preset lives at `$DSH_HOME/.agent-presets/auto` with a `.dsh-preset-owner.json` marker owned by this plugin.

## Usage

1. Create a new session.
2. Pick **自动模式** as its agent preset.
3. Type your request and send.
4. An animated bar appears above the input: first "picking the best preset…", then "Auto-routed to **xxx** — reason". The session is switched and your message is sent automatically; the bar dismisses itself after 3 seconds.
5. No confirmation needed — execution starts on the chosen preset immediately.

> Slash commands (e.g. `/help`) bypass routing and execute directly.

## How it works

| Layer | Piece | Role |
|---|---|---|
| Host | `lib/index.js` | Installs the `auto` preset into the user preset root; exposes an HTTP RPC (`POST /agent-preset-router/rpc`, method `classify`) that runs the flash classifier through `ctx.llm`. |
| Client | `lib/client.js` | Wraps `api.sessions.prompt`; for blank Auto sessions it calls the classify RPC, then **automatically** calls `api.agentPresets.select` and forwards the prompt once the judgment lands, while rendering a 3-second self-dismissing animated info bar in the composer dock (`conversation.input.dock`). |
| Preset | `presets/auto/` | The 自动模式 composition — a compact, safe toolset used as the session's preset when Auto is selected (routing normally switches away before the first turn). |

### Architecture constraints that shaped the design

- **Preset lock**: `agentPresets.select` only works on blank sessions. Routing must happen client-side before the first `session.prompt` — hence the prompt wrapper.
- **The info bar is display-only**: no buttons, no waiting — routing executes the moment the judgment lands, and the bar fades out on its own after 3 seconds.
- **RPC dispatch is fixed**: plugins cannot add RPC methods to the harness protocol, so classification rides an HTTP route with a same-origin check.
- **Inject contract**: the host declares `inject: ['agents', 'llm']`; the client injects `connection`, `sessions`, `slots`, `locale`.

## Configuration

All settings are optional. Configure the plugin via the profile's patch layer (`cordis.patch.yml` in `$DSH_HOME/profiles/web/`) or by patching the bundle row:

```yaml
- config:
    classifier:
      provider: leihuo      # default: the session's own provider, else the first registered
      model: deepseek-v4-flash
      temperature: 0
      maxTokens: 256
    fallbackPreset: standard  # used when classification fails (standard|code|minimal|cordis)
  id: agent-preset-router
```

| Key | Default | Meaning |
|---|---|---|
| `classifier.provider` | session provider → first registered | LLM provider for the classifier |
| `classifier.model` | `deepseek-v4-flash` | Classifier model (session model overrides when default) |
| `classifier.temperature` | `0` | Sampling temperature |
| `classifier.maxTokens` | `256` | Max output tokens for the classification JSON |
| `fallbackPreset` | `standard` | Preset used when classification fails |

The classifier prompt is a strict JSON contract: `{"preset","reason","confidence"}` with the four preset ids, in Chinese, plus a 30s timeout.

## Security notes

- The classify route is POST-only, rejects cross-origin requests, and caps request bodies at 256 KiB.
- The classifier may send your request text to the configured LLM provider — same trust model as the harness itself.

## Limitations

- Routing applies to the **first message of each new session**, not per-message inside an ongoing session (platform preset lock).
- The classifier's judgment is heuristic; routing completes automatically before the message is sent. If it picked wrong, start a new session (or create one directly in the target preset) — there is no in-flight cancel.
- The `auto` preset itself is a compact fallback toolset; if you want richer behavior when Auto is the final preset, extend `presets/auto/agent.cordis.yml` (installed into `$DSH_HOME/.agent-presets/auto`).

## Development

```bash
npm test           # run all three test suites (no DSH needed)
npm pack           # build the publishable tarball
# install the tarball: dsh plugin --profile web add ./dsh-agent-preset-router-0.1.0.tgz
```

Run the test suites individually (no DSH needed):

```bash
node test/host.test.mjs   # parseClassification + preset installer
node test/rpc.test.mjs    # classify RPC handler (stubbed ctx)
node test/client.test.mjs # client bundle load + prompt wrap + HMR
```

### Publishing

```bash
npm publish        # publish to npm (runs "prepublishOnly" checks if configured)
# after publishing, install with: dsh plugin --profile web add dsh-agent-preset-router
```

## Credits

- Preset-installer pattern inspired by [QlzqQlzq/dsh-dual-agent-presets](https://github.com/QlzqQlzq/dsh-dual-agent-presets).
- Client plugin shape informed by [badai147/dsh-global-rules](https://github.com/badai147/dsh-global-rules) and [ChuanTianML/prompt-for-me](https://github.com/ChuanTianML/prompt-for-me).
- Community ecosystem: the [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) registry, the [dsh-market](https://github.com/dsh-market/dsh-market) plugin market, and the related routing/advisory plugins [LeemanCheung/dsh-agent-preset-recommender](https://github.com/LeemanCheung/dsh-agent-preset-recommender), [dylan121322/llm-adaptive](https://github.com/dylan121322/llm-adaptive), [BruceLanLan/dsh-tier-router](https://github.com/BruceLanLan/dsh-tier-router).

## License

[MIT](./LICENSE)
