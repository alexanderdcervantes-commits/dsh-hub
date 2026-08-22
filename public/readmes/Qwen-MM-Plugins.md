# `@deepseek-ai/dsh-qwen-mm`

English | [中文](README.zh.md)

Qwen-MM capabilities as an explicit DSH profile bundle. The package fetches selected Agent Skills at an exact upstream ref, starts each MCP server through the current DSH client, waits for initial tool discovery, and mounts the skill only after its tools are ready.

## Repository shape

```text
package.json              # runtime package, dsh bundle, and browser metadata
cordis.patch.yml          # disabled opt-in row plus Stent patch stub
src/                      # host plugin, browser Stent client, and invariant
lib/                      # generated installation artifacts
legacy/                   # obsolete host patch kept only for migration history
tests/                    # unit, browser Stent, and Loader composition tests
```

The package is intentionally private and can be installed from a Git checkout or linked into a profile. It does not vendor the Qwen-MM Python implementation.

## Bundle behavior

Installing the bundle adds a disabled `qwen-mm` row. Enabling it is an explicit deployment decision because it performs Git fetches and starts external MCP processes.

```yaml
- id: qwen-mm
  disabled: false
  config:
    source: https://github.com/QwenLM/Qwen-MM-Plugins.git
    ref: <exact commit or tag>
    capabilities:
      - id: core
      - id: video-memory
```

The runtime owns the capability registry, exact source/ref, sparse-checkout cache, MCP-before-skill ordering, per-capability cleanup, and strict/best-effort failure policy. The current `@deepseek-ai/dsh-mcp-client` contract is used (`failOnStartupError: true`); the obsolete `requireInitialDiscovery` option is not used. `toolCallTimeoutMs` defaults to 60,000 ms and can be configured per bundle instance.

## New Stent integration

This package is a dual-face Stent consumer, not a replacement for DSH image infrastructure.

- `cordis.patch.yml` places the static `qwen-mm/result-text` descriptor under the row's `config.stent.patches`. The row remains disabled in ordinary profiles.
- The host half mounts `StentCompatService` from `@oh-my-dsh/stent-api` and serves the UI-tool bundle through `serveBundle(..., fallback: 'raw')` when a Web server exists.
- The browser half registers the trusted handler through `ctx.stent.register` and renders durable image references as bounded `[image: WIDTHxHEIGHT MIME]` text. Non-image blocks delegate to the original renderer.
- The browser artifact is a closure-factory `./client` export and declares `@oh-my-dsh/stent` in `dsh.client.inject`; it does not bundle a second Stent runtime or the target UI-tool package.

Use the Stent carrier and launcher for a Stent profile. The profile supplies the bootstrap and the browser `stent` row:

```sh
dsh plugin --profile web add @oh-my-dsh/stent-pack
stent-dsh --profile web --port 8000
```

A plain `dsh` launch leaves Stent-required Qwen rows disabled. Do not enable the Qwen row on a plain host that does not provide the scoped Stent peers and bootstrap.

The DSH host remains authoritative for `ImageBlock`, attachment persistence, MCP image validation and projection, model-route `inputModalities` admission, token accounting, compaction/replay, provider mapping, and ordinary Web rendering. Qwen-MM does not copy the obsolete base64 image, LLM, MCP, or compaction changes from `legacy/qwen-mm-host-integration.patch`.

## Capabilities

The plugin recognizes:

```text
core
video-memory
video-edit
blender
freecad
edu-agent
```

Each capability can override its command, arguments, environment, and working directory. `strict: true` turns a per-capability warning into a load failure; the default skips only the failed capability after cleaning up any partial stage.

## Development

The package resolves all host APIs from registry packages; it has no sibling-checkout TypeScript references.

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
pnpm pack --dry-run --json
```

The `prepare` script uses the source-only host and browser builds for a Git install. It requires a pinned, trusted checkout and a profile that permits the package's build script.

## Model Experience

### Capability tools and skills

The selected Agent Skills and MCP tools become model-visible through DSH's authoritative skill and tool registries. Tool discovery completes before the paired skill is registered, so a failed server cannot expose a tool-less skill. The package adds no fixed prompt text.

### Image content

Image-producing Qwen capabilities use the DSH image vocabulary and durable attachment references. The native host validates MIME, bytes, dimensions, and model-route modality support; Qwen-MM only supplies the capability and the browser's bounded display fallback.

### Token and KV-cache effects

Attachment references keep image bytes out of ordinary model-visible text and replay payloads. Native DSH compaction projects image references to bounded text markers before summarization. The Qwen browser patch does not change provider requests or token accounting.

## Known Limitations and Deferred Work

- External capability fetches require `git`; default MCP launches require `uvx` and the capability's Python environment.
- The Stent browser summary requires a current `@deepseek-ai/dsh-client-ui-tool` bundle whose `lib/client.js` still contains `resultText`; `fallback: 'raw'` keeps the Web app usable when the transform cannot match.
- The profile must install the Stent carrier separately and must use the Stent bootstrap when enabling this Stent-required row.
- Capabilities that produce images still require a resolved model route that declares image-input support.
- `legacy/qwen-mm-host-integration.patch` is not a supported installation path and is not applied by the bundle.
