# dsh-review-workflow · 通用多评委评审工作流

[English](README.en.md)

## 这是什么

一个**通用多评委评审工作流** skill。从 collaboration-review 流程脱敏泛化而来，适用于任何需要结构化评审的场景——项目评审、论文审稿、代码审查、设计评审等。

## 核心能力

| 模块 | 内容 |
|------|------|
| **6 步流程 + 6 Checkpoint** | 材料完整性检查 → 准备 bundle → N 评委并行打分 → 聚合分歧 → Critic 复核 → 出最终决定 |
| **N 评委并行独立打分** | 评委用独立 subagent 运行，互不可见，防止偏见影响 |
| **锚定一致性检查** | 两阶段分歧处理：锚定匹配 → Δ 等级裁决 |
| **Critic 独立复核** | 独立 subagent 复核流程合规性，挑战理据不足 |
| **复评支持** | 增量复评：只重评修改项相关维度 |
| **可配置** | 评审维度、评分标准、模板、评委数量均可配置 |

## 安装

```bash
dsh plugin --profile web add "github:LeslieWylie/review-workflow"
```

重启后，在任意会话中加载 skill：

```
load review-workflow
```

## 所需配置

本 skill 需要项目级配置（放在项目自己的 skill 或配置文件中）：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| rubric | 评审维度与评分标准 | 5 维度 5 分制，每维度有锚定描述 |
| bundle 模板 | 评审材料包模板 | bundle.md |
| panelist prompt | 评委 prompt 模板 | panelist-prompt.md |
| aggregation 模板 | 聚合报告模板 | aggregation.md |
| critic 模板 | 复核报告模板 | critic-report.md |
| checklist | 材料完整性检查清单 | proposal-checklist.md |
| panelist 数量 | 评委人数 | 2 |
| 评分阈值 | 各维度通过/不通过阈值 | ≥3/5 |

## 设计原则

- **场景无关**：只定义评审流程骨架。具体的评审维度、评分标准、模板由项目提供
- **角色隔离**：评委独立运行、Critic 独立 session，防止偏见
- **Checkpoint 强制**：每步有 checkpoint，未过不进入下一步
- **可审计**：所有中间产物存盘，可追溯

## 脱敏声明

本插件从内部分协作评审流程泛化提取，已移除所有内部项目引用（具体机构名称、模型名称、内部工具路径等）。

## 更新日志

见 [CHANGELOG.md](CHANGELOG.md)。

## 许可证

MIT