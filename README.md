# 🐋 DSH Meme Hub

**DeepSeek Harness (dsh) 社区插件策展导航** — *They list everything. We pick the good stuff — and the fun stuff.*

- Nuxt 3 全量 SSG（`nuxi generate`），双语（en 根路径 / zh 前缀），部署到 Vercel
- 数据：`public/data/plugins.json`（87 插件，含 29 整活精选），由 `scripts/build-data.py` 合并两个现有数据源并用 GitHub API 富化（stars / pushed_at / license / topics / manifest 存在性）
- 域名：`dsh-meme-hub.cdqyfdbymn.me`（canonical/og/sitemap/robots 全部读 `runtimeConfig.public.siteUrl`，迁移只改 `NUXT_PUBLIC_SITE_URL` 一处）

## ⚠️ 本机铁律

开发机可用内存 ~1.6GB：**禁止本机跑 `npm run build` / `generate` / `dev` / `preview`**。构建与页面验证一律走 GitHub Actions（`ci.yml` 验证构建、`deploy.yml` 部署 Vercel）。

## 数据维护

```bash
# 刷新数据（需要 gh 已登录；~2 次 API 调用/插件）
npm run build:data
```

新增插件：跑 `build:data` 后在 `scripts/build-data.py` 的 `MEME` 列表补整活条目（含双语文案与截图）。

## 部署所需 secrets

- `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`
- 可选 `INDEXNOW_KEY`（Bing IndexNow，每次部署后自动提交 sitemap）
- 可选 repo variable `SITE_URL`（默认 `https://dsh-meme-hub-site.vercel.app`；绑定正式域名后改这里）
