# dsh-commercial-ui-ux

「Commercial UI/UX」设计技能的 **DeepSeek Harness (DSH) 插件化分发包**。

安装后自动向 DSH 技能系统注册 `commercial-ui-ux` 技能：产品界面、仪表盘、后台、SaaS 工具、移动端、表单、表格、工作流状态、设计系统的**设计 / 审查 / 修复 / 实现**工作台——含 11 篇领域规则文档（Read Order 体系）、设计宪法、质量门禁与独立评估协议。

## 安装

```sh
dsh plugin --profile web add dsh-commercial-ui-ux
```

重启 DSH Web 后，技能出现在技能目录；向 Agent 说"审查这个后台界面的可用性"或"设计一个 SaaS 定价页"即自动走技能工作流。

> 本技能为纯参考枢纽型（无 CLI），agent 按 SKILL.md 的 Read Order 按需读取 `docs/` 参考文档。

## 内容

- `SKILL.md`：入口与工作流（任务模式识别 → 视觉源模式 → UX→UI→GUI 顺序 → 质量门禁）
- `docs/`：11 篇领域规则（边界、设计宪法、视觉策略推断、行业分类、模板库等）
- `evals/`：独立评估协议；`scripts/`：作者侧校验脚本（PowerShell，agent 不需要）
- `showcase/`：示例输出

## 发布 / 维护

```sh
npm pack --dry-run        # 检查内容
npm publish               # 2FA：浏览器授权或 --otp
```

维护纪律：技能本体改动 → 同步 `skills/commercial-ui-ux/` 快照 → 版本迭代重发。
完整迁移流程见 [SKILL-TO-DSH-PLUGIN.md](SKILL-TO-DSH-PLUGIN.md)（同目录模板）。
