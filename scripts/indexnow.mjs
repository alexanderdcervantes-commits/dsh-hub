#!/usr/bin/env node
// IndexNow 提交：把全站 URL（或指定路径）提交给 Bing。
// 用法：
//   node scripts/indexnow-submit.mjs keyfile    # 仅把 key 文件写入构建产物（部署前调用）
//   node scripts/indexnow-submit.mjs sitemap    # 抓取 sitemap 并提交全部 URL
//   node scripts/indexnow-submit.mjs url <path> # 提交单个路径（自动带 2 语种）
// 需要 env：INDEXNOW_KEY（Bing IndexNow key）。
// key 文件优先写入 .output/public/<key>.txt（prebuilt 部署会带上线）；
// 若 .output/public 不存在（本地调用），则写入 public/<key>.txt。
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const site = (process.env.NUXT_PUBLIC_SITE_URL || 'https://dsh-meme-hub.cdqyfdbymn.me').replace(/\/$/, '')
const key = process.env.INDEXNOW_KEY
if (!key) {
  console.error('✗ 缺少 INDEXNOW_KEY 环境变量')
  process.exit(1)
}

// 让 Bing 能验证 key：<key>.txt 内容即 key
const outputDir = resolve('.output/public')
const targetDir = existsSync(outputDir) ? outputDir : resolve('public')
mkdirSync(targetDir, { recursive: true })
writeFileSync(resolve(targetDir, `${key}.txt`), key)
console.log(`key 文件已写入 ${targetDir}/${key}.txt`)

const mode = process.argv[2] ?? 'sitemap'
if (mode === 'keyfile') {
  process.exit(0)
}

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
if (mode === 'url' && process.argv[3]) {
  const p = process.argv[3]
  body = JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: [site + p, `${site}/zh${p}`] })
} else {
  const urls = await collectSitemapUrls()
  body = JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: urls })
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body,
})
console.log(`IndexNow HTTP ${res.status} ${res.status === 200 || res.status === 202 ? '✓ 成功' : '✗ 失败'}`)
if (!res.ok) console.error(await res.text().catch(() => ''))
process.exit(res.ok ? 0 : 1)
