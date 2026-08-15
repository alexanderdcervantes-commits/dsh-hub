import { defineEventHandler } from 'h3'

// robots.txt 也走 runtimeConfig 域名（迁移时一处生效）
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const site = (config.public.siteUrl as string).replace(/\/$/, '')
  event.node.res.setHeader('content-type', 'text/plain')
  return `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`
})
