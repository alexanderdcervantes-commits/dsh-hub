# dsh-plugin-codex-bridge

Bridge OpenAI Codex's skills, instructions, and configuration into DeepSeek Harness -- zero migration.

## What it does

- `~/.codex/skills/<name>/SKILL.md` -- Injects skills as available skills
- `~/.codex/instructions.md` -- Injects instructions into system prompt
- `~/.codex/config.toml` -- Injects model/provider context

## Install

```sh
dsh plugin --profile your-profile add dsh-plugin-codex-bridge
```

## Configuration

```yaml
- id: codex-bridge
  name: dsh-plugin-codex-bridge
  config:
    enableSkills: true
    maxSkills: 30
    enableInstructions: true
    enableConfig: true
```

## License

MIT -- YYTbit
