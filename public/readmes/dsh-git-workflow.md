# dsh-git-workflow

DeepSeek Harness Git 工作流插件：规范提交（Conventional Commits）、自动 changelog、PR 描述生成、分支推送——纯 `git` CLI，兼容 GitCode / GitHub / 任何 git 远端，无需平台 API 或 token。

## 安装

```sh
dsh plugin --profile <name> add dsh-git-workflow
# 或从本地 checkout 安装
cd ~/dsh-git-workflow && dsh plugin --profile <name> add .
```

## 配置

```yaml
- id: git-workflow
  config:
    enabled: true
    workdir: ''        # 可选；默认会话工作目录
    conventional: true # 强制 Conventional Commits 规范
    defaultBranch: main
```

## 工具（对话中自动调用，无需命令）

| 工具 | 作用 |
| --- | --- |
| `git_status` | 分支 / 与上游领先落后 / 已暂存·未暂存·未跟踪文件 / 最近提交 |
| `git_commit` | 校验 Conventional Commits 格式（`feat|fix|docs|…(scope)?: subject`，破坏性变更加 `!`），可选 `all=true` 先暂存全部再提交 |
| `git_changelog` | 生成按类型分组的 Markdown 变更日志；`from` 默认最近 tag |
| `git_pr_summary` | 生成 PR 标题建议 + 描述模板（提交列表 / diff 统计 / 破坏性变更） |
| `git_push` | `git push -u <remote> <branch>` 推送并设置上游 |

示例对话：

```
我：帮我把这次改动提交了
Agent：git_status → 发现 3 个文件变更 → git_commit message="feat: add login flow"
我：生成一个 PR 描述
Agent：git_pr_summary base=main → 输出可直接粘贴的 Markdown
```

## 开发

```sh
pnpm install && pnpm build
node test/git-workflow.test.mjs   # 临时仓库端到端：状态/规范提交/changelog/PR/推送
```

## License

MIT
