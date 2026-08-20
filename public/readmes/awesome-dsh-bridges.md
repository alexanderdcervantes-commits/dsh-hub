# Awesome DSH Bridge Plugins

Bridge your favorite AI coding tools into DeepSeek Harness -- zero migration, full compatibility.

## Bridge Plugins

- dsh-plugin-claude-bridge -- Claude Code (Memory + Skills + Global CLAUDE.md)
- dsh-plugin-codex-bridge -- OpenAI Codex (Skills + Instructions + Config)
- dsh-plugin-opencode-bridge -- OpenCode (Skills + Config)
- dsh-plugin-pi-bridge -- Pi Agent (Skills)

## Utility Plugins

- dsh-plugin-vision-toolkit -- Vision toolkit for text-only agents (glance/ground/detect/crop)
- dsh-plugin-meta-memory -- Structured long-term memory system (unit-based brief/full pairs)

## Quick Install

```sh
dsh plugin --profile your-profile add dsh-plugin-claude-bridge
dsh plugin --profile your-profile add dsh-plugin-codex-bridge
dsh plugin --profile your-profile add dsh-plugin-opencode-bridge
dsh plugin --profile your-profile add dsh-plugin-pi-bridge
```

## How It Works

These plugins read configuration files from other AI coding tools directly -- no migration scripts needed. Skills, memories, and instructions are injected into the dsh system prompt as context.

## Contributing

Have a bridge plugin for another tool? Open a PR to add it to this list.

## License

MIT -- YYTbit
