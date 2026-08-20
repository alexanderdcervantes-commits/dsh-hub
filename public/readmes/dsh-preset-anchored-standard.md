# dsh-preset-anchored-standard

An agent preset for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) that anchors a session's **first request** on the official Minimal preset's real tool pair — persistent `bash` + `str_replace_editor`, with auto-injected workspace/skill context stripped — then, after the first durable promotion signal (a tool call or the first assistant message), exposes the **full Standard catalog** from request #2 on.

Built for trajectory-evaluation runs that need the Minimal anchor at request #1 without giving up Standard capabilities for the rest of the session.

## Why the promotion notice

The bootstrap anchor is behavioral, not just structural: a model that opens with only a shell keeps the habits the bootstrap bash description teaches — notably foreground `sleep N` + `pgrep` polling for long-running waits — even after the catalog silently expands. We observed a delegated session poll a benchmark with `sleep 240` loops for ~90 minutes although `job_output` / `job_list` / `job_kill` were already in its catalog from request #2.

So the preset injects a **one-shot user-role notice at the promotion step** telling the model the full catalog is now active and that waits longer than ~2 minutes belong in background jobs (`run_in_background: true` + completion notices), not foreground polling. The notice fires only for sessions the process actually saw bootstrapping — a session resumed after promotion is not interrupted by it.

## Install

As a bundle (recommended — the preset syncs into `~/.dsh/.agent-presets/` at boot):

```sh
dsh plugin --profile web add "github:ruby1304/dsh-preset-anchored-standard"
```

Manual:

```sh
git clone https://github.com/ruby1304/dsh-preset-anchored-standard.git
cd dsh-preset-anchored-standard
./install.sh        # copies presets/anchored-standard into ~/.dsh/.agent-presets/
```

Then pick **Anchored Standard** in the preset selector, or set it as the default in `~/.dsh/settings.yaml`:

```yaml
agent-presets:
  default: anchored-standard
```

Uninstall: `./uninstall.sh` (or `dsh plugin remove` plus deleting the preset directory).

## Configuration

All knobs live in the `tool-bootstrap` row of `presets/anchored-standard/agent.cordis.yml`:

| Key | Default | Meaning |
| --- | --- | --- |
| `bootstrapTools` | `[bash, str_replace_editor]` | Tool catalog exposed on request #1. |
| `promoteOn` | `either` | Promotion signal: `tool-call`, `assistant-message`, or `either`. |
| `suppressedContextSources` | `[agent-instructions, skill-catalog]` | Auto-injected context stripped while bootstrapping (`[]` disables the filter). |
| `bootstrapMaxTokens` | unset | Optional output cap for request #1; stripped explicitly after promotion. |
| `promotionNotice` | built-in text | One-shot notice at the promotion step: custom string, or `false` to disable. |

## Compatibility

Developed and tested against dsh `0.1.0-rc.5`. The preset composes only shipped `@deepseek-ai/dsh-*` plugins plus its own local `tool-bootstrap.mjs`; no third-party dependencies.

## Development

```sh
node tests/bootstrap-notice.test.mjs   # mock-waterfall test of the promotion-notice logic
```

## License

MIT
