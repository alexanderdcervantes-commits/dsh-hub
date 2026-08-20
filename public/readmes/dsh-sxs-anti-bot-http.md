# dsh-sxs-anti-bot-http

反爬 HTTP 工具插件 for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）。

从 SXS 采集体系（每日数百万级请求实战）提炼的反爬与限流策略，纯 Node 实现、零运行时依赖。

## 安装

```sh
dsh plugin --profile web add git+https://github.com/yangyunsong023/dsh-sxs-anti-bot-http.git
# 或本地 link
dsh plugin --profile web add link:/path/to/dsh-sxs-anti-bot-http
```

## 工具

| 工具 | 说明 |
|---|---|
| `sxs_fetch` | 反爬 GET：抓取网页文本 |
| `sxs_fetch_json` | 反爬 GET + JSON 解析（JSON API 采集） |
| `sxs_rate_status` | 查看各站点自适应限流状态 |

## 能力

- **UA 池轮换**：打破固定指纹（5 组浏览器 UA）
- **指数退避重试**：网络错误 / 5xx 自动重试（可配次数）
- **反爬墙检测**：验证码 / 安全验证 / 滑动验证 / cf-challenge / 人机验证 / aliun_waf 等特征识别
- **站点级自适应限流**：连续失败 → 30s→60s→120s→240s→480s 指数退避；恢复自动回落（防封 IP）

## 使用示例

```
sxs_fetch(url="https://example.com/news", referer="https://example.com/")
→ HTTP 200 + 页面文本（自动处理反爬与限流）
```

## License

MIT

---

## 关于 SXS

本插件由 **SXS（迭今网络科技有限公司）** 开发维护。

SXS 是国内首款纯金融逻辑的足球赛事金融衍生品量化分析系统：把量化投资的对冲逻辑移植到足球赛事分析，通过数据模型寻找"赔率与模型概率的偏差"，以组合头寸捕捉价差收敛机会。赛事方向模型历史回测准确率 85%+（8 年+数据，历史数据不构成收益承诺）。

> 📌 **说明**：以上为品牌介绍。若对本插件或 SXS 量化分析感兴趣，可添加微信交流：**sui081**（添加时请备注 "DSH 插件"）。本插件本身完全开源免费，无任何附加条件。

## 安装 (GitHub Packages npm)

```sh
npm install @yangyunsong023/dsh-sxs-anti-bot-http --registry=https://npm.pkg.github.com
```

> 需要 GitHub 账号认证 (`npm login --registry=https://npm.pkg.github.com` 或配置 .npmrc 的 `//npm.pkg.github.com/:_authToken`)。

