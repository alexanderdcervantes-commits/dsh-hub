# 🧠 dynamic-schulte-dsh

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg?style=flat-square)](LICENSE)

中文 | [English](README.en.md)

> 动态舒尔特方格 · DeepSeek Harness 等待时间小游戏插件。

模型不参与游戏——它专门在**等待模型回复**时打开，边玩边等。插件在 dsh Web UI
的侧边栏底部注册一个「舒尔特」入口；当前会话模型思考中时，入口会亮起呼吸绿点提示。

## 功能

- 🎯 **静态网格**：经典 n×n 舒尔特方格（3×3 ~ 7×7），按顺序点击 1..N
- 🎡 **动态轮盘**：数字分布在同心圆环上，轮盘按可调转速旋转，训练手眼协调与抗干扰能力
- 💚 **等待提示**：模型思考中时，侧边栏入口与面板头部同步显示提示
- 💾 **本地持久化**：历史记录与设置存于浏览器 localStorage，无需后端
- 可选增强：目标数字高亮 / 随机色彩干扰

## 截图

<img src="https://raw.githubusercontent.com/marvin9551/dynamic-schulte-dsh/bba63b7d430c598915c824704238fa21a52f96d2/docs/screenshots/gameplay.png" width="420" alt="动态轮盘游戏截图">

## 安装

本插件声明了 `dsh.bundle` 清单，可通过 `dsh plugin add` 安装：

```sh
# 1. 构建（或使用已发布的产物）
pnpm install
pnpm build

# 2. 安装进 profile
dsh plugin --profile <name> add -w /path/to/dynamic-schulte-dsh

# 3. 启动 Web UI
dsh --profile <name>
```

打开 Web UI 后，在侧边栏底部点击「舒尔特」即可开玩。卸载：

```sh
dsh plugin --profile <name> remove dynamic-schulte-dsh
```

## 开发

```sh
pnpm install        # devDeps: typescript / tsdown / react 类型
pnpm typecheck      # tsc --noEmit（框架类型通过 tsconfig paths 指向本地 deepseek-harness 检出）
pnpm build          # tsdown → lib/index.js(host 占位) + lib/client.js(浏览器 bundle)
pnpm verify:host    # 构建产物冒烟验证
```

## 架构

- **host 半**（`src/index.ts`）：占位插件。游戏为纯浏览器端，host 半仅作为 Cordis
  Loader 行与 `dsh.client` 客户端包发现的载体，不注册任何能力。
- **client 半**（`src/client/`）：浏览器 bundle，注册 `sidebar.footer.action` 槽位；
  面板内为完整游戏——`engine.ts` 为纯 TS 状态机（无 React 依赖），
  `GridBoard`/`RouletteBoard` 分别渲染静态网格与动态轮盘。
- **构建**：`tsdown.config.ts` 复刻 harness 仓库的 client bundle 约定——平台模块
  外部化、其余内联，产出 `window.__ModuleLoader__.load({id, factory})` 闭包工厂，
  由 web shell 以 `/plugins/dynamic-schulte-dsh/client.js` 提供。

## 兼容性

- 运行环境：dsh Web UI（`@deepseek-ai/dsh-web-app` bundle）
- 依赖：React 18（平台模块），无后端/无模型参与
- 需要浏览器 localStorage 支持

## License

MIT
