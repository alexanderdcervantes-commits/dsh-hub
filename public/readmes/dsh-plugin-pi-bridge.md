# dsh-plugin-pi-bridge

Bridge Pi Agent's skills into DeepSeek Harness -- zero migration.

## What it does

- `~/.config/pi/skills/<name>/SKILL.md` -- Injects skills as available skills

## Install

```sh
dsh plugin --profile your-profile add dsh-plugin-pi-bridge
```

## Configuration

```yaml
- id: pi-bridge
  name: dsh-plugin-pi-bridge
  config:
    enableSkills: true
    maxSkills: 30
```

## License

MIT -- YYTbit
