# dsh-check-update

DSH 更新检查器（npm 版）——设置页检查 `@deepseek-ai/dsh` 和已装插件是否有新版，有更新时导航标签显示红点提醒。

适配 **npm 全局安装**（`npm install -g @deepseek-ai/dsh`）：只做版本检查 + 更新指引，不做 git pull。

![DSH 更新设置页](https://raw.githubusercontent.com/HuiHuitie-zhu/dsh-check-update/872b65aa543162a8ccf8d2f9d6428208f373131c/docs/settings-update.png)

## 功能

- **设置页「DSH 更新」**：显示 DSH 本体与各插件本地/最新版本对比
- **导航红点**：任一组件有新版时，设置导航标签带 ● 红点
- **自动检查**：每 6 小时后台检查一次（结果 10 分钟缓存）
- **更新指引**：直接给出更新命令（DSH 本体 `npm install -g @deepseek-ai/dsh@latest`；插件 `dsh plugin --profile web update <name>`）
- **CSRF 防护**：检查接口仅接受 POST，防止任意网页跨站触发

## 安装

```sh
dsh plugin --profile web add dsh-check-update
```

本地开发（file: 依赖）：

```sh
git clone https://github.com/HuiHuitie-zhu/dsh-check-update.git
# 在 ~/.dsh/profiles/web/package.json 的 dependencies 中加入：
#   "dsh-check-update": "file:/path/to/dsh-check-update"
cd ~/.dsh/profiles/web && npm install
```

## 目录结构

```
host.js           # Host 面：POST /dsh-check/check 路由 + 6h 自动检查（零 import 纯 ESM）
client.js         # Client 面：设置页「DSH 更新」section + 导航红点
cordis.patch.yml  # bundle patch 挂载点
```

## 免责声明

早期社区插件，非 DeepSeek 官方插件。检查结果来自 npm registry，网络不可用时静默保留旧缓存。

## License

MIT
