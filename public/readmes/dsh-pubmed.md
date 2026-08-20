# dsh-pubmed

DeepSeek Harness 的 PubMed 深度检索工具集。七个工具，全部走 NCBI E-utilities 公共接口，**零 API key、零本地重依赖**。

## 为什么做这个

dsh 生态里学术检索插件清一色是 arXiv / dblp / OpenAlex / Crossref（偏计算机与综合方向），**没有一个专注 PubMed 这个生物医学权威库**。本项目补上这个空位，并把"深度调查"能力带进来——不止搜文献，还能查作者、做同名消歧、统计机构发文、匹配导师学生、核查撤稿。

## 工具清单

| 工具 | 作用 | 关键参数 |
|---|---|---|
| `pubmed_search` | 文献检索，返回命中数与 PMID 列表 | `query`（支持 `[Author]`/`[Affiliation]` 等字段标签）、`retmax`、`sort`、`mindate`、`maxdate` |
| `pubmed_fetch` | 批量拉取文献元数据（标题/期刊/年份/作者/DOI） | `pmids`（逗号分隔） |
| `pubmed_author` | 作者发文调查 | `fullname`（全名拼音）、`affiliation`（可选）、`retmax` |
| `pubmed_disambiguate` | 同名作者消歧（按机构区分） | `fullname`、`affiliation`、`retmax` |
| `pubmed_institution` | 机构发文统计（含逐年分布） | `institution`、`mindate`、`maxdate`、`retmax` |
| `pubmed_mentor_match` | 导师-学生共同署名匹配 | `mentor`、`student`、`affiliation`（可选） |
| `pubmed_retraction` | 撤稿 / 学术不端核查 | `query`（人名或主题）、`retmax` |

## 安装

```sh
dsh plugin --profile web add <本仓库地址或 npm 包名>
```

本地开发时可用 file 协议：

```sh
dsh plugin --profile web add file:/path/to/dsh-pubmed
```

装完后重启 dsh 即可，工具会出现在 agent 的工具列表里。

## 使用示例

```
帮我查一下作者 "Zhang Wei" 在 PubMed 发了多少篇
```
→ agent 会依次调用 `pubmed_author`（查发文量）、`pubmed_disambiguate`（按机构消歧）。

```
查一下四川大学 2026 年发了多少篇 PubMed 论文，按年份分布
```
→ `pubmed_institution`。

```
这个作者有没有被撤稿的记录？
```
→ `pubmed_retraction`。

## 重要提示：中文作者检索

PubMed 对中文作者用「姓前名后」的全名拼音索引。查"张伟"要写 `Zhang Wei`，而不是 `Wei Zhang`。这是 PubMed 的索引规则，不是本工具的问题。

## 安全

- 本插件只请求 `eutils.ncbi.nlm.nih.gov`（NCBI 公共接口），不需要、也不读取任何 API key。
- 不读取你的 DeepSeek 凭据，不做任何网络请求到第三方。
- 代码零运行时依赖（Node 内置 fetch），无 npm 子依赖注入风险。

## 已知限制

1. **限速**：NCBI 要求每秒 ≤3 次请求，本插件内置 350ms 节流。大批量检索会相对慢，这是遵守 NCBI 规则的必要代价。
2. **作者全名索引**：`[Author]` 检索依赖 PubMed 的 ForeName 全拼索引，少数只以缩写（如 `Shen H`）索引的作者会漏。`pubmed_disambiguate` 已用 efetch 拿全名+机构做精确匹配，规避了这个问题；`pubmed_mentor_match` 基于 esearch 交集，极端情况下可能漏掉个别共同署名。
3. **机构过滤精度**：`[Affiliation]` 是词级检索而非子串检索，机构名写法不同可能导致漏检。建议先用宽泛查询，再用 `pubmed_disambiguate` 精确核对。

## 许可

MIT
