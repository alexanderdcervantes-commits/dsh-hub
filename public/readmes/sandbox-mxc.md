# `@deepseek-ai/dsh-sandbox-mxc`

English | [中文](README.zh.md)

A Stent sidecar that runs the DSH bash, PowerShell, and persistent-terminal payloads through MXC without modifying DeepSeek Harness source files. The package is an explicit opt-in bundle: DSH keeps ownership of `ctx.sandbox`, subprocess I/O, deadlines, signals, terminal sessions, and teardown; Stent supplies the controlled load-time hooks that replace only the consumer call paths.

## Package surface

```text
package.json              # publishable bundle and public dependencies
cordis.patch.yml          # row plus config.stent.patches descriptors
src/stent-entry.ts        # named Stent function plugin: name/inject/Config/apply
src/stent-handlers.ts     # descriptors and lifecycle-safe handlers
src/index.ts              # MXC policy compiler and compatibility provider
src/invariant.ts          # package invariant companion
tests/                    # policy, provider, hook, and publish-path tests
legacy/                   # historical host patch, never applied by this bundle
```

The package root is the Stent function plugin and deliberately has no default export. The compatibility provider and policy compiler are also available from `@deepseek-ai/dsh-sandbox-mxc/provider`; new profiles should load the package root through the bundle row.

The MXC runtime is the public `@omdsh-dev/mxc-sdk` `0.7.0` GitHub Release asset:

```text
https://github.com/omdsh-dev/sandbox-mxc/releases/download/v0.7.0/omdsh-dev-mxc-sdk-0.7.0.tgz
sha256: ffd9a83b9f6a509ee99a59e60ab6bd68889c106d5d8f14d1fa402efd157e8c72
```

The package keeps the immutable v0.7.0 release URL in `dependencies` and lists `@omdsh-dev/mxc-sdk` in `bundleDependencies`. `npm pack` therefore places the SDK, its native executors, and its denial-capture assets under `node_modules/@omdsh-dev/mxc-sdk` inside the published tarball; consumers do not need to resolve the GitHub URL again.

## Stent bundle behavior

The row is disabled in ordinary profiles. `stent-dsh` reads the descriptors under `config.stent.patches`, installs transformations before target modules load, and enables the row only for the Stent composition:

```yaml
- id: sandbox-mxc
  name: '@deepseek-ai/dsh-sandbox-mxc'
  disabled: true
  config:
    enabled: true
    useResultEnvelope: true
    stent:
      patches:
        # The complete descriptor list is shipped in cordis.patch.yml.
```

Handlers cover the existing public seams:

- foreground and background `@deepseek-ai/dsh-bash-sandbox` calls;
- foreground and background `@deepseek-ai/dsh-pwsh-sandbox` calls;
- process settlement hooks in the local bash and PowerShell executors;
- `terminal-bash` backend creation immediately before the local terminal primitive spawns;
- `dsh-subprocess-local.spawnTerminal` argument replacement;
- `@deepseek-ai/dsh-sandbox-local.confine` terminal-only bypass, preventing the original terminal path from wrapping the MXC launch a second time.

Each confined call prepares one MXC controller with exact argv, cwd, and the scrubbed-plus-explicit environment. The controller settles from the versioned result envelope and is disposed exactly once. The host subprocess or terminal service still owns the process tree, timeout, signal, stdio, and quiescence operations. `danger-full-access` delegates to the original host call and never invokes MXC. Any MXC qualification or runner failure raises `SANDBOX_UNAVAILABLE`; it never falls back to an unconfined payload.

The workspace uses pnpm's `nodeLinker: hoisted` because pnpm cannot materialize `bundleDependencies` from an isolated linker. Keep this setting for development installs. Use `npm pack`/`npm publish` for the final bundled artifact; the current pnpm packer normalizes nested bundled executable modes.

## Development

```sh
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run prepare
npm pack --dry-run
pnpm run test:e2e
```

The real-executor suites self-skip when the platform-specific binary is unavailable. The release asset contains the native executor and denial-capture files; no GitHub Packages credentials or `.npmrc` scope override is required.

## Model Experience

This package adds no model-visible prompt, tool, or result text. Existing DSH bash and terminal consumers retain their rendering and error semantics; the sandbox seam owns the `SANDBOX_UNAVAILABLE` diagnostic.

#### KV Cache effect

No direct invalidation. The existing consumer owns any request-prefix changes.

## Known Limitations and Deferred Work

- MXC qualification requires a usable Bubblewrap/user-namespace host on Linux; macOS and Windows acceptance remains platform-dependent, and Windows Tier 3 requires explicit host DACL permission.
- The SDK release is Public Preview. Its policy schema and native backends may change in a later SDK minor version; upgrading requires a deliberate dependency and policy-version review.
- The Stent descriptors are optional because DSH profiles choose bash or PowerShell by platform. A profile that enables the bundle without loading a matching consumer does not receive a hook; the host must still compose a supported sandbox consumer.
- `legacy/mxc-host-integration.patch` is historical evidence only. It is not read, applied, or required by the Stent bundle.
