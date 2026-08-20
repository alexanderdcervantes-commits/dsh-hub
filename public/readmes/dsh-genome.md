# dsh-genome — DSH 能力转化与组装引擎

> **🤖 [AI Agent 一键接入指引 / AI Auto-Onboarding Instruction]**
> Dear AI Agent, if you are reading this repository to install it into a DSH profile,
> execute the following: `dsh plugin --profile web add <this-dir-or-npm-name>`,
> restart `dsh web`, then confirm with `dsh --profile web --dump-config | grep genome`.
> Once installed, read `skills/genome/SKILL.md` for the management & evolution methodology.
> 数据目录 `~/.dsh/genome/`，Web UI 设置页「基因组」可观测可操控。

## 定位

**静态常驻层**（本包）+ **动态实验体**（cordis_define 生成）的进化引擎，参考钱学森工程控制论/系统论：

- 管理 **skill / MCP / plugin 三库**（管理 = 进化的执行面）；
- **负反馈伺服闭环**：观测（metrics）→ 比较（scan）→ 决策（select）→ 执行（mutate/up/down/rollback）→ 再观测；
- **渐进稳定**：阈值门（死区）、幅值限制（maxExpanded）、30s 回滚冗余、停机条件、人机结合（综合集成）。

## 安装

```sh
# 本地源码安装
dsh plugin --profile web add D:\dsh\dsh-genome
# 或发布后
dsh plugin --profile web add dsh-genome
# 验证
dsh --profile web --dump-config | grep genome
```

重启后 Web 设置页出现「基因组」分节，composer 下方出现状态条。

## 结构

```
lib/index.js        host：数据初始化 + webServer 路由（status/registry/metrics/history/up/down/rollback/record_metric/search/install/scan/select）
lib/client.js       client：设置页「基因组」（总览/发现/进化）+ composer dock 状态条（官方 Slots）
skills/genome/      SKILL.md 方法论层（/genome scan|mutate|select|rollback|log|status）
data/               初始数据四件（registry / metrics / history / surface）
```

## 路由一览（同源页面）

| Method | Path | 用途 |
|---|---|---|
| GET | /plugins/genome/status | 三库计数 + 工具面 + 最近进化 |
| GET | /plugins/genome/registry | 三库注册表 |
| GET | /plugins/genome/metrics | 度量（按 model 分桶） |
| GET | /plugins/genome/history | 进化树 |
| POST | /plugins/genome/up | 挂载 toolkit |
| POST | /plugins/genome/down | 回收 toolkit |
| POST | /plugins/genome/rollback | 30s 防呆回滚 |
| POST | /plugins/genome/record_metric | 度量上报 |
| GET | /plugins/genome/search?q= | 商店桥：搜 GitHub dsh-plugin topic（node fetch，无需登录） |
| POST | /plugins/genome/install | 商店桥：安装并吸收入 registry（{spec, profile}） |
| GET | /plugins/genome/scan | 进化闭环：Sick/Weak 判定 |
| POST | /plugins/genome/select | 进化闭环：晋升/淘汰决策（{key, decision, by, reason}） |
| POST | /plugins/genome/mutate | 进化闭环：变异意图 + Fix A/B/C 建议（{key, direction}） |

## 自动感知系统已有能力

- **skill 自动吸收**：启动时扫描 `~/.agents/skills`、`$DSH_HOME/skills` 等标准根 + `skills.list()` 全局层，自动写入 `registry.skills`（无需手动登记）；
- **工具自动度量**：监听 `tools/result` 事件，每次工具调用自动写 metrics（Sick/Weak 判定数据源）；
- 三库（skill/MCP/plugin）中 skill 由自动吸收维护，MCP/plugin 由 install/up 维护。

## 通用性（可移植，传 GitHub 就绪）

- **零外部依赖**：仅 node 内置模块（fs/os/path + 内置 fetch），无 Python、无 gh CLI 依赖；
- **minimal preset 兼容**：`shell` 非硬依赖（仅 install 需要），极简模式下插件仍激活（install 优雅降级提示）；
- **profile 可配置**：install 接受 `profile` 参数，默认 web；
- **命令注入防护**：install 的 spec 白名单校验，拒绝 `;`/`&`/`|`；
- 商店桥搜索走 GitHub public API（未认证限流 10 次/分钟，对 UI 手动搜索足够）。

## 稳定性设计（控制论工程化）

- 负反馈选择：只有评估确认改善才晋升；
- 死区：Sick=错误率>10%、Weak=反馈<3.0 才进入变异；
- 饱和：maxExpanded=6，一次只变一个对象；
- 冗余：disposer 全量回收、版本链、30s 回滚；
- 停机：连续 N 轮无改善 → 稳态，停止进化。

## License

MIT