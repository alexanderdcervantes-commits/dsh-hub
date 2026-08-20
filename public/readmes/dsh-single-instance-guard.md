# dsh-single-instance-guard

A zero-dependency [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that takes an exclusive lock on the `DSH_HOME` data directory at startup and **aborts loudly** when another live dsh server already uses it.

[中文说明](README.zh.md)

## Why

The JSONL session persistence backend documents **"One live writer per session"** and has no cross-process defense. Two dsh servers sharing one `DSH_HOME` (a desktop wrapper spawning its own server, or two `dsh web` processes) append batches with stale sequence cursors, corrupting session logs:

```
history unavailable for session "…": Error: corrupt session log: seq gap in committed region …
```

See [this report](https://github.com/deepseek-ai/deepseek-harness/discussions/2571) for the full diagnosis, a read-only scanner, and a manual repair procedure.

This plugin turns the silent corruption into a loud startup failure.

## Install

After publishing to npm:

```bash
dsh plugin --profile <profile> add dsh-single-instance-guard
```

Manual (any dsh install): add the row to the profile's `cordis.patch.yml` **before** session-related bundles:

```yaml
- insert:
    - id: single-instance-guard
      name: 'dsh-single-instance-guard'
```

The guard is a [profile bundle](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/bundle): its manifest declares the same patch, so the CLI installs it as a patch layer.

## How it works

1. Creates `<DSH_HOME>/.dsh-server.lock` atomically (`O_EXCL`), holding `{ pid, startedAt, hostname }`.
2. On conflict, probes the holder's pid liveness: a live holder aborts startup with a clear bilingual error; a stale lock (dead pid or unparsable file) is removed and acquisition retried once.
3. On process exit the lock is removed — only if still owned by this process.

DSH_HOME is resolved exactly like dsh itself: `$DSH_HOME` or `~/.dsh`. Servers with different data roots never conflict.

## Known limits

- The unlink+retry path has a tiny race when two processes discover the same stale lock simultaneously; the atomic `O_EXCL` write still admits exactly one winner, and the loser fails correctly on the retry.
- The lock protects against concurrent servers sharing one `DSH_HOME`. It does not protect against two dsh instances deliberately pointed at the same **session file** via different roots (unsupported anyway).

## Development

```bash
npm test   # node --test
```

## License

MIT
