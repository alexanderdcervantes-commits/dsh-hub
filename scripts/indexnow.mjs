#!/usr/bin/env node
// IndexNow 提交：把全站 URL（或指定路径）提交给 IndexNow（Bing/Yandex 等共用入口）。
// 用法：
//   node scripts/indexnow.mjs sitemap    # 抓取线上 sitemap 并提交全部 URL（默认）
//   node scripts/indexnow.mjs url <path> # 提交单个路径（自动带 2 语种）
// 可选 env：INDEXNOW_KEY（默认用下方 DEFAULT_KEY，即 public/<key>.txt 里的公开 key）。
// key 文件 public/<key>.txt 已随仓库部署，无需再本地生成；INDEXNOW_KEY 仅在换 key 时覆盖。
// 端点用官方文档的小写 /indexnow（大小写未文档化为等价，只用有保障的形式）。
// 退出码：0 = 引擎已接收（200/202）；1 = 引擎拒绝（4xx，勿盲目重试）；2 = 网络层失败（可重试）。
const DEFAULT_KEY = 'ef62d6639e0847f4bf285feb71e2b366'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

const site = (process.env.NUXT_PUBLIC_SITE_URL || 'https://dsh-meme-hub.cdqyfdbymn.me').replace(/\/$/, '')
const key = process.env.INDEXNOW_KEY || DEFAULT_KEY

/** 带 30s 超时的 fetch；超时/断连按网络错误处理（区别于引擎返回的 HTTP 状态码） */
async function fetchWithTimeout(url, opts = {}) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(30_000) })
}

/** 从 sitemap.xml 提取全部 <loc> URL */
async function collectSitemapUrls() {
  const sitemapUrl = `${site}/sitemap.xml`
  console.log(`抓取 sitemap: ${sitemapUrl}`)
  const res = await fetchWithTimeout(sitemapUrl, { headers: { 'user-agent': 'Mozilla/5.0' } })
  if (!res.ok) {
    throw new Error(`sitemap 抓取失败: HTTP ${res.status}`)
  }
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
  const unique = [...new Set(urls)]
  console.log(`sitemap 共 ${urls.length} 个 URL，去重后 ${unique.length} 个`)
  if (!unique.length) {
    throw new Error('sitemap 里没有提取到任何 <loc>（响应可能是错误页），中止提交')
  }
  return unique
}

const mode = process.argv[2] ?? 'sitemap'

/** 网络层错误（连接被拒/超时，请求未送达）→ exit 2，调用方可安全重跑 */
function exitOnNetworkError(e) {
  if (e instanceof TypeError || e.name === 'TimeoutError' || e.name === 'AbortError') {
    console.error(`网络错误（请求未送达）：${e.name}: ${e.message}`)
    process.exit(2)
  }
  throw e
}

let body
let submittedCount
if (mode === 'url' && process.argv[3]) {
  const p = process.argv[3]
  submittedCount = 2
  body = JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: [site + p, `${site}/zh${p}`] })
} else {
  let urls
  try {
    urls = await collectSitemapUrls()
  }
  catch (e) {
    exitOnNetworkError(e)
  }
  if (urls.length > 10000) {
    // 协议上限：单次请求最多 10000 个 URL；当前全站 ~121 个，正常情况到不了这里
    throw new Error(`URL 数 ${urls.length} 超过单次请求上限 10000，请分批`)
  }
  submittedCount = urls.length
  body = JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: urls })
}

console.log(`提交 ${submittedCount} 个 URL 到 ${ENDPOINT} ...`)
try {
  // 单次请求，不重试（收到 429 直接停，避免轰炸）
  const res = await fetchWithTimeout(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body,
  })
  console.log(`共提交 ${submittedCount} 个 URL，IndexNow HTTP ${res.status} ${res.status === 200 || res.status === 202 ? '✓ 成功' : '✗ 失败'}`)
  if (!res.ok) console.error(await res.text().catch(() => ''))
  process.exit(res.ok ? 0 : 1)
}
catch (e) {
  // 网络层失败（连接被拒/超时）：请求未送达，重跑脚本不算重复提交
  console.error(`网络错误（请求未送达引擎）：${e.name}: ${e.message}`)
  process.exit(2)
}
