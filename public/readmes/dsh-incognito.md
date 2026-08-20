# dsh-incognito

DeepSeek Harness 无痕会话（incognito）插件——随时开一个**独立的临时子 Agent**：不继承任何父会话上下文，工作目录隔离在专用临时目录，聊天内容只显示在浮窗里，**关闭窗口即焚毁**——主会话零记录、磁盘零痕迹。

![无痕会话](https://raw.githubusercontent.com/HuiHuitie-zhu/dsh-incognito/e3d66a71fd665a66d610bedf8f8524e915b90f12/docs/window3.png)

*入口按钮（输入框加号旁）：*

![入口](https://raw.githubusercontent.com/HuiHuitie-zhu/dsh-incognito/e3d66a71fd665a66d610bedf8f8524e915b90f12/docs/window1.png)

## 功能

- **一键开启**：输入框加号旁的入口按钮，打开无痕卡片窗，输入条自动切换为无痕输入条
- **完全隔离**：独立 agent preset，不继承父会话的上下文、记忆、提示词；工作目录用 `/incognito/` 专用临时目录
- **全量工具**：DSH 初始化工具集全给——shell / 文件读写 / 后台任务 / skills / goals / subagent / workflow / ralph / 联网（含 web_fetch）
- **窗口可拖动**：标题栏拖拽移动，自动避开右侧文件树
- **粉碎关闭动画**：点关闭 → 窗口淡出 + 碎片飞散 → 彻底焚毁
- **用完即焚**：close 时子会话目录延迟重试删除，刷新/重启残留自动清理

## 安装

```sh
dsh plugin --profile web add dsh-incognito
```

本地开发（file: 依赖）：

```sh
git clone https://github.com/HuiHuitie-zhu/dsh-incognito.git
# 在 ~/.dsh/profiles/web/package.json 的 dependencies 中加入：
#   "dsh-incognito": "file:/path/to/dsh-incognito"
cd ~/.dsh/profiles/web && npm install
```

## 设计要点

- Host 端走 `/api/fork-incognito/*` RPC（open / send / poll / close），**完全绕过主会话**——主会话零消息、零工具调用、零记录
- 子 agent 会话目录落在 `--incognito--` 专用目录，close 时焚毁，刷新/重启残留一键清空
- 模型用 host 级默认模型，无需配置
- 提示词 = DSH 预设提示词 + 无痕会话场景/环境说明；工具 = DSH 初始化全量工具集（`preset/agent.cordis.yml`）

## 目录结构

```
preset/              # fork preset（persona + 全量工具集）
lib/index.js         # host 端：fork-incognito RPC（open/send/poll/close + 焚毁）
lib/client.js        # 前端：入口按钮 + 无痕卡片窗（可拖动、粉碎动画）
cordis.patch.yml     # bundle patch 挂载点
```

## 免责声明

- 早期社区插件，非 DeepSeek 官方插件
- 无痕 ≠ 绝对安全：模型输出仍经 API 服务端处理；本地不留痕

## License

MIT
