# Qiushi DSH Evidence Audit

English | [简体中文](README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/qiushi-dsh-evidence-audit.svg)](https://www.npmjs.com/package/qiushi-dsh-evidence-audit)
[![CI](https://github.com/030611/qiushi-dsh-evidence-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/030611/qiushi-dsh-evidence-audit/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/qiushi-dsh-evidence-audit.svg)](LICENSE)
[![featured on dsh-suite](https://img.shields.io/badge/featured%20on-dsh--suite-4d6bfe)](https://whyihaveyou.github.io/dsh-suite/)

![Qiushi DSH Evidence Audit social preview](https://raw.githubusercontent.com/030611/qiushi-dsh-evidence-audit/94fae130b2845309e1dcabac14696fddb18f8f3a/docs/social-preview.jpg)

**Leave a locally checkable execution trail without storing prompts, tool arguments, tool results, or session IDs in plaintext.**

```sh
dsh plugin --profile web add qiushi-dsh-evidence-audit
```

> Community-maintained and not an official DeepSeek project. Related trust-layer plugins: [Telemetry Redactor](https://github.com/030611/dsh-telemetry-redactor), [Verification Receipt](https://github.com/030611/dsh-verification-receipt), and [Context Provenance](https://github.com/030611/dsh-context-provenance).

Qiushi DSH Evidence Audit is an observe-only DeepSeek Harness Profile Bundle. It listens to the official `tools/result` and `session/event` extension points and appends deterministic, hash-chained JSONL evidence receipts. It never registers a model-facing tool, changes a prompt, transforms a tool result, or appends to a session.

![Evidence Audit data flow: DSH observations are canonicalized and hashed into a private JSONL chain, while observed plaintext is omitted](https://raw.githubusercontent.com/030611/qiushi-dsh-evidence-audit/94fae130b2845309e1dcabac14696fddb18f8f3a/docs/evidence-flow.svg)

## Install from npm

Prerequisites are Node.js `^22.19.0 || >=24.0.0` and a DSH installation built from the [tested commit](#compatibility).

```powershell
dsh plugin --profile <profile> add qiushi-dsh-evidence-audit
dsh --profile <profile> --dump-config
```

The config dump should contain a row with id `qiushi-evidence-audit` and name `qiushi-dsh-evidence-audit`. Receipts then default to `$DSH_HOME/evidence-audit/evidence-receipts.jsonl`, or `~/.dsh/evidence-audit/evidence-receipts.jsonl` when `DSH_HOME` is unset. If running DSH from its source checkout, replace `dsh` with that checkout's documented `pnpm dsh` launcher.

To remove the bundle:

```powershell
dsh plugin --profile <profile> remove qiushi-dsh-evidence-audit
```

## What it can and cannot establish

- It can make edits to retained records, untouched-prefix removal, broken links, and partial final lines detectable when the existing file is verified.
- It can show that this observer saw specific event categories and hashes in a particular local sequence.
- It **cannot** prove that a command ran correctly, that a result was truthful, who produced the file, or that a valid suffix was not deleted.
- Its hashes are **not** redaction, encryption, digital signatures, or an external trust anchor. Protect the receipt file as sensitive pseudonymous data.

## Compatibility

This release has one deliberately narrow compatibility claim: it was implemented and tested against `deepseek-ai/deepseek-harness` commit `47f943859bef60e4160492346772ded9b24f765a` on 2026-08-13. That checkout identifies its packages as `0.1.0-rc.5`, but that version was not available from npm during verification. This is therefore a commit-pinned claim, not a promise for npm release `0.0.1-rc.1`, future DSH commits, or a semver range.

The official installer reads `package.json#dsh.bundle.patch`. [`dsh.plugin.json`](dsh.plugin.json) is additional project metadata with a local schema; the pinned DSH commit does not read that file and this project does not claim otherwise.

## Receipt data

The default file is `$DSH_HOME/evidence-audit/evidence-receipts.jsonl`, or `~/.dsh/evidence-audit/evidence-receipts.jsonl` when `DSH_HOME` is unset or blank. The plugin creates the default directory with owner-only mode `0700` and the file with owner-only mode `0600` where the operating system honors POSIX modes. It never defaults to the current working directory.

Every line contains `schemaVersion`, `sequence`, `collectedAt`, `previousRecordHash`, and `recordHash`. `recordHash` is SHA-256 over canonical JSON for every field except `recordHash` itself. The next line commits to it through `previousRecordHash`; the first line uses `null`. Startup verifies the complete existing file and refuses to append if a line, sequence, record hash, or previous-hash link is invalid.

A `session-event` receipt stores the hashed session ID, event type, event sequence and time, a hash of event data, and the optional `ignorable` marker. A `tool-result` receipt stores the tool name, hashed call/root-call/session IDs, argument hash, final outcome hash, error flag, parent-presence flag, and optional error code.

> [!WARNING]
> **`eventDataHash`, `argumentsHash`, and `outcomeHash` are not redaction, encryption, or digital signatures.** The JSONL excludes the observed plaintext, but an attacker who can guess a low-entropy value can hash candidates and confirm a match offline. Treat the receipt file as sensitive pseudonymous data and protect it accordingly.

Event types and tool names remain readable because they are the stable audit categories. The two feeds are not deduplicated: DSH may publish one logical tool outcome first on `tools/result` and then durably as a `tool/result` `session/event`. In that case this plugin intentionally writes two receipts describing two observations. Do not sum those receipts as independent tool executions.

### Canonical JSON boundary

`hashObservedValue` accepts only lossless JSON values: `null`, booleans, finite numbers, strings, dense arrays, and plain objects with string keys. Object keys are sorted recursively using JavaScript's default UTF-16 code-unit order. Strings use `JSON.stringify` escaping, SHA-256 consumes the resulting UTF-8 bytes, and Unicode normalization is not performed; canonically equivalent NFC and NFD strings therefore hash differently.

`undefined` (including an object property), `BigInt`, non-finite numbers, functions, symbols, sparse array holes, extra array properties, accessors, non-enumerable or symbol keys, circular references, proxies, array subclasses, and non-plain objects such as `Date`, `Map`, or class instances are rejected. Accessor getters are not invoked. Direct callers receive a path-bearing `TypeError`; observer callbacks catch the failure, log a warning, omit only that receipt, and leave the DSH publication unchanged. Existing-file verification still fails plugin startup loudly.

## Observe-only behavior

Both listeners are ordinary contained observers. They do not return a waterfall decision and do not mutate either callback argument. A receipt serialization or append error is logged and contained so the tool outcome and session publication continue unchanged. A startup error, including an invalid output path or damaged existing chain, fails plugin loading loudly instead of silently discarding audit records.

One cleanup effect explicitly unregisters both listeners before closing the writer; Cordis's automatic listener disposers are idempotent with that cleanup. Appends and close are synchronous (`writeSync`/`closeSync`), with no promise-backed write queue left pending at unload. A real Cordis test awaits disposal and verifies that a later emission does not change the file.

Model experience: no prompt text, tool schema, token, model request, result, or KV-cache behavior changes. The only runtime costs are canonical serialization, SHA-256, synchronous append I/O per observed record, and complete chain verification at plugin startup.

## Optional output override

The override must be absolute. A later profile patch replaces the complete row config, so keep the row name and provide the full config:

```yaml
- id: qiushi-evidence-audit
  name: qiushi-dsh-evidence-audit
  config:
    outputPath: 'D:\private-audit\evidence-receipts.jsonl'
```

The configured destination is operator-owned; its parent-directory permissions and link safety are not changed by the plugin. Prefer a private directory that other users cannot write.

## Verify and build

```powershell
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run test:built
pnpm run publint
pnpm pack --dry-run
pnpm run test:tarball
$env:DSH_UPSTREAM_CHECKOUT='D:\path\to\pinned\deepseek-harness'
pnpm run test:upstream
```

Tests cover canonical JSON acceptance/rejection and Unicode behavior, a fixed SHA-256 vector, deterministic chain creation, exact mutation/truncation boundaries, a real two-process append race, plaintext exclusion, duplicate feed observations, fail containment, safe default resolution, real Cordis mount/event/disposal, built-artifact loading, publint, an exact pack list, install/import/mount from the tarball, and commit-pinned bundle composition with the byte-identical official `applyEntryPatches` implementation.

## Integrity detection boundaries

This file is **not generically tamper-evident**. It has an unkeyed, self-contained hash chain with no external anchor. The tested boundaries are:

| Scenario | Detected? | Exact boundary |
| --- | --- | --- |
| Edit a retained line or link | Yes, at verification/startup | Unless an attacker recomputes that line and every following hash. |
| Remove an untouched prefix | Yes, at verification/startup | The first remaining sequence/link no longer starts at `0`/`null`; rewritten and re-chained files can evade this. |
| Leave a partial final line | Yes, at verification/startup | A non-empty file must end with a newline after a complete JSON record. |
| Delete the whole file | **No** | Re-creation is indistinguishable from first use without an external anchor. |
| Remove a complete suffix | **No** | The shorter retained prefix remains a valid chain. |
| Two processes append one file | Not prevented | There is no cross-process lock. The adversarial test makes two processes open the same head; later verification rejects the resulting duplicate/stale sequence. Use a separate file per process. |
| Attacker rewrites and re-chains records | **No** | SHA-256 is unkeyed and the file carries no trusted signature/checkpoint. |

## Known limitations and remaining risks

- Hashes do not prove author identity and provide neither a digital signature nor a checkpoint anchored outside the host.
- A completed `writeSync` is not an `fsync` durability guarantee. A power loss or kernel/storage failure can lose the last receipt.
- Multiple DSH processes must not write the same file concurrently. Detection occurs only on a later verification and is not recovery; use one output file per process/profile.
- Startup verification is linear in the existing file size, and synchronous append I/O adds latency to the event publisher.
- POSIX modes do not express full Windows ACL policy. Verify ACLs for sensitive deployments.
- The plugin observes live publications after it mounts. Constructor seed/replay events that DSH deliberately does not publish on `session/event` are not backfilled.
- The compatibility smoke did not perform a model-backed DSH turn: the pinned shallow checkout had no installed/built workspace dependencies or API credential. It did exercise the real Cordis runtime and the official bundle patch parser/application semantics.

## Project links

- [GitHub repository](https://github.com/030611/qiushi-dsh-evidence-audit)
- [npm package](https://www.npmjs.com/package/qiushi-dsh-evidence-audit)
- [v0.1.0 release notes](https://github.com/030611/qiushi-dsh-evidence-audit/releases/tag/v0.1.0)

## License

[MIT](LICENSE)
