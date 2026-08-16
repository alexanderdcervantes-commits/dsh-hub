#!/usr/bin/env node
// 断言「期望路由集 == 预渲染产物」：与 nuxt.config.ts 的 prerenderSeed 同源推导。
// 任一期望路由缺少 .output/public/<path>/index.html 即 exit 1（挡在 Vercel 之前）。
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const data = JSON.parse(readFileSync('public/data/plugins.json', 'utf8'))
const pluginSlugs = data.plugins.map(p => p.slug)
const memeSlugs = data.plugins.filter(p => p.is_meme).map(p => p.slug)
const topPages = ['', 'plugins', 'meme', 'submit', 'about', 'install', 'launcher']
const locales = ['en', 'zh', 'zh-TW', 'de']

const expected = [
  ...locales.flatMap(lang => {
    const prefix = lang === 'en' ? '' : `/${lang}`
    return [
      ...topPages.map(p => (p === '' ? (prefix || '/') : `${prefix}/${p}`)),
      ...pluginSlugs.map(s => `${prefix}/plugins/${s}`),
      ...memeSlugs.map(s => `${prefix}/meme/${s}`),
    ]
  }),
  // DSH Dojo 雪藏教程区：仅中文、无 i18n 前缀，与 nuxt.config.ts 的 DOJO_PAGES 同步
  ...['dojo', 'dojo/step-01', 'dojo/step-02', 'dojo/step-03', 'dojo/step-04', 'dojo/step-05', 'dojo/step-06', 'dojo/step-07', 'dojo/step-08', 'dojo/step-09', 'dojo/step-10', 'dojo/catalog', 'dojo/playground'].map(p => `/${p}`),
]

const outDir = '.output/public'
if (!existsSync(outDir)) {
  console.error(`✗ ${outDir} 不存在——先跑 nuxt generate`)
  process.exit(1)
}

const missing = expected.filter(route => {
  const file = route === '/' ? join(outDir, 'index.html') : join(outDir, route, 'index.html')
  return !existsSync(file)
})

// sitemap / robots 是单文件产物，单独断言
const extras = ['sitemap.xml', 'robots.txt'].filter(f => !existsSync(join(outDir, f)))

if (missing.length || extras.length) {
  console.error(`✗ 预渲染缺失：${missing.length} 页 HTML + ${extras.length} 个文件`)
  for (const m of missing.slice(0, 20)) console.error(`  - ${m}`)
  process.exit(1)
}

console.log(`✓ 预渲染全覆盖：${expected.length} 页 HTML + sitemap.xml + robots.txt`)
