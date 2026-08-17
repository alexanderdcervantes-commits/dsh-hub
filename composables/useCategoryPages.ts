// 分类落地页（Programmatic SEO）单一数据源：data/seo/category-pages.json。
// 运行时由 [slug].vue 分发器 / CategoryLanding / plugins 主目录页入口共用；
// 预渲染种子（nuxt.config.ts）与 sitemap（server/routes/sitemap.xml.ts）直接读同一 JSON，
// 新增分类只改配置文件，四处自动跟随。
import raw from '~/data/seo/category-pages.json'
import type { DshPlugin } from '~/composables/usePlugins'

/** 分类筛选条件：categoryZh ∪ memeSection ∪ topicsAny（正则），三者取并集 */
export interface CategoryFilter {
  categoryZh?: string[]
  memeSection?: string[]
  topicsAny?: string
}

/** 四语文案字段（en / zh / zh-TW / de，与 i18n locales 一一对应） */
export type L10nStr = Record<'en' | 'zh' | 'zh-TW' | 'de', string>
export type L10nStrList = Record<'en' | 'zh' | 'zh-TW' | 'de', string[]>

export interface CategoryFaq {
  q: L10nStr
  a: L10nStr
}

export interface CategoryPageConfig {
  slug: string
  enabled: boolean
  emoji: string
  ogImage: string
  filter: CategoryFilter
  label: L10nStr
  /** title/desc 含 {n} 占位符，运行时以该分类实际插件数填充（数字纪律：不写死数量） */
  title: L10nStr
  h1: L10nStr
  desc: L10nStr
  intro: L10nStrList
  installNote: L10nStr
  faqs: CategoryFaq[]
  keywords: { en: string[]; zh: string[] }
}

export const CATEGORY_PAGES = (raw as unknown as { categories: CategoryPageConfig[] }).categories

/** enabled 的分类（入口列表 / 预渲染 / sitemap 均只用这些） */
export function enabledCategoryPages(): CategoryPageConfig[] {
  return CATEGORY_PAGES.filter(c => c.enabled)
}

/** slug → 分类配置；只命中 enabled 的（配置下线 = 该路由回到插件详情 404 逻辑） */
export function categoryBySlug(slug: string): CategoryPageConfig | undefined {
  return CATEGORY_PAGES.find(c => c.slug === slug && c.enabled)
}

/** 按 locale 取四语字段，缺省回退 en（配置完整性由构建期人工保证，此处兜底防裸 key） */
export function pickL10n<T>(obj: Record<string, T>, locale: string): T {
  return (locale in obj ? obj[locale] : obj.en) as T
}

/** 填充 {n} 占位符（配置文案不经 vue-i18n，避免复数/管道语法副作用） */
export function fillN(tmpl: string, n: number): string {
  return tmpl.replace('{n}', String(n))
}

/**
 * 分类插件列表：应用 filter 三路并集 → slug 去重 → star 降序。
 * 与主目录页默认排序（query 默认 stars）一致，ItemList 结构化数据同源。
 */
export function categoryPlugins(cat: CategoryPageConfig, plugins: DshPlugin[]): DshPlugin[] {
  const rx = cat.filter.topicsAny ? new RegExp(cat.filter.topicsAny) : null
  const seen = new Set<string>()
  const out: DshPlugin[] = []
  for (const p of plugins) {
    const hit =
      (cat.filter.categoryZh?.includes(p.category_zh) ?? false)
      || (cat.filter.memeSection?.includes(p.meme_section ?? '') ?? false)
      || (!!rx && p.topics.some((tp: string) => rx.test(tp)))
    if (hit && !seen.has(p.slug)) {
      seen.add(p.slug)
      out.push(p)
    }
  }
  return out.sort((a, b) => b.stars - a.stars)
}
