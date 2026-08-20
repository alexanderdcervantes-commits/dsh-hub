# DIT.ai for DeepSeek Harness

[![npm version](https://img.shields.io/npm/v/dsh-plugin-dit.svg)](https://www.npmjs.com/package/dsh-plugin-dit)
[![CI](https://github.com/cuboteam/dsh-plugin-dit/actions/workflows/ci.yml/badge.svg)](https://github.com/cuboteam/dsh-plugin-dit/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/dsh-plugin-dit.svg)](LICENSE)

Use the DIT.ai conversational model catalog in [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). This profile bundle adds [DIT.ai](https://dit.ai) as a native model provider while keeping the stock Harness runtime and tools unchanged.

## Install

DeepSeek Harness requires Node.js 22.19 or newer and pnpm.

```sh
npx @deepseek-ai/dsh plugin --profile web add dsh-plugin-dit
```

Start Harness:

```sh
npx @deepseek-ai/dsh web
```

On first Web-profile launch, a one-time DIT guide lets users register, open the API-key page, and save the key through Harness Credentials. The plugin cannot read stored plaintext and does not send the key anywhere except the configured DIT API endpoint.

See [installation and troubleshooting](docs/TROUBLESHOOTING.md) for version
verification, onboarding recovery, network access, and compatibility details.

You can also skip the guide and use an environment variable:

```sh
export DIT_API_KEY="your-dit-api-key"
```

Open **Settings → Models**, then choose a model and protocol:

- `DIT.ai`: recommended default using OpenAI Chat Completions (`/v1/chat/completions`)
- `DIT.ai Messages`: Anthropic Messages (`/v1/messages`)

`DIT.ai` exposes every current DIT model that supports OpenAI Chat Completions. `DIT.ai Messages` exposes every model that supports Anthropic Messages. Both providers share the same `DIT_API_KEY`.

For headless runs:

```sh
npx @deepseek-ai/dsh plugin --profile headless add dsh-plugin-dit
export DIT_API_KEY="your-dit-api-key"
npx @deepseek-ai/dsh --profile headless "Explain this repository"
```

## Discover inside Harness

The plugin is listed in the community directory used by
[dsh-market](https://github.com/dsh-market/dsh-market) and can also be found by
[dsh-find-plugin](https://github.com/awesome-dsh-plugin/dsh-find-plugin).

```sh
npx @deepseek-ai/dsh plugin --profile web add dshmarket
```

Open the Market tab and search for `DIT` or `dsh-plugin-dit`.

## Protocol support

| Provider | Harness API | DIT endpoint | Thinking |
| --- | --- | --- | --- |
| `dit` | `openai-completions` | `/v1/chat/completions` | Model-specific |
| `dit-messages` | `anthropic-messages` | `/v1/messages` | Native Anthropic Messages thinking |

Use `DIT.ai` for OpenAI-compatible clients. Use `DIT.ai Messages` for Anthropic content blocks, tool use, native Messages streaming events, and thinking budgets.

## What the bundle configures

- Provider routes: `dit` and `dit-messages`
- OpenAI Chat base URL: `https://api.dit.ai/v1`
- Anthropic Messages base URL: `https://api.dit.ai` (Harness appends `/v1/messages`)
- Credential reference: `DIT_API_KEY`
- Attribution header: `X-DIT-Integration: deepseek-harness`
- Chat models: all 29 models currently advertised with `openai_chat_completions`, including Claude, DeepSeek V4, Gemini, GLM, GPT, Grok, Kimi, and MiniMax families
- Messages models: all 10 Claude models currently advertised with `anthropic_messages`
- Native Messages thinking with Off, High, and Max levels
- One-time Web onboarding for registration, key creation, and secure Harness Credentials storage

The API key is resolved by Harness at request time and is never embedded in the plugin.
DIT's authenticated `/v1/models` response is the protocol authority. Image, audio, and video models are not listed because Harness consumes conversational model APIs.

## Security

The bundle contains no API key. Harness Credentials does not expose stored
plaintext back to the plugin, but the default local Harness backend persists it
unencrypted in `$DSH_HOME/.credentials.yaml` with filesystem mode `0600`.
See the complete [security policy](SECURITY.md) and report security issues
privately through GitHub Security Advisories.

## Local development

From this directory:

```sh
pnpm test
pnpm smoke:harness
DIT_API_KEY="your-dit-api-key" node scripts/check-catalog.mjs
npx @deepseek-ai/dsh plugin --profile web add .
npx @deepseek-ai/dsh --profile web --dump-config
```

`pnpm smoke:harness` runs the official Harness headless agent against local `/v1/chat/completions` and `/v1/messages` mocks. `scripts/check-catalog.mjs` compares the bundled model IDs with DIT's live protocol declarations without making a model request.

## Uninstall

```sh
npx @deepseek-ai/dsh plugin --profile web remove dsh-plugin-dit
```

## License

MIT
