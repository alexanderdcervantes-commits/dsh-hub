# dsh-hot-plugin-host

**Runtime plugin loading for DeepSeek Harness Web — no restarts.**

The DSH loader tree is composed at boot, so adding a *static* client plugin (a UI panel, a widget, a dashboard) normally requires restarting `dsh web`. This plugin fixes that: it watches a **hot directory** and installs/updates client plugin bundles **at runtime** on every open page.

```
write a bundle → ~/.dsh/hot-plugins/<id>/client.js
      ↓ (host polls every 1.5s)
/ hot-plugins/list + SSE events + bundle serving
      ↓ (browser half)
fetch → __ModuleLoader__.load → loader.create (full cordis fiber lifecycle)
      ↓
the plugin goes live on every open page — no restart, no refresh
```

Updates work the same way (overwrite the file → invalidate + live refresh). Delete the directory → the plugin disappears on next page load.

## Install

```sh
# from this repo
mkdir -p ~/.dsh/profiles/web/node_modules
ln -s "$PWD" ~/.dsh/profiles/web/node_modules/dsh-hot-plugin-host
# add "dsh-hot-plugin-host" to dsh.profile.bundles in
# ~/.dsh/profiles/web/package.json
```

Then restart `dsh web` **once** (the host itself is a boot plugin). From then on, every future plugin ships through the hot dir with zero restarts.

> npm: `dsh-hot-plugin-host` (once published)

## Usage

Drop a bundle into the hot directory:

```sh
mkdir -p ~/.dsh/hot-plugins/my-widget
cp examples/demo-widget/client.js ~/.dsh/hot-plugins/my-widget/
# within ~1.5s it is live on every open page
```

A hot bundle is the same `__ModuleLoader__.load` format as a boot bundle:

```js
window.__ModuleLoader__.load({
  id: "my-widget",                       // must equal the directory name
  factory: (require) => {
    // require() only modules in the client table: react, react/jsx-runtime,
    // @deepseek-ai/dsh-client-runtime/client, ...
    const inject = ["sessions", "slots", "locale"];
    function apply(ctx) { /* full plugin powers: ctx.slots.register(...) */ }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
```

- id: `[A-Za-z0-9@._-]`, single path segment, no `/`
- routes: `GET /hot-plugins/list`, `GET /hot-plugins/events` (SSE), `GET /hot-plugins/<id>/client.js`
- hot dir: `DSH_HOT_PLUGINS` env override, default `~/.dsh/hot-plugins` (auto-created)

## Examples

| Example | Description |
|---|---|
| [`packages/dsh-client-ui-subagent-dashboard`](packages/dsh-client-ui-subagent-dashboard) | Subagent dashboard in the right column: live status, expandable details, background jobs, one-click open of the child session transcript. Ships as its own npm package; also works as a hot bundle. |
| [`examples/demo-widget`](examples/demo-widget) | Minimal self-contained hot bundle: a live status chip. |

## Security

The hot directory is a **trust boundary**, equivalent to the boot `bundles` list (a hot plugin gets full client-side service access). Local development machines only — never point it at untrusted content.

## How it works

- **Host half** (`lib/index.js`): registers `/hot-plugins` routes on `ctx.webServer` (list / SSE / bundle), polls the hot dir (mtime+size → rev), broadcasts `change` events.
- **Browser half** (`lib/client.js`): injects `loader`; reconciles on connect (list), subscribes to SSE, fetches changed bundles, executes them via the standard module loader, then mounts them with `loader.create` — the exact mechanism the official `dsh-cordis-client-runner` uses for dynamic packages, giving hot plugins the full fiber lifecycle (activation gating, effect cleanup, status projection).

## Related

- [dsh-market](https://github.com/dsh-market/dsh-market) — the community plugin market UI inside DSH (browse/search/one-click install)
- [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) — the curated registry this project is listed in

MIT
