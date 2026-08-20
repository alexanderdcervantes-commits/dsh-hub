# `@deepseek-ai/dsh-client-web-component`

English | [中文](README.zh.md)

The DSH Web Component adapter as an installable profile bundle. It exposes a browser-side `webComponent` service that mounts registered slot trees as native Custom Elements, while keeping slot ownership, typed descriptors, property/event bindings, DOM outlets, and incarnation lifetimes behind the adapter boundary.

## Repository shape

```text
package.json              # plugin package and dsh.bundle/dshClient manifests
cordis.patch.yml          # browser opt-in profile layer
src/index.ts              # host loader entry
src/client/               # browser implementation
src/invariant.ts          # package invariant companion
lib/                      # generated host/client artifacts
legacy/                   # source-compatible host integration patch for older DSH snapshots
docs/                     # detailed protocol reference
tests/                    # unit, composition, and terminal-free browser tests
```

## Bundle behavior

Installing the bundle adds a disabled `web-component` row. A Web profile enables it explicitly after the slot host and browser runtime are present:

```yaml
- id: web-component
  disabled: false
  name: '@deepseek-ai/dsh-client-web-component'
```

The bundle layer only composes the plugin row. Slot host APIs, descriptor types, browser runtime, and the React renderer seam must come from the DSH version selected by the profile. The previous host-source integration patch is retained under `legacy/` for migration of older DSH snapshots and is not part of the bundle package contract.

The client module never exposes a live React tree or raw DOM context to feature plugins. It accepts plain descriptors, resolves declared values from the incarnation context, assigns JavaScript properties rather than serialized attributes, and reports CustomEvent details through declared handlers.

## Development

A full typecheck expects a sibling DSH checkout:

```text
~/git/deepseek-harness
~/git/web-components
```

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
```

The `prepare` script builds the host and browser entries directly from `src/`, so a Git install does not require sibling project references. pnpm 10 may ask the profile to allow the package's prepare script; only approve a pinned, trusted checkout.

## Model Experience

This package contributes no model-visible text, tools, or prompt sections. It only projects browser slot state and Custom Element events; model-visible behavior remains owned by the DSH services rendered through the slots.

## Known Limitations and Deferred Work

- `CustomElementRegistry` definitions are page-lifetime resources and cannot be unregistered; the adapter rejects constructor replacement.
- The bundle does not provide a DOM or React renderer; the profile must already mount the DSH slot host and browser runtime.
- Older DSH snapshots require the compatibility patch in `legacy/` because a bundle cannot add missing host source APIs; the current `master` also predates the Slots election/incarnation APIs, so full typecheck requires the compatible Slots change (for example `d97d6a1e`).
