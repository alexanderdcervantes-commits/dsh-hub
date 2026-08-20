# dsh-prompt-optimizer

A prompt-optimizer plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`). It adds an **✨ Optimize Prompt** button right below the chat composer: click it to rewrite your draft into a clearer, more executable prompt — then apply it back into the input box with one click.

## Features

- Button rendered under the composer (via the `conversation.composer.dock` slot)
- Reads the current composer text on click; friendly prompt when empty
- Rewrites the draft through the host's `ctx.llm` with a fixed six-step procedure (intent → context → hidden constraints → gaps → restructure → language check)
- Before/after dialog with a **Replace into input** button that writes the result back
- Output always matches the input language; code, terms, and URLs are preserved

## Requirements

- DeepSeek Harness `dsh` (web profile) with a configured model (e.g. a DeepSeek API key in **Settings → Models**)

## Install

```sh
dsh plugin --profile web add https://github.com/SongMiao-tech/dsh-prompt-optimizer
```

Or clone and install from source:

```sh
git clone https://github.com/SongMiao-tech/dsh-prompt-optimizer.git
cd dsh-prompt-optimizer
pnpm install
pnpm run build
```

Then register the bundle in your profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: prompt-optimizer
      name: '@deepseek-ai/dsh-prompt-optimizer'
    - id: ui-prompt-optimizer
      name: '@deepseek-ai/dsh-client-ui-prompt-optimizer'
```

## Usage

1. Type a rough draft in the composer
2. Click **✨ Optimize Prompt**
3. Review the rewrite in the dialog
4. Click **Replace into input** to swap it in, then send

## Development

```sh
pnpm install
pnpm run build     # tsc + tsdown for both packages
pnpm run test      # vitest unit tests
```

## Structure

```
.
├── cordis.patch.yml            # bundle manifest patch (host + client rows)
├── packages/
│   ├── prompt-optimizer/       # host half: promptOptimizer Remote over ctx.llm
│   └── ui-prompt-optimizer/    # client half: dock button, dialog, write-back
└── scripts/                    # vendored tsdown client-bundle preset
```

## License

[MIT](LICENSE)
