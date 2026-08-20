#!/usr/bin/env node
// 全量抓取插件仓库 README,落盘 public/readmes/{slug}.md(只读 plugins.json,不改写它)。
// 详情页 components/PluginReadme.vue 用 import.meta.glob 按需懒加载这些文件渲染 markdown-body。
//
// 抓取链路(逐插件,基建与 fetch-screenshots.mjs 完全同款):
//   1. git ls-remote 取 repo HEAD 的 40 位 commit SHA(child_process,不占 API 配额)
//   2. 抓 raw.githubusercontent.com/{repo}/{SHA}/README.md,404 依次试 README / readme.md
//      (README.zh.md 不收,详情页正文以 README.md 为准)
//   3. 正文图片改写为钉死 SHA 的防裂绝对地址 —— 与截图管道的过滤逻辑相反:
//      SVG / shields 徽章一律保留(README 页要展示它们),只做地址归一化:
//      - Markdown ![](相对路径) 与 <img src="相对路径"> → raw.githubusercontent.com/{repo}/{SHA}/{路径}
//      - 同仓库 raw / github blob 链接 → 分支名替换为 SHA(防改名/force-push 裂图)
//      - 其余绝对 https(CDN、badge 服务)原样保留;锚点、data: 等无法归一化的保留原样
//   4. 超 400KB 按字节截断并追加注释行;写入 public/readmes/{slug}.md(幂等,重跑覆盖)
//
// monorepo 子包:repo 字段形如 owner/name#packages/foo 时只抓 {#后路径}/README.md,
// 全部 404 视作「跳过」记录在案,不回退仓库根 README(子包页面展示根 README 文不对题)。
//
// 本机访问 GitHub 必须走 sing-box 代理;undici ProxyAgent + git -c http.proxy 同 fetch-screenshots。
// 单个插件失败只记入 data/readme-failures.json(repo + 原因),绝不中断整体。
import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DATA_FILE = resolve(import.meta.dirname, '../public/data/plugins.json')
const OUT_DIR = resolve(import.meta.dirname, '../public/readmes')
const FAILURES_FILE = resolve(import.meta.dirname, '../data/readme-failures.json')
// GITHUB_DIRECT=1 时强制不走代理(GitHub Actions runner 直连;本机默认走 sing-box)
const PROXY = process.env.GITHUB_DIRECT ? '' : (process.env.HTTP_PROXY || process.env.http_proxy || 'http://127.0.0.1:7890')
const TIMEOUT_MS = 20_000
const CONCURRENCY = 8
const RAW_BASE = 'https://raw.githubusercontent.com'
// 404 依次尝试的文件名(raw 区分大小写)
const README_FILES = ['README.md', 'README', 'readme.md']
const MAX_BYTES = 400 * 1024

// undici 的 fetch 与全局 fetch 同 API,但确保请求经过上面的 ProxyAgent
let ProxyAgent, setGlobalDispatcher, fetchViaProxy
try {
  ({ ProxyAgent, setGlobalDispatcher, fetch: fetchViaProxy } = await import('undici'))
}
catch {
  console.error('缺少依赖 undici(本机走代理抓 GitHub 必需):请先运行 npm i -D undici')
  process.exit(1)
}
if (PROXY) setGlobalDispatcher(new ProxyAgent(PROXY))

/** execFile 的 Promise 包装,出错时优先带出 stderr */
const execFileP = (cmd, args, opts) => new Promise((resolveP, rejectP) => {
  execFile(cmd, args, opts, (err, stdout, stderr) => {
    if (err) rejectP(new Error(stderr?.trim() || err.message))
    else resolveP(stdout)
  })
})

/** 取 repo HEAD 的完整 40 位 commit SHA;git 需显式传代理 */
async function headSha(repo) {
  const args = []
  if (PROXY) args.push('-c', `http.proxy=${PROXY}`)
  args.push('ls-remote', `https://github.com/${repo}.git`, 'HEAD')
  const out = await execFileP('git', args, { timeout: TIMEOUT_MS })
  const sha = (out.trim().split(/\s+/)[0] || '')
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`ls-remote 无有效 HEAD: ${out.trim().slice(0, 60)}`)
  return sha
}

// monorepo 常出现「多个插件共享同一 repo」:缓存 ls-remote 的 Promise,并发下每仓只打一次;
// 失败立即逐出缓存,同一 repo 后续插件还有重试机会
const shaCache = new Map()
function headShaCached(repo) {
  let p = shaCache.get(repo)
  if (!p) {
    p = headSha(repo)
    shaCache.set(repo, p)
    p.catch(() => shaCache.delete(repo))
  }
  return p
}

/** 抓文本:2xx 返回正文,404/410 返回 null(换下一个候选文件名),其余状态码/网络异常抛出 */
async function fetchText(url) {
  const res = await fetchViaProxy(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (res.ok) return res.text()
  if (res.status === 404 || res.status === 410) return null
  throw new Error(`HTTP ${res.status}`)
}

/**
 * 图片地址归一化(防裂,规则与 fetch-screenshots.mjs 同款,外加子包基路径):
 *   - 相对路径 → raw.githubusercontent.com/{repo}/{SHA}/{baseDir + path}(README 所在目录起算)
 *   - 同仓库 raw 链接 / github blob 链接 → 分支名替换为 SHA(路径本就是仓库绝对路径,不叠 baseDir)
 *   - 其余绝对 https(含 SVG / shields 徽章 —— README 页要展示,不过滤)原样保留
 * @returns {string|null} null = 无法归一化,调用方保留原样
 */
function normalizeImageUrl(rawUrl, repo, sha, baseDir) {
  let u = rawUrl.trim()
  if (u.startsWith('<') && u.endsWith('>')) u = u.slice(1, -1)
  if (!u || u.startsWith('#') || u.startsWith('data:')) return null
  if (u.startsWith('//')) return `https:${u}`

  if (/^https?:\/\//i.test(u)) {
    // 同仓库 raw: https://raw.githubusercontent.com/{repo}/{branch}/{path}
    const rawPrefix = `https://raw.githubusercontent.com/${repo.toLowerCase()}/`
    if (u.toLowerCase().startsWith(rawPrefix)) {
      const rest = u.slice(rawPrefix.length)
      const slash = rest.indexOf('/')
      if (slash > 0) return `${RAW_BASE}/${repo}/${sha}/${rest.slice(slash + 1)}`
    }
    // 同仓库 blob 页: https://github.com/{repo}/blob/{branch}/{path} → raw + SHA
    const blobPrefix = `https://github.com/${repo.toLowerCase()}/blob/`
    if (u.toLowerCase().startsWith(blobPrefix)) {
      const rest = u.slice(blobPrefix.length)
      const slash = rest.indexOf('/')
      if (slash > 0) return `${RAW_BASE}/${repo}/${sha}/${rest.slice(slash + 1)}`
    }
    return u
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return null // mailto: ftp: 等其它协议

  // 仓库内相对路径:先落子包基路径(monorepo),再逐段消解 ./ ../;含空格/中文的段百分号编码
  const segs = []
  for (const seg of baseDir.split('/')) if (seg) segs.push(seg)
  for (const seg of u.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') { segs.pop(); continue }
    segs.push(/[^\w.\-~()%]/.test(seg) ? encodeURIComponent(seg) : seg)
  }
  return segs.length ? `${RAW_BASE}/${repo}/${sha}/${segs.join('/')}` : null
}

/**
 * 改写正文里的图片地址(Markdown ![](url "title") 与 <img src="url"> 两种语法;
 * 链接、代码块等其余内容一律不动)。正则按「前缀 + URL + 后缀」三段捕获后原样重组,
 * 避免 URL 字符串恰好也出现在 alt 文本里时误伤第一处出现。
 */
const MD_IMG_RE = /(!\[[^\]]*\]\(\s*)(<[^>]*>|[^)\s]+)((?:\s+"[^"]*")?\s*\))/g
const HTML_IMG_RE = /(<img\b[^>]*?\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi

function rewriteImages(text, repo, sha, baseDir) {
  const fix = (u) => normalizeImageUrl(u, repo, sha, baseDir) ?? u
  return text
    .replace(MD_IMG_RE, (full, pre, url, post) => `${pre}${fix(url)}${post}`)
    .replace(HTML_IMG_RE, (full, pre, url, post) => `${pre}${fix(url)}${post}`)
}

/** 超 400KB 按字节截断(边界可能切碎多字节字符,utf8 解码自动吞掉残字节) */
function capSize(text) {
  const buf = Buffer.from(text, 'utf8')
  if (buf.length <= MAX_BYTES) return text
  return `${buf.slice(0, MAX_BYTES).toString('utf8')}\n\n<!-- 本 README 超过 400KB,此处截断,完整内容请去仓库查看 -->\n`
}

/** 单个插件的 README 抓取:返回改写后的 md 全文;仓库(或子包)没有 README 返回 null;网络等硬错误抛出 */
async function fetchReadme(plugin) {
  // repo 形如 owner/name 或 owner/name#packages/foo(monorepo 子包)
  const hashAt = plugin.repo.indexOf('#')
  const repo = hashAt === -1 ? plugin.repo : plugin.repo.slice(0, hashAt)
  const subPath = hashAt === -1 ? '' : plugin.repo.slice(hashAt + 1).replace(/^\/+|\/+$/g, '')
  const sha = await headShaCached(repo)

  const base = subPath ? `${subPath}/` : ''
  for (const file of README_FILES) {
    const text = await fetchText(`${RAW_BASE}/${repo}/${sha}/${base}${file}`)
    if (text !== null) return capSize(rewriteImages(text, repo, sha, base))
  }
  return null
}

// ---- 主流程:8 路并发池,逐插件写 public/readmes/{slug}.md ----
const raw = await readFile(DATA_FILE, 'utf8')
const data = JSON.parse(raw)
const plugins = data.plugins
console.log(`${DATA_FILE}: ${plugins.length} 个插件,代理 ${PROXY || '(无)'},并发 ${CONCURRENCY}`)

// 即使全军覆没也保证目录/清单文件在,workflow 的 git add 路径不落空
await mkdir(OUT_DIR, { recursive: true })

const failures = [] // 硬错误 + 没写 README 的仓库,统一落 data/readme-failures.json
let okCount = 0
let skipCount = 0
let done = 0
let cursor = 0

async function worker() {
  for (;;) {
    const i = cursor++
    if (i >= plugins.length) return
    const plugin = plugins[i]
    const tag = () => `[${String(done + 1).padStart(4)}/${plugins.length}]`
    try {
      const md = await fetchReadme(plugin)
      if (md === null) {
        skipCount++
        failures.push({ repo: plugin.repo, slug: plugin.slug, kind: 'no-readme', reason: 'README.md / README / readme.md 均不存在' })
        console.log(`${tag()} ${plugin.repo} → 跳过(无 README)`)
      }
      else {
        await writeFile(resolve(OUT_DIR, `${plugin.slug}.md`), md) // 幂等:整体覆盖
        okCount++
        console.log(`${tag()} ${plugin.repo} → ${(md.length / 1024).toFixed(0)}KB`)
      }
    }
    catch (err) {
      failures.push({ repo: plugin.repo, slug: plugin.slug, kind: 'error', reason: err?.message || String(err) })
      console.log(`${tag()} ${plugin.repo} → 失败: ${err?.message || err}`)
    }
    done++
  }
}

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, plugins.length) }, worker))

// 熔断:硬错误过半说明代理/GitHub 整体抽风,直接失败退出 —— 此时产出的失败清单只有误导性
const errors = failures.filter(f => f.kind === 'error')
if (errors.length > plugins.length / 2) {
  console.error(`硬失败 ${errors.length}/${plugins.length} 过半,疑似网络整体故障;本次不写任何文件`)
  process.exit(1)
}

await writeFile(FAILURES_FILE, JSON.stringify(failures, null, 2) + '\n')

// ---- 统计 ----
console.log('—— 完成 ——')
console.log(`成功 ${okCount} / 失败 ${errors.length} / 跳过 ${skipCount}(跳过=仓库或子包无 README)`)
if (failures.length) {
  console.log(`失败与跳过明细(${failures.length} 条)已写入 ${FAILURES_FILE}`)
  for (const f of failures.slice(0, 20)) console.log(`  - [${f.kind}] ${f.repo}: ${f.reason}`)
  if (failures.length > 20) console.log(`  … 其余 ${failures.length - 20} 条见失败清单`)
}
