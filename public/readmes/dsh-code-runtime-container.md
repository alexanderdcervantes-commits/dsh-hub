# dsh-code-runtime-container

[![npm](https://img.shields.io/npm/v/dsh-code-runtime-container?color=4D6BFE)](https://www.npmjs.com/package/dsh-code-runtime-container)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

English | [中文](README.zh.md)

A **container-isolated backend** for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) code-execution seam (`ctx.codeRuntime`). Code Mode programs run in a fresh container with no network, a read-only root filesystem, every capability dropped, and kernel-enforced memory, CPU, and pid ceilings.

## Why

The seam declares three well-known isolation substrates and ships one. From `@deepseek-ai/dsh-code-runtime`'s own README:

> **Only the worker-thread backend ships** — `'process'`/`'container'` are declared well-known `isolation` values with no implementation; **a hard security boundary awaits a container backend.**

And the shipped backend is equally explicit about its posture:

> **Containment, not a security boundary**: trust posture is bash-equivalent by design.

That is a reasonable default — Code Mode programs are model-written code, and so is everything `bash` runs. But it means a `run_code` program executes **inside the agent's own process**, with the agent's network access, the agent's filesystem, and whatever the agent's environment holds. This backend is for deployments where that is not acceptable.

|  | worker-thread (shipped) | this backend |
|---|---|---|
| Substrate | a `Worker` in the agent process | a fresh container per run |
| Network | full agent network access | `--network=none` |
| Filesystem | the whole host, as the agent user | read-only rootfs, no host mount |
| Privileges | the agent's | `--cap-drop=ALL`, `no-new-privileges`, `nobody` |
| Runaway CPU | measured busy-time budget | kernel CPU quota + wall clock |
| Runaway memory | V8 heap cap | cgroup memory limit → OOM kill |
| Fork bomb | — | `--pids-limit` |
| Cold start | ~milliseconds | ~200 ms |

## Install

```sh
dsh plugin --profile <name> add dsh-code-runtime-container
```

Requires a container engine on the host and the image available locally:

```sh
docker pull node:22-alpine
```

The bundle patch **disables the worker-thread `code-runtime` row** as it inserts this one: `ctx.codeRuntime` accepts exactly one implementation per context.

No image build and no bind mount are needed — the in-container runner is passed to `node -e` on the command line, so the stock upstream image works as-is. `podman` and `nerdctl` work through `dockerPath`.

## Configuration

Every default is the restrictive one; a backend whose point is isolation must not be safe only after configuration.

| Key | Default | Meaning |
|---|---|---|
| `dockerPath` | `docker` | Container CLI. Anything argv-compatible with `docker run`. |
| `image` | `node:22-alpine` | Needs a `node` on `PATH` and nothing else. |
| `network` | `none` | Docker network mode. **The main reason to use this backend.** |
| `memory` | `512m` | Memory ceiling; an overrun is an OOM kill reported as `worker-exit`. |
| `cpus` | `1` | Kernel-enforced CPU quota. |
| `pidsLimit` | `128` | Process ceiling: a fork bomb hits it, not the host. |
| `user` | `65534:65534` | `nobody:nogroup`. Empty uses the image default. |
| `readOnlyRootfs` | `true` | Read-only root, with a tmpfs at `/tmp`. |
| `tmpfsMb` | `64` | Size of that tmpfs. |
| `workspacePath` | `''` | Absolute host path to mount at `/workspace`. Empty mounts nothing. |
| `workspaceReadOnly` | `true` | Mount the workspace read-only. |
| `extraArgs` | `[]` | Extra `docker run` flags. **An escape hatch that can weaken every default above.** |
| `maxWallMs` | `120000` | Wall-clock ceiling for one run, including container start. |
| `maxOutputBytes` | `4194304` | Combined cap on logs plus completion value. |

Programs that must read project files need a mount:

```yaml
- id: code-runtime-container
  config:
    workspacePath: /Users/me/projects/app
    workspaceReadOnly: true
    # …restate the rest; a patch replaces a row's whole config
```

## Threat model

The seam is explicit that `isolation` is **"a label for deployments and diagnostics, not a security claim"**. So here is the actual claim, stated narrowly.

**What a program cannot do, verified by tests against a real container:**

- Reach the network (`fetch` fails; `--network=none`).
- Write to the root filesystem (`EROFS`).
- See any host path — `/workspace` does not exist unless you mount it.
- Run as root (`uid` is `65534`).
- Observe or affect another run: each run is a fresh container, and a global set in one run is gone in the next.
- Outlive its budget: a `while(true){}` is killed, and the container is killed by name — not merely the `docker run` client.
- Forge a result. Every control frame carries a per-run nonce delivered over stdin and held only in the runner's module scope — never on a global, never in `argv` or `env`, both of which the program can read. A program writing `{"t":"done","value":"FORGED"}` to stdout has that line accounted as **output**, not control.
- Corrupt the transport by patching intrinsics: `JSON.stringify` and `process.stdout.write` are captured before the program runs.

**What this does NOT protect against:**

- **A kernel or container-runtime escape.** This is a container, not a VM. A local privilege-escalation bug in the kernel, the runtime, or the engine defeats it. If your threat model includes that, use a VM-backed engine (`dockerPath` pointing at a Kata/Firecracker-compatible CLI) or an isolated host.
- **Whatever you mount.** A read-write `workspacePath` is a real write path into your project. That is the point of the option, and it is the one setting that meaningfully widens the boundary.
- **Whatever `extraArgs` opens.** It is passed to `docker run` verbatim; `--network=host` there undoes the headline property.
- **The bindings themselves.** A program can call every host function the consumer exposed, as many times as its budget allows. Isolating the *program* does not narrow the *tools* — that is the tool-registry's gate, not this seam's. See [`dsh-egress-guard`](https://github.com/tancheng33/dsh-egress-guard) for the tool-call side.
- **Docker socket access from the agent.** This plugin runs a docker client as the agent user. A user who can reach the Docker socket can generally reach root on the host; that is a property of your Docker setup, not of this plugin.

## Semantics

The seam contract is honored as written:

- **Errors are result fields, not rejections.** Every program outcome — exception, non-erasable TypeScript, timeout, abort, OOM, lossy completion, output overflow — resolves as `{ logs, error: { kind, message } }`. `run()` rejects **only** for contract misuse: a disposed runtime, or a binding namespace that violates the portable-identifier rules.
- **Portable identifiers are enforced from the seam's own exported sets** (`PORTABLE_RESERVED_WORDS`, `RESERVED_BINDING_GLOBALS`, `RESERVED_ERROR_MEMBERS`, `DUNDER_MEMBER`), not restated here — so `lambda` is refused on this TypeScript backend exactly as it would be on a Python one, and a widening of the union reaches this backend with a dependency bump.
- **Binding members are own properties of a null-prototype object**, so a function named `__proto__` or `constructor` is an ordinary member.
- **A declared `errorClass` is materialized in the program**, so `e instanceof ToolCallError` works and the failed member name lands on the declared property.
- **Top-level `await` and `return` work.** The program is wrapped, stripped, and sliced back out by byte offset (`mode: 'strip'` preserves positions), so a bare `return` is not a syntax error.
- **Erasable syntax only**, matching the shipped backend: `enum` and namespaces are a program failure, not a silent transform.
- **Dispose to quiescence.** Teardown marks the runtime unusable, kills every in-flight container, and awaits each exit.

### How this differs from the worker backend

- **`computeMs` has no equivalent.** The worker backend meters measured event-loop busy time to stop a hot loop hiding behind a pending dispatch. Across a container boundary that measurement is not available, so CPU is bounded by the kernel (`--cpus`) and elapsed time by `maxWallMs`. This is a genuine behavioral difference: a program that sleeps for a long time consumes wall budget here, where the worker backend would only charge it busy time.
- **Cold start is ~200 ms per run**, against roughly a millisecond for a worker. Set against an LLM round trip this is small, but it is not free.
- **`isolation` reports `'container'`**, which the seam treats as informational.

## Tests

63 tests, 26 of which run against a **real container engine** — including every isolation claim above, both budget kinds, cancellation, substrate death, and the two hostile-program cases (a forged protocol frame and a replaced `JSON.stringify`).

```sh
npm test                                  # unit tests only

docker pull node:22-alpine
DSH_CONTAINER_TEST=1 npm test             # + live container suite
```

## Limitations

- **TypeScript only.** `language` is `'typescript'`. The seam declares `'python'` as the other well-known value and `dsh-tools` already ships a Python SDK renderer, but no Python backend exists yet — including this one.
- **One container per run, no pooling.** That is what makes cross-run state unrepresentable; it is also where the ~200 ms goes.
- **No streaming logs.** The seam's `run()` is one-shot: logs arrive on the resolved result. A killed program still shows what it printed before it died.
- **Image pulls are not managed.** A missing image surfaces as a `worker-exit` failure naming the engine's output; pull it ahead of time.
- **No multiplexed stdio.** The protocol shares the container's stdout with program output, disambiguated by the nonce. Program bytes are never lost — they become logs — but a program emitting gigabytes of output hits `maxOutputBytes` rather than a stream backpressure path.

## License

MIT
