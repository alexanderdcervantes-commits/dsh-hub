# noatmark-dsh-plugin

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

**NoAtMark text hygiene** as a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) plugin.

Everything-is-a-plugin: this plugin gives your dsh agent four text-hygiene tools, backed by the same deterministic engines behind [noatmark.com](https://noatmark.com).

## Tools

| Tool | What it does |
|---|---|
| `sanitize_text` | Strip invisible/zero-width characters and flag prompt-injection + hidden-text signals. |
| `scan_text` | Report invisible characters (with code points + positions), injection patterns, and hidden text. |
| `clean_format` | Clean LLM formatting artifacts (blank lines, stray fences, trailing spaces) — meaning untouched. |
| `sanitize_csv` | Escape CSV formula injection (OWASP): `= + - @` prefixes get a leading quote. |

All processing is deterministic and local — no data leaves your machine.

## Install

Add this plugin to your dsh Web UI. If you're running from a source checkout, use a `cordis.yml` patch:

```yaml
- insert:
    - id: noatmark
      name: noatmark-dsh-plugin
```

or point at the source directly (absolute path):

```yaml
- insert:
    - id: noatmark
      name: '/path/to/noatmark-dsh-plugin/src/index.ts'
```

Start dsh with the patch:

```sh
npx @deepseek-ai/dsh web --patch ./cordis.yml
```

## Usage

In a dsh session, ask the agent to use a tool, e.g.:

> Sanitize this pasted text before you summarize it.

> Scan this file for invisible characters.

> Clean the formatting of this AI output.

> Escape this CSV before saving it.

## Development

```sh
pnpm install
pnpm build   # tsc -> dist/
```

## Resources

- Web tools: https://noatmark.com/
- NoAtMark SDK (npm/PyPI): `noatmark-text-hygiene`
- DeepSeek Harness: https://github.com/deepseek-ai/deepseek-harness
- Official docs: https://deepseek-harness.github.io/deepseek-harness/

MIT
