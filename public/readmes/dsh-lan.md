# dsh-lan

让 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Web UI 可以在局域网访问的插件 + overlay。

## 警告

dsh web **没有认证层**。绑定 `0.0.0.0` 会把远程代码执行能力暴露给整个局域网——只在你完全信任的网络中使用。

## 使用

```sh
# 1. 一次性：把插件装进 web profile
dsh plugin --profile web add <本项目路径>

# 2. 启动（从源码目录运行则为 pnpm dsh web ...）
dsh web --patch <本项目路径>/cordis.yml
```

局域网设备打开启动行打印的 `(LAN: http://...)` 地址即可；多网卡机器请用真实局域网 IP 加端口（如 `http://192.168.x.x:3080`）。用域名/别名访问需编辑 `cordis.yml` 里注释掉的 `trustedHosts` 示例。

卸载：`dsh plugin --profile web remove dsh-lan`

## 原理

- `cordis.yml` 是 dsh 的 patch overlay：把 webserver 行的绑定地址覆盖为 `0.0.0.0`（CLI 的 `--host 0.0.0.0` 被刻意拒绝，overlay 是官方组合接缝）。绑定后宿主自动把本机 LAN IPv4 加进 `/api` 信任栅栏，其他 Host 一律 403。
- `index.mjs` 是 host 插件：浏览器只在安全上下文（HTTPS/localhost）暴露 `crypto.randomUUID`，局域网纯 HTTP 页面没有它会导致客户端 RPC 启动即崩。插件通过 `webServer.tapIndex()` 向 `<head>` 最前面注入一段 polyfill 脚本（基于任何上下文都可用的 `crypto.getRandomValues`）。

## 已知边界

- 设置、凭据、agent 预设编辑、"在操作系统中打开"被上游刻意钉在回环客户端，LAN 下控制台出现 `settings.describe` / `credentials.describe` 的 403 属预期，界面会自动降级。
- 目录选择器浏览的是**运行 dsh 的那台机器**的文件系统。
