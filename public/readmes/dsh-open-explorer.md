# dsh-open-explorer

> 为 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/deepseek-harness) Web GUI 提供便捷的 Workspace 文件夹打开入口。

`dsh-open-explorer` 会在 DSH 会话标题右侧提供文件夹按钮。点击后，插件通过 DSH 的公开 Client Connection Host RPC，请求运行 DSH 的主机直接打开当前 Workspace 根目录。

## 界面

| 工作区菜单 | 会话标题按钮 |
| --- | --- |
| <img src="https://raw.githubusercontent.com/YooRarely/dsh-open-explorer/d950a30adbf8e55b77d63d6b917d9ce44ab5d7e6/assets/workspace-menu.png" alt="工作区菜单中的在资源管理器中打开" width="420" /> | <img src="https://raw.githubusercontent.com/YooRarely/dsh-open-explorer/d950a30adbf8e55b77d63d6b917d9ce44ab5d7e6/assets/header-button.png" alt="会话标题右侧的在资源管理器中打开按钮" width="420" /> |

## 功能

- 在工作区右侧的 `...` 菜单中添加“在资源管理器中打开”。
- 在当前会话标题右侧提供文件夹按钮。
- 打开当前 Workspace 根目录，而不是某个单独文件。
- 不修改或依赖 DSH 源码；只使用公开的 Client Connection Host RPC 和 Header Slot。
- 直接请求 Host 的原生打开能力，不会被可选的内置侧边栏路径拦截。
- 支持 Windows、macOS、Linux 和 WSL 的系统目录打开方式。
- 针对当前 npm DSH 的工作区点点点菜单，使用基于 ARIA 语义的浏览器兼容适配，将“在资源管理器中打开”插入现有菜单；适配失效时仍保留标题栏按钮。

## 工作区菜单兼容适配

当前 npm DSH 版本没有公开的工作区菜单 Slot，菜单由 DSH 自己渲染。插件不会替换整个工作区区域，也不依赖 DSH 私有 React 组件，而是识别公开 DOM 语义（工作区 `treeitem`、工作区操作按钮和 `menuitem`），在当前菜单打开时添加一个可撤销的菜单项。

这是一层针对当前 npm DSH 菜单语义的防御性适配：如果未来 DSH 改变这些 ARIA 语义，菜单项会安全地不显示，但标题栏按钮仍可使用。

## 安装

```sh
dsh plugin --profile web add github:YooRarely/dsh-open-explorer
```

安装完成后重启 `dsh web`：

```sh
dsh web
```

然后刷新浏览器页面即可使用。

如果你是从 DeepSeek Harness 源码运行：

```sh
pnpm dsh plugin --profile web add github:YooRarely/dsh-open-explorer
pnpm dsh web
```

### 本地开发

```sh
dsh plugin --profile web add <path-to-this-checkout>
```

本地修改后重启 `dsh web`，以加载最新的插件代码。

## 使用

1. 打开 DeepSeek Harness Web 界面。
2. 进入一个已经关联 Workspace 的会话。
3. 点击会话标题右侧的文件夹按钮。
4. 系统文件管理器会打开该 Workspace 的根目录。

## 支持的平台

| 平台 | 打开方式 | 条件 |
| --- | --- | --- |
| Windows | 文件资源管理器 | 无额外配置 |
| macOS | 系统默认目录打开器 | 无额外配置 |
| Linux | `xdg-open` | 需要桌面环境 |
| WSL | 转换为 Windows 路径后打开 | 需要可用的 Windows 桌面 |

如果通过远程浏览器访问 DSH，目录会在**运行 DSH 的主机**上打开，而不是浏览器所在电脑上。

本插件只依赖公开的会话标题 Header Slot 和 Client Connection Host RPC，不需要修改或启动 DeepSeek Harness 源码。

## 开发检查

本插件的浏览器 bundle 已直接提交为 `client.js`，无需构建工具。提交前运行：

```sh
npm test
```

## 目录

```text
dsh-open-explorer/
├── assets/              # README 界面截图
├── client.js            # Web GUI 插件代码
├── index.js             # Host 插件入口
├── cordis.patch.yml     # profile 挂载配置
├── package.json         # 插件声明
└── README.md
```

## License

[MIT](./LICENSE)
