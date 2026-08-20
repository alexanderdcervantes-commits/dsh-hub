# dsh-plugin-call-trace

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)

给 DeepSeek Harness 的 LLM **工具调用轨迹记录器**：每次模型调用工具（`read` / `pwsh` /
`subagent` / `web_search` …），它把这次调用**持久化**到 JSONL 文件——**重启不丢**——
并提供一个结构化 `call_trace` 工具供模型随时查询，以及一个 `callTraceHistory` 服务供
浮层 UI 合并历史。

- 纯 ESM、**零 `@deepseek-ai/*` 运行时依赖**，从任意目录可加载（`--patch` overlay 或 profile 安装均可）。
- 监听 `agent/request` + `tools/execute` + `tools/result`（根作用域，包含子代理调用）。
- 记录字段：工具名、参数、状态（ok/error/running）、结果摘要、耗时、turn/step、agent。
- 文件超 5 MB 自动改名轮转，永不无限膨胀。

## 安装

### 方式 A：安装进 profile（推荐，可分发）

```sh
dsh plugin --profile voice add ./call-trace-plugin
dsh --profile voice --dump-config      # 验证出现 "# == dsh-plugin-call-trace" 层
dsh --profile voice                    # 启动
```

### 方式 B：`--patch` 本地 overlay（最快，先试这个）

```sh
# 先停掉当前的 dsh web，再：
pnpm dsh web --patch D:\Java\dsh-demo\call-trace-plugin\cordis.local.yml
```

> `cordis.local.yml` 里的 `name` 是 `file://` URL（Windows 绝对路径必须写成合法
> `file://` URL），插件移动后要同步改。

### 方式 C：tarball / npm

```sh
pnpm pack                                   # 产出 dsh-plugin-call-trace-1.0.0.tgz
dsh plugin --profile <name> add ./dsh-plugin-call-trace-1.0.0.tgz
# 或发布到 npm 后：dsh plugin --profile <name> add dsh-plugin-call-trace
```

## 配置

配置写在 patch 行的 `config` 下（方式 B 在 `cordis.local.yml`，profile 安装则在
`$DSH_HOME/profiles/<name>/cordis.patch.yml` 覆盖该行 id `call-trace-recorder`）。

```yaml
config:
  outDir: 'D:/...'   # 输出目录；默认 $DSH_HOME/call-trace（不写 node_modules）
```

## 使用

- **模型查询**：对模型说「用 `call_trace` 看下最近的调用」。工具返回**结构化数组**
  （name / status / args / summary / turn / step / agentId / durationMs / ts），模型可直接读字段。
- **清空**：`call_trace({ clear: true })`（破坏性，清空整个历史文件）。
- **历史服务**：`callTraceHistory.tail(n)` 返回解析后的最近记录，供 UI 合并。

## 浮层 UI（可选附加）

目录 `ui/` 附带一个**动态插件**浮层 UI（GraphRAG 式分叉连线 + 中文工具描述 +
点击展开详情 + 子代理嵌套分支 + 历史合并 + 本会话/全部过滤）。动态插件只存在进程内存，
重启后需重建：对 agent 说「用 `call-trace-plugin\ui\host.js` 和 `ui\client.js` 重建
调用轨迹动态插件并运行」（详见 `ui/DEFINE.md`）。

## 文件结构

```
call-trace-plugin/
├── package.json        # dsh.bundle manifest
├── cordis.patch.yml    # profile 安装用的 bundle 层（name 为包名）
├── cordis.local.yml    # --patch overlay（name 为 index.js 的 file:// URL）
├── index.js            # 插件入口：事件监听 + JSONL 落盘 + 轮转 + 服务 + 工具
├── ui/                 # 可选浮层 UI（动态插件源码 + 重建说明）
├── smoke-test.mjs      # 记录器冒烟测试
├── check-syntax.mjs    # ui/ 源码语法检查
└── README.md / LICENSE
```

## 设计说明

- **零 `@deepseek-ai/*` 运行时导入**：树外插件只能稳定解析安装闭包内的包，所以用
  `ctx.on` 监听事件、`ctx.tools.register` 注册原始 JSON Schema 工具、`ctx.provide`
  提供服务，不导出 `Config` schema（无 `Config` 时 Cordis 把 patch `config` 原样传给
  `apply`，默认值在 apply 内合并）。
- **记录在完成时写入**：`tools/execute` 记开始，`tools/result` 记完成并落盘；进程在
  调用中途崩溃则该次调用不落盘（可接受）。
- **轮转**：`trace.jsonl` 超过 5 MB 自动改名为 `trace-<ts>.jsonl` 并开新文件。

## 开发验证

```sh
node --check index.js     # 语法
node smoke-test.mjs       # 记录器冒烟（结构化输出/历史服务/并行/轮转/clear）
node check-syntax.mjs     # ui/host.js + ui/client.js 语法
```

## Known Limitations

- **浮层 UI 是动态插件**：客户端半侧需要 monorepo 客户端构建链（tsdown + slot 类型 +
  props share），与官方文档建议一致，不在本 bundle 内构建；以源码存档附带，按需重建。
- **工具→插件归属不做映射**：工具注册不暴露提供方，卡片只展示工具名 + 中文用途描述。
- **子代理嵌套按时间窗口启发式**：`subagent`/`workflow` 调用执行窗口内、来自不同
  agentId 的调用会被收进该调用的「子代理分支」，极端并发下可能误归（多会话时用
  「本会话」视图过滤）。
- **记录器与动态 UI 同时启用**：两者各自记录/展示，不冲突（同一事件各听各的）。
