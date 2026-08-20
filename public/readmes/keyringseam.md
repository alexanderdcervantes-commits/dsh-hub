# KeyringSeam

[![Self-test](https://github.com/fieldnote-ops/keyringseam/actions/workflows/self-test.yml/badge.svg?branch=main)](https://github.com/fieldnote-ops/keyringseam/actions/workflows/self-test.yml)

KeyringSeam is an independently maintained macOS credential provider for the DeepSeek Harness `ctx.credentials` seam. The `0.2.0-rc.1` candidate replaces the legacy file-Keychain helper with a Developer ID-signed, notarized Broker app that stores managed values in a private Data Protection Keychain access group and asks for explicit device-owner authentication before `get`, `set`, or `unset`.

> **Release status:** `v0.2.0-rc.1` is a public release candidate. Local Agent-isolation acceptance, DSH consumer boot, Apple notarization, stapling, Gatekeeper, quarantined native/Intel launches, and public archive hash verification have passed. The 3-machine/24-hour external acceptance round is intentionally deferred; independent security review and independent-user adoption are not claimed. The published v0.1.3 tag remains the legacy storage-only release and must not be described as Agent isolation.

[简体中文](README.zh-CN.md)

KeyringSeam is an independent, AI-assisted open-source project by **FIELD NOTE**. It is not affiliated with, sponsored by, or endorsed by DeepSeek or Apple. DeepSeek Harness is named only to describe compatibility; macOS and Keychain are Apple trademarks.

## Proof at a glance

| Surface | Verified behavior |
| --- | --- |
| Broker boundary | Persistent stdin/stdout framing, empty child environment, no secret-bearing argv, bounded requests/responses, serialized operations, and lifecycle disposal. |
| Keychain policy | Private exact access group `TU8DF2JWHF.org.fieldnote.keyringseam.broker`, Data Protection Keychain, device-only item protection, and explicit device-owner authentication for every secret-bearing operation. |
| Same-user attacks | Independent Security.framework reader returns `errSecMissingEntitlement (-34018)`; `/usr/bin/security` cannot find the item; a copied raw Broker is rejected; canceled direct invocation returns `-128` with no value. |
| Binary provenance | Universal `arm64` + `x86_64` Developer ID Application signature, Hardened Runtime, secure timestamp, embedded profile, accepted Apple notarization `8941cae5-75a5-4f1c-bdfb-998d1ce578c3`, staple, Gatekeeper, and quarantine launch checks. |
| Harness integration | Isolated DSH `0.1.0-rc.6` `plugin add`, composed profile replacement, Web boot HTTP 200, and a DSH bash-tool attempt that failed closed without returning a value. |

Independent security review and independent-user adoption are not claimed.

## Install the public release candidate

`dsh` is not a system-global command. Install the pinned preview CLI and `pnpm` in the environment where you will run Harness:

```sh
npm install --global pnpm @deepseek-ai/dsh@0.1.0-rc.6
dsh --version
pnpm --version
```

Install the pinned public release candidate. Use a disposable credential for the first run and review the generated profile diff before using a production credential:

```sh
dsh plugin --profile web add github:fieldnote-ops/keyringseam#v0.2.0-rc.1
```

The previous `v0.1.3` command remains available for rollback and is explicitly legacy storage-only:

```sh
dsh plugin --profile web add github:fieldnote-ops/keyringseam#v0.1.3
```

## Security design

- The provider launches one fixed, signed Broker app per provider lifetime over anonymous pipes. It passes no host environment and no command-line arguments to the Broker.
- Every `get`, `set`, and `unset` performs an explicit device-owner authentication. Cancellation, timeout, missing entitlements, invalid signatures, locked Keychain, malformed frames, and native failure return errors; there is no plaintext or legacy-helper fallback.
- The Broker targets macOS 13 or newer and contains Apple Silicon and Intel slices. Consumer machines do not need Swift, Xcode, or Apple command-line developer tools at runtime.
- Environment values remain read-only and highest priority. Project and user `.env` fallbacks remain below the managed Keychain source.
- A user who approves an unexpected authentication prompt, a compromised macOS account, debugger access to the trusted Harness host, and the trusted host itself remain outside the boundary.

## Maintainer verification

```sh
npm ci
npm run check
node scripts/broker-architecture-smoke.mjs native
node scripts/broker-architecture-smoke.mjs x86_64
```

Building a new Broker requires the exact Developer ID identity and the approved provisioning profile:

```sh
KEYRINGSEAM_SIGN_IDENTITY='Developer ID Application: Legal Name (TEAMID)' \
KEYRINGSEAM_PROVISIONING_PROFILE='/absolute/path/to/profile.provisionprofile' \
npm run build:broker
```

The signed app is notarized with the locally stored `keyringseam-notary` profile through `scripts/notarize-broker.sh`. Never bypass secure timestamps or staple validation.

See [Agent isolation design](docs/AGENT_ISOLATION.md) and [SECURITY.md](SECURITY.md) for the threat model, acceptance boundary, migration policy, and evidence limits.
