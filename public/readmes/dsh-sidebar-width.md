# dsh-sidebar-width

Control the **left sidebar (session list) width** of the DeepSeek Harness Web UI:
lower the drag minimum (official floor 264px), optionally the drag maximum and the
expanded default width. Nothing outside the sidebar is touched.

控制 DeepSeek Harness Web UI **左侧会话列表栏宽度**：调低拖动下限（官方 264px），
可选调整拖动上限与展开默认宽度。不涉及任何其他功能模块。

## Why a patch-style plugin / 为什么是"打补丁"式插件

The sidebar width clamp (`clampWidth(px, 264, 420)`) and the 280px default are baked
into the client bundle `@deepseek-ai/dsh-client-ui-layout/lib/client.js` (grid solver
`computeColumns` + layout store `setSidebar`/init/toggle). The client runtime exposes
no seam to change them (the store and its actions are private to the bundle), so this
plugin patches the served bundle file once at `dsh web` startup:

侧边栏宽度钳制与默认值写死在客户端 bundle `@deepseek-ai/dsh-client-ui-layout/lib/client.js`
中（网格求解器 + layout store），客户端运行时没有可改的接缝，因此插件在 `dsh web`
启动时修补被服务的 bundle 文件：

- first run backs up to `client.js.dsh-sidebar-width.bak` / 首次运行先备份
- idempotent — a marker makes re-runs no-ops; a dsh upgrade replaces the file and the
  next startup re-patches / 幂等——升级覆盖文件后下次启动自动重打补丁
- configurable via the plugin row / 全部数值可配置

## Config / 配置

| key | meaning / 含义 | default / 默认 |
|---|---|---|
| `min` | lower drag bound, px / 拖动下限 | `180` |
| `max` | upper drag bound, px / 拖动上限 | keep bundle value (420) |
| `defaultWidth` | expanded default width, px / 展开默认宽度 | keep bundle value (280) |
| `path` | absolute path of the layout client.js / 手动指定 bundle 路径 | auto-locate |

All keys optional. / 全部可选。

## Install / 安装

```sh
dsh plugin --profile web add dsh-sidebar-width   # npm（推荐）
# 或本地开发: dsh plugin --profile web add link:/path/to/dsh-sidebar-width
# 然后重启 dsh web（插件在启动时打补丁）
```

> `dsh plugin` requires pnpm on PATH. / 需要 PATH 上有 pnpm。

## Tune / 调参

Edit `~/.dsh/profiles/web/cordis.patch.yml` (user layer overrides the bundle row):

```yaml
- id: sidebar-width
  name: 'dsh-sidebar-width'
  config:
    min: 160
    max: 420
    defaultWidth: 240
```

Restart to apply. / 重启生效。

## Uninstall / 卸载

```sh
dsh plugin --profile web remove dsh-sidebar-width
```

The patch itself stays (harmless); restore manually from the backup:
补丁不会自动回滚（无害），可手动还原：

```sh
mv <install>/.../dsh-client-ui-layout/lib/client.js.dsh-sidebar-width.bak \
   <install>/.../dsh-client-ui-layout/lib/client.js
```

## Scope / 边界

This plugin's only job is the sidebar width. No UI buttons, no other panels, no
settings surface. / 本插件唯一职责就是侧边栏宽度：不加按钮、不动其他面板、不扩功能。

## Publish / 发布（for maintainers）

1. Push the repo to GitHub and add the `dsh-plugin` topic.
2. `npm publish` (name `dsh-sidebar-width` is free on npm as of 2026-08-15).
3. Open a PR to [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin):
   add one line under **UI Enhancements / UI 增强** in both `README.md` and `README.zh.md`.
   [dsh-market](https://github.com/dsh-market/dsh-market) picks the list up automatically.
