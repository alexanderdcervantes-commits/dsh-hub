# DSH Session Manager

A client plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web
that adds a **right-click context menu** on sidebar conversation rows and a
**Session manager** entry at the sidebar footer.

It answers the frequent request "the three-dot menu has too few options compared
to Codex". The stock three-dot menu is hard-coded (no public session-row action
slot in `0.1.0-rc.6`), so this plugin works around it instead: right-click any
session row for a full action menu, and use the footer button for the current
session.

## Features

**Right-click a conversation in the sidebar:**

| Action | Backing |
| --- | --- |
| Pin / Unpin chat | `localStorage` (`dsh.session-pins.v1`) — shared with [dsh-session-pins](https://github.com/alooshxl/dsh-session-pins) |
| Mark as unread / read | Local state (`dsh.session-unread.v1`) with a dot on the row; opening a session marks it read |
| Rename chat | Official `sessions.binding(id).session.rename()` + a rename dialog |
| Archive chat | Official `workspaces.archiveSession()` |
| Continue in new chat | Official `sessions.fork()` then open the child |
| Open in file explorer | Official `workspaces.openPath()` on the session's workspace |
| Copy working directory | Workspace `path` from the workspaces store |
| Copy session title / ID | Clipboard (`writeClipboard`) |
| Copy deep link | Copies `<origin>/?session=<id>` — opens the session when [dsh-deeplink](https://github.com/qyw233/dsh-deeplink) is installed |
| Open in new window | `window.open(.../?session=<id>)` — needs dsh-deeplink to land on the session |

**Sidebar footer "Session manager" (current session):** export session ZIP,
archive, fork, copy title / ID.

Not implemented (no backend in rc.6): continue in a new working tree, delete-session.

## Install

```sh
dsh plugin --profile web add github:Semidia/dsh-session-manager#v0.1.1
# recommended companion for deep links:
dsh plugin --profile web add github:qyw233/dsh-deeplink#main
dsh web
```

Restart `dsh web` once after adding, then hard-refresh the page. No official
package is patched except one additive `data-session-id` attribute on the
session row (see below).

## How it works

- A one-line additive patch adds `data-session-id` to the sidebar session row
  (`@deepseek-ai/dsh-client-ui-workspace` → `SessionNodeItem`). Without it, no
  public API exposes which session a row represents.
- The plugin registers a capture-phase `contextmenu` listener and a menu in the
  public `shell.overlay` slot, positioned at the cursor via the primitives
  `Menu` (portal + `getAnchorRect`).
- The footer entry registers in the public `sidebar.footer.action` slot
  (additive cell, id `session-manager`, same slot as Session Pins).
- All session/workspace actions use public client services
  (`sessions`, `workspaces`, `locale`, `slots`); no private host APIs.

> The `data-session-id` row patch lives in the installed
> `@deepseek-ai/dsh-client-ui-workspace` package and is overwritten on a dsh
> upgrade — re-apply it (one line) after upgrading.

## Compatibility

Targets `@deepseek-ai/dsh@0.1.0-rc.6`. DeepSeek Harness is in developer
preview; a new release candidate may change the slot contracts this plugin
relies on until compatibility is reviewed.

## License

MIT
