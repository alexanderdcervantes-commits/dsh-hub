#!/usr/bin/env node
/**
 * import-awesome.mjs — 从 awesome-dsh-plugin.com/plugins.json 全量导入（官方 canonical，免验证）
 * 用户决策 2026-08-19：直接收录全部，质量字段后续人工打磨。
 *
 * 映射规则：
 *  - 官方 20 类 → 本站 14 类（filter.categoryZh 精确值），映射表见 CATEGORY_MAP
 *  - 繁体 *_zh_TW 用 opencc-js s2twp 只转换新条目（绝不动既有条目，避免覆盖人工润色）
 *  - 新条目标记 auto_ingested: true；screenshots 留空（每日自动管道补）；stars 用官方当日快照
 *  - slug 冲突（与既有 slug 同名）→ 加 owner 前缀
 */
import { readFileSync, writeFileSync } from 'node:fs'
import OpenCC from 'opencc-js'

const SITE_JSON = new URL('../public/data/plugins.json', import.meta.url).pathname
const AW_JSON = new URL('../data/awesome-import-source.json', import.meta.url).pathname
const CATEGORY_CFG = new URL('../data/seo/category-pages.json', import.meta.url).pathname

const convert = OpenCC.Converter({ from: 'cn', to: 'twp' })

// 官方 category 码 → 本站 14 类（category_zh 精确值，与 category-pages.json filter 对齐）
const CATEGORY_MAP = {
  ui: 'UI 增强', tools: '工具与集成', theme: '换皮肤色', fun: '娱乐',
  vision: '视觉与多模态', memory: '记忆与知识', model: 'Agent 与自动化',
  usage: '安全与运维', dev: '生态与开发', skill: '工具与集成',
  security: '安全与运维', git: '工具与集成', browser: '工具与集成',
  workflow: 'Agent 与自动化', session: '会话与消息', notify: '工具与集成',
  market: '生态与开发', remote: '客户端与终端', voice: '工具与集成', docs: '工具与集成',
}

// 本站 14 类的 category_en（从 category-pages.json label.en 提取）
const cfg = JSON.parse(readFileSync(CATEGORY_CFG, 'utf8'))
const EN_LABELS = {}
for (const c of cfg.categories) {
  EN_LABELS[c.filter.categoryZh[0]] = c.label.en
}

const site = JSON.parse(readFileSync(SITE_JSON, 'utf8'))
const aw = JSON.parse(readFileSync(AW_JSON, 'utf8'))

const existingByRepo = new Set(site.plugins.map(p => (p.repo || '').toLowerCase()))
const existingSlugs = new Set(site.plugins.map(p => p.slug))

const added = []
const skipped = { dup: 0, noInstall: 0, noDesc: 0 }
const catCount = {}

for (const p of aw.plugins) {
  const repo = `${p.owner}/${p.name}`.toLowerCase()
  if (existingByRepo.has(repo)) { skipped.dup++; continue }
  if (!p.install) { skipped.noInstall++; continue }
  const zh = (p.description && p.description.zh) || ''
  const en = (p.description && p.description.en) || ''
  if (!zh || !en) { skipped.noDesc++; continue }

  let slug = p.name
  if (existingSlugs.has(slug)) slug = `${p.owner}-${p.name}`
  existingSlugs.add(slug)

  const catZh = CATEGORY_MAP[p.category] || '工具与集成'
  const catEn = EN_LABELS[catZh] || 'Tools & Integrations'
  catCount[catZh] = (catCount[catZh] || 0) + 1

  added.push({
    slug,
    name: p.name,
    repo: `${p.owner}/${p.name}`,
    url: p.url,
    description_zh: zh,
    description_en: en,
    stars: p.stars ?? null,
    forks: null,
    category_zh: catZh,
    category_en: catEn,
    is_meme: false,
    meme_section: null,
    meme_caption_zh: '',
    meme_caption_en: '',
    image: null,
    install_cmd: p.install,
    pushed_at: null,
    license: null,
    language: null,
    has_manifest: true,
    topics: [],
    description_zh_TW: convert(zh),
    category_zh_TW: convert(catZh),
    meme_caption_zh_TW: '',
    screenshots: [],
    auto_ingested: true,
  })
}

site.plugins.push(...added)
site.count = site.plugins.length
site.updatedAt = new Date().toISOString().slice(0, 10)

writeFileSync(SITE_JSON, JSON.stringify(site, null, 1) + '\n')

console.log('=== 导入完成 ===')
console.log('新增:', added.length, '| 去重跳过:', skipped.dup, '| 无 install:', skipped.noInstall, '| 无双语描述:', skipped.noDesc)
console.log('站点总数:', site.count)
console.log('=== 新增分类分布 ===')
for (const [k, v] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) console.log(`  ${v.toString().padStart(4)}  ${k}`)
