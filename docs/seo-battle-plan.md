# DSH Meme Hub SEO 作战计划（2026-08 冲刺）

> 特殊时期白刃战：生态爆发窗口（topic:dsh-plugin 实测 5728 个仓库，awesome-dsh-plugin ★5503 每日更新），
> 竞品已出现（dshhub.org、hub.omdsh.dev 已在 Bing 占位）。
> **打法：先用凑合内容占位拿 URL 和主题词，再逐步替换成好内容。**

## 一、数据底盘（实数，2026-08-17 采集，禁止凭感觉）

### 1.1 Google Trends rising 榜（暴涨词，中文为主战场）
| 词 | 增长 | 判断 |
|---|---|---|
| deepseek dsh | +250400% | 品牌词爆发 |
| deepseek harness 是什么 | +123700% | 认知词，首页承接 |
| deepseek desktop | +120200% | 桌面需求，launcher 页承接 |
| deepseek harness 安装 | +98150% | install 页承接（已有） |
| cordis | +86900% | 技术词，正文自然覆盖 |
| deepseek harness 下载 | +60600% | 首页/install 承接 |
| npm / npx / node js | 数万% | 安装链路词，install FAQ 覆盖 |
| deepseek harness 招聘 | +190% | 不碰（无承接价值） |

### 1.2 联想词穷举（Google+Bing 双通道，714 唯一词，存 data/seo/keywords-suggest.json）
关键修正：
- **英文短词污染严重**："dsh skin" 联想全是护肤品/汽车中控/游戏皮肤；"dsh pet" 全是狗背带（harness 本义）。→ **中文长尾优先，英文只打全称长尾**
- vs 对比词实锤存在：`deepseek harness vs claude code / vs opencode / vs hermes`
- 报错词联想量为 0（生态太新）→ troubleshooting 只占位不重仓

### 1.3 站点现状 Schema 盘点（已具备，勿重复开发）
- 101 个插件详情页：SoftwareApplication + AggregateRating + 多图画廊 ✅
- /install：HowTo + FAQPage ✅；/plugins、/launcher：ItemList ✅
- hreflang 双语（zh/zh-TW/en/de）✅

## 二、执行清单（按批次，凑合内容占位 → 好内容替换）

### 🔴 批次 S1：分类锚点页（纯前端路由，当天完成）
| 路由 | 承接关键词（中/英） | 占位方案 | 升级方案 |
|---|---|---|---|
| `/plugins/skins` | dsh 皮肤/换肤/皮肤推荐/怎么换皮肤 · dsh skin/deepseek harness skin/theme | 现有「换皮肤色」类目 8 插件 + topics 过滤，复用 PluginCard 网格 | 加皮肤画廊预览、换肤教程段 |
| `/plugins/pets` | dsh 桌宠/鲸鱼娘/桌面宠物/桌宠怎么开 · dsh pet/whale pet | 现有「赛博宠物」类目 11 插件过滤 | 鲸鱼娘 IP 专题段、桌宠启用教程 |

TDK 原则：全称 "DeepSeek Harness" 在前，缩写 (dsh) 括号内；zh 版用口语词（桌宠/换肤/整活）。

### 🔴 批次 S2：现有页面 TDK 扩容（只改文案，不开发）
| 页面 | 补词 |
|---|---|
| 首页 `/` | deepseek harness 是什么/官网/下载/官方 · what is deepseek harness；正文加 what-is 段 |
| `/plugins` | best/top/必备/推荐/大全/有多少插件；加真实数字句"GitHub topic:dsh-plugin 生态 5728 仓库，本站精选收录"（数字必须随数据更新，build-data.py 生成） |
| `/install` | 报错词（安装失败/报错/打不开）写进已有 FAQ 文案；分系统词 Windows/Mac/Linux |
| `/launcher` | 图形界面/不用命令行/桌面版下载 |
| `/submit` | 插件开发/开发教程/投稿规范，加"开发者指南"小节 |

### 🔴 批次 S3：对比页（决策词，新站最易抢位）
| 路由 | 承接词 | 占位方案 |
|---|---|---|
| `/compare` 或博客式 `/compare/deepseek-harness-vs-claude-code` | deepseek harness vs claude code/codex/opencode · dsh 对比/区别/哪个好 | 表格对比框架（占位文案）+ 真实差异点（开源免费/插件生态/cordis 架构），H2 锚点覆盖多竞品 |

### 🟡 批次 A1：榜单页（与目录页意图互补）
| 路由 | 承接词 | 方案 |
|---|---|---|
| `/best` | best dsh plugins 2026/必备插件/top deepseek harness plugins | 从 plugins.json 按 stars 自动生成 Top N，程序化生成零维护 |

### 🟡 批次 A2：信任词 + 教程集群
| 路由 | 承接词 |
|---|---|
| `/about` 补强 | is deepseek harness safe / dsh 靠谱吗（信任验证词，爆发期量大） |
| `/guides`（后做） | 使用教程/入门/技巧（留存型，等安装流量起来再做） |

### 🟢 批次 B：占位观察区（不开发，等信号）
- `/guides/troubleshooting`：报错词现在联想量为 0，先占位文案进 install FAQ，独立页等 GSC 出现报错查询再做
- 功能词分类页（/plugins/vision、/mcp 等 13 个）：联想量全为 0。替代方案：/plugins 页加话题标签筛选（零路由成本），discover 脚本观察到某功能词起量再升级成独立页

## 三、自动化联动（已上线的基建直接用）
- `scripts/discover-plugins.mjs`（每天 10:17）：新插件提名 → 审核收录 → 详情页自动获得单品词覆盖
- `scripts/fetch-screenshots.mjs`：详情页图自动更新，Image SEO 持续生效
- **新增建议**：GSC 查询词周报 → 反哺本计划词表（哪些占位页真的有查询进来了）

## 四、纪律（白刃战期间的规矩）
1. **占位内容必须可索引**：title/description/H1 齐全、正文 ≥300 字、内链 ≥3 条，不许空壳页
2. **数字不编造**：插件数/star 数/生态数必须来自真实数据源（build-data.py 或当次采集）
3. **每批交付后**：IndexNow 推送 + GSC request indexing 催收录
4. **中文长尾优先**：英文短词歧义污染，只打 "deepseek harness" 全称长尾
5. **占位页标记**：正文顶部加注释 `<!-- SEO-PLACEHOLDER: 待升级 -->`，方便后续替换追踪

## 五、进度追踪
| 批次 | 状态 | 完成日期 | commit |
|---|---|---|---|
| S1 分类锚点页 | ✅ | 2026-08-17 | 1391a40 |
| S2 TDK 扩容（含管道符全站 bug 修复） | ✅ | 2026-08-17 | 1127296 |
| S3 对比页（vs Claude Code/OpenCode/Codex，16 URL） | ✅ | 2026-08-17 | 60d9416 |
| Meme 轨对齐 + Schema 判重修复 | ✅ | 2026-08-17 | f090f11 |
| A1 榜单页 | ⬜ 待做 | | |
| A2 信任词+教程 | ⬜ 待做 | | |
| B 占位观察 | ⬜ 待信号 | | |
| 遗留：清理存量 compare.* 死键（含"Codex 闭源"错误旧数据） | ⬜ | | |

---
数据文件：
- `data/seo/keywords-suggest.json` — 714 个联想词穷举（Google+Bing）
- `data/seo/trends-related.json` — Trends top/rising 相关词
