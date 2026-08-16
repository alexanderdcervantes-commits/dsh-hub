<script setup lang="ts">
import { PLATFORM_FILTERS } from '~/composables/useLaunchers'
import type { DshLauncher } from '~/composables/useLaunchers'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { launchers, updatedAt, query, platformCounts } = useLaunchers()

// 列表默认 UI 状态（ItemList 结构化数据也用同一组常量，保证两边永不漂移）
const DEFAULT_PLATFORM = 'all'
const DEFAULT_SORT: 'stars' | 'recent' | 'name' = 'stars'

const platform = ref(DEFAULT_PLATFORM)
const sort = ref<'stars' | 'recent' | 'name'>(DEFAULT_SORT)

const results = computed(() =>
  query({ platform: platform.value, sort: sort.value }))

// CollectionPage + ItemList 结构化数据：与渲染列表共用 useLaunchers() 同一份数据，
// 按默认渲染顺序（star 降序）列出全部启动器，条目 url 指向各项目 GitHub 仓库。
const siteUrl = config.public.siteUrl as string
const listLaunchers = query({ platform: DEFAULT_PLATFORM, sort: DEFAULT_SORT })
const collectionJson = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: locale.value === 'zh' ? 'DSH 桌面启动器目录 — DSH Meme Hub' : 'DSH Desktop Launchers — DSH Meme Hub',
  description: locale.value === 'zh'
    ? '把 DSH 装进原生桌面窗口的一键启动器收录：按平台筛选，按 star 排序，面向不想敲命令行的新手。'
    : 'Community one-click launchers that wrap DSH in a native desktop window: filter by platform, sort by stars. Built for people who never want to open a terminal.',
  url: `${siteUrl}${localePath('/launcher')}`,
  inLanguage: locale.value,
  isPartOf: { '@type': 'WebSite', name: 'DSH Meme Hub', url: siteUrl },
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: listLaunchers.length,
    itemListElement: listLaunchers.map((l: DshLauncher, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: l.name,
      url: l.url,
    })),
  },
})

const pageTitle = locale.value === 'zh'
  ? 'DSH 桌面启动器 — 不敲命令行也能用 | DSH Meme Hub'
  : 'DSH Desktop Launchers — no terminal required | DSH Meme Hub'
const pageDesc = locale.value === 'zh'
  ? '不想敲命令行？这些社区项目把 DSH 装进原生桌面窗口、做成一键启动器——下载安装、双击即用，覆盖 Windows/macOS/Linux/安卓。'
  : 'Don\'t want to touch a terminal? These community projects wrap DSH in a native desktop window or a one-click launcher — download, install, double-click. Windows/macOS/Linux/Android.'
const ogUrl = `${siteUrl}${localePath('/launcher')}`
const ogImage = `${siteUrl}/images/dsh-deep-whale.webp`

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDesc },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDesc },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: ogImage },
    { property: 'og:url', content: ogUrl },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: collectionJson,
  }],
})

useSeoMeta({
  title: pageTitle,
  description: pageDesc,
  ogTitle: pageTitle,
  ogDescription: pageDesc,
  ogType: 'website',
  ogImage,
  ogUrl,
})
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1>🖥️ {{ t('launcher.title') }}</h1>
      <p class="sub">{{ t('launcher.sub') }}</p>
      <p class="sub note" style="margin:0 0 6px">{{ t('launcher.note') }}</p>
    </div>

    <div class="filter-bar">
      <select v-model="platform" aria-label="platform">
        <option value="all">{{ t('launcher.allPlatforms') }} ({{ platformCounts('all') }})</option>
        <option v-for="p in PLATFORM_FILTERS" :key="p" :value="p">{{ t(`launcher.pf.${p}`) }} ({{ platformCounts(p) }})</option>
      </select>
      <select v-model="sort" aria-label="sort">
        <option value="stars">{{ t('launcher.sortStars') }}</option>
        <option value="recent">{{ t('launcher.sortRecent') }}</option>
        <option value="name">{{ t('launcher.sortName') }}</option>
      </select>
    </div>

    <p class="result-note">{{ t('launcher.results', { n: results.length }) }}</p>

    <div v-if="results.length" class="grid cols-3" style="padding-bottom:26px">
      <LauncherCard v-for="l in results" :key="l.slug" :launcher="l" />
    </div>
    <p v-else style="color:var(--text-3);padding-bottom:26px">{{ t('launcher.noResults') }}</p>

    <div class="warning" style="margin-bottom:60px">
      <strong>{{ t('launcher.disclaimerTitle') }}</strong>
      <p style="margin:6px 0 0">{{ t('launcher.disclaimer', { date: updatedAt }) }}</p>
    </div>
  </div>
</template>
