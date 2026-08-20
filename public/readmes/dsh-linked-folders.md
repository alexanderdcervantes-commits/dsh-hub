# @steven-wu/dsh-linked-folders

Out-of-tree [dsh](https://github.com/deepseek-ai/deepseek-harness) plugin that
gives a session **multi-folder workspace** access — like Codex's linked folders.

- A **global linked-folders list** (durable, cross-session) — your "global workspace".
- **Per-session temporary links** the model adds/removes on the fly with
  `link_folder` / `unlink_folder`.

Both lists are injected into the system prompt, so the model knows which extra
roots it may `cd` into and work across.

## Install

The package declares a `dsh.bundle` manifest, so `dsh plugin add` installs it
and adds it to the profile's bundle layers automatically:

```sh
dsh plugin --profile web add @steven-wu/dsh-linked-folders
# restart the web profile, then refresh the page
```

## Use

- **Composer** → the **📁** button on the left of the input bar. Click it to
  open the panel: manage the global list (add by absolute path or **Browse…**,
  remove with ×) and see this session's temporary links.
- **Model**: say "link folder /path/to/foo" — the agent calls `link_folder`;
  "unlink /path/to/foo" calls `unlink_folder`. Session links appear in the
  prompt as `(this session)`.

### Workspace-picker entry (optional Tier-2 patch)

The official workspace-picker menu is inline (not a slot), so the plugin can't
add to it. `scripts/patch-workspace-picker.py` patches the compiled
`dsh-client-ui-workspace` bundle to add a **"Link folder…"** entry next to
"Add workspace"; selecting it dispatches `dsh:link-folder-requested`, which this
plugin listens for (opens the native picker and links the chosen path).

```sh
python3 scripts/patch-workspace-picker.py
# then restart dsh web
```

Re-run after a dsh update (idempotent; the original bundle is backed up to
`*.pre-linkfolder.bak`).

## Configuration

State lives in `~/.dsh/linked-folders.json`:

```jsonc
{
  "global": ["/Users/you/projects/app", "/Users/you/projects/lib"],
  "sessions": { "session-abc…": ["/tmp/scratch"] }
}
```

Override the path with the `DSH_LINKED_FOLDERS` env var or the bundle row's
`config.path`. Linked folders are canonicalized to real paths and must be
existing directories.

## Sandbox note

The plugin only advertises folders to the model and provides the management UI;
it does not change the file sandbox. Under `danger-full-access` the model can
read/write anywhere; under `workspace-write` it can read linked folders but
writes are still confined to the session workspace root.

## Model experience

- **System prompt**: a `## Linked folders` section listing global + session roots.
- **Tools**: `link_folder(path)` / `unlink_folder(path)`.
- **Web Remote**: the client bundle explicitly mounts the `linkedFolders`
  Remote contribution before the sidebar consumes it (required by dsh rc.6+).
- **Prompt token cost**: proportional to the number of linked folders (one
  short line each), zero when none are linked.
