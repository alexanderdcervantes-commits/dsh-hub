# 🐋 DSH Meme Hub

**DeepSeek Harness (dsh) 社区插件策展导航** — *They list everything. We pick the good stuff — and the fun stuff.*

- Nuxt 3 全量 SSG（`nuxi generate`），双语（en 根路径 / zh 前缀），由 Vercel 直接构建并部署（不经过 GitHub Actions 打包）
- 数据：`public/data/plugins.json`（87 插件，含 29 整活精选），由 `scripts/build-data.py` 合并两个现有数据源并用 GitHub API 富化（stars / pushed_at / license / topics / manifest 存在性）
- 域名：`dsh-meme-hub.cdqyfdbymn.me`（canonical/og/sitemap/robots 全部读 `runtimeConfig.public.siteUrl`，迁移只改 `NUXT_PUBLIC_SITE_URL` 一处）

## ⚠️ 本机铁律

开发机可用内存 ~1.6GB：**禁止本机跑 `npm run build` / `generate` / `dev` / `preview`**。部署构建由 Vercel Git Integration 执行；GitHub Actions 仅保留 `ci.yml` 做 PR 验证（类型检查 + 预渲染覆盖检查）。

## 数据维护

```bash
# 刷新数据（需要 gh 已登录；~2 次 API 调用/插件）
npm run build:data
```

新增插件：跑 `build:data` 后在 `scripts/build-data.py` 的 `MEME` 列表补整活条目（含双语文案与截图）。

## 部署（Vercel Git Integration）

1. 在 Vercel 导入本仓库，框架选择 **Nuxt.js**（仓库内 `vercel.json` 已配置 `npm run generate` 输出 `.output/public`）。
2. Vercel 项目环境变量：
   - `NUXT_PUBLIC_SITE_URL` = `https://dsh-meme-hub.cdqyfdbymn.me`（绑定正式域名后）
   - `NODE_OPTIONS` = `--max-old-space-size=4096`
3. Node 版本：Vercel 设置里选 **22.x**（仓库有 `.nvmrc`）。
4. 域名：Vercel → Settings → Domains 添加 `dsh-meme-hub.cdqyfdbymn.me`，然后到 Cloudflare 把 `dsh-meme-hub` 的 CNAME 指向 `cname.vercel-dns.com`（DNS only）。
5. 可选：`node scripts/indexnow.mjs` 抓取线上 sitemap 全量提交 IndexNow（key 已内置于脚本默认值，`INDEXNOW_KEY` 仅换 key 时覆盖）。
