#!/usr/bin/env node
// IndexNow 提交：把全量 URL（或指定路径）提交给 Bing。
// 用法：
//   node scripts/indexnow-submit.mjs sitemap     # 提交 sitemap
//   node scripts/indexnow-submit.mjs url <path>  # 提交单个路径（自动带 2 语种）
// 需要 env：INDEXNOW_KEY（Bing IndexNow key）。key 文件 public/<key>.txt 由本脚本自动生成。
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const site = (process.env.NUXT_PUBLIC_SITE_URL || 'https://dsh-meme-hub.cdqyfdbymn.me').replace(/\/$/, '')
const key = process.env.INDEXNOW_KEY
if (!key) {
  console.error('✗ 缺少 INDEXNOW_KEY 环境变量')
  process.exit(1)
}

// 让 Bing 能验证 key：public/<key>.txt 内容即 key
writeFileSync(resolve('public', `${key}.txt`), key)
console.log(`key 文件已写入 public/${key}.txt（需随下次部署一起上线）`)

const data = existsSync('public/data/plugins.json')
  ? JSON.parse(readFileSync('public/data/plugins.json', 'utf8'))
  : { plugins: [] }

const mode = process.argv[2] ?? 'sitemap'
let body
if (mode === 'url' && process.argv[3]) {
  const p = process.argv[3]
  body = JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: [site + p, `${site}/zh${p}`] })
} else {
  body = JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, url: `${site}/sitemap.xml` })
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body,
})
console.log(`IndexNow HTTP ${res.status} ${res.status === 200 || res.status === 202 ? '✓ 成功' : '✗ 失败'}`)
if (!res.ok) console.error(await res.text().catch(() => ''))
process.exit(res.ok ? 0 : 1)
