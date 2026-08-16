import data from '~/public/data/launchers.json'

export interface DshLauncher {
  slug: string
  name: string
  repo: string
  url: string
  description_zh: string
  description_en: string
  stars: number
  platforms: string[]
  stack: string
  language: string
  license: string | null
  highlights_zh: string[]
  highlights_en: string[]
  platform_note_zh?: string
  platform_note_en?: string
  /** GitHub pushed_at（ISO 字符串），用于"最近更新"排序 */
  pushed_at?: string
}

interface LauncherData {
  updatedAt: string
  count: number
  launchers: DshLauncher[]
}

const launcherData = data as unknown as LauncherData

/** 筛选器 key → platforms 数组里的原始写法（数据里就是这几种拼写） */
const PLATFORM_KEY_TO_NAME: Record<string, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  android: 'Android',
}

/** 平台筛选器固定顺序（/launcher 页下拉框与 platformCounts 共用） */
export const PLATFORM_FILTERS = ['windows', 'macos', 'linux', 'android'] as const

export function useLaunchers() {
  const launchers: DshLauncher[] = launcherData.launchers

  /** 当前 locale 下字段选择器 */
  const descOf = (l: DshLauncher, locale: string) =>
    locale === 'zh' ? l.description_zh : l.description_en

  const highlightsOf = (l: DshLauncher, locale: string) =>
    (locale === 'zh' ? l.highlights_zh : l.highlights_en) ?? []

  const noteOf = (l: DshLauncher, locale: string) =>
    (locale === 'zh' ? l.platform_note_zh : l.platform_note_en) ?? ''

  /** 各筛选项的收录数（'all' 返回总数），数据驱动、不硬编码 */
  const platformCounts = (key: string) =>
    key === 'all'
      ? launchers.length
      : launchers.filter((l: DshLauncher) => l.platforms.includes(PLATFORM_KEY_TO_NAME[key] ?? key)).length

  /**
   * 平台筛选 + 排序（/launcher 页用）。
   * sort: 'stars' | 'recent' | 'name'。recent 按 pushed_at 降序（launchers.json 已带该字段）。
   */
  function query(opts: { platform?: string; sort?: 'stars' | 'recent' | 'name' }): DshLauncher[] {
    let list = [...launchers]
    if (opts.platform && opts.platform !== 'all') {
      const name = PLATFORM_KEY_TO_NAME[opts.platform] ?? opts.platform
      list = list.filter((l: DshLauncher) => l.platforms.includes(name))
    }
    if (opts.sort === 'name') {
      list.sort((a: DshLauncher, b: DshLauncher) => a.name.localeCompare(b.name))
    }
    else if (opts.sort === 'recent') {
      list.sort((a: DshLauncher, b: DshLauncher) => (b.pushed_at ?? '').localeCompare(a.pushed_at ?? ''))
    }
    else {
      list.sort((a: DshLauncher, b: DshLauncher) => b.stars - a.stars)
    }
    return list
  }

  return {
    launchers,
    updatedAt: launcherData.updatedAt,
    descOf,
    highlightsOf,
    noteOf,
    platformCounts,
    query,
  }
}
