# dsh-lean-prover

DSH(Cordis)单插件:把数学/物理推导结果钉死在 **Lean 内核 clean replay** 验证上。
任何 Agent 声称的结果都必须通过可复现、防造假的 Lean 验证才被接受;推导由 Agent/外部工具
产出,本插件只负责"裁定 + 证据存证"。

## 核心信念

- **Lean 内核 clean replay 是唯一最终数学权威。**
- **反作弊是"权威复核"而非文本扫描**:Lean 的 `#print axioms <name>` 会报告目标定理依赖的 axiom
  集;任何依赖 `sorryAx`(sorry/admit)、`*`(unsound)或未授权 axiom 的候选都会被拒绝——即使它
  源码里没有字面 `sorry`(例如 `axiom bogus` + `theorem := bogus` 编译退出码 0 且无警告,仍会被拦)。
- **statement 锁定**:解析出锁定的 theorem 名 + 命题类型,候选必须声明同名同型(candidate binding)才放行,
  再经 Lean 权威验证,防"把难的定理偷偷改简单/改名"。
- **import 白名单真正执行**:候选的 `import` 必须落在领域允许集(baseline Std/Mathlib)内,超出的拒绝。
- 不可跳步 + 强签名产物链 + 领域覆盖校验:保证每个环节真的挂载了所需检查。

## 安全边界(诚实声明)

- 本机**无 OS 级沙箱**(无 docker / bubblewrap)。Lean 会在验证 `.lean` 时执行候选代码里的
   `#eval`,因此候选可借此执行宿主命令。
- 当前采取的**软件层 fail-closed 拦截**(第 7 道 anti-cheat 硬门)会拒绝候选中的 `#eval`、
   `#reduce/#compute`、`run_cmd`、`unsafe`、`IO./System.`/文件读写等执行/逃逸向量,宁误杀
   也不放行。
- 要在受信环境里运行,部署者**必须**在容器/bubblewrap 中运行 lean runner(例如
   `bwrap --ro-bind /some/readonly-elan /usr/bin/lean ...` + 独立可写工作目录)。这是
   "真正隔离"的正确形态,当前代码保留了 runner 见 `lean/lean-runner.ts` 的抽象点以便接入。

## 关键机制(对应"可靠性")

| 机制 | 文件 | 作用 |
|---|---|---|
| M1 状态机不可跳步 | `src/run/run-state.ts` | 推导必须从 lock 开始顺序走 |
| M2 强签名产物链 | `src/run/artifact-chain.ts` | 每个产物带 SHA-256 + 产出插件 id,防改/防混挂 |
| M3 领域覆盖校验 | `src/domain/domain-registry.ts` | 领域声明的必需检查缺一个 → 拒跑 |
| M4 只读检查+唯一裁定器 | `src/run/orchestrator.ts` | 只有 orchestrator 能写最终结论 |
| M5 Lean 内核权威 + 反作弊 | `src/lean/*` | `lean` 真实编译 + `#print axioms` 权威门 + import 白名单 |

## 领域

- **linear_algebra**:纯数学验证闭环(必需: statement_lock / anti_cheat / clean_replay)。
- **fluid_mechanics**:物理领域(在形式上再加 `dimensional_consistency` 域检查——该检查是提示,
  不是证明权威,可否决但不可认证)。

## 运行

```bash
npm install          # 或 corepack pnpm install
npm run typecheck    # tsc
npm test             # node --import tsx/esm test/run.smoke.ts

node --import tsx/esm test/acceptance.ts       # 8 条验收断言 A1–A7(含真实 Lean)
node --import tsx/esm test/anti-cheat.ts       # 16 条反作弊权威断言(#print axioms + import 白名单 + #eval 逃逸)
node --import tsx/esm test/dimension.ts         # 7 条量纲一致性断言
node --import tsx/esm test/fluid-domain.ts      # 3 条流体域门断言
node --import tsx/esm test/multi-agent.ts       # 4 条多 agent 编排断言
node --import tsx/esm test/research.ts          # 4 条第多 agent 端到端(含修复循环,agent 意见不能替代内核)
node --import tsx/esm test/project-mode.ts      # 2 条 lake 项目模式断言
node --import tsx/esm test/tool-registration.ts # DSH ctx.tools 注册契约
node --import tsx/esm demo/verify-a5.ts         # 单文件真实验证 2+2=4
node --import tsx/esm demo/research.ts          # 完整工作台:多 agent 编排 + Lean 裁定
```

前提:本机有 Lean 工具链(`lean`/`lake` 在 `~/.elan/bin`)。已实测 Lean 4.27.0 + Lake 5.0.0。
mathlib 未随附,需 `lake new` + 拉取 mathlib 才能验证 mathlib 依赖的定理。

## DSH 集成(待登记)

- 工具:`dsh_lean_lock_statement`、`dsh_lean_verify`、`dsh_lean_domain_register`、
  `dsh_lean_run_status`、`dsh_lean_evidence_export`。
- 入口:`src/index.ts` 的 `bootstrapTools(api, register)` 按 DSH `ctx.tools.register(defineTool(..))`
  契约发出这 5 个工具。
- 要在 GRAPH 里真正可用,需 link DSH 的 `@deepseek-ai/dsh-tools` + vendor `cordis`,并在
  `~/.dsh/cordis.patch.yml` 注册插件入口,再重载/重启 `dsh web`。

## 已扩展的能力(完善工作台进展)

- **权威反作弊(第 7 道硬门)**:拒绝 `#eval`、`#reduce/#compute`、`run_cmd`、`unsafe`、
  `IO./System.`/文件读写等宿主执行/逃逸向量(见 `test/anti-cheat.ts` 16 断言)。
- **真实量纲一致门**(fluid 域):`-- @check_dim: LHS == RHS` 注释会被解析成基础量纲向量
  (M, L, T)并核对;能量 vs 动量等不一致会被拒绝(见 `test/dimension.ts` 7 断言 +
  `test/fluid-domain.ts` 3 断言)。
- **Lake 项目模式**:`verifyProject(runId, projectRoot, target)` 以整项目 `lake build` 为权威
  (见 `demo/lake-project/` 自含模板,无 mathlib 依赖;`test/project-mode.ts`)。
- 诚实边界:本机无 docker/bubblewrap,OS 级沙箱需部署到有容器能力的宿主;整项目模式不单独
  断言"某定理被证明"(用单文件模式+`#print axioms` 做该断言)。
