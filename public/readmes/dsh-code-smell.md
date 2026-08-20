# dsh-code-smell（代码气味雷达）

> **Code Smell Radar for DeepSeek Harness.**
> A read-only DSH plugin that statically scans a repository for common code smells:
> TODO/FIXME/HACK debt, stub implementations (`NotImplemented` / `未实现`), over-long
> lines, oversized files, and duplicated code blocks — then outputs severity-sorted,
> actionable fix suggestions.
> Install with: `dsh plugin --profile web add "github:lucky8197/dsh-code-smell#main"`.

代码在交付前往往带着一堆"以后再说"的痕迹：TODO/FIXME 债务越积越多、未实现桩混在
"已完成"代码里、超长行与重复块让维护成本上升、超大文件拖慢一切。`dsh-code-smell`
用**纯静态扫描、全程只读**把这些气味量化成可执行的修复清单。

## 特性

| 维度 | 说明 | 气味类型 | 严重度 |
| --- | --- | --- | --- |
| TODO/FIXME 债务 | `TODO`/`FIXME`/`HACK`/`XXX`/`BUG` 遗留标记，支持 `TODO(john): 文案` 负责人格式 | `todo_debt` | medium |
| 未实现桩 | `NotImplementedError` / `NotImplemented` / `IMPLEMENT ME` / `未实现` 等 | `stub_marker` | high |
| 超长行 | 行长 > 阈值（默认 120 字符） | `long_line` | low |
| 大文件 | 单文件 > 阈值（默认 256 KB） | `big_file` | low |
| 重复代码块 | 精确重复的行序列（≥3 行、≥2 次，自动扩展成最大重复段） | `duplicate_block` | low |

## 快速安装

```bash
dsh plugin --profile web add "github:lucky8197/dsh-code-smell#main"
```

## 工具用法

```
code_smell
  参数：
    cwd?: string          扫描起点目录（默认当前会话工作目录）
    maxLineLen?: number   超长行阈值（默认 120）
    detail?: 'summary' | 'developer'
  输出：canonical JSON 报告（渲染为分节文本）
```

### canonical JSON

```jsonc
{
  "tool": "code_smell",
  "version": 1,
  "cwd": "/path/to/repo",
  "scanned": { "files": 42, "lines": 5312, "bytes": 102400 },
  "smells": [
    { "severity": "high", "kind": "stub_marker", "file": "src/a.py",
      "line": 7, "detail": "存在未实现桩（NotImplemented / 未实现 / IMPLEMENT ME 等）",
      "evidence": "raise NotImplementedError",
      "fix": "实现 src/a.py 第 7 行的桩逻辑，或标注为显式 TODO 并跟踪" }
  ],
  "stats": { "smellCount": 12, "byKind": { "todo_debt": 8, "stub_marker": 1 } },
  "suggestions": [ { "severity": "high", "text": "…" } ]
}
```

`detail=developer` 附加 `receipt`：每个扫描文件的路径/行数/字节数。

## 配置（cordis 配置节）

```yaml
- insert:
    - id: code-smell
      name: 'dsh-code-smell'
      config:
        includeExts: ["ts", "tsx", "js", "py", "cs", "go", "rs"]  # 参与扫描的扩展名
        ignorePaths: [".git", "bin", "obj", "node_modules", "dist", "lib", ".dsh"]
        maxLineLen: 120        # 超长行阈值（字符）
        maxFileBytes: 262144   # 大文件阈值（字节）
        hardReadCap: 524288    # 单文件读取硬上限（字节），超限跳过
        minBlockLines: 3       # 重复块最少行数
```

## 安全边界（硬性要求）

- **全程只读**：只用 `ctx.fs` 的 `resolve`/`stat`/`readText`/`listDir` 子集；
- **单文件 > 512 KB 硬上限跳过不读**（`hardReadCap` 可配）；
- **报告不含完整文件内容**：只含路径、行号、统计与 ≤200 字符证据；
- **不执行测试、不跑构建**：纯静态扫描，不运行任何代码；
- 不修改任何文件（有测试断言）。

## 防误报设计

- 普通注释（"变量名含 todo"）不误判；
- `TODO: 实现逻辑` 不是未实现桩（"未实现"三字需连续）；
- 空行块不参与重复检测；相同起始位置的重复窗口自动去重保留最长段；
- 二进制/不可读文件静默跳过。

## 工程结构

```
dsh-code-smell/
├── package.json          # name=dsh-code-smell, main=./lib/index.js, dsh.bundle.patch
├── cordis.patch.yml      # - insert: [{ id: code-smell, name: 'dsh-code-smell' }]
├── scripts/              # setup-dsh-deps / build.sh / build-win.mjs（纯 tsc 构建）
├── src/
│   ├── index.ts          # apply(ctx)：注册 code_smell 工具 + 配置读取
│   ├── audit.ts          # 编排：磁盘遍历 + 文件扫描 + receipt
│   ├── scan.ts           # TODO/超长行/未实现桩/重复块解析（纯函数）
│   ├── analyze.ts        # 严重度 + 修复建议 + 分节渲染
│   └── types.ts          # canonical 类型 + 配置 + fs 服务面子集
└── tests/                # node --test（27 用例，零测试依赖，真实临时目录端到端）
```

## 开发 / 测试 / 构建

```bash
npm install && npm run setup
npm test                # node --test（27 用例）
npm run build:win       # Windows 构建；POSIX 用 npm run build
```

构建产物 `lib/` 入库提交（GitHub 源安装免构建）。

## License

BSD-3-Clause。见 [LICENSE](./LICENSE)。
