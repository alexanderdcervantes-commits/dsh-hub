[English](README.en.md) | 中文

# dsh-session-cost

DeepSeek Harness（dsh）Web 界面的**会话花费插件**：把当前会话的 DeepSeek API 累计花费显示为输入框旁的一个小徽标。

## 特性

- **输入框实时花费**：在 `conversation.input.right` 槽位（模型选择器左侧）显示当前会话的 DeepSeek API 花费（¥），每 5 秒刷新。
- **严格模型门槛**：**仅当会话当前模型为 DeepSeek 时生效**；使用其他模型（MiniMax、Kimi 等）时徽标自动隐藏，且**非 DeepSeek 模型的请求完全不计价、不进入统计**。
- **悬停浮窗**：弹出与项目风格一致的浮窗，展示：
  - 会话花费明细**表格**：输入(未命中) / 缓存命中 / 输出 × 数量 × 有效单价 = 金额；
  - 今日(DSH) 用量：本机 DSH 会话今日（北京时间）消耗的 DeepSeek 花费；
  - 账户余额：读 DSH 凭证中的 `DEEPSEEK_API_KEY`，经 DeepSeek 官方 `user/balance` 接口获取。
- **官方计价引擎**：按 DeepSeek 官方价格时间表对**每条** `assistant/message` 消息**按其发生时刻**逐条计价，自动应用 2026-08-17 起的高峰/空闲定价（北京时间 09:00–12:00 / 14:00–18:00 为高峰，其余时段半价），并包含插件安装之前的历史。
- **性能友好**：会话日志按 revision 缓存（5 秒轮询 = 一次 stat 比对，不重复解压解析）；今日/余额独立 60 秒节奏。

## 安装

> ⚠️ **注意**：npm 上的 `dsh-session-cost`（0.1.3）是另一个同名插件（[ChengChe106/dsh-session-cost](https://github.com/ChengChe106/dsh-session-cost)），与本仓库无关。请务必用下面的仓库地址安装本插件。

```sh
dsh plugin --profile web add github:Lzh3070/dsh-session-cost
```

国内网络可走 Gitee 镜像：

```sh
dsh plugin --profile web add https://gitee.com/lzh10602042_gitee/dsh-session-cost/repository/archive/main.zip
```

装完**重启 dsh web 服务**，浏览器硬刷新（Ctrl+Shift+R）。

首次使用：设置 → 模型 中需配置 `DEEPSEEK_API_KEY`（余额与今日统计读取该凭证；未配置时余额显示 `--`，会话花费不受影响）。

## 界面

输入框右侧的小徽标（`¥0.12`），悬停弹出浮窗：

![会话花费截图](https://raw.githubusercontent.com/Lzh3070/dsh-session-cost/98a4b6b2a233fc5caee419d552b26c21137dca1f/Snipaste.png)

浮窗内容示例：

```
当前会话花费 ¥6.55
  项目        数量      单价        金额
  输入(未命中) 3.5M     ¥1.000/M   ¥3.49
  缓存命中    111.8M    ¥0.020/M   ¥2.24
  输出      410.5K     ¥2.00/M    ¥0.821
──────────────────────────────
  今日(DSH)          ¥0.356
  账户余额          ¥197.66
```

## 价格说明

内置 DeepSeek 官方政策时间表（元 / 百万 tokens）：

| 模型 | 阶段 | 输入(未命中) | 缓存命中 | 输出 |
| --- | --- | --- | --- | --- |
| deepseek-v4-flash | 当前价（2026-05-22 起） | 1 | 0.02 | 2 |
| deepseek-v4-flash | 2026-08-17 起·高峰 | 3 | 0.1 | 9 |
| deepseek-v4-flash | 2026-08-17 起·空闲 | 1.5 | 0.05 | 4.5 |
| deepseek-v4-pro | 当前价（2026-05-22 起） | 3 | 0.025 | 6 |
| deepseek-v4-pro | 2026-08-17 起·高峰 | 9 | 0.3 | 27 |
| deepseek-v4-pro | 2026-08-17 起·空闲 | 4.5 | 0.15 | 13.5 |

价格表位于 `lib/index.js` 的 `OFFICIAL_PRICING_POLICIES`，官方调价时按 `since` 时间轴追加条目即可。

## 结构

```
cordis.patch.yml   inserts the plugin row into the host composition
dsh.plugin.json    plugin metadata (entry id + client platform)
lib/index.js       host entry: SessionCostRuntime (TypertRemoteService) +
                   official pricing engine + strict Typert manifest
lib/client.js      single-file client bundle (ModuleLoader handshake):
                   composer cost chip + hover popover (class component)
lib/invariant.js   invariants companion entry
```

## 数据流

- 宿主 `sessionCost(sessionId)`：经 `sessionPersistence.readRaw` 回放会话日志，逐条计价，按日志 revision 缓存。
- 宿主 `accountSummary()`：回放全部会话统计今日（北京时间）DeepSeek 用量；凭证 `DEEPSEEK_API_KEY` → 官方 `user/balance` 取余额。
- 客户端：`conversation.input.right` 槽位注册，5s 轮询 + 60s 账户节奏 + 悬停浮窗。

## 许可

MIT。计价引擎移植自 [dsh-deepseek-quota](https://github.com/yingjunnan/dsh-deepseek-quota)（MIT，其本身移植自 [bpc-oss/dsh-web-billing](https://github.com/bpc-oss/dsh-web-billing) MIT）。
