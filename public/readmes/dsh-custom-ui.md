# dsh-custom-ui

Custom UI plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web.

Adds a right-side file-tree sidebar, workspace file open, and a DeepSeek account balance meter in the composer stats line.

## Features

- **Balance meter** — shows the DeepSeek account balance in the composer stats line. The API key is resolved **server-side only** through the credentials seam (`credentialRef` from `@deepseek-ai/dsh-credentials`) — it never crosses the wire to the browser.
- **File tree sidebar** — a right-side workspace file tree for quick navigation, with collapse/expand and a floating toggle button.
- **Workspace file open** — open files/folders with the system default application (workspace-rooted; path traversal guarded).

## Install

```sh
dsh plugin --profile web add dsh-custom-ui
```

Then restart `dsh web`. If installed from a local checkout instead, link it via `pnpm link` (or `"dsh-custom-ui": "link:<path>"` in the profile's `package.json`) and rebuild.

## Requirements

- DeepSeek Harness Web (`dsh web`)
- `DEEPSEEK_API_KEY` configured in the harness credentials (for the balance meter; the file tree works without it)

## Host routes

| Route | Purpose |
|-------|---------|
| `GET /api/custom-ui/balance` | DeepSeek account balance (via `DEEPSEEK_API_KEY` through the credentials seam) |
| `GET /api/custom-ui/fs/list` | Directory listing (workspace-rooted) |
| `GET /api/custom-ui/fs/open` | Open a file/folder with the system default |

## Development

```sh
# host half (server routes)
node lib/index.js            # or run through dsh plugin dev flow

# client half (browser UI) — HMR while `pnpm run dev:web` runs in the DSH checkout
# client-plugin changes reload without a refresh only while the dev:web watcher is running
```

Build the client bundle with your DSH toolchain, then restart `dsh web`.

## Security

- The API key is resolved server-side only; the browser client never receives it.
- File routes are workspace-rooted: `resolve()` + prefix check against the workspace root blocks path traversal.
- Review `lib/index.js` and `lib/client.js` before installing if you did not clone from the official repo.

## License

MIT — see [LICENSE](LICENSE).
