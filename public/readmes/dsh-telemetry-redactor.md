# DSH Telemetry Redactor

[![CI](https://github.com/030611/dsh-telemetry-redactor/actions/workflows/ci.yml/badge.svg)](https://github.com/030611/dsh-telemetry-redactor/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-telemetry-redactor)](https://www.npmjs.com/package/dsh-telemetry-redactor)
[![License](https://img.shields.io/github/license/030611/dsh-telemetry-redactor)](LICENSE)
[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)
[![featured on dsh-suite](https://img.shields.io/badge/featured%20on-dsh--suite-4d6bfe)](https://whyihaveyou.github.io/dsh-suite/)

English | [中文](README.zh.md)

![DSH Telemetry Redactor social preview](https://raw.githubusercontent.com/030611/dsh-telemetry-redactor/811b0b1abf424e57045ab5a5eaa203660ca43908/docs/social-preview.jpg)

**Redact supported credential patterns from outbound telemetry copies before configured backends receive them—without rewriting canonical session logs.**

```sh
dsh plugin --profile web add dsh-telemetry-redactor
```

> Community-maintained and not an official DeepSeek project. Related trust-layer plugins: [Verification Receipt](https://github.com/030611/dsh-verification-receipt), [Evidence Audit](https://github.com/030611/qiushi-dsh-evidence-audit), and [Context Provenance](https://github.com/030611/dsh-context-provenance).

`dsh-telemetry-redactor` is a minimal DeepSeek Harness Profile Bundle that redacts sensitive values from session telemetry before a backend receives them. It mounts on the official `session-telemetry/record` waterfall, calls `next()` so other deployment rules still compose, and returns a new recursively redacted record.

The official telemetry coordinator deep-copies canonical session events before this waterfall and contains thrown rules per record. Therefore this plugin changes only the outbound copy: it never rewrites the canonical session log. In this document, **fail-closed means only that this coordinator withholds one failing export copy** and continues the agent loop. It is not a claim that every telemetry path or listener order is impossible to bypass.

## What it redacts

- Values under high-risk key names such as `authorization`, `cookie`, `credential`, `password`, `secret`, `token`, `apiKey`, `access_token`, `clientSecret`, and `privateKey`; recognized credential patterns in key names are replaced too.
- Bearer and Basic authorization values embedded in strings.
- Common credential forms including `sk-...`, GitHub tokens, Slack tokens, JWT-like triples, and `token=...` / `api_key: ...` assignments.

Keys are tokenized before matching, so telemetry counters such as `inputTokens`, `output_tokens`, `tokenUsage`, `tokenCount`, and `contextTokenCount`, and ordinary fields such as `tokenizer`, remain intact. Redaction is a safety filter, not a proof that an arbitrary unknown secret format is absent. The exact supported and unsupported cases are in [SECRET-MATRIX.md](SECRET-MATRIX.md); see [SECURITY.md](SECURITY.md) for the trust boundary.

The listener is prepended so it normally wraps deployment rules mounted before or after it and redacts their final output. A deliberately prepended outer listener can still add content after this plugin; review the complete waterfall listener set in security-sensitive deployments.

## Install

Install the public package into the selected DSH profile, then inspect the resolved configuration:

```sh
dsh plugin --profile web add dsh-telemetry-redactor
dsh --profile web --dump-config
```

The dump must contain the inserted `telemetry-redactor` row. The bundle does not add, replace, or enable a telemetry backend; it only protects records handled by whatever backend the deployment already selected.

## Configuration

The only option is `replacement`, which defaults to `[REDACTED]`. It must contain 1 to 128 characters and must not itself match a supported credential pattern; invalid values fail loudly when the Cordis plugin fiber is awaited.

```yaml
- id: telemetry-redactor
  config:
    replacement: '[TELEMETRY-REDACTED]'
```

The key and pattern rules are fixed security behavior and cannot be disabled through configuration.

## Verification

```sh
pnpm run typecheck
pnpm test
pnpm run build
pnpm run test:smoke
pnpm run test:performance
pnpm run test:official-head
pnpm run test:official-patch
pnpm run test:packed:clean-env
```

The tests include a real Cordis Loader composition with the `SessionTelemetryCoordinator`: the backend receives the replacement while the authoritative session event retains the fixture secret, and an over-deep record is withheld without escaping the capture handler. Release smokes use the packaged frozen fixture for official commit `47f943859bef60e4160492346772ded9b24f765a`: it pins the reviewed source hashes, exact published runtime versions and runtime-file hashes, then verifies the required Cordis/session/LLM/coordinator API surface before composing it with the built or tarball-installed plugin. `test:official-patch` similarly pins the reviewed Include source hash before applying `cordis.patch.yml`. No environment variable or installed official checkout is required.

## Model Experience

None. The plugin observes an outbound telemetry copy after session logging and contributes no prompt text, tool schema, message, or provider request.

#### KV Cache effect

None; no model request changes.

## Known limitations

- Unknown secret formats that have neither a sensitive key nor a recognized string pattern may pass through. Add deterministic coverage before extending the fixed patterns.
- Accessor properties and non-plain objects are rejected rather than read or silently converted. Enumerable JSON data in arrays, ordinary objects, and null-prototype objects is supported; non-enumerable fields are outside the telemetry contract.
- A key-name match redacts the complete value. This favors safety over retaining structure beneath fields named as credentials.
- Redaction occurs synchronously on the telemetry capture path. The implementation is recursive and bounded to 64 nested containers; very large but shallow records still cost linear CPU time.
- A Proxy can run or throw from reflection traps before the plugin can inspect its contents. The official coordinator's own `structuredClone` normally rejects a Proxy before this waterfall; direct third-party dispatch is not a supported hostile-object sandbox.
- `dsh.plugin.json` is supplemental community metadata. DSH installation is controlled by `package.json`'s `dsh.bundle` field and `cordis.patch.yml`.

## License

MIT
