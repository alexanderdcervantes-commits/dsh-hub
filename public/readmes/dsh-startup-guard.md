# 🛡️ dsh-startup-guard

简体中文 | [English](README.en.md)

> DeepSeek Harness 启动守卫 —— 在启动前修复会话日志、预检插件组合、执行宿主插件冒烟测试并隔离崩溃源，让「插件损坏 / 日志损坏」再也无法把 DSH 卡死在启动。

![Check](https://github.com/aokamoaki/dsh-startup-guard/actions/workflows/check.yml/badge.svg) ![version](https://img.shields.io/badge/version-1.0.0-blue) ![npm](https://img.shields.io/npm/v/dsh-startup-guard) ![license](https://img.shields.io/badge/license-MIT-green) ![node](https://img.shields.io/badge/node-%3E%3D22.13-339933) ![dsh](https://img.shields.io/badge/DSH-web-4d6bfe) ![tests](https://img.shields.io/badge/tests-73%20passed-brightgreen)

---

## 📖 简介

DSH 的功能由大量第三方插件组合而成：某个插件包缺失、patch 语法损坏、client 产物未构建、甚至宿主 `apply()` 抛一个运行时异常，都可能让整个应用**启动即崩**。dsh-startup-guard 在启动早期异步执行七道检查，能自动修复 / 回滚 / 隔离问题源——**它是「解析 → 组合 → 执行 → 崩溃兜底」的四层防线**，而不仅仅是一组文件检查。

安装后**零配置**即生效，日常开销 < 0.5s。

## ✨ 核心能力

| # | 检查 | 行为 |
| :-- | :-- | :-- |
| 1 | **会话日志修复** | 修复 `session.jsonl[.zstd]` 的 seq 损坏（删重复行或截断到已提交点）；帧级检测 zstd 永久 torn 尾帧并截断；清理已删除会话的过期缓存条目。修复前**原件备份**到 `repair-backups/` |
| 2 | **清单快照 + 指纹** | 每个 profile 的 `package.json` / `cordis.patch.yml` / pnpm 清单 + **link 插件源码**快照到 `plugin-snapshots/`，记录每 bundle 的 host/client/patch 内容指纹（保留最近 N 份） |
| 3 | **Bundle 预检 + 回滚** | 校验第三方 bundle 目录可解析；缺失时回滚到最新可完全解析的快照（24h 宽限防死循环）；坏清单另存为 `package.json.broken` |
| 4 | **组合预检 + 修复** | 检测 entry id 重复、`name:` 不可解析、YAML 致命形态；`name:` 失效的 row **自动禁用**（带备份）；致命形态在 `strict` 模式写块标记，启动器拒绝启动 |
| 5 | **客户端 bundle 有效性** | 校验 `exports["./client"]` 存在、注册 `__ModuleLoader__.load`，并**在 vm 沙箱真实执行加载**；检测跨 bundle 重复 client id；损坏自动禁用 |
| 6 | **宿主 apply() 冒烟** | 在子进程 + mock Cordis 环境执行每个第三方插件的 `apply()`，识别「启动即抛」的运行时错误（如 `ReferenceError`）；结果按内容指纹缓存 |
| 7 | **崩溃隔离** | 启动器/桌面应用检测到上次启动崩溃时写崩溃标记，**宿主插件也会自写启动标记**（`dsh-boot-state.json`：启动时写入、正常关闭清除、异常退出遗留）——两类证据都让本次启动**强制全量冒烟**并自动禁用冒烟失败的插件，让「崩溃 → 自动禁用 → 恢复启动」闭环成立。**纯 web（`dsh web`，无任何外壳）同样生效** |

## 🚀 快速开始

```bash
dsh plugin --profile web add dsh-startup-guard          # npm（预构建，免构建授权）
# 或从源码安装：
dsh plugin --profile web add github:aokamoaki/dsh-startup-guard
```

> 已发布到 npm：`dsh-startup-guard@1.0.0`（[npm 页面](https://www.npmjs.com/package/dsh-startup-guard)）。

重启 `dsh web` 后自动生效。首次启动会：

1. 扫描并（如有需要）修复会话日志；
2. 快照当前插件清单；
3. 对每个第三方插件做一次宿主冒烟 + 客户端校验；
4. 把结果写入 `~/.dsh/dsh-preflight-report.json` 供你查看。

## ⚙️ 模式与配置

配置文件：`~/.dsh/dsh-startup-guard.json`（缺省使用默认值）。

| 模式 | 行为 |
| :-- | :-- |
| `report` | 只检测与报告，**绝不修改任何文件** |
| `fix`（默认） | 自动修复 / 自动禁用 / 自动回滚 |
| `strict` | `fix` + 致命组合形态写块标记，启动器拒绝启动并弹窗 |

```json
{
  "mode": "fix",
  "smoke": true,
  "smokeTimeoutMs": 15000,
  "clientVmCheck": true,
  "clientFactorySmoke": false,
  "quarantineOnCrash": true,
  "autoRepairComposition": true,
  "tornTailGraceMs": 300000,
  "keepSnapshots": 10,
  "exclude": ["some-bundle-i-trust"]
}
```

| 配置项 | 默认 | 说明 |
| :-- | :-- | :-- |
| `mode` | `fix` | `report` / `fix` / `strict` |
| `smoke` | `true` | 是否执行宿主 apply() 冒烟 |
| `smokeTimeoutMs` | `15000` | 单个冒烟子进程超时 |
| `clientVmCheck` | `true` | 是否在 vm 中真实加载 client 产物 |
| `clientFactorySmoke` | `false` | 是否额外调用 client factory（stub require） |
| `quarantineOnCrash` | `true` | 崩溃标记在场时强制全量冒烟 |
| `autoRepairComposition` | `true` | 自动禁用 `name:` 失效的 patch row |
| `tornTailGraceMs` | `300000` | 判定"永久 torn 尾帧"的停写时长 |
| `keepSnapshots` | `10` | 保留的快照份数 |
| `exclude` | `[]` | 永不触碰的 bundle 名单 |

## 🛡️ 自动禁用的安全策略

冒烟跑在 mock 环境，失败可能是真实 bug，也可能是插件依赖真实 DSH 服务的环境缺口。因此：

- **单独的冒烟失败不会自动禁用**（只写入报告与 `fixNeeded`）；
- 上次启动**确实崩溃过**（崩溃标记在场）→ 冒烟失败插件自动禁用；
- 插件显式声明 `"dsh": { "smoke": true }` → 冒烟失败自动禁用；
- 插件声明 `"dsh": { "smoke": false }` 或在 `exclude` 中 → 跳过冒烟；
- 客户端产物损坏（解析类检查）→ 照常自动禁用。

误禁用时，删除 profile `cordis.patch.yml` 里对应的 `- id: "xxx" / disabled: true` 条目即可（原 patch 已备份到 `repair-backups/`）。

## 🗂️ 数据位置

```
~/.dsh/
├── dsh-preflight.log            # 运行日志（超阈值自动轮转 .old）
├── dsh-preflight-state.json     # 扫描状态 + 冒烟指纹缓存
├── dsh-preflight-report.json    # 每次运行的机器可读摘要
├── dsh-crash-state.json         # 崩溃标记（启动器/桌面应用写入，guard 消费后删除）
├── dsh-boot-state.json          # 启动标记（宿主插件写入、正常关闭清除；异常退出时作为崩溃证据）
├── dsh-preflight-block.json     # strict 模式拦截标记（启动器读取）
├── dsh-startup-guard.json       # 配置（可选）
├── repair-backups/              # 修复/禁用前的原文件备份
└── plugin-snapshots/            # 清单 + link 源码 + 指纹快照
```

## 🔌 集成

guard 有**三个入口**，任一崩溃场景都有兜底；**纯 web（不经任何外壳直接 `dsh web`）也具备崩溃隔离**——宿主插件自写启动标记，上次启动未正常结束即视为崩溃：

1. **桌面客户端**（dsh-desktop-app）：spawn server 前以子进程运行 `guard-runner.mjs`；server 崩溃时写崩溃标记，正常退出清除启动标记
2. **Web 启动器**（dsh-launcher.ps1）：启动循环内调用 `guard-sessions.mjs`；崩溃时写标记；发现 strict 块标记则拒绝启动并弹窗；正常停止清除启动标记
3. **宿主插件**：dsh web 启动早期异步执行；写/清启动标记，并据启动标记触发隔离

CLI：

```bash
node guard-sessions.mjs                # fix 模式
node guard-sessions.mjs --dry-run      # 只报告，不修改任何文件
node guard-sessions.mjs --mode report  # 同 dry-run
node guard-sessions.mjs --mode strict  # fix + strict 拦截
```

核心 API：

```js
import { runGuard } from 'dsh-startup-guard/lib/guard-core.mjs';
const r = await runGuard(home, { dryRun: true });
// r: { repaired, rolledBack, autoDisabled, broken, hostBroken,
//      smokeUnresolved, issues, fixNeeded, blocked, crash, lines, ... }
```

## 🛠️ 开发

```
dsh-startup-guard/
├── lib/
│   ├── index.js          # 宿主入口（fire-and-forget，动态 import）
│   └── guard-core.mjs    # 核心：runGuard + 全部检查
├── test/guard-core.test.mjs  # 73 个用例（node:test，mock home，零依赖）
├── cordis.patch.yml      # bundle 注册
└── package.json
```

```bash
npm test                          # node --test（73 个用例）
node guard-sessions.mjs --dry-run # 对真实 home 干跑（只读）
```

**设计原则**：

- **fire-and-forget**：守卫自身失败只写日志，绝不抛进启动流程；
- **原子写**：所有文件修改均 tmp+rename，中途崩溃不留半写文件；
- **优雅降级**：会话解码器缺失时只跳过会话扫描，其余检查照常；
- **单实例锁**：`dsh-preflight.lock` 串行化多个入口，避免并发写竞态。

## 📄 许可

[MIT](./LICENSE)

---

*DeepSeek Harness 社区插件，与 DeepSeek 官方无关。*
