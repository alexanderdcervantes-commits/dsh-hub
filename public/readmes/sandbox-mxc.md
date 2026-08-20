# `@deepseek-ai/dsh-sandbox-mxc`

English | [中文](README.zh.md)

The MXC sandbox provider extracted from the DSH `feat-mxc` implementation as one standalone external bundle. The repository keeps two delivery faces in one Git repository:

- `main` contains the registry-backed provider from DSH `feat-mxc`.
- `feat-mxc-vendor-sdk` carries the same provider with the pinned SDK and native executors in `vendor-sdk/` for offline packed-install rehearsal.

## Repository shape

```text
package.json              # standalone provider package and dsh.bundle manifest
cordis.patch.yml          # explicit sandbox-mxc profile row
src/                      # provider, invariant, and Windows environment helpers
tests/                    # unit, parity, and publish-path tests
lib/                      # generated install artifacts
vendor-sdk/               # vendor branch only: SDK runtime and native executors
docs/                     # detailed provider documentation
legacy/                   # DSH host integration patch for older snapshots
```

The package exports `@deepseek-ai/dsh-sandbox-mxc` and its invariant companion. Its runtime peers are the DSH sandbox seam, subprocess environment helper, invariants package, and Cordis. The patched `@dsh-external/mxc-sdk` remains a runtime dependency: `main` resolves the `dsh` release tag from GitHub Packages, while the vendor branch replaces it with `file:./vendor-sdk`.

## Bundle behavior

The bundle contributes an explicit, disabled opt-in row:

```yaml
- id: sandbox-mxc
  name: '@deepseek-ai/dsh-sandbox-mxc'
  disabled: true
  config:
    enabled: true
    useResultEnvelope: true
```

Enable the row in a profile only after the target DSH host supplies the prepare/settlement sandbox seam and the patched MXC SDK is available. The bundle does not silently replace an existing `sandbox` row; `legacy/mxc-host-integration.patch` contains the host cutover for DSH snapshots that need it.

The provider remains fail-closed. `prepare()` refuses to run unless `enabled: true`, and functional qualification must prove the exact bundled executor before a launch is returned. The provider compiles complete file-effect policy, preserves the exact payload argv/cwd/environment, settles versioned result envelopes, and releases per-run capture artifacts.

## Development

A full source-plane check uses a sibling DSH checkout. For the latest extracted implementation, point `external-plugins/deepseek-harness` at the compatible `feat-mxc` checkout, install the SDK or use the vendor branch, then run:

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run prepare
pnpm pack --dry-run
```

The `prepare` script builds directly from `src/`, so a Git installation does not require DSH project references at runtime. `pnpm test:e2e` runs the packed-install and real-executor rehearsals when the platform, SDK, and native executor are available.

## Model Experience

This provider adds no model-visible prompt, tool, or result text. It supplies the sandbox capability consumed by DSH bash and PTY plugins; the sandbox seam owns the `SANDBOX_UNAVAILABLE` error and any user-facing denial semantics.

## Known Limitations and Deferred Work

- Linux MXC qualification requires usable Bubblewrap/user namespaces.
- macOS and Windows acceptance remains platform-dependent; Windows Tier 3 requires explicit host DACL permission.
- The registry-backed `main` branch requires GitHub Packages access to resolve `@dsh-external/mxc-sdk@dsh`; use `feat-mxc-vendor-sdk` for the tracked offline carrier.
- Older DSH snapshots require `legacy/mxc-host-integration.patch` because a bundle cannot add missing sandbox prepare/settlement APIs by itself.
