#!/usr/bin/env node
// 新插件自动「提名」(nomination only):搜索 GitHub 上的 DSH 插件仓库,验证
// package.json 里确有 dsh.bundle / dsh.client manifest,剔除已收录,输出
// data/discovery/candidates.json 供人工/AI 审核后再走正常收录流程。
//
// 绝不做:不写 public/data/plugins.json、不改任何已收录数据、不自动开 PR/commit 收录。
//
// 发现链路(仿 dsh-skin-market 的 discoverGithubPlugins):
//   1. GitHub Search API 两路查询:topic:dsh-plugin / topic:deepseek-harness
//      (均 archived:false,stars 降序,各取前 200;设 GITHUB_TOKEN 可享更高速率)
//   2. 合并去重 → 剔除已收录(public/data/plugins.json 里的 repo,忽略大小写)
//   3. 对每个候选抓 raw.githubusercontent.com/{repo}/HEAD/package.json
//      (raw 不占 Search/REST API 配额;HEAD 引用免 ls-remote)
//   4. 校验 dsh.bundle / dsh.client 声明(嵌套 pkg.dsh.bundle/client 或字面顶层键都认)
//   5. 按 stars 降序写 data/discovery/candidates.json,保留老候选的首次发现时间
//
// 本机访问 GitHub 必须走 sing-box 代理(同 fetch-screenshots.mjs);GitHub Actions
// runner 直连,设 GITHUB_DIRECT=1 关代理。幂等:重跑整文件覆盖,零副作用。
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const PLUGINS_FILE = resolve(import.meta.dirname, '../public/data/plugins.json')
const OUT_FILE = resolve(import.meta.dirname, '../data/discovery/candidates.json')
const PROXY = process.env.GITHUB_DIRECT ? '' : (process.env.HTTP_PROXY || process.env.http_proxy || 'http://127.0.0.1:7890')
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const TIMEOUT_MS = 20_000
const CONCURRENCY = 8
const PER_ROUTE = 200       // 每路搜索各取前 200
const MAX_CANDIDATES = 200  // 合并去重、剔除已收录后,最多验证/保留 200 个
const SEARCH_QUERIES = [
  'topic:dsh-plugin archived:false',
  'topic:deepseek-harness archived:false',
]

let ProxyAgent, setGlobalDispatcher, fetchViaProxy
try {
  ({ ProxyAgent, setGlobalDispatcher, fetch: fetchViaProxy } = await import('undici'))
}
catch {
  console.error('缺少依赖 undici(本机走代理抓 GitHub 必需):请先运行 npm i -D undici')
  process.exit(1)
}
if (PROXY) setGlobalDispatcher(new ProxyAgent(PROXY))

const GH_HEADERS = {
  'User-Agent': 'dsh-meme-hub-discovery',
  'Accept': 'application/vnd.github+json',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/** 抓一页搜索结果;403/429(限流)等 8 秒重试一次,仍失败则抛错 */
async function searchPage(query, page) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100&page=${page}`
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetchViaProxy(url, { headers: GH_HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (res.ok) return await res.json()
      if ((res.status === 403 || res.status === 429) && attempt === 1) {
        console.warn(`  限流 HTTP ${res.status},等 8s 重试(${query} 第 ${page} 页)`)
        await sleep(8_000)
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    }
    catch (err) {
      if (attempt === 1 && err?.name !== 'AbortError') { await sleep(2_000); continue }
      throw err
    }
  }
}

/** 单路搜索,分页取满 PER_ROUTE 个;第 1 页就失败算整路失败(抛错),翻页失败保留已有部分 */
async function searchRoute(query) {
  const items = []
  for (let page = 1; items.length < PER_ROUTE; page++) {
    let json
    try {
      json = await searchPage(query, page)
    }
    catch (err) {
      if (page === 1) throw err
      console.warn(`  翻页失败(第 ${page} 页): ${err?.message || err},保留前 ${items.length} 条`)
      break
    }
    items.push(...json.items)
    if (json.items.length < 100) break
    await sleep(500) // 搜索接口限速 10 次/分(带 token 30 次/分),页间稍歇
  }
  return items
}

/** 抓仓库根 package.json;404/5xx/解析失败一律返回 null(= 无法验证,不提名) */
async function fetchPkgJson(repo) {
  const res = await fetchViaProxy(`https://raw.githubusercontent.com/${repo}/HEAD/package.json`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

/**
 * 校验 DSH manifest:嵌套(pkg.dsh.bundle / pkg.dsh.client)与字面顶层键
 * ("dsh.bundle" / "dsh.client")两种写法都认。
 * @returns {'bundle'|'client'|null}
 */
function manifestType(pkg) {
  const dsh = pkg?.dsh
  if (dsh && typeof dsh === 'object') {
    if (dsh.bundle !== undefined) return 'bundle'
    if (dsh.client !== undefined) return 'client'
  }
  if (pkg?.['dsh.bundle'] !== undefined) return 'bundle'
  if (pkg?.['dsh.client'] !== undefined) return 'client'
  return null
}

// ---- 已收录集合(repo 归一为小写 owner/name) ----
const pluginsData = JSON.parse(await readFile(PLUGINS_FILE, 'utf8'))
const included = new Set(pluginsData.plugins.map(p => p.repo?.toLowerCase()).filter(Boolean))
console.log(`${PLUGINS_FILE}: 已收录 ${included.size} 个 repo,代理 ${PROXY || '(无)'},token ${TOKEN ? '有' : '无(匿名速率)'}`)

// ---- 两路搜索,合并去重;至少一路成功才继续 ----
const seen = new Map() // repo(小写) → 搜索条目
let anyRouteOk = false
for (const query of SEARCH_QUERIES) {
  try {
    const items = await searchRoute(query)
    anyRouteOk = true
    let fresh = 0
    for (const it of items) {
      const key = (it.full_name || '').toLowerCase()
      if (key && !seen.has(key)) { seen.set(key, it); fresh++ }
    }
    console.log(`搜索「${query}」: ${items.length} 条,去重后新增 ${fresh}`)
  }
  catch (err) {
    console.warn(`搜索「${query}」整路失败: ${err?.message || err}(跳过该路)`)
  }
}
if (!anyRouteOk) {
  console.error('两路搜索全失败(限流/代理不通?),本次不写 candidates.json')
  process.exit(1)
}

const merged = [...seen.values()].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
const notIncluded = merged.filter(it => !included.has(it.full_name.toLowerCase()))
console.log(`合并去重 ${merged.length} 个,剔除已收录后剩 ${notIncluded.length} 个待验证`)

// ---- 逐候选抓 package.json 验证 manifest,8 路并发池 ----
const toVerify = notIncluded.slice(0, MAX_CANDIDATES)
if (toVerify.length < notIncluded.length) {
  console.log(`候选过多:只验证 stars 前 ${MAX_CANDIDATES} 个,丢弃 ${notIncluded.length - toVerify.length} 个`)
}

const verified = []   // { it, type }
const rejected = []   // { repo, reason }
let done = 0
let cursor = 0

async function worker() {
  for (;;) {
    const i = cursor++
    if (i >= toVerify.length) return
    const it = toVerify[i]
    let pkg = null
    let reason = ''
    try {
      pkg = await fetchPkgJson(it.full_name)
    }
    catch (err) {
      reason = `抓取失败: ${err?.message || err}`
    }
    const type = pkg ? manifestType(pkg) : null
    if (type) verified.push({ it, type })
    else rejected.push({ repo: it.full_name, reason: reason || (pkg ? '无 dsh.bundle/dsh.client 声明' : '无根 package.json') })
    console.log(`[${String(done + 1).padStart(3)}/${toVerify.length}] ${it.full_name} ${type ? `✓ ${type}` : `✗ ${rejected[rejected.length - 1].reason}`}`)
    done++
  }
}

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toVerify.length || 1) }, worker))

// ---- 写盘:stars 降序;老候选沿用首次发现时间,新候选记当下 ----
let prev = {}
try { prev = JSON.parse(await readFile(OUT_FILE, 'utf8')) }
catch { /* 首次运行无旧文件 */ }
const prevAt = new Map((prev.candidates || []).map(c => [c.repo?.toLowerCase(), c.discoveredAt]))

const now = new Date().toISOString()
const candidates = verified
  .sort((a, b) => (b.it.stargazers_count || 0) - (a.it.stargazers_count || 0))
  .map(({ it, type }) => ({
    repo: it.full_name,
    url: it.html_url,
    name: it.name,
    stars: it.stargazers_count || 0,
    description: it.description || '',
    hasManifest: true,
    dshType: type,
    topics: (it.topics || []).slice(0, 8),
    discoveredAt: prevAt.get(it.full_name.toLowerCase()) || now,
  }))

await mkdir(resolve(OUT_FILE, '..'), { recursive: true })
await writeFile(OUT_FILE, JSON.stringify({ generatedAt: now, candidates }, null, 2) + '\n')

// ---- 统计 ----
console.log('—— 完成 ——')
console.log(`搜索合并 ${merged.length} → 未收录 ${notIncluded.length} → 验证通过 ${candidates.length} 个候选`)
console.log(`已写入 ${OUT_FILE}(提名清单,收录仍需人工/AI 审核)`)
if (rejected.length) {
  console.log(`剔除 ${rejected.length} 个:无 manifest ${rejected.filter(r => r.reason === '无 dsh.bundle/dsh.client 声明').length} / 无 package.json ${rejected.filter(r => r.reason === '无根 package.json').length} / 抓取失败 ${rejected.filter(r => r.reason.startsWith('抓取失败')).length}`)
}
console.log('Top 10 候选:')
candidates.slice(0, 10).forEach((c, i) =>
  console.log(`  ${String(i + 1).padStart(2)}. ${c.repo} ★${c.stars} [${c.dshType}] ${c.description.slice(0, 60)}`))
