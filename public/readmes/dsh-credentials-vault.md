# dsh-credentials-vault

[![npm](https://img.shields.io/npm/v/dsh-credentials-vault?color=4D6BFE)](https://www.npmjs.com/package/dsh-credentials-vault)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

English | [中文](README.zh.md)

A **HashiCorp Vault** backend for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) credential seam (`ctx.credentials`). Provider keys live in Vault; the agent host holds at most a short-lived AppRole-issued token.

## Why

The shipped provider, `@deepseek-ai/dsh-credentials-local`, stores keys in a `0600` YAML document under the harness home. Its own README says where that stops:

> The document is `0600` under a `0700` directory, which stops other OS users — **not** the model. […] That is discretion, not a boundary. A deployment that must keep provider keys away from its own agent cannot get there with file permissions […] and belongs beside this provider as a sibling package.

This is the **central** answer to that, as distinct from a per-machine OS keychain:

| | `credentials-local` | OS keychain | `dsh-credentials-vault` |
|---|---|---|---|
| Where the key lives | file on the agent host | that machine's keychain | Vault |
| Headless / container / CI agent | file must be shipped in | no keychain to speak of | works — AppRole login |
| Rotating a key across 20 agents | edit 20 files | 20 machines | one Vault write |
| Who read the key, when | not recorded | not recorded | Vault audit device |
| Bootstrap secret on the host | the key itself | none | a role id + secret id, not the key |

## Install

```sh
dsh plugin --profile <name> add dsh-credentials-vault
```

The bundle patch **disables `credentials-local`** as it inserts this row: `ctx.credentials` accepts exactly one implementation per context.

Then point it at your Vault in your profile's `cordis.patch.yml`:

```yaml
- id: credentials-vault
  config:
    address: https://vault.internal:8200
    namespace: ''            # Vault Enterprise namespace
    mount: secret
    path: dsh
    kvVersion: 2
    tokenRef: VAULT_TOKEN
    approleMount: approle
    roleIdRef: VAULT_ROLE_ID
    secretIdRef: VAULT_SECRET_ID
    readOnly: false
    environmentWins: true
    cacheTtlMs: 0
    timeoutMs: 10000
```

A patch replaces a row's **whole** `config`, so restate every key you want to keep.

Secrets are one flat map at `<mount>/<path>`, keyed by credential reference — the same shape `credentials-local` uses in YAML:

```sh
vault kv put secret/dsh DEEPSEEK_API_KEY=sk-… OPENAI_API_KEY=sk-…
```

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `address` | `http://127.0.0.1:8200` | Vault base address. |
| `namespace` | `''` | Vault Enterprise namespace. Empty sends no header. |
| `mount` | `secret` | KV secrets-engine mount point. |
| `path` | `dsh` | Path under the mount holding the credential map. |
| `kvVersion` | `2` | KV engine version. v2 gives compare-and-swap and versioning. |
| `tokenRef` | `VAULT_TOKEN` | Env var holding a Vault token. Used when AppRole is not configured. |
| `approleMount` | `approle` | AppRole auth mount path. |
| `roleIdRef` | `VAULT_ROLE_ID` | Env var holding an AppRole role id. |
| `secretIdRef` | `VAULT_SECRET_ID` | Env var holding an AppRole secret id. |
| `readOnly` | `false` | Refuse `set`/`unset` entirely. |
| `environmentWins` | `true` | Let an inherited env var shadow Vault, as the local provider does. |
| `cacheTtlMs` | `0` | Cache the secret map for this many ms. `0` reads per operation. |
| `timeoutMs` | `10000` | Vault request timeout. |

**Nothing secret goes in this file.** `tokenRef`, `roleIdRef`, and `secretIdRef` name *environment variables* carrying the bootstrap credential. The point of the plugin is that long-lived provider keys are not in configuration, and that has to hold for its own bootstrap too.

## Authentication

Setting **both** `VAULT_ROLE_ID` and `VAULT_SECRET_ID` selects AppRole; otherwise a static `VAULT_TOKEN` is used.

AppRole is the machine path and the one worth using: the agent host never holds a provider key, only a role id and a secret id that mint a leased token. The lease is reused until a minute before it expires — a token that expired mid-request would surface as a spurious auth failure on an unrelated call.

## Precedence

| Layer | Source id | Writable | Wins |
|---|---|---|---|
| Inherited process environment | `env` | **no** | by default |
| Vault KV map | `vault` | yes | otherwise |

This mirrors `credentials-local`'s honesty rule. A per-run override — `DEEPSEEK_API_KEY=… dsh`, a CI secret, a container `-e` — is operator intent for *this run*, and it cannot be edited from inside the harness. So it wins **and** is visibly read-only: `describe()` reports `writable: false`, and `set`/`unset` reject rather than committing a change no reader would ever observe.

Set `environmentWins: false` to make Vault authoritative; the environment then serves only as a fallback for references Vault does not hold.

## Rotation without restart

The seam resolves per operation, and by default so does this provider: `cacheTtlMs: 0` means every LLM request reads the current value. Rotate a key in Vault and the next request uses it — no restart, no reload, no cache to bust.

`cacheTtlMs` above zero trades that immediacy for round trips: a rotation then reaches the agent within the TTL instead of instantly. It exists for deployments where Vault is far away; leave it at `0` unless you have measured a reason.

## Concurrency

Writes are read-modify-write on one shared map, under KV v2 **compare-and-swap**. Two agents storing different references at the same path would otherwise last-write-wins one of them away. On a CAS mismatch the provider re-reads and retries once; a second mismatch surfaces as a genuinely contended path rather than being retried forever.

## Tests

56 tests, eight of which run against a **real Vault**. The unit suite runs against a fake implementing Vault's contract *as this plugin understands it* — which is precisely the thing that can be wrong, so the live suite checks the understanding: KV v2's double nesting, real CAS rejection, real 403 text, and a real AppRole login.

```sh
npm test          # unit tests only

docker run -d --name vault -p 18200:8200 \
  -e VAULT_DEV_ROOT_TOKEN_ID=dsh-test-root --cap-add=IPC_LOCK hashicorp/vault:latest
DSH_VAULT_TEST_ADDR=http://127.0.0.1:18200 npm test
```

## What this does and does not protect

**Does:** removes the long-lived provider key from the agent host. Centralizes rotation. Puts every credential read in Vault's audit device. Makes a stolen host disk worth a leased token with a lifetime, not a permanent API key.

**Does not:** stop the *running agent process* from using the credentials it is authorized to use. A tool that can make network requests can still spend whatever the resolved key authorizes while the process is live — that is what the key is *for*. Narrowing what a live agent may reach is a different seam; see [`dsh-egress-guard`](https://github.com/tancheng33/dsh-egress-guard) for the network side.

Nor does it hide values from a `bash` tool call that reads the process environment, when `environmentWins` is supplying them from there. Vault-sourced values are never written to the environment by this plugin.

## Limitations

- **KV secrets engine only.** No database, PKI, transit, or dynamic-secret engines; the seam's four operations map onto a static key/value store.
- **One path, one flat map.** Credential references are POSIX identifiers, and this stores them as keys at a single path — the same shape the local provider uses.
- **No lease renewal for the AppRole token**, only re-login. Vault's `auth/token/renew-self` would extend a lease in place; re-login is simpler and, for a token used every few seconds, indistinguishable.
- **No `credentials/updated` for external Vault edits.** The local provider watches its file; this provider has no subscription to Vault. With `cacheTtlMs: 0` an external rotation still reaches the next operation — it just does not announce itself.

## License

MIT
