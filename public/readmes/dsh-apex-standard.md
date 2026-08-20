# Miraculous Standard

> DeepSeek V4 系列（Pro / Flash）统一锚定 agent 预设，同时适配 DeepSeek 官方 API 与 opencode-go 订阅接口，兼容 dsh rc.7。

`Miraculous Standard` 是面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）的 agent-plane 预设。它把“首请求精确锚定”与“完整 Standard 工具能力”分离：先让 V4 Pro 稳定进入训练对齐（RL-aligned）轨迹，让 V4 Flash 稳定进入高规划质量 persona；晋升后再按模型开放对应工具目录，从而不牺牲 Standard 的完整能力。

本预设为社区实验项目，与 DeepSeek 官方无关，未获任何官方背书。文中所引实测结论均来自公开仓库的个人测量，不构成跨任务普适性承诺。

---

## 独特性

1. **双模型、双渠道统一**  
   同一预设覆盖 DeepSeek V4 Pro / Flash × 官方 API / opencode-go 四种组合。路径选择只看路由模型 id（`/flash/i`），不看 provider，避免渠道差异造成行为漂移。

2. **首请求字节级 Minimal 锚定**  
   首个请求仅暴露官方 Minimal 的真实工具对：`bash` + `str_replace_editor`，系统提示保持 Minimal 原文，并剥离所有自动注入。这是社区多轮实验验证的“V4 Pro 轨迹锚定”最稳定条件。

3. **模型感知晋升目录**  
   - Pro：晋升后保持最小常驻集（默认 5 件套），重型工具经 `dev_tool_search` 按需解锁，避免“全目录倾倒”把轨迹拉回 standard-like。
   - Flash：persona 主导、目录免疫，晋升后默认开放完整 Standard 目录，保留全部能力。

4. **统一 context-gate（默认拒绝未知注入）**  
   不只屏蔽 `skill-catalog` / `agent-instructions` 两个已知来源，而是采用 claimed-baseline 门：未晋升时只保留用户消息与用户技能手势，任何第三方插件/hook/runtime context 都不能污染首请求。

5. **非命令式 instruction-hint**  
   晋升后的 AGENTS.md 提示改为“参考文档、按需查阅”的中性措辞。社区实测表明命令式“read first and follow them”会把锚定轨迹打回 `let me`；中性措辞既能保住轨迹，又不丢失环境文档可用性。

6. **epoch 感知长会话稳定性**  
   - compaction 后自动回退受控阶段；
   - `dev_tool_search` 解锁集合按 epoch 重置，防止长对话目录单调膨胀；
   - instruction-hint / discipline hint 按 epoch 重发；
   - 进程重启后通过 durable 日志扫描去重，避免重复注入。

7. **rc7 就绪**  
   - 同步官方 rc7 的 subagent 配置（`backgroundMode: one-shot`）；
   - 受益于官方持久 Bash 延迟修复（Linux/macOS 每次调用从秒级降到百毫秒级）；
   - 受益于 max-token replay 修复，`bootstrapMaxTokens` 这类预算实验更安全。

8. **Windows 工程化**  
   `custom-bash` 自动探测 Git for Windows 安装位置，并把 Git Bash 路径 `/e/foo` 归一化为 `E:\foo`；显式 workdir 不可用时回退会话 cwd 并给出提示。

9. **零依赖、零额外调用、零合成消息**  
   无 warmup 轮、无 replay、无第三方运行时依赖；所有插件均为 Node.js ESM `.mjs`，不发起网络请求，不采集遥测。

---

## 主要作用

一句话：**在不放弃 Standard 完整工具面的前提下，把 DeepSeek V4 Pro / Flash 的“启动环境”稳定到 RL 对齐状态，并用 epoch 管理防止长会话轨迹漂移。**

- 对 Pro：解决“标准模式下工具面过大导致 `Let me` 轨迹、能力打折”的问题；
- 对 Flash：解决“默认无引导时思考浅、草草动手”的问题，同时保留全目录能力；
- 对长会话：解决 compaction、subagent、resume 后“二次首请求”失锚的问题；
- 对 Windows：解决 PTY 缺失、Git Bash 路径不兼容、每次 bash 新进程的工程问题。

---

## 安装

### 环境要求

- DeepSeek Harness（dsh）`0.1.0-rc.7`（rc.5 / rc.6 亦可运行，但推荐 rc.7）；
- Windows 需安装 Git for Windows；
- 以下渠道之一：DeepSeek 官方 API key，或 opencode-go 订阅。

### 方式一：克隆本仓库

```bash
git clone https://github.com/rinDBeans/dsh-miraculous-standard.git
# Windows PowerShell:
#   Copy-Item -Recurse .\dsh-miraculous-standard\preset "$env:USERPROFILE\.dsh\.agent-presets\miraculous-standard"
# Linux / macOS:
#   cp -r dsh-miraculous-standard/preset "${DSH_HOME:-$HOME/.dsh}/.agent-presets/miraculous-standard"
```

### 方式二：通过 bundle 安装

```bash
dsh plugin --profile web add github:rinDBeans/dsh-miraculous-standard
```

安装后完全重启 dsh，新会话中选择 **Miraculous Standard (Pro/Flash unified, experimental)**。

### 模型配置

```yaml
# DeepSeek 官方 API 或 opencode-go 订阅
agent-default-model:
  provider: deepseek            # 或 opencode-go
  model: deepseek-v4-pro        # 或 deepseek-v4-flash
  reasoningEffort: max          # 建议 max；至少 high
agent-presets:
  default: miraculous-standard
```

---

## 配置

配置位于 `preset/agent.cordis.yml`。

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `bootstrapTools` | `[bash, str_replace_editor]` | 首请求可见工具 |
| `promoteOn` | `either` | 晋升触发：`either` / `tool-call` / `assistant-message` |
| `bootstrapMaxTokens` | 未设 | 首请求输出上限（opt-in，晋升后剥离） |
| `suppressedContextSources` | `[agent-instructions, skill-catalog]` | 兼容性保留的源过滤；统一 context-gate 已覆盖未知来源 |
| `residentTools` | `[bash, str_replace_editor, dev_tool_search, skill_search, skill_load]` | Pro（及 Flash resident 模式）晋升后常驻目录；可加 `read`、`grep` 等 |
| `compactionTools` | `[read, edit, glob, grep]` | compaction 后、再晋升前的受控工具集 |
| `forcePath` | `auto` | 路径钉死：`auto` / `pro` / `flash` |
| `flashGuidance` | `true` | Flash 神模式 persona 开关 |
| `flashPersona` | 内置 w7+deep | 自定义 Flash persona |
| `flashPromotedCatalog` | `full` | Flash 晋升后目录：`full` / `resident` |
| `includeSubagents` | `true` | 子代理是否也走 bootstrap 锚定阶段 |
| `proDisciplineHint` | `false` | Pro 晋升后每 epoch 注入一次长任务纪律提示 |
| `proDisciplineHintText` | 内置文本 | 自定义纪律提示 |

---

## 设计原理

### 请求生命周期

```
用户首条消息
    │
    ▼
┌ 请求 #1 ─ bootstrap 阶段 ─────────────────────────────────────┐
│ tools   : bash + str_replace_editor（Minimal 真实 schema）     │
│ context : context-gate 默认拒绝未知注入                         │
│ persona : Pro = Minimal 原文 / Flash = 神模式五锚               │
│ budget  : adapter 默认（bootstrapMaxTokens 可选）               │
└───────────────────────────────────────────────────────────────┘
    │ 首个 durable tool/call 或 assistant/message
    ▼ 晋升（durable 事件派生，resume/reload 安全）
┌ 请求 #2+ ─ resident 阶段 ─────────────────────────────────────┐
│ Pro   : 常驻 5 件套 + 已解锁工具（可配 residentTools）          │
│ Flash : 完整 Standard 目录（默认；可配 resident）               │
│ context : 注入恢复；中性 instruction-hint 按需提示 AGENTS.md    │
└───────────────────────────────────────────────────────────────┘
    │ compaction/end
    ▼ 回退受控阶段：bootstrap 对 + compactionTools，直至新晋升信号
```

### 与上游/相邻方案的关系

- 继承 `xiaobright/dsh-anchored-standard` 的两阶段锚定与 epoch 管理；
- 吸收 `dsh-router-standard` 的 Flash persona / 深度收敛研究；
- 吸收社区 rc7 / issue #49 / #58 / #59 / #72 等修复；
- 不采用 warmup 额外模型调用，也不注入合成消息。

---

## 测试

```bash
node test/smoke.mjs
```

覆盖：双路径锚定、晋升目录、解锁、compaction 回退、epoch 解锁隔离、hint 每 epoch 一次、context-gate 未知注入拦截、resume 去重、降级路径。全部通过输出 `ALL PASS`。

---

## 已知限制

- **能力证据边界**：轨迹锚定机制有强复现，但能力增益在独立复现中仍属未决（n 小、CI 宽）；请以任务完成度、token/耗时等结果指标为准。
- **Flash 相关任务链**：紧密相关的多轮修改链上，静态引导可能为负；可设 `flashGuidance: false`。
- **Windows PTY**：rc7 的 node-pty 升级不改变 Windows process inspector 缺失问题，因此 Windows 仍使用 `custom-bash`（每次调用新进程），`read/grep` 常驻可减少 bash 调用。
- **宿主边界**：compaction 摘要质量、token 计量等属 dsh 宿主能力。

---

## 许可证

MIT License。派生自以下 MIT 项目，详见 [`NOTICE`](./NOTICE)：

- [xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard)
- [SheberDavid/v4-flash-godmode-opencode-go](https://github.com/SheberDavid/v4-flash-godmode-opencode-go)
- [yjh051108/dsh-router-standard](https://github.com/yjh051108/dsh-router-standard)
- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
