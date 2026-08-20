# dsh-inspiration-deck-workshop

「灵感演示工坊 / Inspiration Deck Workshop」的 **DeepSeek Harness (DSH) 插件化分发包**。

安装后自动向 DSH 技能系统注册 `inspiration-deck-workshop` 技能：本地静态 HTML 演示文稿工作台——6 套 deck 模板、25+ 布局、主题/动效展示馆，带 `validate` 校验与 PNG/PDF 导出 CLI（纯 Node 内置模块，零 npm 依赖）。

## 安装

```sh
dsh plugin --profile web add dsh-inspiration-deck-workshop
```

重启 DSH Web（`dsh --profile web`）后，技能出现在技能目录中，任意会话可直接让 agent 按技能工作流生成 HTML 演示文稿。

> 需要 PNG/PDF 导出时，本机需有 Chrome/Chromium（DSH 的 Playwright 缓存即可）。

## 用法（agent 侧）

加载技能后按 SKILL.md 工作流：

```sh
node "<技能资源目录>/tools/cli.mjs" list decks
node "<技能资源目录>/tools/cli.mjs" new <deck-name> --template <deck-id> --theme <theme-id>
node "<技能资源目录>/tools/cli.mjs" validate <deck-path> --write-manifest
node "<技能资源目录>/tools/cli.mjs" export <deck-path> --format pdf --out <out.pdf>
```

> 说明：`cli.mjs` 的所有路径都锚定在技能目录内，生成的 deck 默认写到技能目录；需要放到会话工作区时用文件工具移动即可。

## 本地开发 / 安装未发布版本

```sh
# 从本包目录直接装（链接模式）
dsh plugin --profile web add ./dsh-inspiration-deck-workshop

# 或打 tarball 后安装
pnpm pack
dsh plugin --profile web add ./dsh-inspiration-deck-workshop-0.1.0.tgz
```

## 发布（作者执行）

```sh
# 1. 确认包名未被占用
npm view dsh-inspiration-deck-workshop

# 2. 登录 npm（首次）
npm login

# 3. 构建产物并发布（files 已限定 index.js / cordis.patch.yml / skills/）
pnpm pack --dry-run   # 先看 tarball 内容
npm publish

# 4. 验收：全新 profile 安装
dsh plugin --profile web add dsh-inspiration-deck-workshop
```

> 发布前请确认 license 与版权声明符合你的分发计划（当前 package.json 声明 MIT）。
