# dsh-git-hygiene（Git 卫生巡检）

> **Git Hygiene Checker for DeepSeek Harness.**
> A read-only DSH plugin that inspects a repository's hygiene: merged-but-not-deleted
> branches, stale branches with no commits for months, oversized tracked files,
> untracked files, and uncommitted work — then outputs a health report with cleanup
> suggestions. It never deletes or modifies anything automatically.
> Install with: `dsh plugin --profile web add "github:lucky8197/dsh-git-hygiene#main"`.

仓库用久了会"长胖"：功能分支合并后没人删、几个月不动的老分支堆积、不小心提交了
几十 MB 的二进制、未跟踪文件散落一地。`dsh-git-hygiene` 用**只读 git 命令**给仓库
做一次"体检"，把这些问题量化成带清理建议的报告。

## 特性

| 维度 | 说明 | 发现类型 | 严重度 |
| --- | --- | --- | --- |
| 已合并分支 | 已合并到当前分支但未删除的分支（`git branch --merged`） | `merged_branch` | medium |
| 过期分支 | 超过 N 天（默认 90）无提交的分支（`for-each-ref` committerdate） | `stale_branch` | low |
| 大文件 | 跟踪文件超过阈值（默认 5 MB），提示用 LFS/filter-repo 处理 | `large_file` | low |
| 未跟踪文件 | `git status --porcelain` 的 `??` 条目 | `untracked` | low |
| 未提交修改 | 工作区 dirty 状态（`M`/`A`/`D` 等） | `dirty_worktree` | low |

## 快速安装

```bash
dsh plugin --profile web add "github:lucky8197/dsh-git-hygiene#main"
```

## 工具用法

```
git_hygiene
  参数：
    cwd?: string          仓库目录（默认当前会话工作目录）
    staleDays?: number    过期分支阈值（天，默认 90）
    maxFileBytes?: number 大文件阈值（字节，默认 5MB）
  输出：canonical JSON 报告（渲染为分节文本）
```

### canonical JSON

```jsonc
{
  "tool": "git_hygiene",
  "version": 1,
  "cwd": "/path/to/repo",
  "repo": { "isRepo": true, "root": "/path/to/repo", "branch": "main",
            "head": "abc1234…", "remotes": ["origin"], "sizeBytes": 4211000, "objectCount": 1200 },
  "findings": [
    { "severity": "medium", "kind": "merged_branch",
      "detail": "2 个分支已合并到当前分支，可以安全删除：feature-a、feature-b",
      "evidence": "feature-a, feature-b",
      "fix": "对每个已合并分支执行 `git branch -d <branch>`（-d 安全删除，未合并会拒绝）" }
  ],
  "stats": { "findingCount": 1, "byKind": { "merged_branch": 1 } },
  "suggestions": [ { "severity": "medium", "text": "…" } ]
}
```

## 配置（cordis 配置节）

```yaml
- insert:
    - id: git-hygiene
      name: 'dsh-git-hygiene'
      config:
        staleDays: 90          # 过期分支阈值（天）
        maxFileBytes: 5242880  # 大文件阈值（字节）
        maxList: 30            # 各清单最大展示条数
```

## 安全边界（硬性要求）

- **只执行白名单只读 git 子命令**（`src/git.ts` WHITELIST 全量枚举：status --porcelain /
  branch --merged / for-each-ref / ls-files / count-objects -v / remote -v / rev-parse /
  log -1 / symbolic-ref）；白名单外的一律拒绝（含 `checkout`/`reset`/`clean`/`delete`/`push`）；
- **不自动删除/修改任何分支或文件**——只输出建议，清理动作由用户执行；
- 文件体积用只读 `node:fs stat`，报告不含任何文件内容；
- 非 git 目录返回 `isRepo: false`，不报错不猜测。

## 防误报设计

- 当前分支自动从"已合并"清单排除（`*` 标记剥离）；
- detached HEAD 正常处理（branch 为空，不崩溃）；
- 文件缺失/不可读静默跳过。

## 工程结构

```
dsh-git-hygiene/
├── package.json          # name=dsh-git-hygiene, main=./lib/index.js, dsh.bundle.patch
├── cordis.patch.yml      # - insert: [{ id: git-hygiene, name: 'dsh-git-hygiene' }]
├── scripts/              # setup-dsh-deps / build.sh / build-win.mjs（纯 tsc 构建）
├── src/
│   ├── index.ts          # apply(ctx)：注册 git_hygiene 工具 + 配置读取
│   ├── audit.ts          # 编排：只读 git 命令序列 + 大文件 stat
│   ├── git.ts            # 白名单执行器（破坏性命令一律拒绝）
│   ├── scan.ts           # git 输出解析 + 严重度/建议/渲染
│   └── types.ts          # canonical 类型 + 配置
└── tests/                # node --test（22 用例，真实 git 临时仓库端到端）
```

## 开发 / 测试 / 构建

```bash
npm install && npm run setup
npm test                # node --test（22 用例，含真实 git 建仓）
npm run build:win       # Windows 构建；POSIX 用 npm run build
```

构建产物 `lib/` 入库提交（GitHub 源安装免构建）。

## License

BSD-3-Clause。见 [LICENSE](./LICENSE)。
