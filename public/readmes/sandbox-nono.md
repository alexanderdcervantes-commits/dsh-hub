# `@deepseek-ai/dsh-sandbox-nono`

English | [中文](README.zh.md)

The nono (Landlock/Seatbelt) backend as an installable DSH profile bundle. This standalone package contains the sandbox provider, its invariant companion, the bundle patch, and the vendored `@dsh-external/nono-ts` native executor carrier.

## Repository shape

```text
package.json              # standalone package and dsh.bundle manifest
cordis.patch.yml          # explicit sandbox-nono provider row
docs/                     # detailed bilingual Nono documentation
src/                      # provider and invariant companion
tests/                    # unit and real-wrapper integration tests
vendor-nono-ts/           # pinned native binding and executor wrapper
lib/                      # generated install artifacts
```

The bundle adds a distinct `sandbox-nono` row disabled by default. Enable it from a profile overlay when the deployment wants the Nono backend; the existing DSH `sandbox` row is not silently renamed or replaced.

```yaml
- id: sandbox-nono
  name: '@deepseek-ai/dsh-sandbox-nono'
  disabled: false
  config:
    probeTimeoutMs: 5000
```

The provider fails closed with `SANDBOX_UNAVAILABLE` when the host has no vendored binding, the platform has no backend, or the functional channel probe does not prove enforcement. The SDK owns binding resolution, launch argv composition, wrapper failure classification, and channel qualification.

Detailed behavior and limitations: [`docs/nono.md`](docs/nono.md).

## Development

A full typecheck expects the DSH checkout beside this repository:

```text
../../deepseek-harness
```

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
pnpm run test:e2e
```

The `prepare` script builds directly from `src/`, so a package installation does not depend on the sibling checkout at runtime. The vendored carrier currently contains only the Linux x64 GNU binding; unsupported hosts intentionally fail closed.

## Model Experience

Indirectly, through `@deepseek-ai/dsh-bash-sandbox` and `@deepseek-ai/dsh-tool-bash`, which render enforcement and denial facts. The `@deepseek-ai/dsh-sandbox` seam owns the `SANDBOX_UNAVAILABLE` text.

## Known Limitations and Deferred Work

- Only the `linux-x64-gnu` native binding is committed; other platforms need a matching carrier under `vendor-nono-ts/native/`.
- Windows has no Nono backend and fails closed.
- The functional probe verdict is cached for the provider lifetime; repairing a binding requires reloading the plugin.
