# dsh-plugin-opencode-bridge

Bridge OpenCode's skills and configuration into DeepSeek Harness -- zero migration.

## What it does

- `~/.config/opencode/skills/<name>/SKILL.md` -- Injects skills as available skills
- `~/.config/opencode/opencode.jsonc` -- Injects config context

## Install

```sh
dsh plugin --profile your-profile add dsh-plugin-opencode-bridge
```

## Configuration

```yaml
- id: opencode-bridge
  name: dsh-plugin-opencode-bridge
  config:
    enableSkills: true
    maxSkills: 30
    enableConfig: true
```

## License

MIT -- YYTbit
