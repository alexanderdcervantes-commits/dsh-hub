# DSH VS Code Theme

[English](README.md) | [简体中文](README.zh.md)

`dsh-vscode-theme` adds a VS Code theme importer to DeepSeek Harness Web. In **Settings -> Plugins -> VS Code Themes**, drag in a `.vsix` file, select one of the theme variants it contains, and the DSH interface switches immediately. Parsing happens in the browser; the VSIX is not uploaded. The interface follows DSH's selected language and supports English and Simplified Chinese.

The plugin also exposes `vscode_theme_parse` for agents that need the complete VS Code color and token data from a workspace file.

## Install

Install directly from GitHub:

```sh
dsh plugin --profile web add github:Sim-xia/dsh-vscode-theme
```

When running DSH from its source checkout, use the equivalent command:

```sh
pnpm dsh plugin --profile web add github:Sim-xia/dsh-vscode-theme
```

The package declares a DSH bundle patch, so the command also enables it in that profile. Restart the profile. The plugin depends on DSH's standard `fs` and `tools` services, which the web profile provides.

For local development, replace the GitHub specifier with this repository's absolute path.

## Use the UI

Restart the DSH Web profile after installing or rebuilding this package, then open **Settings -> Plugins -> VS Code Themes**. Drop a VSIX onto the import panel or choose it from disk. Every imported VSIX is stored in this browser's IndexedDB; use the saved-package menu to switch between them after a refresh or DSH restart. They are never uploaded. A theme applied through this plugin remains applied after a refresh; choosing a different DSH theme clears that restoration preference.

DSH and VS Code have different visual-token systems. The importer maps the workbench palette (backgrounds, text, borders, focus, selection, status colors, and sidebar) into DSH's UI tokens. Syntax token colors remain available to the agent parser but do not recolor the DSH interface.

## Use from an agent

Ask the agent to inspect a VSIX, or call the registered tool directly:

```json
{
  "path": "/workspace/piousdeer.adwaita-theme-1.1.0.vsix",
  "theme": "Adwaita Dark",
  "detail": "summary"
}
```

Use `detail: "full"` to return every resolved color and token rule. The default summary returns metadata, rule counts, inherited files, and the first 24 workbench colors to keep ordinary model context compact.

## Development

Building and publishing require Node.js 22 or later. The compiled host plugin targets Node.js 20 for DSH runtime compatibility.

```sh
npm install
npm run check
npm run build
```
