# zotero-wave-rag

面向 Zotero 论文库的**浪潮式 RAG** 细节检索系统 —— DeepSeek Harness (DSH) 外部插件（纯 TypeScript，零运行时依赖，`node:sqlite` 直读 Zotero 库）。

在传统向量 RAG（KNN 最近邻）之上，移植并实现了 **VCPToolBox** "浪潮语义动力学" 的四个核心思想
（参考项目：[github.com/lioensky/VCPToolBox](https://github.com/lioensky/VCPToolBox) ｜
[官网 vcptoolbox.com](https://www.vcptoolbox.com) —— 本仓库按其公开文档所述算法思想**独立重新实现**，未搬运其代码，并在 Zotero 论文库场景落地为可评测的检索系统）：

1. **标签河道图传播** —— 论文为节点、共享标签为河道边（权重 ∝ 1/标签稀有度），查询先做稠密召回得种子，再沿图做 personalized-PageRank 式多跳传播，挖出"语义不相似但沿关系链真实相关"的论文；
2. **虫洞跳转 (Wormhole)** —— 预计算"结构相连但语义疏远"的桥接边（共享作者/收藏夹、无共享标签、低向量相似），让能量跨领域跳跃；
3. **钟型阻尼 (Bell Damper)** —— 贪心选集时对与已选论文高度同质的候选做重叠惩罚，抑制"同义回音"、保证多样性；
4. **Ω 泛函重排** —— `score = Π[0,1]( α·语义基线 + β·拓扑创新 + γ·直接锚点 )`，其中创新通道只奖励"传播分超过其标签类期望"的候选（对应 RiverMemo Topology V3 的条件创新项），锚点通道保护 hop-0 事实匹配（查询点名标题/作者/标签）。

配套：**论文细节卡生成**（元数据 + 方法/贡献/实验 + 图邻居关联 + 证据引文）、**与 NaiveRAG 基线的消融评测**、**超参网格搜索**、**claim–evidence 忠实度校验**。

## 架构

```
zotero.sqlite(node:sqlite) / 内置示例库
  → 元数据/作者/标签/收藏夹/批注/全文(fulltextItems)
  → 分块 → 可插拔嵌入(hash 离线 | API) → 标签河道图(含wormhole候选边)
  → 稠密种子 → 图传播 → 虫洞 → Ω重排 → 钟型阻尼 → Top-K
  → BM25 全文稀疏通道 + RRF 融合
  → 细节卡生成(抽取式 | LLM，逐句证据校验)   →   评测/消融 CLI
```

## 数据接入

- **直读 Zotero 数据目录**：指向含 `zotero.sqlite`（及 `storage/` PDF）的目录即可，无需导出/迁移；
- **两级索引成本工程**：`ZWR_INDEX_LEVEL=abstract` 只嵌入标题+摘要（成本约全文字级的 1/60），
  细节卡直接使用已提取的 PDF 全文（按需切块，不需要嵌入）；`fulltext` 级完整嵌入全文；
- **增量嵌入缓存**（缓存 v3）：per-paper 内容哈希，只重嵌变化的论文；全库未变时零嵌入调用直接命中；
- **Zotero 6/7 适配**：Zotero 6 的 `fulltextItems.indexableText` 存原始全文直接读取；Zotero 7
  移除该列后自动回退 **poppler `pdftotext`** 提取（磁盘缓存）；附件 `path` 新旧两种格式兼容；
  中文/日文论文无空格分词问题由 CJK 边界处理解决；
- **校验**：`node scripts/check-zotero-dir.mjs <数据目录>`。

```sh
ZWR_DATA_DIR=/path/to/zotero node scripts/ingest.mjs   # 建索引（全文+索引缓存于 .zwr-cache/）
node scripts/query.mjs "查询" --detail                  # 直接查询
```

## DSH 插件工具

| 工具 | 说明 |
|---|---|
| `zotero_status` | 数据源 / 索引状态 / 模型 provider / 浪潮超参 / 语义可用性 |
| `zotero_search` | 浪潮式检索（wave + BM25 + RRF），返回命中 + Ω 通道分数 + 召回理由 + 证据 snippet，支持 `type` 方法类型过滤 |
| `zotero_paper_detail` | 单篇论文细节卡（元数据/方法/贡献/实验/关联/证据，带页码） |
| `zotero_compare` | 多篇论文并排对比 + 共享标签/作者 |
| `zotero_embedder` | 嵌入模型预设列表与切换（持久化） |

## 检索内容策略（本地、零 API 成本）

1. **全文 BM25 稀疏通道 + RRF 融合**（`retrieval/bm25.ts`）：BM25 不需要嵌入，
   因此全部正文都能免费建词法索引——精确术语、方法名、缩写（VCCT/CZM/PDDO）只出现在正文也能命中；
2. **领域查询扩展**（`retrieval/expand.ts`）：缩写→全称、**中文↔英文桥**（近场动力学→peridynamics、
   拉弯耦合→tension bending coupling…），跨语言检索互通；
3. **标签自举**（`ingest/autotags.ts`）：从标题+摘要自动提取领域词作为 `autoTags`
   （不污染用户标签，只进图/BM25），让浪潮的"标签河道"在用户未打标签的库上重新有水。

## 忠实度校验层（RAG 失败案例驱动的两项能力）

1. **methodType 自动分类**：标题+摘要关键词打分 → `experimental / numerical / analytical / review / mixed`；
   细节卡与检索命中都带该字段，`zotero_search` 支持 `type` 过滤——数值模型论文不会混进"试验"查询结果；
2. **claim–evidence 校验器**（`generate/claim_check.ts`）：LLM 生成细节卡后逐句校验——复用插件自身的
   BM25 词管线和中英桥词典，判"该句是否被证据支持"；不支持句标注「⚠ 此句未在证据中找到直接支持」
   而非静默删除（含跨语言支持）。

> 局限（如实）：校验为词法级（含中英桥），语义级蕴含（近义改写）需 API 嵌入或 NLI 模型。

## 嵌入模型选择（用户入口）

两个入口，选择即持久化（`~/.config/zotero-wave-rag/config.json`），索引缓存按模型隔离、切换后自动重建：

- **DSH 工具** `zotero_embedder`：`list` 查看预设与当前模型；`set <id>` 切换；
- **CLI**：`node scripts/embedder.mjs list | set <id> | status`。

| id | 模型 | 需要 API key | 说明 |
|---|---|---|---|
| `hash` | 离线哈希（免费） | 否 | 无依赖、可复现，开箱即用 |
| `bge-m3` | BAAI/bge-m3 | 是 | 文本专用、性价比高（推荐） |
| `qwen3-embed-8b` | Qwen/Qwen3-Embedding-8B | 是 | Qwen 系文本嵌入 |
| `qwen3-vl-embed-8b` | Qwen/Qwen3-VL-Embedding-8B | 是 | 多模态；纯文本任务不划算 |

运行时配置文件还包含 `dataDir` 与 `indexLevel`——数据目录与索引粒度都可运行时切换，**无需在服务器启动时注入环境变量**。
优先级：运行时配置（用户显式选择）> 环境变量（`ZWR_EMBEDDER*`/`ZWR_DATA_DIR`/`ZWR_INDEX_LEVEL`）> 默认值。
API key 只从本地 `.env.local`（gitignored）读取，不落入预设注册表。

## 参考与致谢

- **VCPToolBox**（浪潮语义动力学 / TagMemo / RiverMemo Topology V3 算法思想的来源）：https://github.com/lioensky/VCPToolBox ｜ https://www.vcptoolbox.com
- **llm-for-zotero**（RAG/Embedding 工程实践参考，混合检索与嵌入缓存模式借鉴）：https://github.com/yilewang/llm-for-zotero

> 说明：本项目的浪潮检索核心（标签河道图传播 / 虫洞跳转 / 钟型阻尼 / Ω 泛函重排）是对 VCPToolBox
> 公开文档所述算法思想的独立 TypeScript 实现，不包含其代码；检索/评测/成本工程等为本仓库自研。

## DSH 平台更新注意（踩坑实录）

DSH 快照更新到 profile-patch 架构后，**旧 `~/.dsh/config.yaml` 覆盖层被彻底移除**，外部插件改由
`~/.dsh/cordis.patch.yml`（home 级）与 `~/.dsh/profiles/web/cordis.patch.yml`（profile 级，启动时应用）挂载。
症状：`dshx list` 显示 `[on]` 但工具全部缺失（管理 API `/api/dshx/list` 的 `warnings` 列出声明未挂载的工具）。

迁移方法：把插件 insert 行（文件路径 name）写入两个 patch 文件，并迁移既有用户配置行。
**注意**：每次 DSH 自更新会切换 staging 目录，patch 里的文件路径需随之刷新（`dshx install` 仍写旧 config.yaml，
属 dshx 与新运行时的版本错位，平台修复前需手动维护 patch）。

## 开发

```sh
pnpm run build    # tsc -> lib/
pnpm run verify   # 以宿主 tsx loader 挂载插件并逐个执行工具（含宿主侧 schema 校验）
node scripts/ingest.mjs    # 建索引
node scripts/eval.mjs      # 消融评测
node scripts/sweep.mjs     # 超参搜索
node scripts/preflight.mjs # 工具输出 schema/无损预检
dshx install zotero-wave-rag .   # 安装进 DSH checkout
dshx list / dshx verify zotero-wave-rag
```

