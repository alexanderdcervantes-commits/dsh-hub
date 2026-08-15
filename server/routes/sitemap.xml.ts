import { defineEventHandler } from 'h3'
import pluginsData from '~/public/data/plugins.json'

interface Slug { slug: string; is_meme: boolean }

// 全量 sitemap：顶层页 + 全部插件详情 + 整活详情，× 2 语种（en 根路径 / zh 前缀）
// siteUrl 来自 runtimeConfig（构建时 NUXT_PUBLIC_SITE_URL 注入），域名迁移只改一处
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const site = (config.public.siteUrl as string).replace(/\/$/, '')
  const plugins = (pluginsData as { plugins: Slug[] }).plugins

  const top = ['', 'plugins', 'meme', 'submit', 'about']
  const urls: string[] = []

  const emit = (path: string, altPath: string) => {
    urls.push(
      `  <url>\n    <loc>${site}${path || '/'}</loc>\n`
      + `    <xhtml:link rel="alternate" hreflang="en" href="${site}${path || '/'}"/>\n`
      + `    <xhtml:link rel="alternate" hreflang="zh" href="${site}${altPath || '/zh'}"/>\n`
      + `    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${path || '/'}"/>\n  </url>`,
    )
  }

  for (const p of top) {
    const en = p === '' ? '' : `/${p}`
    const zh = p === '' ? '/zh' : `/zh/${p}`
    emit(en, zh)
  }
  for (const plug of plugins) {
    emit(`/plugins/${plug.slug}`, `/zh/plugins/${plug.slug}`)
    if (plug.is_meme) emit(`/meme/${plug.slug}`, `/zh/meme/${plug.slug}`)
  }

  event.node.res.setHeader('content-type', 'application/xml')
  return `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`
    + `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`
    + urls.join('\n')
    + `\n</urlset>\n`
})
