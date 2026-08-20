# dsh-character-profiler

[English](./README.en.md)

DSH 写作插件：**角色性格侧写 + 出场权重统计 + 行为偏离检测**。为长篇小说提供人物一致性的量化监控，让每个角色的性格"立得住、可查证、不漂移"。

## 功能

| 工具 | 作用 | 消耗 |
| --- | --- | --- |
| `novel_profile` | 为角色生成/更新**性格侧写档案**：五维性格、动机、恐惧、价值观、说话风格（口癖/称谓）、行为习惯、情绪触发点、弱点、当前成长弧、一致性红线；同时收集全名/别称（含"老头子"这类他人称呼） | LLM（深模型可选） |
| `novel_appearance` | 统计每个角色的**出场权重与占比**：提及次数、段落数、对话段数、章节分布、权重分（提及×1+段落×2+对话×3）、占比排行与主角/配角档位；另提示正文中出现但未建档的疑似角色 | 纯本地，0 API |
| `novel_deviation` | 检测角色在正文中的行为与侧写的**偏离程度**：偏离指数 0~100、偏离点清单（类型/严重度/原文引用/建议）；区分「无铺垫的 OOC 突变」与「有因果铺垫的合理性格发展」（对照 evolution.json） | LLM |
| `novel_profiler_status` | 角色一致性总览：人物卡↔侧写档案对照、出场权重、未建档角色、建议动作 | 纯本地 |

## 工作方式

- 侧写档案写入项目的 **`lore/profiles/<角色key>.md`**。该目录位于 `lore/` 下，会被写作引擎自动注入后续写作上下文——**写正文时模型持续看到角色的性格红线**，从源头降低偏离。
- 出场统计从人物卡标题自动推导简称（「玛丽安娜·霍斯顿」→ 玛丽安娜/玛丽/霍斯顿），生成侧写后还会合并 LLM 提取的别称，越用越准。
- 偏离检测默认对照侧写档案；没有档案时退化为对照人物卡，并建议先跑 `novel_profile`。

## 安装

> **推荐：DSH 插件命令一键安装** `dsh plugin --profile web add github:MlittleFriend/dsh-character-profiler`，重启 `dsh web` 后即可使用（与下方本地脚本等效，免手动复制目录）。

1. 把本目录（`dsh-character-profiler/`）放到你方便的位置（比如项目旁）。
2. 运行 `install.ps1`（右键 → 使用 PowerShell 运行；或 `powershell -ExecutionPolicy Bypass -File install.ps1`）。
3. **重启 dsh web**（关闭当前窗口后重新运行启动命令）。重启后控制台应多出 `tool:character-profiler` 的提示词节。
4. 新会话中即可调用 `novel_profile` / `novel_appearance` / `novel_deviation` / `novel_profiler_status`。

> 安装脚本会自动：安装包到 `~/.dsh/profiles/web`、把插件加入 bundles、在 profile 的 `cordis.patch.yml` 登记插件行。**API 配置（apiKey/baseURL/model）由插件在运行时自动继承 `dsh-tool-writing` 行的配置**——key 只存在一处（tool-writing 的 patch 配置或环境变量），无需复制。

## 使用建议（流程）

```
每卷开头：  novel_profiler_status          → 看谁没侧写、谁占比异常
新角色：    novel_profile                  → 建侧写档案
例行检查：  novel_appearance               → 出场权重/占比是否失衡
写完几章：  novel_deviation                → 查行为是否漂移
弧光变化：  novel_profile                  → 更新侧写（旧档案被覆盖）
```

## 常见问题

- **角色名匹配不上？** 在人物卡里加一行 `- 别称：玛丽 / 老头子`，或跑一次 `novel_profile` 让 LLM 提取别称。
- **偏离检测总说"一致"？** 侧写是从正文提炼的，自洽是正常的；新章节行为变化后检测才有意义。也可用 `perChapter`/`maxParagraphs` 调细粒度。
- **没建人物卡的角色**（正文里的"卡尔"）不会被统计/检测，`novel_appearance` 会提示你补卡。

## 开发与验证

`test-local.mjs` 可在不重启 GUI 的情况下直接驱动引擎验证（需 DSH_WRITING_API_KEY 或读取 profile patch 中的 key）：

```bash
node test-local.mjs --stats --root "项目目录"
node test-local.mjs --profile <角色key> --root "项目目录"
node test-local.mjs --deviation <角色key> --root "项目目录"
```

## 许可

MIT
