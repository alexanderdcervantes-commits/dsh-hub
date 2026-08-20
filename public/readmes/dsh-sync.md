<div align="center">

# dsh-sync

**Git sync for DeepSeek Harness settings and profile configuration.**

*Sync what should travel. Keep secrets, machine-local values, and executable changes under your control.*

[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek_Harness-plugin-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)
[![npm](https://img.shields.io/npm/v/dsh-sync)](https://www.npmjs.com/package/dsh-sync)
[![license](https://img.shields.io/github/license/ZhenHuangLab/dsh-sync)](./LICENSE)
[![stars](https://img.shields.io/github/stars/ZhenHuangLab/dsh-sync?style=flat)](https://github.com/ZhenHuangLab/dsh-sync/stargazers)

</div>

<p align="center">
  <a href="#installation"><b>Install</b></a>
  &nbsp;·&nbsp;
  <a href="#quick-start"><b>Quick start</b></a>
  &nbsp;·&nbsp;
  <a href="#features"><b>Features</b></a>
  &nbsp;·&nbsp;
  <a href="#safety-and-privacy"><b>Safety</b></a>
</p>

---

## Why choose dsh-sync

Keeping DeepSeek Harness configured across multiple machines should not mean copying your entire DSH home directory into Git.

dsh-sync gives you a safer workflow:

- **Choose exactly what to sync** — settings namespaces, profiles, patches, and your own presets.
- **Keep secrets and local values local** — credentials and configured machine-specific fields are excluded.
- **Review before applying** — inspect incoming changes and toggle individual added or removed lines.
- **Separate settings from executable files** — changes that can affect code or plugins require explicit confirmation.
- **Handle conflicts clearly** — cherry-pick local vs remote lines, or keep/take a whole file, without editing Git internals.
- **Repair interrupted writes** — backups and a repair action restore live configuration after a failed apply.

## Installation

Install the plugin for the Web profile:

```sh
dsh plugin --profile web add dsh-sync
```

Restart `dsh web`, then open **Settings → Git Sync**.

To use `/sync` in a headless profile as well:

```sh
dsh plugin --profile headless add dsh-sync
```

## Quick start

1. Open **Settings → Git Sync**.
2. Enter your Git remote URL and branch.
3. Select the settings namespaces, profiles, patches, and presets you want to sync.
4. Add any machine-specific settings paths to **Keep local-only paths**.
5. Save the configuration and select **Compare**.
6. Review the incoming and outgoing changes.
7. Apply settings, confirm executable changes, resolve conflicts, or push local changes.

Git authentication uses your existing Git environment. dsh-sync does not store Git credentials in its configuration.

## Features

### Selective configuration sync

Only the settings namespaces, profiles, patches, and user preset IDs you explicitly select are included. Selected user preset directories are synchronized recursively, including their imported `.mjs` modules. Exact files can be marked **local only** so they stay unchanged on one machine and disappear from the sync plan. Credentials, sessions, storage, dependencies, and system presets stay outside the sync payload.

### Secret-aware settings

dsh-sync removes known secret fields and your configured local-only paths before settings are stored in Git. Those local values are preserved when remote settings are applied.

### Per-line review

Each changed line can be toggled before applying:

- Disable an added line to skip it.
- Disable a removed line to keep the local line.
- Keep the rest of the file selected and apply only the changes you want.

Unselected incoming changes remain available for the next review. Items under **Local changes (not pushed)** can also be opened and restored fully or partially from Git when you do not want to publish a local edit.

### Executable-change confirmation

Profile patches, home patches, plugin manifests, and user presets can affect code execution. dsh-sync keeps these changes separate from ordinary settings and requires an explicit confirmation before applying them.

### Conflict handling

When local and remote values both changed, dsh-sync shows the conflict. You can cherry-pick individual lines, or choose **Keep local** / **Take remote** for the whole file. Settings conflicts are decided per key. Remote changes are checked again before anything is written.

### Safe recovery

Live files are backed up before replacement. If an apply is interrupted or verification fails, **Repair interrupted write** restores the previous files.

### Sidecar Git workflow

The sync repository is kept separate from live DSH files. Fetching remote changes does not overwrite your active configuration, and pushes remain fast-forward only.

### Web UI and commands

The Web plugin adds **Settings → Git Sync** with Compare, per-line review, conflict decisions, outgoing rollback, Inspect, and Repair controls. The `/sync` command provides the same core workflow from a session.

## What gets synced

| Configuration | Behavior |
| --- | --- |
| Selected settings namespaces | Applied directly after review |
| Web and headless profile manifests | Applied with restart guidance |
| Profile and home patches | Require executable-change confirmation |
| Explicitly selected user agent preset directories | Synchronized recursively; require executable-change confirmation |

Never synchronized: credentials, sessions, storage, `node_modules`, generated profile files, `.dsh-sync`, `.env*`, system presets, symlinks, or gitlinks.

`baseURL` remains portable by default. Add it to local-only setting paths if an endpoint should stay on one machine. Add a repo-relative file such as `profiles/web/package.json` to **Files kept local** when that machine's plugin list should not be synchronized.

## Commands

```text
/sync status
/sync check
/sync diff
/sync pull
/sync push
/sync doctor
/sync recover
```

The standalone command is also available:

```sh
dsh-sync status
dsh-sync check
dsh-sync doctor
dsh-sync recover
```

## Safety and privacy

- Only selected configuration is eligible for synchronization.
- Secret and local-only settings are preserved locally.
- Executable changes are never applied automatically.
- Reviewed changes are rejected if the plan, remote branch, or local file changed afterward.
- File writes are backed up and verified.
- HTTPS remote URLs containing embedded credentials are refused.
- Secret scanning reports the affected path without displaying the secret value.

If a secret has already entered Git history, rotate it before continuing.

## Find it in dsh-market

dsh-sync is listed in [dsh-market](https://github.com/dsh-market/dsh-market) and the [awesome-dsh-plugin catalog](https://awesome-dsh-plugin.com/p/ZhenHuangLab/dsh-sync/).

Install it directly with:

```sh
dsh plugin --profile web add dsh-sync
```

## Requirements

- DeepSeek Harness
- Node.js 22 or newer
- A Git remote you can read and write

## License

[MIT](./LICENSE)
