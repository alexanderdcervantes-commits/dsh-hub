# dsh-moonrise · 月升

A warm amber-on-midnight theme for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web UI.

夜色深蓝为底，月光琥珀做点缀——给 DSH 换一套"深夜写代码"的配色。

## Install

```sh
dsh plugin --profile web add dsh-moonrise
# or from source / a tarball:
dsh plugin --profile web add ./dsh-moonrise
```

Then restart the Web UI and pick **moonrise** in Settings → Appearance.

## What it overrides

`ctx.theme.register()` with a dark-scheme `ThemeDefinition` that overrides the
`--dsw-alias-*` semantic tokens (surfaces, borders, brand, labels, states,
buttons, sidebar, markdown, scrollbars). The token set is the documented
`ui-theme` inspect list plus the design-platform aliases.

## Structure

```text
package.json        # dsh.bundle + dsh.client manifests
cordis.patch.yml    # inserts the client row
index.js            # node half (no-op; theming is browser-side)
dist/client.js      # browser bundle (window.__ModuleLoader__.load factory)
```

## Publishing

```sh
npm publish
# or ship a tarball:
npm pack
```

Tag the repo with `dsh-plugin`, then submit to
[awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin).
