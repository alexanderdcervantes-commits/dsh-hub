import data from '~/public/data/plugins.json'

export interface DshPlugin {
  slug: string
  name: string
  repo: string
  url: string
  description_zh: string
  description_en: string
  stars: number
  forks?: number
  category_zh: string
  category_en: string
  is_meme: boolean
  meme_section?: 'absurd' | 'skins' | 'pets' | 'slackoff' | 'useful' | 'textclub'
  meme_caption_zh?: string
  meme_caption_en?: string
  image: string | null
  install_cmd: string
  video_url?: string
  pushed_at: string
  license?: string | null
  language?: string | null
  has_manifest: boolean
  topics: string[]
}

interface PluginData {
  updatedAt: string
  count: number
  plugins: DshPlugin[]
}

const pluginData = data as unknown as PluginData

/** 分类 emoji 映射（首页分类网格 & 卡片 chip 用） */
const CATEGORY_EMOJI: Record<string, string> = {
  '抽象整活': '🤯', '换皮肤色': '🎨', '赛博宠物': '🐳', '摸鱼游戏': '🎮',
  '生产力工具': '🛠️', '文字选手': '📝', 'UI 增强': '✨', '工具与能力': '🧰',
  '开发与运行时': '⚙️', '工作流与自动化': '🔁', '通知与集成': '🔔',
  '会话与消息': '💬', '娱乐': '🎲', '记忆': '🧠',
}

export function usePlugins() {
  const plugins: DshPlugin[] = pluginData.plugins

  /** 当前 locale 下分类字段选择器 */
  const catOf = (p: DshPlugin, locale: string) =>
    locale === 'zh' ? p.category_zh : p.category_en

  const descOf = (p: DshPlugin, locale: string) =>
    locale === 'zh' ? p.description_zh : p.description_en

  const captionOf = (p: DshPlugin, locale: string) =>
    (locale === 'zh' ? p.meme_caption_zh : p.meme_caption_en) ?? ''

  const emojiOf = (p: DshPlugin) => CATEGORY_EMOJI[p.category_zh] ?? '🧩'

  const byStars = () => [...plugins].sort((a, b) => b.stars - a.stars)

  const memes = () => plugins.filter((p) => p.is_meme)

  /**
   * 最近 N 天内有推送的，按 pushed_at 倒序。
   * 以数据更新日期（updatedAt）为基准，保证 SSR/客户端预渲染水合一致；
   * 数据久未刷新时该区块可能长期显示同一批，需通过 build:data 刷新。
   */
  const fresh = (days = 7) => {
    const cutoff = new Date(pluginData.updatedAt)
    cutoff.setDate(cutoff.getDate() - days)
    const iso = cutoff.toISOString().slice(0, 10)
    return plugins.filter((p) => p.pushed_at && p.pushed_at >= iso)
      .sort((a, b) => (a.pushed_at < b.pushed_at ? 1 : -1))
  }

  /** 分类聚合（按 locale 取名），按数量倒序 */
  const categories = (locale: string) => {
    const map = new Map<string, { key: string; label: string; emoji: string; count: number }>()
    for (const p of plugins) {
      const label = catOf(p, locale)
      const key = p.category_zh // stable key regardless of locale
      const cur = map.get(key) ?? { key, label, emoji: emojiOf(p), count: 0 }
      cur.count++
      cur.label = label
      map.set(key, cur)
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }

  const bySlug = (slug: string) => plugins.find((p) => p.slug === slug)

  const related = (p: DshPlugin, n = 4) =>
    plugins.filter((x) => x.slug !== p.slug && x.category_zh === p.category_zh)
      .sort((a, b) => b.stars - a.stars)
      .slice(0, n)

  const totalStars = () => plugins.reduce((s, p) => s + p.stars, 0)

  /** 搜索 + 筛选 + 排序（/plugins 页用） */
  function query(opts: {
    q?: string
    categoryKey?: string // category_zh（稳定 key）
    memeSection?: string
    sort?: 'stars' | 'recent' | 'name'
  }): DshPlugin[] {
    let list = [...plugins]
    if (opts.memeSection) {
      list = list.filter((p) => p.is_meme && (opts.memeSection === 'all' || p.meme_section === opts.memeSection))
    }
    if (opts.categoryKey && opts.categoryKey !== 'all') {
      list = list.filter((p) => p.category_zh === opts.categoryKey)
    }
    const q = (opts.q ?? '').trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q)
        || p.repo.toLowerCase().includes(q)
        || p.description_zh.toLowerCase().includes(q)
        || p.description_en.toLowerCase().includes(q)
        || (p.meme_caption_zh ?? '').toLowerCase().includes(q)
        || (p.meme_caption_en ?? '').toLowerCase().includes(q)
        || p.topics.some((t) => t.toLowerCase().includes(q)))
    }
    switch (opts.sort) {
      case 'recent':
        list.sort((a, b) => ((a.pushed_at || '') < (b.pushed_at || '') ? 1 : -1))
        break
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        list.sort((a, b) => b.stars - a.stars)
    }
    return list
  }

  return {
    plugins,
    updatedAt: pluginData.updatedAt,
    catOf,
    descOf,
    captionOf,
    emojiOf,
    byStars,
    memes,
    fresh,
    categories,
    bySlug,
    related,
    totalStars,
    query,
  }
}

/** 本地收藏（点赞）：localStorage 计数，无后端 */
export function useLikes() {
  const KEY = 'dshmeme_likes_v1'
  const counts = useState<Record<string, number>>(KEY, () => ({}))
  const mine = useState<Set<string>>(`${KEY}_mine`, () => new Set())

  const load = () => {
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(KEY)
        if (raw) {
          const obj = JSON.parse(raw)
          counts.value = obj.counts ?? {}
          mine.value = new Set(obj.mine ?? [])
        }
      }
      catch {}
    }
  }

  const persist = () => {
    if (import.meta.client) {
      localStorage.setItem(KEY, JSON.stringify({
        counts: counts.value,
        mine: [...mine.value],
      }))
    }
  }

  const toggle = (slug: string) => {
    const c = { ...counts.value }
    c[slug] = Math.max(0, (c[slug] ?? 0) + (mine.value.has(slug) ? -1 : 1))
    counts.value = c
    const m = new Set(mine.value)
    m.has(slug) ? m.delete(slug) : m.add(slug)
    mine.value = m
    persist()
  }

  /** 展示用计数：本地赞 + star 数 /100 向下取整的种子底数（让卡片不至于全是 0） */
  const countOf = (slug: string, seed = 0) =>
    (counts.value[slug] ?? 0) + seed

  const liked = (slug: string) => mine.value.has(slug)

  return { load, toggle, countOf, liked }
}
