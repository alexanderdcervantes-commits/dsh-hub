# dsh-spill-s3

[![npm](https://img.shields.io/npm/v/dsh-spill-s3?color=4D6BFE)](https://www.npmjs.com/package/dsh-spill-s3)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

English | [中文](README.zh.md)

An **S3-compatible backend** for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) spill storage seam (`ctx.spillStore`). Oversized tool output goes to object storage — AWS S3, MinIO, Cloudflare R2, or any S3-compatible server — instead of the disk of whichever machine happened to run the agent.

## Why

When a tool result is too large for the model's context, the harness *spills* it: the full text is persisted and the model gets a locator plus retrieval guidance. The shipped backend, `@deepseek-ai/dsh-spill-local`, writes that text to a private directory on the local host. That is the right default, and the wrong deployment for a team:

| | `dsh-spill-local` | `dsh-spill-s3` |
|---|---|---|
| Where artifacts live | a private dir on the agent's host | your bucket |
| A headless/containerized run | artifacts die with the container | artifacts outlive it |
| Another engineer wants to look | shell onto that host | already has bucket access |
| Encryption at rest / lifecycle / retention | whatever the host does | whatever your bucket policy says |

This plugin swaps the **substrate**, not the policy. It implements the one method the seam declares — `saveText` — and leaves retention (`@deepseek-ai/dsh-output-retention`) and tool-result replacement (`@deepseek-ai/dsh-spill-policy`) exactly where they already live.

## Install

```sh
dsh plugin --profile <name> add dsh-spill-s3
```

The bundle patch **disables `spill-local`** as it inserts this row: `ctx.spillStore` accepts exactly one implementation per context, and loading a second throws cordis' duplicate-service error.

`bucket` ships empty on purpose — the row fails validation until you set it. Silently defaulting a bucket name is how spilled output ends up somewhere nobody intended. Set it in your profile's `cordis.patch.yml`:

```yaml
- id: spill-s3
  config:
    endpoint: https://s3.us-east-1.amazonaws.com
    region: us-east-1
    bucket: my-agent-spill
    prefix: dsh-spill
    forcePathStyle: false      # AWS virtual-host style
    accessKeyIdRef: AWS_ACCESS_KEY_ID
    secretAccessKeyRef: AWS_SECRET_ACCESS_KEY
    sessionTokenRef: AWS_SESSION_TOKEN
    serverSideEncryption: AES256
    retrieval: cli
    presignExpiresSeconds: 3600
    timeoutMs: 30000
```

A patch replaces a row's **whole** `config`, so restate every key you want to keep.

### MinIO / R2 / self-hosted

```yaml
- id: spill-s3
  config:
    endpoint: http://127.0.0.1:9000
    region: us-east-1          # any consistent value; it only scopes the signature
    bucket: agent-spill
    forcePathStyle: true       # required on a bare IP — no wildcard DNS
    serverSideEncryption: ''   # some servers reject the header
    # …restate the rest
```

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `endpoint` | `https://s3.us-east-1.amazonaws.com` | Service endpoint origin. |
| `region` | `us-east-1` | Region in the SigV4 credential scope. S3-compatible servers accept any consistent value. |
| `bucket` | *(required)* | Destination bucket. It must already exist — this plugin never creates one. |
| `prefix` | `dsh-spill` | Key prefix. Artifacts land under `<prefix>/session-<hash>/`. |
| `forcePathStyle` | `true` | `host/bucket/key` addressing. Required by MinIO and bare-IP endpoints; set `false` for AWS virtual-host style. |
| `accessKeyIdRef` | `AWS_ACCESS_KEY_ID` | Credential **reference** — a name, not a value. |
| `secretAccessKeyRef` | `AWS_SECRET_ACCESS_KEY` | Reference for the secret key. |
| `sessionTokenRef` | `AWS_SESSION_TOKEN` | Reference for an STS session token. Ignored when unset. |
| `serverSideEncryption` | `AES256` | `x-amz-server-side-encryption` value. Empty sends no header. |
| `retrieval` | `cli` | How the model is told to read an artifact: `cli`, `presigned`, or `locator-only`. |
| `presignExpiresSeconds` | `3600` | Presigned URL lifetime (1..604800). |
| `timeoutMs` | `30000` | Upload timeout. |

### Credentials are references, not values

`accessKeyIdRef` names a credential; the value is resolved **per upload** through `ctx.credentials`, falling back to the process environment when no credential provider is mounted. Nothing secret belongs in `cordis.patch.yml`.

Because resolution is per operation (the seam's own contract), a rotated key reaches the next upload without restarting anything. Pair it with a central secret store — e.g. [`dsh-credentials-vault`](https://github.com/tancheng33/dsh-credentials-vault) — and the agent host never holds a long-lived AWS key at all.

### Choosing a `retrieval` mode

| Mode | The model is told | Cost |
|---|---|---|
| `cli` *(default)* | run `aws s3 cp s3://…` | needs the AWS CLI and credentials on the machine running commands |
| `presigned` | fetch this URL | **puts a bearer URL in the model's context and the durable session log** |
| `locator-only` | ask the user | safest; the model cannot self-serve |

`presigned` is genuinely useful — it makes a spilled artifact readable with a plain `web_fetch` — but a presigned URL is a bearer credential with a lifetime. It is opt-in for that reason.

## Key layout

```
<prefix>/session-<sha256(sessionId)[0:16]>/<18 random hex>-<safe name>
```

- **The session id is hashed.** Bucket keys are visible to every principal with `s3:ListBucket` and are copied into inventories, access logs, and analytics pipelines. Per-session grouping survives; the id does not leak.
- **The random component precedes the name.** It satisfies the seam's collision-free requirement and makes a key unguessable to someone holding only prefix-level read. Putting it first also keeps a prefix listing from clustering by tool name.
- **The suggested name is sanitized, never trusted.** `[A-Za-z0-9._-]` is kept, everything else collapses to `-`, runs of two or more dots become `-` (so `..` never appears in a derived key), and leading dots/dashes are stripped. The seam calls `suggestedName` "a hint, never a path", and this treats it as one.

## Design notes

**No AWS SDK.** The signing is ~150 lines of `node:crypto` against the published SigV4 contract. `@aws-sdk/client-s3` is tens of megabytes of transitive dependencies for a single `PUT`, and a spill backend that inflates every install is a spill backend nobody mounts. The trade — owning a signer — is bounded because SigV4 is a stable wire format, and it is checked against a real server (below) rather than only against itself.

**The signature covers the real payload digest**, not `UNSIGNED-PAYLOAD`. The body is already in memory, and a signed digest makes the stored artifact tamper-evident in transit.

**`saveText` rejects on a storage failure**, per the seam contract — it never returns a locator for an object that was not written. The spill policy treats a rejection as best-effort and keeps the inline result, so a bucket outage degrades to today's behavior instead of losing output. Failures carry a machine-readable `kind`: `network` (never reached the server), `http` (the server refused, with status), or `config`.

**Cancellation is chained.** The caller's `AbortSignal` and the configured timeout both abort the in-flight request, so a spill cannot hold a cancelled tool result open.

## Tests

50 tests, including four that run against a **real S3-compatible server**. Unit tests pin the *shape* of a signature; only a live server proves it is *correct* — a self-consistent but wrong signer would pass every unit test and fail every upload.

```sh
npm test          # unit tests only

# with a live server (verifies signing, presigned GET, and percent-encoded keys)
docker run -d --name minio -p 19000:9000 \
  -e MINIO_ROOT_USER=dshtest -e MINIO_ROOT_PASSWORD=dshtest12345 \
  cgr.dev/chainguard/minio:latest server /data
DSH_SPILL_S3_TEST_ENDPOINT=http://127.0.0.1:19000 npm test
```

## Limitations

- **`saveText` only.** The seam declares one method, and this implements exactly it. There is no retrieval, search, or delete API here — retrieval is what `retrievalHint` describes, and deletion belongs to your bucket's lifecycle policy.
- **The bucket must exist.** Creating buckets requires privileges a spill backend should not hold.
- **No multipart upload.** Spilled tool output is a single `PUT`. Objects beyond the 5 GiB single-`PUT` limit are not supported; the harness's own output caps make that unreachable in practice.
- **`isolation`-style claims.** Server-side encryption is whatever your bucket and the `serverSideEncryption` header negotiate. This plugin does not encrypt client-side, and does not claim to.

## License

MIT
