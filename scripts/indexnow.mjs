#!/usr/bin/env node
// IndexNow 提交：把全站 URL（或指定路径）提交给 IndexNow（Bing/Yandex 等共用入口）。
// 用法：
//   node scripts/indexnow.mjs sitemap    # 抓取线上 sitemap 并提交全部 URL（默认）
//   node scripts/indexnow.mjs url <path> # 提交单个路径（自动带 2 语种）
// 可选 env：INDEXNOW_KEY（默认用下方 DEFAULT_KEY，即 public/<key>.txt 里的公开 key）。
// key 文件 public/<key>.txt 已随仓库部署，无需再本地生成；INDEXNOW_KEY 仅在换 key 时覆盖。
const DEFAULT_KEY = 'ef62d6639e0847f4bf285feb71e2b366'

const site = (process.env.NUXT_PUBLIC_SITE_URL || 'https://dsh-meme-hub.cdqyfdbymn.me').replace(/\/$/, '')
const key = process.env.INDEXNOW_KEY || DEFAULT_KEY

const mode = process.argv[2] ?? 'sitemap'

/** 从 sitemap.xml 提取全部 <loc> URL */
async function collectSitemapUrls() {
  const sitemapUrl = `${site}/sitemap.xml`
  console.log(`抓取 sitemap: ${sitemapUrl}`)
  const res = await fetch(sitemapUrl, { headers: { 'user-agent': 'Mozilla/5.0' } })
  if (!res.ok) {
    throw new Error(`sitemap 抓取失败: HTTP ${res.status}`)
  }
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  const unique = [...new Set(urls)]
  console.log(`sitemap 共 ${urls.length} 个 URL，去重后 ${unique.length} 个`)
  return unique
}

let body
let submittedCount
if (mode === 'url' && process.argv[3]) {
  const p = process.argv[3]
  submittedCount = 2
  body = JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: [site + p, `${site}/zh${p}`] })
} else {
  const urls = await collectSitemapUrls()
  if (urls.length > 10000) {
    // 协议上限：单次请求最多 10000 个 URL；当前全站 ~121 个，正常情况到不了这里
    throw new Error(`URL 数 ${urls.length} 超过单次请求上限 10000，请分批`)
  }
  submittedCount = urls.length
  body = JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: urls })
}

console.log(`提交 ${submittedCount} 个 URL 到 https://api.indexnow.org/IndexNow ...`)
// 单次请求，不重试（收到 429 直接停，避免轰炸）
const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body,
})
console.log(`共提交 ${submittedCount} 个 URL，IndexNow HTTP ${res.status} ${res.status === 200 || res.status === 202 ? '✓ 成功' : '✗ 失败'}`)
if (!res.ok) console.error(await res.text().catch(() => ''))
process.exit(res.ok ? 0 : 1)
