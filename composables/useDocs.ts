// 文档区（/docs）数据层：data/docs/docs-data.json 单一数据源（66 篇，构建期内联）。
// 侧边栏树 / 翻页 / 总览卡片共用同一份树序；sitemap 与预渲染种子直接读同一 JSON，
// 新增篇章只改数据文件，四处自动跟随。
import docsData from '~/data/docs/docs-data.json'

export interface DocPage {
  slug: string
  title_zh: string
  title_en: string
  group: string
  group_en: string
  subgroup: string | null
  source: string
  content: string
}

interface DocsDataRaw {
  dshVersion: string
  groups: Array<{ group: string; group_en: string }>
  pages: DocPage[]
}

const data = docsData as unknown as DocsDataRaw

/** 全部文档页，保持数据文件顺序（组顺序 × 组内顺序）——侧边栏、总览、翻页、sitemap 同源 */
export const DOC_PAGES: DocPage[] = data.pages

/** 文档对应的 DSH 版本徽章文案，如 v0.1.0-rc.7 */
export const DOC_VERSION = data.dshVersion

/** locale → 字段约定：zh 用 *_zh，en/de/zh-TW 统一用 *_en（不机翻 66 篇标题） */
export function docTitle(p: DocPage, locale: string): string {
  return locale === 'zh' ? p.title_zh : p.title_en
}

export function docGroupLabel(g: { group: string; group_en: string }, locale: string): string {
  return locale === 'zh' ? g.group : g.group_en
}

/** 二级分组名数据里只有中文；仅 2 个值，手工映射，不设 i18n key */
const SUBGROUP_EN: Record<string, string> = { 基础概念: 'Basics', 核心机制: 'Core Mechanics' }
const SUBGROUP_ZH_TW: Record<string, string> = { 基础概念: '基礎概念', 核心机制: '核心機制' }

export function docSubgroupLabel(name: string, locale: string): string {
  if (locale === 'zh') return name
  if (locale === 'zh-TW') return SUBGROUP_ZH_TW[name] ?? name
  return SUBGROUP_EN[name] ?? name
}

export interface DocSidebarSubgroup { name: string | null; pages: DocPage[] }
export interface DocSidebarGroup {
  group: string
  group_en: string
  subgroups: DocSidebarSubgroup[]
}

/** 侧边栏树：组 →（可选二级分组，按首次出现顺序聚簇）→ 页，全部渲染不做 JS 折叠（SEO 内链） */
export function docGroups(): DocSidebarGroup[] {
  return data.groups.map((g) => {
    const subgroups: DocSidebarSubgroup[] = []
    for (const p of data.pages) {
      if (p.group !== g.group) continue
      const last = subgroups[subgroups.length - 1]
      if (last && last.name === p.subgroup) last.pages.push(p)
      else subgroups.push({ name: p.subgroup, pages: [p] })
    }
    return { ...g, subgroups }
  })
}

export function docBySlug(slug: string): DocPage | undefined {
  return DOC_PAGES.find(p => p.slug === slug)
}

/** 上一篇/下一篇：按树序全局扁平排序（与侧边栏、总览一致），首页 prev / 末页 next 为 null */
export function docNeighbors(slug: string): { prev: DocPage | null; next: DocPage | null } {
  const i = DOC_PAGES.findIndex(p => p.slug === slug)
  if (i < 0) return { prev: null, next: null }
  return {
    prev: i > 0 ? DOC_PAGES[i - 1] : null,
    next: i < DOC_PAGES.length - 1 ? DOC_PAGES[i + 1] : null,
  }
}

/** 页面组件统一入口（Nuxt 自动导入）；常量与工具函数按需具名导入 */
export function useDocs() {
  return {
    version: DOC_VERSION,
    pages: DOC_PAGES,
    groups: docGroups(),
    bySlug: docBySlug,
    neighbors: docNeighbors,
    title: docTitle,
    groupLabel: docGroupLabel,
    subgroupLabel: docSubgroupLabel,
  }
}
