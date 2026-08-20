# dsh-models-dev-reasoning

从 [models.dev](https://models.dev) 补齐 DeepSeek Harness 中第三方或自定义模型的思考档位，让 `llm-pi-ai` 的模型选择器也能显示 `reasoningEfforts`。

插件只处理尚未设置 `reasoningEfforts` 的模型；已有配置不会覆盖。models.dev 的 `none` 会映射为 DSH 的 `off`。

适用于手填模型、代理模型和 NewAPI 等场景。

## 工作方式

1. DSH 启动后等待 `settings` 可用。
2. 读取 `https://models.dev/api.json`，失败时回退到 models.dev 的 GitHub `dev` tarball。
3. 匹配 `llm-pi-ai` provider 下的模型并补写推理档位。

4. 将目录缓存到系统临时目录，有效期 24 小时。

没有插件配置项，也没有 `prepare` 安装脚本。

## 安装

官方 CLI 的正确格式是 `dsh plugin --profile <profile> add <source>`。Desktop 默认使用 `web` profile；其他 profile 请替换 `web`。

```sh
dsh plugin --profile web add github:aerince/dsh-models-dev-reasoning

# 可复现安装：v0.1.0 release
dsh plugin --profile web add github:aerince/dsh-models-dev-reasoning#v0.1.0

# 不可变 commit pin
dsh plugin --profile web add github:aerince/dsh-models-dev-reasoning#0893e91cbe7bdc684eaf1ed52767b8ca3289c751
```

本包是零构建 JavaScript，没有 `prepare`，不需要为它添加 pnpm `allowBuilds`。安装前提是可用的 `dsh`、`pnpm` 和 `git`。安装后重启 DSH。

DSH 会把插件写入 `$DSH_HOME/profiles/<profile>`；请确认 CLI 与 Desktop 使用的是同一个 DSH home。

## 验证与卸载

```sh
dsh --profile web --dump-config
```

配置树中应出现 `models-dev-reasoning`。打开一个 models.dev 标记为 reasoner 的自定义模型，检查模型选择器是否出现思考档位；已有 `reasoningEfforts` 的模型应保持不变。

## 卸载

```sh
dsh plugin --profile web remove dsh-models-dev-reasoning
```

## DSH 官方安装对照

本仓库按 DSH 当前官方基线（`deepseek-ai/deepseek-harness` commit `47f943859bef60e4160492346772ded9b24f765a`）核对：

| 官方要求 | 本项目 |
|---|---|
| 普通 package entry | `package.json` → `index.js` |
| `dsh.bundle.patch` | 已配置 `./cordis.patch.yml` |
| YAML patch 的 `name` 可解析 | `dsh-models-dev-reasoning` 与 package name 一致 |
| Git source 可直接安装 | 零构建 JS，无 `prepare` |
| profile 安装命令 | 使用 `dsh plugin --profile web add github:...` |
| 安装后验证 | 使用 `dsh --profile web --dump-config` |

官方参考：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.zh.md>、<https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/plugin.ts>。

## 网络、文件与权限

插件注入 `settings`，只写入 `llm-pi-ai` 下缺失的 `reasoningEfforts`。它会访问 models.dev 和 GitHub 回退地址，并在系统临时目录写入可选缓存；缓存写失败不会阻止插件运行。没有 `prepare` 安装脚本。

## License

MIT
