# dsh-plugin-sync

[![npm](https://img.shields.io/npm/v/dsh-plugin-sync)](https://www.npmjs.com/package/dsh-plugin-sync)
[![license](https://img.shields.io/npm/l/dsh-plugin-sync)](LICENSE)

把 DeepSeek Harness 已安装的插件清单同步到 GitHub Gist 的 DSH 插件。

- GitHub OAuth **设备流快捷登录**（无需手动粘贴 token）
- **导出**：将 `profiles/<profile>/package.json` 的 `dependencies` + `dsh.profile.bundles` + `cordis.patch.yml` 打包为 `dsh-plugins.json` 上传到 Gist
- **导入**：从 Gist 读取插件清单，写回 `package.json` / `cordis.patch.yml` 并**自动执行 `pnpm install`**，提示重启 Harness 生效
- 未指定 Gist 地址时，自动创建名为 `dsh_plugin_sync_XXXX`（4 位随机字符）的私有 Gist

## 安装

```bash
dsh plugin --profile web add dsh-plugin-sync
```

或手动编辑 profile 的 `package.json`：

```json
{
  "dependencies": {
    "dsh-plugin-sync": "^1.0.0"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-plugin-sync"]
    }
  }
}
```

然后 `pnpm install` 并重启 Harness。安装后可在 dsh-market 中查看。

## 使用

1. 打开设置 →「插件同步」
2. 点「登录 GitHub」，按提示跳转 GitHub 授权（仅需 `gist` 权限）
3. 点「导出到 Gist」上传插件清单；「从 Gist 导入」填写 Gist 地址后自动安装并提示重启

## 构建

```bash
npm install
npm run build   # esbuild 产出 lib/index.js（host）+ lib/client.js（client bundle）
```

`@deepseek-ai/*` 与 `react` 保持外部依赖（由 profile 的 node_modules / app 模块系统提供），`zod` 打包进产物。

## License

MIT
