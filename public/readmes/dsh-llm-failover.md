# dsh-llm-failover

Provider failover for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`): when a model provider returns rate-limit (429) or quota-exhausted errors, switch to the next provider automatically — with a configurable per-provider model mapping, a permanent final fallback, and a visible notice in the UI.

模型提供方故障转移插件：遇到限流（429）或配额耗尽时，自动切换到下一个提供方——支持按提供方配置模型、永久最终兜底，并在界面显示切换提示。

## Features / 功能

- Automatic switch on `RATE_LIMIT` / `QUOTA` failures, with configurable retry threshold (`fallbackAfterRetries`). / 遇到限流/配额错误自动切换，可配置切换前连续失败次数。
- Per-provider model mapping — a switched provider can use a different model. / 每个提供方可单独指定切换后使用的模型。
- Cooldown per provider (`cooldownMs`): a cooled-down provider is skipped until it recovers. / 提供方冷却机制：冷却期间直接跳过，到期自动恢复。
- The last entry in the provider list is the permanent fallback and is never switched away (no retry loops). / 列表最后一条是永久兜底，永远不会被切走（不会死循环）。
- UI notice bar on every switch (auto-dismiss). / 每次切换在输入框上方显示提示条（自动消失）。
- Configuration card in Settings → Plugins → Plugin configuration. / 设置 → 插件 → 插件配置 页面卡片直接配置。

## Install / 安装

```sh
dsh plugin --profile web add dsh-llm-failover
```

## Configuration / 配置

Either use the Settings UI card, or edit `~/.dsh/settings.yaml`:

```yaml
llm-failover:
  enabled: true                     # master switch / 总开关
  providers:                        # tried in order; last one is the fallback / 按顺序尝试，最后一条是兜底
    - provider: huoshan             # provider key from your llm-pi-ai / llm-deepseek config
      model: deepseek-v4-flash      # optional: model to use after switching / 可选：切换后使用的模型
    - provider: huoshan2
      model: deepseek-v4-flash
    - provider: deepseek-official   # permanent fallback, never switched away / 永久兜底
      model: deepseek-v4-flash
  fallbackAfterRetries: 2           # consecutive failures before cooldown+switch / 连续失败几次后冷却并切换
  cooldownMs: 60000                 # cooldown duration in ms / 冷却时长（毫秒）
```

## How it works / 原理

Hooks two official agent waterfalls:

- `agent/request` — picks the first non-cooled provider in the configured order at request time (returns a new config object; the seed config is deep-frozen).
- `agent/request-error` (prepended, so it counts failures before `dsh-llm-retry`) — after `fallbackAfterRetries` consecutive `RATE_LIMIT`/`QUOTA` failures, cools the provider down and returns `{ kind: "retry" }`; the last list entry never switches.

The config card talks to the plugin-owned `/llm-failover` RPC channel (the official settings RPC serves only allowlisted namespaces); writes go through the standard settings service — schema-validated and persisted to `settings.yaml`, live without restart.

## License

MIT
