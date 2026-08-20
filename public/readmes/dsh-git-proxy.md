[中文](./README.md) · [English](./README.en.md)

# dsh-git-proxy

DeepSeek Harness 的按需 GitHub 代理插件。在 Web UI 设置里一键开关 `github.com` 的 git/SSH 代理、保存代理地址、下载前测试连通性。

## 安装

通过插件市场安装，或：

```
dsh plugin --profile web add github:wjt0321/dsh-git-proxy
```

重启 Web UI 后，打开 **设置 → Git 代理**。

## 使用

1. 输入代理地址（如 `127.0.0.1:10808`）并点击**保存**。
2. 点击**开启代理**——它会配置：
   - git（https）：`git config --global http.https://github.com.proxy http://<地址>`
   - SSH（`git@github.com:`）：在 `~/.ssh/config` 的 `Host github.com` 块写入插件拥有的 `ProxyCommand`（使用 Git for Windows 自带的 `connect` 工具）
3. 用**测试连通性**验证代理端口与 `github.com:443` / `github.com:22` 隧道。
4. 下载完成后点击**关闭代理**——两项配置立即移除。

### 截图

![Git 代理已开启](https://raw.githubusercontent.com/wjt0321/dsh-git-proxy/7179a3f64ad92b3432b4e29a7df9e36aa698e3b1/image/open.jpg)

*开启状态——git 与 SSH 代理均已打开。*

![Git 代理已关闭](https://raw.githubusercontent.com/wjt0321/dsh-git-proxy/7179a3f64ad92b3432b4e29a7df9e36aa698e3b1/image/close.jpg)

*关闭状态——点击关闭代理后两项均关闭，恢复直连。*

## 安全

- 只影响对 `github.com` 的 git 操作（https 与 SSH）。npm/pnpm 包下载不受影响。
- 代理地址经过校验（host 字符 + 端口范围），按 profile 存储于 `<profile>/git-proxy.json`。
- `~/.ssh/config` 编辑非常保守：只会替换或移除**插件拥有的** `ProxyCommand` 行（本插件写出的带引号 connect 格式）；用户已有的 `ProxyCommand` 行会保留，插件行插入在其前（ssh_config 取第一个匹配值）。其余内容逐字保留；包含 `Match` 段或多主机 `github.com` 行的配置完全不动（界面会提示）。
- 变更路由只接受同源 POST。

## 已知限制

- SSH 代理依赖 `connect` 工具（Git for Windows 自带）。缺失时 SSH 部分标记不可用，https 照常。
- 不支持认证代理（用户名/密码）。
- 不支持 IPv6 代理地址。
- 代理软件未运行时开启代理会导致 git 操作失败（测试按钮可提前预警）。
- 用户自写的、恰好匹配插件格式（引号路径 + `-H` + `%h %p`）的 `ProxyCommand` 行会被当作插件行处理。
- 编辑 CRLF 的 ssh config 会把行尾统一为 LF。

## 开发

```
pnpm install
pnpm test        # vitest 套件
pnpm typecheck
pnpm build       # tsc host + tsdown client bundle（lib/client.js）
```

client bundle 是 `__ModuleLoader__` factory（id `dsh-git-proxy`），经 `exports["./client"]` 子路径由 client-modules 服务。

## 许可

MIT
