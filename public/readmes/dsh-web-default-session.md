# dsh-web-default-session

[English](#english) | 简体中文

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面的客户端插件：把「必须选一个文件夹才能开始对话」的限制去掉。

- **点「新会话」默认无文件夹**：侧栏的「新会话」按钮会打开一个绑定在宿主默认目录（`dsh web` 的启动目录，即 `host.describe` 返回的 `cwd`）上的会话，不再落到「当前/最近工作区」，也无需选文件夹；
- **选文件夹时也有「无文件夹」选项**：插件会在默认目录上维护一个名为 **「默认目录」** 的工作区，它出现在顶部文件夹 chip 的菜单和侧栏工作区列表里，点它就是“无文件夹”；
- **零工作区启动**：没有任何工作区时，插件自动创建「默认目录」并打开，输入框直接可用；
- **升级安全**：只改用户 profile（`~/.dsh`），不动 dsh 安装本体，dsh 升级不会覆盖；
- 工作区上右键等**显式指定工作区**的入口保持原行为。

## 安装

```bash
dsh plugin --profile web add dsh-web-default-session
```

包声明了 `dsh.bundle`，`dsh plugin add` 会自动把它激活为 profile layer，无需手工改 patch。然后重启 `dsh web`（或依赖 HMR），刷新页面即可。

其它等价装法：

```bash
# 从 GitHub 装（发布后可用）
dsh plugin --profile web add github:<你的用户名>/dsh-web-default-session

# 或手动：先 pnpm add，再在 ~/.dsh/profiles/web/cordis.patch.yml 注册宿主行
dsh plugin --profile web add dsh-web-default-session
```

手动注册方式（一般不需要，bundle 会自动生效）：

```yaml
- insert:
    - id: web-default-session
      name: 'dsh-web-default-session'
```

## 行为细节

- 默认目录 = `dsh web` 进程的启动目录（在 `/Users/user` 启动就是 `/Users/user`）；
- 「默认目录」工作区首次加载页面时自动创建，标题从目录名重命名为「默认目录」（只在标题还是目录名时改名，不覆盖你的手动重命名）；
- 会话期间手动删除「默认目录」不会被立刻复活；刷新页面后会重新出现；
- 已在「默认目录」的空白会话里再点「新会话」时，会新建一个全新空白会话，保证点击有可见反馈。

## 定制

- 想改菜单里显示的名字：编辑 `lib/client.js` 顶部的 `DEFAULT_TITLE`；
- 想改默认目录：把 `resolveCwd()` 换成你自己的逻辑（例如固定 `"/path/to/dir"`）。

## 卸载

```bash
dsh plugin --profile web remove dsh-web-default-session
```

并删除 `cordis.patch.yml` 里的 `web-default-session` 行。

---

## English

A client plugin for the DeepSeek Harness Web UI that lifts the "pick a folder before chatting" gate.

- **New Session defaults to no folder**: the generic New Session button opens a session rooted at the Host's default working directory (the directory `dsh web` was launched from, i.e. the `cwd` from `host.describe`) instead of the current/recent workspace — no folder picking required;
- **A "no folder" choice in the workspace picker**: the plugin maintains a workspace named **默认目录** ("Default directory") at the default directory; it appears in the hero workspace-picker menu and the sidebar, and picking it is the no-folder choice;
- **Zero-workspace boot**: with no Workspace at all, the plugin creates the default workspace and opens it, so the composer is usable immediately;
- **Upgrade-safe**: only the user profile (`~/.dsh`) is touched — dsh upgrades do not overwrite it;
- Workspace-scoped actions (e.g. "new session in this workspace") keep their built-in behaviour.

### Install

```bash
dsh plugin --profile web add dsh-web-default-session
```

The package declares `dsh.bundle`, so `dsh plugin add` activates it as a profile layer automatically — no manual patch edits. Restart `dsh web` (or rely on HMR) and refresh the page.

Equivalent options:

```bash
# From GitHub (once published)
dsh plugin --profile web add github:<your-username>/dsh-web-default-session
```

Manual registration (normally unnecessary — the bundle takes effect on its own):

```yaml
- insert:
    - id: web-default-session
      name: 'dsh-web-default-session'
```

### Customisation

- Menu title: edit `DEFAULT_TITLE` at the top of `lib/client.js`.
- Default directory: replace `resolveCwd()` with your own logic.

### Uninstall

```bash
dsh plugin --profile web remove dsh-web-default-session
```

and remove the `web-default-session` row from `cordis.patch.yml`.

## License

MIT
