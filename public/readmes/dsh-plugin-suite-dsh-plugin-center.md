# dsh-plugin-center

DeepSeek Harness 社区插件中心。

## 功能

- 从 GitHub `dsh-plugin` Topic 和 `awesome-dsh-plugin` 社区目录读取插件。
- 展示插件描述、来源、精选状态和当前安装版本。
- 安装前要求用户确认，服务端只接受 npm 包名或 GitHub 仓库来源。
- 在设置页和 `DSH-better-sidebar` 侧边栏中提供插件中心入口。
- 可配置自动检查开关、检查间隔、稳定版/测试版通道和目标 profile。

## 安装

本仓库的 Windows 源码安装脚本会自动把插件链接到 `web` profile：

```powershell
& .\scripts\install.ps1
```

如果单独开发本插件，需要让 `dsh-plugin-manager-core` 与本目录保持同级，并使用本仓库提供的完整安装流程。

## 安全边界

- 不执行任意远程 URL 脚本。
- 安装动作必须由用户点击确认。
- 管理接口只允许本机请求。
- 不读取或上传 API Key、聊天记录和会话内容。

## License

MIT
