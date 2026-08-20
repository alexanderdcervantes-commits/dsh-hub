# dsh-bull-bear

> Bull & bear market pet for DeepSeek Harness: the closer your portfolio climbs toward a 20% gain, the harder the bull sprints; the deeper it falls, the more theatrically the bear tumbles.

A market-status pet in the bottom-left corner of the DeepSeek Harness Web UI. It reads **free, real-time A-share quotes** and turns your watchlist's average move into a **running bull or bear** that charges harder the more the market moves. Purely for fun — not investment advice.

## Features

- **Free real-time quotes**: Sina `hq.sinajs.cn` public endpoint — no login, no API key, fetched directly from Node.
- **Portfolio-driven mood**: the pet follows your **whole basket's average**. Gain → bull (🐂); fall → bear (🐻); flat → calm.
- **Dramatic, vigor-driven running**: the closer the average move gets to a **20% gain**, the faster the pet sprints, the wider its limbs swing, the higher it jumps and the denser the dust it kicks up. Horizontal when flat, furious when the market runs.
- **Anthropomorphic designs**: a running bull, and a Boonie-Bears-style standing bear (red-brown fur, white chest band, big nose, green eyes, red ears).
- **Draggable & collapsible**: grab the pet and move it anywhere; click (without dragging) to toggle the watchlist panel.
- **Watchlist panel**: brick-and-mortar list of every held symbol with red/green change, portfolio average at the bottom, and search-by-name/code to add or remove holdings.
- **🏁 Market race**: a "race track" section where each holding runs a bar whose length is proportional to its change — the biggest mover fills its lane, the rest scale relative to it.
- **Scales to many symbols**: up to 200 held symbols, fetched in chunks of 500 to stay under Sina's single-URL limit.

## Install

```bash
# npm package (prebuilt, recommended)
dsh plugin --profile web add dsh-bull-bear

# or a local directory
dsh plugin --profile web add /path/to/dsh-bull-bear
```

Restart `dsh web` once after adding, then refresh the page to see the pet.

## Usage

- **Drag**: press and hold the pet with the mouse, then move it anywhere in the window; release to leave it there. Position is kept for the session.
- **Open / close the panel**: click the pet without dragging to toggle the watchlist panel on the right.
- **Watchlist panel**:
  - Each row shows the stock's name and its change in A-share colors — **red = up, green = down**.
  - The **search box** accepts a name or code (e.g. `茅台`, `600519`); matching stocks appear below and one click adds them.
  - The `✕` button on a row removes that holding.
  - The **portfolio average** (`组合平均`) is shown at the bottom, also in red/green.
  - Edits are written to `<workspace>/.bull-bear-watchlist.json` and reapplied on startup (up to 200 symbols).
- **🏁 Market race**: the uppermost section lists your holdings sorted by change, each with a lane whose filled width is **proportional to the biggest mover** — the leading stock fills 100%, the rest scale by their ratio. The row marks show the top 6 movers.

### Config

| Key | Default | Description |
| --- | --- | --- |
| `symbols` | SSE/SC/ChiNext/Moutai/CATL | watchlist (Sina codes like `sh000001`/`sz399001`; a `6`-prefixed 6-digit code is auto-detected as SSE) |
| `refreshMs` | `5000` | quote refresh interval (ms) |
| `sensitivity` | `1` | rate→angle multiplier (`0.1`–`5`) |

Defaults live in the `config` object in `src/index.js`; they can be adjusted at runtime via the RPC interface.

## How it works

- **Host half** (`src/index.js`): every `refreshMs` it fetches Sina `hq.sinajs.cn` with native `fetch`, decodes GBK, computes each symbol's change vs previous close (`pct`) and its rate, then the **portfolio average** (`avgPct`, `avgRate`). Because Sina rejects URLs over ~800 symbols (HTTP 431), the watchlist is fetched in **chunks of 500**. A `search` action resolves names/codes through Tencent's `smartbox` endpoint. All of it is exposed over the official `ctx.connection.rpc.handle('/bullbear'...)` channel.
- **Client half** (`src/client/index.js`): polls the RPC, derives a **vigor** (`|avgPct| / 20`, capped) that scales running speed, limb swing, jump height and dust; an animation loop drives the limbs by frame. The panel and race track read the same data. Registered into the `shell.overlay` slot.

`mood` within a window: portfolio `avgPct > 0.05` shows the bull, `avgPct < -0.05` the bear, otherwise flat.

## Disclaimer

- Data comes from Sina Finance's public web interface, for study and research only, and is **not investment advice**; do not poll aggressively and respect the source site's terms.
- This plugin is not an official product of any broker or quote provider.

## License

[MIT](./LICENSE)
