# dsh-workshop · DSH 创意工坊

Steam Workshop 风格的 DeepSeek Harness Web UI 插件商店：浏览、搜索、一键安装社区插件，自动镜像加速与安全校验。

![features](https://raw.githubusercontent.com/loguhan/dsh-workshop/cf36f61f708100d9f2c67db3a1722a8b85b53757/docs/screenshots/workshop.png)

## 功能

- 🎮 **独立侧边栏入口**：现代图标按钮，点击即打开创意工坊面板（不占用设置页）
- 🔍 **浏览与搜索**：850+ 插件卡片式网格，支持分类筛选（UI 增强 / 工具能力 / 工作流 / 通知 / 开发 / 娱乐）、5 种排序、分页
- 🀄 **中文描述**：122 个精选插件接入官方双语描述库，详情页中英对照
- ⚡ **一键安装**：npm 优先，自动回退 GitHub 源；全程显示安装进度（阶段 + 实时日志）
- 🌐 **GitHub 镜像加速**：内置 7 个镜像自动测速选最快（ghfast.top / gh-proxy.com / ghproxy.net 等），面板可手动重新测速
- 🛡️ **安全机制**：
  - TUI/独立发行版插件黑名单（防破坏 web 启动）
  - 安装前 patch 预检（检测覆盖核心 agent 配置的危险行）
  - 安装后产物校验 + 自动回滚
  - 构建脚本被 pnpm 阻止时自动解锁（allowBuilds）重装
  - 全部写操作接口同源校验（防 CSRF / 防端口暴露被远程滥用）
- 📦 **已安装管理**：已安装视图、卸载、重新安装/更新

## 安装

```sh
# 从 npm 安装（推荐）
dsh plugin --profile web add dsh-workshop

# 或从 GitHub 安装
dsh plugin --profile web add github:loguhan/dsh-workshop

# 重启后，侧边栏出现「创意工坊」入口
dsh web
```

## 使用

1. 点击侧边栏「创意工坊」按钮（商店图标）
2. 浏览 / 搜索 / 按分类筛选插件
3. 点击卡片查看详情，点「一键安装（自动选源）」或「从 GitHub 安装」
4. 安装完成后**重启 `dsh web`** 使 bundle 插件生效
5. 安装进度、日志实时显示在面板底部

## 安全声明

- **收录 ≠ 安全背书**：目录数据来自第三方社区索引（dsh-recommend 数据仓库），插件由各自作者维护。安装任何第三方插件 = 在本机运行第三方代码，请自行审查源码。
- **本地使用**：创意工坊 API 仅接受本机回环地址（127.0.0.1 / localhost）的同源请求。请勿将 `dsh web` 端口暴露到公网（如使用 cloudflared 隧道，创意工坊的安装/卸载接口将被拒绝——这是有意为之的安全边界）。
- **冲突恢复**：极少数插件（如 TUI 类）可能与 web 冲突导致启动异常。若侧边栏入口消失，执行：
  ```sh
  npx -y @deepseek-ai/dsh plugin --profile web remove <包名>
  ```

## 开发

```sh
# 依赖
pnpm install

# 构建（产物提交到 lib/，git 源安装无需构建）
pnpm run bundle

# 类型检查
pnpm run typecheck

# 本地安装到 profile
dsh plugin --profile web add .
```

## 目录结构

```
src/
├── core.ts            # 共享核心：目录读取、已安装检测、镜像测速、安装/卸载、进度
├── host/
│   ├── index.ts       # agent 工具半（workshop_status/search/install/uninstall/refresh）
│   └── web.ts         # web API 半（catalog/install/uninstall/progress/mirror，同源校验）
└── client/
    ├── index.tsx      # 浏览器半入口：侧边栏注入 + 面板挂载
    ├── controller.ts  # 面板开关 + 中央列独占
    ├── sidebar.ts     # 侧边栏入口（自愈 DOM 注入）
    └── mount.tsx      # 中央列视图挂载
```

## 致谢与数据来源

- 目录数据：[dsh-recommend](https://github.com/zp-home/dsh-recommend)（GitHub `dsh-plugin` 话题抓取 + 公开评分模型）
- 中文描述：[awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 精选列表
- 侧边栏/面板注入模式参考：[dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)（task-board / ssh）

## License

[MIT](LICENSE) © 2026 dsh-workshop contributors

