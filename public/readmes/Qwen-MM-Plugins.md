# `@deepseek-ai/dsh-qwen-mm`

English | [中文](README.zh.md)

Qwen-MM capabilities as an installable DSH profile bundle. The package keeps the Qwen-MM implementation small and explicit: it fetches each selected Agent Skill at a configured upstream ref, starts its MCP server through the existing DSH client in required-initial-discovery mode, and mounts the skill only after tool discovery succeeds.

## Repository shape

```text
package.json              # runtime package and dsh.bundle manifest
cordis.patch.yml          # opt-in profile layer
src/                      # Cordis plugin and invariant companion
lib/                      # generated install artifact
legacy/                   # source-compatible host integration patch for older DSH snapshots
tests/                    # plugin and composition tests
```

The package is intentionally private and can be installed from a Git checkout or linked into a profile. It does not vendor the Qwen-MM Python implementation.

## Bundle behavior

Installing the bundle adds a disabled `qwen-mm` row. This is deliberate: enabling it starts remote Git fetches and external MCP processes, so the deployment must provide the exact Qwen-MM ref, capability list, and any capability environment explicitly in its profile layer.

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

The bundle patch only composes the plugin row. Image content blocks, MCP image results, model modality checks, token accounting, compaction, replay, and Web summaries must be provided by the DSH version used by the profile; the old host patch is retained under `legacy/` only as a migration artifact for snapshots that do not yet provide those seams.

## Capabilities

The plugin currently recognizes:

```text
core
video-memory
video-edit
blender
freecad
edu-agent
```

Each capability can override its command, arguments, environment, and working directory. `strict: true` turns a per-capability warning into a load failure; the default skips only the failed capability.

## Development

A full typecheck expects sibling checkouts:

```text
~/git/deepseek-harness
~/git/Qwen-MM-Plugins
```

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
```

The `prepare` script uses a source-only tsdown configuration so a Git install can build `lib/` without a DSH sibling checkout or project references. pnpm 10 may require the profile to allow the package's `prepare` script; only approve a pinned, trusted checkout.

## Model Experience

The plugin contributes no fixed prompt text. Its selected Agent Skills and MCP tools become model-visible through the authoritative DSH skill and tool services, which own logging, lifecycle, cancellation, and result rendering.

## Known Limitations and Deferred Work

- External capability fetches require `git`; default MCP launches require `uvx` and the capability's Python environment.
- Capabilities that produce images require a resolved model route that declares image-input support.
- The bundle does not silently forward credential-shaped environment variables; capability credentials must be configured explicitly.
- The real Loader composition checks require a DSH `mcp-client` build whose async plugin load performs required initial discovery; older synchronous host snapshots skip those checks because they can mount the skill before tools are ready.
