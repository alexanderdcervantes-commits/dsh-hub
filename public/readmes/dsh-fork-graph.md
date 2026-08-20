# dsh-fork-graph

English | [简体中文](README.zh.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-3c873a)](package.json)
[![Tests](https://img.shields.io/badge/tests-64-brightgreen)](tests)

**See your conversation's fork history as a git graph — right in the session header.**

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) Web plugin. Fork a session in DSH and you get a child that inherits the parent's history — but the sidebar only shows a flat list with indentation. This plugin draws the actual branch topology: coloured lanes, curved fork lines, one row per session, click to jump.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/preview-dark.svg">
  <img alt="The branch panel: a git-style rail with one row per session in the lineage" src="https://raw.githubusercontent.com/chouyong/dsh-fork-graph/bb162457a238eff0672f2bff7f180874fe90b377/assets/preview-light.svg" width="460">
</picture>

<p>
  <img alt="Real DSH Web session with the branch trigger inline in the conversation header" src="https://raw.githubusercontent.com/chouyong/dsh-fork-graph/bb162457a238eff0672f2bff7f180874fe90b377/assets/screenshot-trigger.png" width="460">
  <img alt="Real DSH Web session with the expanded branch graph panel" src="https://raw.githubusercontent.com/chouyong/dsh-fork-graph/bb162457a238eff0672f2bff7f180874fe90b377/assets/screenshot-panel.png" width="460">
</p>

*The SVG above is rendered by the plugin's own layout code (`scripts/render-preview.ts`); the two PNGs are genuine captures from a running DSH Web session.*

## Why

Agent work does not stay linear. You fork at a good checkpoint to try something risky, a subagent goes off to audit one file, yesterday's dead end becomes today's starting point. After a day of that you have eight sessions and no idea which came from which.

A flat list tells you *what exists*. A graph tells you *what came from what* — which is the question you actually have when you are looking for "the session where it still worked".

## What it does

- **Branch topology, not indentation.** Each branch gets its own coloured lane; forks are drawn as curves leaving the parent commit dot.
- **One row per session** with its title, plus the facts that change how you read it: `current`, `running`, `subagent`, `forks into N`.
- **Click to jump.** Any node navigates to that session.
- **Focused by default.** Shows the lineage family of the session you are in, not every session you ever had.
- **Appears only when it is useful.** No fork in this lineage → the control does not render at all.
- **English and Chinese**, following the page language.

## What it deliberately does not do

- **No writes.** No session events, no RPC, no persisted state, no prompt content. It reads the session list the host already maintains and draws it. Composing the plugin out removes one button and nothing else.
- **No second source of truth.** It renders the host's own list store — it never keeps a copy that could drift from the sidebar.
- **No forking UI.** DSH already has fork actions in the chat view; this plugin visualises the result rather than duplicating the verb.

## Install

Requires DSH, Node.js `^22.19.0 || >=24.0.0`, and pnpm.

```sh
dsh plugin --profile web add github:chouyong/dsh-fork-graph
dsh web
```

A git install builds from source, so pnpm ≥10 will refuse the package's `prepare` script until you allow it. The first `add` prints the exact key — put it in that profile's `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  dsh-fork-graph: true
```

then run the `add` again. Pin a commit (`github:chouyong/dsh-fork-graph#<sha>`) if you want later pushes to have no effect on what runs on your machine.

If the git install reaches `prepare` but fails because the published DSH packages request the unpublished `@deepseek-ai/dsh-compact`, install the prebuilt tarball instead:

```sh
cd path/to/dsh-fork-graph
npm install --ignore-scripts --legacy-peer-deps
npm run build
npm pack
dsh plugin --profile web add ./dsh-fork-graph-0.1.0.tgz
```

To remove:

```sh
dsh plugin --profile web remove dsh-fork-graph
```

## How it works

DSH's `SessionStore.fork(source, boundary)` seeds a child session with a prefix of the parent's event log and records `parentSession` in the child's durable header. The browser sees that as `SessionSummary.parentId` on the session list. So the fork tree is **already in the data** — this plugin is a pure projection of it, with no storage of its own.

Layout is git-graph convention with one deliberate deviation:

- A node keeps its parent's lane when it is that parent's **first** child (the trunk continues); every other child opens a **new** lane.
- **Lanes are never recycled.** That buys a guarantee worth more than a narrow graph: a lane holds exactly one branch chain, so two nodes adjacent on the same lane are always parent and child, and a vertical run can be drawn as a continuous line without ever implying a relationship that is not there. (Recycling was implemented first. Because a pre-order walk keeps each subtree contiguous, a freed lane is *always* available to the next branch — which collapsed every graph to two lanes and erased the parallel-branch picture entirely.)
- A cross-lane edge settles into the **child's** lane first, then descends. Descending in the parent's lane first would draw the line straight through the parent's earlier children, which occupy that lane on the rows in between.

The plugin contributes one entry to the `conversation.session.header.actions` slot and takes everything it renders from its own inject face, so it merges nothing into DSH's global type surface beyond that one slot key.

## Known limitations

Stated plainly, because some of them will matter to you:

- **Verified end-to-end in a running DSH Web instance.** On 2026-08-16 this was verified with DSH `0.1.0-rc.5`, a locally built tarball installed in the Web profile, an actual Edge browser, one completed parent conversation, and two completed sibling forks. The plugin response was HTTP 200, with zero console errors, page errors, or failed requests; the real panel showed two lanes, a fork curve, three nodes, and the current-session highlight. The validation environment needed the README-required DSH source build first, and the plugin used the prebuilt tarball fallback after git `prepare` reached the unpublished `@deepseek-ai/dsh-compact` dependency; no plugin source changes were needed.
- **The fork point is not shown.** DSH records *how many* events a child inherited (`seedLength`) in the durable header, but does not surface it to the browser. So the graph can tell you B forked from A; it cannot yet tell you it happened at A's turn 7.
- **Language follows the document, not DSH's locale service.** `@deepseek-ai/dsh-client-locale` cannot currently be installed from npm (see below), so the copy is self-contained and reads `<html lang>` / `navigator.language`. A language switch is picked up on the next render.
- **Blank leaf sessions are hidden** (the sidebar hides them too), except the one you are in. A blank session that has children is kept — dropping it would orphan a real branch. The count of hidden ones is shown in the panel rather than silently dropped.
- **Three DSH packages cannot be installed from npm.** `dsh-client-runtime`, `dsh-client-locale` and `dsh-client-ui-conversation` all depend, directly or transitively, on `@deepseek-ai/dsh-compact`, which is unpublished (registry 404). This plugin therefore declares the narrow type surface it reads in [`src/client/contract.ts`](src/client/contract.ts), mirroring the published `0.0.1-rc.1` declarations file by file. If those packages become installable, that file should shrink to imports.
- **Wide lineages scroll.** Lanes are not recycled, so a session forked twenty times is twenty lanes wide. The panel scrolls; it does not compress.

## Related projects

Two other plugins visualise session lineage. Both render an indented tree and both occupy `conversation.view` (a whole tab), so they solve an overlapping problem in a different shape — and because this plugin lives in the header action slot instead, it can be installed **alongside** either of them:

- [`Nirvana-Jie/dsh-session-tree`](https://github.com/Nirvana-Jie/dsh-session-tree) — ARIA tree view with keyboard navigation, a fork action, and a detail pane. The more featureful option if you want a dedicated tab.
- [`ZhengQingJing/dsh-session-tree`](https://github.com/ZhengQingJing/dsh-session-tree) — indented list with ASCII branch marks.

What is different here: the git-graph rail itself (lanes, curves, commit dots) and living inline in the session header rather than taking a tab.

## Development

```sh
npm install --ignore-scripts --legacy-peer-deps   # both flags are required, see below
npm run build        # d.ts via tsc + both bundles via tsdown
npm test             # 64 tests
npm run typecheck
node scripts/render-preview.ts   # regenerate the README preview
```

`--legacy-peer-deps` is needed because several DSH packages declare peer dependencies that are not published; `--ignore-scripts` skips the `prepare` build during a dev install.

Engineering notes, including the failure modes that do **not** announce themselves, are in [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)
