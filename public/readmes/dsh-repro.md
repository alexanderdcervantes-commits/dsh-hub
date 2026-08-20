# dsh-repro

Export a minimal, secret-scrubbed, replayable problem bundle for the DeepSeek
Harness.

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

`/repro` reads the current session's complete canonical log through
`sessionPersistence.inspect`, scrubs secrets value by value, collects failed
commands and a `git diff`, and writes a `repro-<sessionId>.json` manifest.

## Install

```sh
dsh plugin --profile <name> add github:EvilIrving/dsh-repro
```

Or, from a checkout:

```sh
dsh plugin --profile <name> add ./dsh-repro
```

The bundle patch inserts one plugin row (`dsh-repro`); it needs the
`commands` and `sessionPersistence` services, which the base profile already
mounts.

## What the bundle contains

```ts
interface ReproManifest {
  formatVersion: number          // 1
  header: SessionHeader          // cwd, lineage, delegation depth
  events: SessionEvent[]         // complete, secret-scrubbed canonical log
  failedCommands: string[]       // `name <arguments>` for each errored tool call
  gitDiff: string                // empty when git or a repo is unavailable
  versions: Record<string, string>
}
```

The `events` array is the full canonical log (contiguous from seq 0), so it can
later be replayed via `ctx.sessions.create(id, { seed })`; secrets are redacted,
not dropped, which preserves replay balance.

## Secret scrubbing (fail-closed)

`redactValue` walks the detached JSON log and:

1. redacts any object key matching the harness's credential pattern
   (`/KEY|PASSWORD|SECRET|TOKEN/i`) **whole**;
2. redacts any string beginning with a known token prefix (`sk-`, `ghp_`,
   `xoxb-`, `Bearer `, …);
3. redacts any high-entropy run (long base64/hex/token-shaped sequence).

Both prefix and entropy thresholds are `Config`-driven. The default is
fail-closed: a string that looks credential-shaped is redacted rather than
passed through. This mirrors `session-telemetry`'s waterfall *shape* (rewrite an
outbound copy, never the canonical log) while supplying the value-level rules
the telemetry seam deliberately ships without.

## Config

```ts
export interface Config {
  tokenPrefixes: string[]
  minHighEntropyLength: number  // default 20
  gitDiffMaxBytes: number       // default 256 KiB
  gitGraceMs: number            // default 5000
}
```

## Dependencies

- `commands` and `sessionPersistence` are hard dependencies (`inject`).
- `subprocess` is optional (`ctx.get`): `git diff` degrades to an empty string
  when it is absent or the cwd is not a repository.

## Model Experience

### Request context and condition

#### What the model sees

A single slash command `/repro [output directory]`. Its result is a one-line
success message naming the written bundle path; the bundle contents are never
injected into the model context.

#### Token effect

Zero-direct effect; the command result is a single short text line.

#### KV Cache effect

Append-only: the command lifecycle events (`command/run`, `command/done`) append
to the log and never rewrite earlier tokens.

## Known Limitations and Deferred Work

- **Bundle write bypasses the sandboxed `ctx.fs` seam** — v1 uses
  `node:fs/promises` directly; routing the write through `ctx.fs` (so a
  sandboxed deployment constrains the output path) is deferred.
- **Replay CLI is out of scope** — `dsh repro run <bundle>` is a separate
  process-level seam (`boot/cmdline` + `cmdlineArgs`), not `/repro`; v1 only
  exports.
- **No oversized-artifact inlining** — spill artifacts are referenced by
  locator, never inlined; any file-byte inlining would need a size policy.
