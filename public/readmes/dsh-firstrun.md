# dsh-firstrun

[![npm](https://img.shields.io/npm/v/dsh-firstrun.svg)](https://www.npmjs.com/package/dsh-firstrun)

[![CI](https://github.com/zoahdev/dsh-firstrun/actions/workflows/ci.yml/badge.svg)](https://github.com/zoahdev/dsh-firstrun/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-verified-blue)](https://github.com/topics/dsh-plugin)

First-run health check for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh): one command that tells a new user **what's missing and what to run next**.

It verifies the pieces that trip up every first-hour user — Node.js, pnpm, dsh CLI, home directory, dsh profile, API key (names only, never values), workspace writability, npm registry — and prints actionable next steps. Zero runtime dependencies, read-only.

## Install

```sh
dsh plugin add dsh-firstrun
```

Or run standalone:

```sh
npx dsh-firstrun
```

## CLI

```sh
dsh-firstrun [--json]
```

- Prints a check-by-check report with `→` next steps.
- Exit codes: `0` ready, `1` needs attention, `2` usage error.

```sh
npx dsh-firstrun
npx dsh-firstrun --json
```

## In-harness usage (agent-callable)

Ask your dsh agent:

> 帮我体检一下环境，看看还缺什么。
> Run a first-run health check: `quickstart`.

The tool returns a `dsh-firstrun/v1` report:

```json
{
  "schema": "dsh-firstrun/v1",
  "ok": false,
  "summary": { "total": 8, "pass": 5, "warn": 1, "fail": 2 },
  "checks": [
    { "id": "node", "name": "Node.js installed", "status": "pass", "detail": "v24.19.0", "nextStep": null },
    { "id": "api-key", "name": "API key configured", "status": "fail", "detail": "None of DEEPSEEK_API_KEY, OPENAI_API_KEY is set", "nextStep": "Store an API key: export DEEPSEEK_API_KEY=... or use the Web Models page" }
  ],
  "generatedAt": "2026-08-18T00:00:00Z"
}
```

## Checks

| Check | Verifies | Status when missing |
|---|---|---|
| `node` | Node.js on PATH | fail |
| `pnpm` | pnpm on PATH | fail |
| `dsh` | dsh CLI on PATH | fail |
| `home` | HOME / USERPROFILE set | fail |
| `profile` | DSH_HOME or ~/.dsh exists | warn |
| `api-key` | one of the API key env vars is set (values never shown) | fail |
| `workspace` | current directory is writable | warn |
| `registry` | npm registry config resolves | warn |

## Why it exists

- The official repo's first-hour failures are overwhelmingly setup friction (missing toolchain, missing key, network); most users don't know what to check first.
- Existing tools diagnose plugin health (dsh-plugin-doctor) and network (dsh-cn-boot); this one closes the loop with a single user-facing checklist + next steps.
- Zero runtime dependencies, read-only, values never printed.

## Development

```sh
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm test:integration
```

CI runs the dsh-plugin-doctor preflight, unit tests, packed-artifact integration (real `quickstart` invocation), and a fresh-profile `dsh web` boot smoke on Windows.

## License

MIT © 2026 zoahdev

---

# dsh-firstrun（中文）

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）的**首次运行体检**：一条命令告诉新用户“缺什么、下一步跑什么”。

它检查每个新手第一小时都会踩的点——Node.js、pnpm、dsh CLI、home 目录、dsh profile、API Key（只显示变量名，绝不显示值）、工作区可写性、npm 注册表——并给出可执行的下一步。零运行时依赖、只读。

## 安装

```sh
dsh plugin add dsh-firstrun
```

独立使用：

```sh
npx dsh-firstrun
```

## CLI

```sh
dsh-firstrun [--json]
```

- 输出逐项检查报告，带 `→` 下一步建议。
- 退出码：`0` 就绪，`1` 需要处理，`2` 用法错误。

```sh
npx dsh-firstrun
npx dsh-firstrun --json
```

## 在 harness 内使用（agent 可调用）

对 agent 说：

> 帮我体检一下环境，看看还缺什么。

工具返回 `dsh-firstrun/v1` 报告（结构见英文版 JSON 示例）。

## 检查项

| 检查 | 验证内容 | 缺失时状态 |
|---|---|---|
| `node` | Node.js 在 PATH | fail |
| `pnpm` | pnpm 在 PATH | fail |
| `dsh` | dsh CLI 在 PATH | fail |
| `home` | HOME / USERPROFILE 已设置 | fail |
| `profile` | DSH_HOME 或 ~/.dsh 存在 | warn |
| `api-key` | 任一 API Key 环境变量已设置（绝不显示值） | fail |
| `workspace` | 当前目录可写 | warn |
| `registry` | npm 注册表配置可解析 | warn |

## 为什么需要它

- 官方仓库第一小时的失败绝大多数是环境摩擦（缺工具链、缺 Key、网络问题），多数用户不知道先查什么。
- 现有工具管插件健康（dsh-plugin-doctor）和网络（dsh-cn-boot）；本插件用一份面向用户的清单 + 下一步建议闭环。
- 零运行时依赖、只读、绝不输出值。

## 开发

```sh
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm test:integration
```

CI 跑 dsh-plugin-doctor 预检、单元测试、打包集成（真实 `quickstart` 调用）、Windows 全新 profile 的 `dsh web` 启动冒烟。

## 许可证

MIT © 2026 zoahdev
## Related ecosystem tools

- [dsh-dep-audit](https://github.com/zoahdev/dsh-dep-audit) - dependency supply-chain hygiene
- [dsh-quality-score](https://github.com/zoahdev/dsh-quality-score) - plugin quality scorecard + full-registry leaderboard
- [dsh-ecosystem](https://github.com/zoahdev/dsh-ecosystem) - health scan, impact, trend, live dashboard
- [dsh-tutorials](https://github.com/zoahdev/dsh-tutorials) - bilingual plugin pipeline tutorials
## FAQ

- **How do I install?** dsh plugin add dsh-firstrun or run the CLI directly (see README).
- **Does it need an API key?** No.
- **Is it read-only?** Yes by default; any write/apply is an explicit flag.

