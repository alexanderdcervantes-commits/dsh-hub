# dsh-plugin-updater

DeepSeek Harness 插件更新中心。

## 功能

- 检查当前 profile 中 npm 插件的稳定版或测试版更新。
- 有更新时在侧边栏和设置入口显示红点提示。
- 支持单个更新和全部更新。
- 更新前自动备份 `package.json`、锁文件和 workspace 配置。
- 更新失败时保留备份，并支持从设置页回滚。
- 提供插件健康检查。
- 对 `link:`、`file:`、`workspace:` 和 GitHub 源码链接插件跳过在线覆盖，避免破坏本地开发环境。

## 安装

请使用仓库根目录的 Windows 安装脚本：

```powershell
& .\scripts\install.ps1
```

## 设计原则

自动检查不等于自动修改：插件可以后台检查版本，但必须经过用户确认才会更新。

## License

MIT
