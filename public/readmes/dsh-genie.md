<h1 align="center">🪔 dsh-genie</h1>

<p align="center"><b>Wishes that outlive the session.</b></p>

<p align="center">
  <a href="https://github.com/deepseek-ai/deepseek-harness">DeepSeek Harness</a> can already write its own plugins.<br>
  It just can't keep them. This is the other half.
</p>

<p align="center">
  English | <a href="README.zh.md">中文</a>
</p>

---

## The gap

DeepSeek Harness ships a self-referential toolset — `cordis_inspect`, `cordis_define`,
`cordis_run` — that lets the agent write a plugin and hot-load it into the live process.
You describe a feature, the agent builds it, and it works *right now*.

Then you restart, and it's gone. From the official README of that toolset:

> Dynamic packages live only in the shared DSH process memory. […] They create no Plugin file,
> install no package, change no `cordis.yml` or personal/project configuration, **do not survive
> restart, and cannot be promoted automatically.** To keep an experiment, ask the Agent to
> implement a normal local, project, or repository Plugin through the regular development workflow.

`dsh-genie` is that "regular development workflow", collapsed into one tool call.

## The loop

```
you  ▸ every time I say "ship it", stage everything and commit with a generated message

     ▸ agent writes the plugin, cordis_run mounts it            ← ships with DSH
     ▸ you try it. it works.
     ▸ "keep it"
     ▸ genie_keep dyn-1 → dsh-wish-ship-it                      ← this package

     ▸ restart
     ▸ still there.
```

Two extra facts that make this pleasant:

- **No pnpm, no network, no build authorization.** A granted wish is written straight into
  `$DSH_HOME/genie/` and linked where the launcher already resolves modules. Compare that to
  the normal path for a git-installed plugin, which needs a `prepare` script from the author
  *and* an `allowBuilds` grant from you — arbitrary code execution at install time, outside
  every sandbox the agent runs in.
- **It's just files.** Every wish is a readable directory with a `package.json`, a
  `cordis.patch.yml`, and an `index.js`. Read it, edit it, `git init` it, publish it.
  dsh-genie never rewrites a wish after granting it.

## Install

```sh
dsh plugin --profile web add github:swaylq/dsh-genie
```

Then restart `dsh`. That's it — plain JavaScript, no build step, so there is no `prepare`
script and nothing to authorize.

Already have your own `@deepseek-ai/dsh-tool-cordis` row? See [Composition](#composition).

## What you get

| | |
|---|---|
| `genie_keep` | Take a dynamic package the agent just proved out and make it permanent. Only appears when the dynamic-package runner is composed. |
| `genie_wish` | Same, for code the agent wrote directly — no prototype step. |
| `genie_list` | Every wish on this machine, and whether it's live in this profile. |
| `genie_revoke` | Unlist and unlink a wish. Keeps the source unless you ask otherwise. |
| `/wish` | The human view: what's granted, what's active, where the code lives. |

The bundle also mounts `@deepseek-ai/dsh-tool-cordis`, DeepSeek Harness's own
self-modification toolset. It ships inside every install but the stock `web` profile
doesn't mount it — its runner already is, so switching it on costs no install.

## How it works

Three facts about the launcher, none of them private API:

1. **A profile resolves bundles through two anchors** — the dsh installation, then the profile
   directory. Node's ordinary parent walk from `<profile>/package.json` reaches
   `$DSH_HOME/profiles/node_modules`, the flat fallback directory the launcher maintains so
   in-box plugins resolve from any profile.
2. **That directory is append-only in practice.** `healProfilesModuleFallback` keeps correct
   links, re-points moved ones, and never prunes what it doesn't own — so a link planted there
   survives every later boot.
3. **`dsh plugin` won't reclaim the layer.** Its reconcile pass only removes a bundle whose name
   is (or was) a profile `dependencies` key. dsh-genie writes to `dsh.profile.bundles` and never
   to `dependencies`, so `dsh plugin add anything-else` leaves your wishes alone.

So granting a wish is: write the package → symlink it into the fallback → append one name to
the profile's ordered bundle list. No installer, no registry, no build.

One wrinkle worth knowing, because it bites everyone once: **Node resolves a package's imports
from its real directory, not from the symlink used to find it.** A wish in `$DSH_HOME/genie/`
would walk `genie` → `$DSH_HOME` → `~` and never see the fallback, so dsh-genie plants
`$DSH_HOME/genie/node_modules` → `$DSH_HOME/profiles/node_modules` beside the wishes. That
puts every in-box package back on the walk. For the same reason dsh-genie itself declares no
runtime dependency at all — it loads `@deepseek-ai/dsh-tools` through the *profile*, the way
the launcher resolves its own bundles, so it works from a `link:` checkout, a git install, an
npm install, or a directory you dropped in by hand.

## Trust stance

Read this before you install it, not after.

**A granted wish is ordinary code that runs at every boot, with the harness's full context.**
That is the point of the package, and it is also the whole risk. dsh-genie does not add a
capability your agent lacked — an agent with bash access could already write these files — but
it does make it one tool call instead of a visible sequence of them, which is exactly the kind
of convenience worth being explicit about.

What the design does about it:

- **Nothing runs in the session that wrote it.** A grant writes files and edits one manifest.
  The code loads on the next restart, which only you can perform. That restart is the
  checkpoint, and every tool result says so.
- **Nothing is executed to be validated.** Generated modules are parse-checked with
  `node --check`, which parses without evaluating. A wish that doesn't parse installs nothing.
- **Everything is listable and reversible.** `/wish` and `genie_list` show every wish and its
  source path; `genie_revoke` removes it. Revoke only accepts `dsh-wish-*` names, so a
  mistyped argument cannot unlist `dsh-base`.
- **Wish names are one validated path segment.** No scopes, no dots, no traversal.

What it does *not* do: sandbox the wish, review the code for you, or ask a second time. If you
would not run a script an agent wrote without reading it, read the wish before you restart —
the tool result hands you the exact path for that reason.

Upstream's stance on the toolset this builds on is the same one, and worth repeating: the vm
sandbox behind `cordis_run` "isolates globals but is not a security boundary […] treat this
toolset like bash access."

## Composition

The bundle inserts two rows: `genie-tool-cordis` and `genie`. If something else in your profile
already mounts `@deepseek-ai/dsh-tool-cordis`, both registrations claim the same tool names and
the load fails loudly (as DSH intends). Disable ours from your profile's `cordis.patch.yml`:

```yaml
- id: genie-tool-cordis
  disabled: true
```

Config on the `genie` row:

| key | default | meaning |
|---|---|---|
| `allowUpdate` | `true` | whether `mode: "update"` may overwrite an existing wish |

## Caveats

- **A kept dynamic package changes realms.** `cordis_define` bodies run in a vm sandbox where
  Node globals are absent or redirected to Cordis services. A kept wish runs in ordinary Node,
  so a body written against those facades may need adjusting. `genie_keep` tells the model to
  say so when the code touches them; it cannot rewrite the code for you.
- **Layer order is append.** A wish patches on top of `dsh-base`, the mode bundle, and every
  plugin installed before it. A patch replaces a row's whole `config` rather than deep-merging,
  so a wish that overrides an existing row must restate every key that row needs.
- **DSH is a developer preview.** Upstream says breaking changes are coming. This package leans
  on documented launcher behavior rather than internals, but "documented" and "stable" are not
  the same thing yet.
- **The client half is stored, not mounted.** `genie_keep` saves a `client.js` beside the host
  half for reference; wiring a browser half into the web UI is still manual work.

## Development

```sh
npm test          # 19 tests, real throwaway Harness homes, no network
```

`lamp.js` is the whole install mechanism and imports nothing from DSH — it is plain `node:fs`
and testable on its own. `index.js` is the plugin surface.

## License

[MIT](LICENSE)

Built on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (MIT) and
[Cordis](https://github.com/cordiverse/cordis). Not affiliated with DeepSeek.
