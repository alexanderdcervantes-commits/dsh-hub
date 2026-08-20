# dsh-clawshell

ClawShell 愿景（自感知 / 自适应 / 自组织 / 多 Agent 集群）在 **DeepSeek Harness (DSH)** 上的插件化实现。

它不再是"改宿主配置注入"的 Python 守护进程，而是一圈用 Cordis 原语写成的插件。只吸收 clawshell 的**高价值边界能力**（控制论自愈 + 信任协作 + 知识传承），底座全部交给 DSH。

## 插件清单（7 个）

| 插件 | 愿景层 | 提供能力 | 吸收自 clawshell |
|---|---|---|---|
| `sense` | L1 自感知 | `clawshell.sense`：metrics + `/clawshell/health` + 事件 | health_check |
| `adapt` | L2 自适应 | `clawshell.adapt`：鲁棒控制器 + 策略切换 + 修复升级链（完整闭环） | robust_controller + strategy + repair_escalation |
| `swarm` | L4 集群 | `clawshell.swarm`：完整版信任（加权分量+威胁窗口+衰减+持久化）+ 生态位匹配 | trust/evaluator + niche |
| `insight` | 异常挖掘 | `clawshell.insight`：错误风暴检测 + 周期摘要 + 离线检测 | InsightEngine |
| `genome` | 知识传承 | `clawshell.genome`：版本化知识 + 进化里程碑 + LRU 缓存 | heritage + evolution_tracker + cache_manager |
| `tools` | 工具面 | 7 个工具（health/repair/trust/delegate/insights/remember/recall） | — |
| `client` | 可视化 | shell.overlay 指标仪表盘 slot | — |

## 控制论闭环（adapt）——clawshell 最痛教训的解法

clawshell 的 L2 自修复是 pkill 且"杀进程不拉起、存在自杀链"。dsh-clawshell 补完了五段闭环：

```
measure(sense 采集) → decide(鲁棒控制器) → act(可逆修复 effect)
        ↑                                        ↓
   switch(策略切换机) ← escalate(升级链) ← verify(指标是否回落)
```

- **可逆修复**：每次修复注册 undo effect，卸载时逆序回滚——时间可组合。
- **verify**：修复后观察指标是否回落，判定修复有效/无效。
- **escalate**：自愈层失败 3 次 → 自动修复层，再失败 2 次 → 人工（emit 告警）。
- **switch**：健康分 + 资源压力驱动 5 态策略机（default/emergency/economy/aggressive/conservative）。

## 增强能力（v0.2.0）

- **信任驱动派发门控**：`clawshell_delegate` 支持 `minTrust` 阈值，能力匹配到的节点若无一达标则拒绝派发。
- **自适应增益调优**：adapt 按修复验证结果自动调 PID/鲁棒增益（有效提升响应、无效增大阻尼）。
- **fiber 生命周期监控**：insight 订阅 `internal/status`，把插件 fiber FAILED 纳入异常挖掘（吸收 dsh-doctor 的思路）。
- **doctor 桥**：检测到 fiber 失败/metrics 停摆时，自动调 `ctx.get('dsh-doctor')` 诊断并沉淀联合告警。
- **洞察→知识沉淀**：同类洞察反复出现达阈值，自动写入 genome 知识传承。
- **时空感知**：sense 从「30s 盲轮询」升级为「资源轮询(慢) + 事件驱动拓扑/业务感知(快)」，实时追踪插件/工具/fiber/子智能体变化。

## 完整版信任模型（swarm）

移植 clawshell shared/trust/evaluator.py 的加权模型：

```
trust = 0.4·成功率 + 0.2·在线率 + 0.2·(1-威胁惩罚) + 0.2·数据完整性
```

含威胁窗口（1h 滚动、2+ 威胁触发惩罚）、级别迁移记录、JSON 持久化、安全事件即时降级。

## 安装与验证

```sh
# 本地构建
pnpm install && pnpm exec tsc && npx tsdown

# 冒烟测试（真实 Cordis 挂载）
node smoke-test.mjs

# 安装进 DSH profile
dsh plugin --profile <name> add <本仓库路径>

# 确认 bundle 层
dsh --profile <name> --dump-config
```

## 已丢弃的冗余能力

clawshell 的 EventBus/调度/HTTP/持久化/任务板/AgentMesh/5路注入/Electron GUI 等，在 DSH 里已原生覆盖或仅对 OpenClaw 类框架有意义——全部丢弃。

## License

MIT
