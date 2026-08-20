# dsh-agentframe-suite

**AgentFrame 三件套整合包** —— 一条命令装齐记忆 + 压缩 + 主动调度。

> 三个插件分别被 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)（1300+ ⭐ 社区精选列表）收录。
> 这个整合包把它们打包成一个安装单元。

## 安装

```bash
dsh plugin --profile web add github:ljsysfurryACE/dsh-agentframe-suite
```

一条命令，三个插件全部激活：

| 插件 | 分类 | 干什么 |
|------|------|--------|
| **dsh-compaction** | Tools | 确定性语义提取替换 LLM 摘要（压缩零模型调用） |
| **dsh-memory-director** | Memory | LLM 决策的跨会话记忆（记住什么由模型定） |
| **dsh-aura-scheduler** | Workflow | 价值网络主动调度（V = 紧迫度+相关性−打扰代价） |

## 为什么整合

- **一个入口**：不用分别找三个仓库、装三次
- **配置开箱即用**：cordis.patch.yml 已带完整默认配置
- **协同工作**：compaction 管上下文、memory 管记忆、aura 管主动开口——三件套本来就是一套设计

## 配置

装完可以在设置页/配置里分别调整各插件：

```yaml
- id: compaction-agentframe   # 压缩
  config:
    semantic: true            # 语义提取
    physical: true            # 物理压缩
    bytesPerToken: 7776
- id: memory-director         # 记忆
  config:
    model: deepseek-v4-flash
    dedupThreshold: 0.8
    forgetThreshold: 0.1
- id: aura-scheduler          # 主动调度
  config:
    quietHours: [23, 8]
    offPeakHours: [2, 7]      # 低谷时段省钱
    alpha: 0.4
    beta: 0.4
    delta: 0.2
```


## 🖥️ WebUI 控制面板（v1.1 新增）

安装后，Web 界面的会话视图会出现 **AgentFrame** tab（在 Chat/Trajectory/Context 右侧）：

```
🧠 记忆   — MemoryDirector 的记忆条目 (文本 + 重要度)
📦 压缩   — 最近压缩运行 (保留 vs 剔除 比例条)
💓 心跳   — Aura 价值网络实时状态 (V 值/心跳数/主动次数)
           + 传感器触发计数 + 静默/低谷价 徽章
```

- 数据每 5 秒自动刷新
- 中英文双语界面
- 无额外运行时依赖（esbuild 打包，React 由 Web 平台注入）

### 架构

```
Client (web tab)                 Host (Cordis 插件)
┌──────────────────┐   RPC  ┌──────────────────────┐
│ conversation.view │ ◄────► │ connection.rpc.handle │
│  AgentFrame tab   │ /agentframe-suite │ /agentframe-suite │
│  React 渲染面板    │       │ 读 ctx.memory/compaction/aura │
└──────────────────┘        └──────────────────────┘
```


## 验证

```
✅ 三插件 cordis.patch.yml 注册条目完整
✅ suite 服务聚合状态 (compaction/memory/aura)
✅ 依赖版本锁定 (0.1.0 / 0.1.0 / 0.2.0)
```

## 关联仓库

- [dsh-compaction](https://github.com/ljsysfurryACE/dsh-compaction)
- [dsh-memory-director](https://github.com/ljsysfurryACE/dsh-memory-director)
- [dsh-aura-scheduler](https://github.com/ljsysfurryACE/dsh-aura-scheduler)
- [AgentFrame v3](https://github.com/ljsysfurryACE/AgentFrame-v3)

## License

GPL-3.0 © Cloud LTE Studio / AgentFrame
