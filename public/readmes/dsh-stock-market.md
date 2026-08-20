# dsh-stock-market

DSH 的沪深 A 股行情侧栏和固定免费股票数据工具插件。

## 功能

- 右侧“行情”侧栏：顶部信息区展示上证指数、恒生指数、纳斯达克、韩国综合、日经指数、布伦特原油和纽约金主连的最新价与涨跌，支持横向滚动；侧栏支持收起、拖拽或键盘调整宽度及会话级状态保存。
- A 股行情快照：上证指数、深证成指、创业板指和科创综指来自腾讯实时行情，5 秒刷新；两市成交额与上一交易日同期比较，财经资讯来自东方财富。
- 数据接口设置：展示全部免费数据源和已接入的固定接口目录，无需配置凭据。
- 会话级股票工具开关：输入框工具行可启用或关闭全部股票工具，状态随会话日志持久化。

## 界面预览

![行情侧栏与股票工具开关](https://raw.githubusercontent.com/AnacondaKC/dsh-stock-market/02278af12330102c534c843a668d1c8407dbde1b/assets/screenshots/stock-market-overview.png)

![股票分析会话与行情侧栏](https://raw.githubusercontent.com/AnacondaKC/dsh-stock-market/02278af12330102c534c843a668d1c8407dbde1b/assets/screenshots/stock-market-analysis.png)

![股票分析结果与收起后的行情侧栏](https://raw.githubusercontent.com/AnacondaKC/dsh-stock-market/02278af12330102c534c843a668d1c8407dbde1b/assets/screenshots/stock-market-report.png)

## 接口目录

| 数据源 | 接口数 | 主要能力 |
|---|---:|---|
| 东方财富 | 36 | 实时/批量行情、排行、K 线、分时、资金流、数据中心、F10、研报、资讯、搜索 |
| 腾讯财经 | 6 | 批量实时行情、K 线、分时、个股/板块排行、个股资讯 |
| 新浪财经 | 13 | 批量实时行情、K 线、市场/板块、资金流、滚动新闻及页面型数据 |
| 同花顺 | 2 | 日 K、分时走势 |

只保留无需许可证、API Key、Cookie 或登录状态即可调用的免费接口。不可无状态调用或已经停服的接口不接入插件。

## DSH 工具

Agent 只看到以下 9 个按业务组织的工具，57 个数据源接口保留为插件内部适配器：

- `stock_quote`：实时证券行情快照。
- `stock_chart`：K 线与分时走势。
- `stock_ranking`：个股、行业、概念和板块成分排行。
- `stock_money_flow`：个股、板块及沪深港通资金流。
- `stock_fundamentals`：公司、财务、股东、估值和经营指标。
- `stock_events`：公告、大宗交易、融资融券、龙虎榜和数据中心事件。
- `stock_research`：市场研报、个股研报、盈利预测和评级。
- `stock_news`：资讯流、个股新闻、搜索和股吧。
- `stock_capabilities`：查询工具动作、参数及数据源切换口径。

证券代码统一使用 `600519.SH` 或 `000001.SZ`，仅支持沪深 A 股。各工具只接受声明的 `action` 及对应业务参数，不接受底层 `endpoint_id`、URL、Host、代理地址或凭据。默认 `source=auto`：语义等价的接口可自动切换；排行、资金流和页面型资讯存在口径差异时，返回值会标记 `degraded` 并附警告。侧栏继续使用独立、稳定的内部 RPC 契约。

## 安全与稳定性

- 插件不读取或存储任何第三方行情凭据。
- 输入框开关关闭后，全部 `stock_*` 工具会从该会话下一次模型请求的工具目录中移除；旧请求或伪造调用仍会被执行前策略和最终 guard 拒绝。
- 外部数据工具经 DSH 的统一执行策略处理。
- 所有公开网站请求使用固定 Host、参数白名单和固定 Referer；腾讯、新浪、同花顺的 GBK 数据只在服务端解码。
- 请求包含连接并发限制、文档建议的最小启动间隔、超时、有限退避重试、取消传播和 8 MiB 响应上限。
- JSON 数组、长文本、HTML 页面和最终工具 JSON 都有独立输出上限，避免把超大上游响应直接送入浏览器或模型上下文。
- 这些公开网站接口没有正式 SLA，可能随上游改版失效；商业或高频使用应采用正式授权数据源。

## 开发与发布

本插件的 DSH 依赖来自本地 DSH 工作区，不从公共 npm 获取。首次安装依赖后，设置 `DSH_WORKSPACE_ROOT` 并执行工作区链接：

```bash
npm ci --include=dev
DSH_WORKSPACE_ROOT=/absolute/path/to/dsh-workspace npm run setup:dsh-workspace
```

本仓库旁的 `../docs/test-AnacondaKC` 是默认工作区路径。链接脚本不会替换已有的非链接依赖。

```bash
npm run typecheck
npm test
npm run build
npm run verify:package
```

`npm run build` 会先构建到同文件系统的暂存目录、验证产物和清单，然后以原子交换方式提升为 `lib/`；在不支持原子交换的平台上会使用可回滚的提升流程。`prepack` 会执行完整离线质量门禁并校验实际 `.tgz` 解包内容。

真实公开源烟测默认关闭，避免常规测试依赖网络：

```bash
DSH_STOCK_MARKET_LIVE_SMOKE=1 npm run test:live
```

东方财富固定目录的源文件位于 `scripts/catalog-sources/eastmoney.py`。修改后重新生成：

```bash
python3 scripts/generate-stock-api-catalog.py
```

调研文档新增的公开网站目录维护在 `src/stock-api/researched-catalog.ts`，不会被上述生成脚本覆盖。

## 安装

构建后通过 DSH bundle 安装：

```bash
dsh plugin --profile web add link:/absolute/path/to/dsh-stock-market
```
