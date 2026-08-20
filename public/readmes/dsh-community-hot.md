# dsh-community-hot

A floating panel for the DeepSeek Harness Web UI that surfaces what's hot in the dsh community right now — 24-hour hot topics and the top 10 hot plugins — with a draggable, always-on-top button and deep links straight to the content pages.

[中文说明](README.zh.md)

## Features

- **Floating, draggable button** — drag it anywhere; the position persists across reloads and it always stays on top.
- **Centered panel** — click the button to expand a two-tab panel in the middle of the page.
  - **热门话题 (Hot Topics)** — the 24h-hottest GitHub Discussions of `deepseek-ai/deepseek-harness`, ranked by comments and reactions, with a `24h` badge on fresh threads.
  - **热门插件 TOP10 (Hot Plugins)** — the curated [awesome-dsh-plugin](https://awesome-dsh-plugin.com) community list ranked by GitHub stars (npm-download ranking as an automatic fallback).
- **Deep links** — every row opens the discussion / plugin repository in a new tab.
- **Live badge + auto-refresh** — the button shows a live count of 24h-active topics and refreshes on a configurable interval.
- **Configurable** — list size, refresh interval, and button label via the ⚙ menu in the panel.

## Install

```sh
dsh plugin --profile web add dsh-community-hot
```

Then restart the web profile (or refresh the page if it's already running). The floating button appears in the bottom-right corner of the Web UI.

> Requires a web profile (`@deepseek-ai/dsh-web-app`). On headless profiles the plugin is a no-op.

## Data sources

- Hot topics: `api.github.com/repos/deepseek-ai/deepseek-harness/discussions`
- Hot plugins: `awesome-dsh-plugin.com/plugins.json` (fallback: npm registry search + download counts)

All requests run in the browser against public, CORS-enabled endpoints; data is cached for 10 minutes.

## License

MIT
