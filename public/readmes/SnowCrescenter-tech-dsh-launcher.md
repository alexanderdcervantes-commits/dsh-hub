# dsh-launcher

> A portable Windows launcher for DeepSeek Harness. Double-click to start, no Node.js, no pnpm, no command line.

## What is this?

DeepSeek Harness is DeepSeek's official agent framework. The official build is still a developer preview: to install it yourself you need Node 22.19+ or 24, pnpm, and a pile of command line steps. That is a high bar for most people.

This project packages all of that into a portable, green release. Download, extract, double-click. The Web UI opens in your browser.

## Quick start

1. Download `DeepSeek-Harness-免安装版-v0.1.0.zip` from the Releases page
2. Extract it to any folder
3. Double-click `启动.bat`, paste your DeepSeek API key when asked. The browser opens automatically at http://127.0.0.1:3080

The launcher checks the environment, writes your API key to a local config, starts the service, and opens the browser. No manual steps.

## Getting an API key

DeepSeek's API is pay-as-you-go, billed by DeepSeek. Create a key at https://platform.deepseek.com (it looks like `sk-...`). Your key is stored only on your own machine.

## FAQ

**Antivirus warning?**

This is a green portable build with no installer: a `启动.bat` script, the officially signed `node.exe`, and dependencies. It changes nothing on your system, and the first launch auto-unblocks the SmartScreen mark. If an antivirus still flags it, add the extracted folder to the trust list (360 安全卫士: 木马查杀 → 信任区; 火绒安全: 防护中心 → 病毒防护 → 信任区; 腾讯电脑管家: 病毒查杀 → 信任区; Windows Defender: 病毒和威胁防护 → 排除项). Every release also ships a SHA256SUMS.txt for verifying the download.

**Port 3080 is already in use?**

If port 3080 is taken, the launcher automatically falls back to a free OS-assigned port, so no action is needed.

**How is this different from the official release?**

It is not. The script runs the official build unchanged, and only automates environment checks, API key setup, and opening the browser.

**Do I have to pay?**

The software is free and open source, but the DeepSeek API is pay-as-you-go. Current reference prices (per million tokens): deepseek-v4-flash $0.14 input / $0.28 output; deepseek-v4-pro $0.435 input / $0.87 output; cache-hit input is far cheaper. See https://api-docs.deepseek.com/quick_start/pricing for the authoritative list. Billing switches to peak/off-peak pricing starting 2026-08-16.

## Technical notes

- Bundles portable Node v24.19.0 (no system Node required)
- Runs the Web UI via `@deepseek-ai/dsh@0.1.0-rc.6`
- Data lives in `%USERPROFILE%\.dsh`
- Contents: `启动.bat` (entry point), `launcher/` (startup logic), `node.exe` + `node_modules/` (bundled runtime)

## Disclaimer

Community project, not an official DeepSeek product. DeepSeek Harness is in developer preview and may change without notice. This project is MIT licensed. Check the official docs first when you hit problems.

## Links

- Official repo: https://github.com/deepseek-ai/deepseek-harness
- API console: https://platform.deepseek.com
- Topics: dsh-plugin, dsh, deepseek-harness, windows, portable, launcher
