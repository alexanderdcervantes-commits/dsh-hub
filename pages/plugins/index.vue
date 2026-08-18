<script setup lang="ts">
import { categoryPlugins, enabledCategoryPages, pickL10n } from '~/composables/useCategoryPages'
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const config = useRuntimeConfig()
const { plugins, query, categories } = usePlugins()

// 分类落地页入口（data/seo/category-pages.json 驱动）：标签、emoji、数量全部读配置+运行时计算，
// 新增分类自动出现在这里与 sitemap/预渲染里（真实可点击入口，非 sitemap 孤立页）
const categoryEntries = computed(() =>
  enabledCategoryPages().map(cat => ({
    slug: cat.slug,
    emoji: cat.emoji,
    label: pickL10n(cat.label, locale.value),
    count: categoryPlugins(cat, plugins).length,
  })))

// 列表默认 UI 状态（ItemList 结构化数据也用同一组常量，保证两边永不漂移）
const DEFAULT_CAT = 'all'
const DEFAULT_SORT: 'stars' | 'recent' | 'name' = 'stars'

// 搜索防抖:输入框即时回显,但过滤延迟 180ms —— 否则每次击键都同步重渲
// 整页插件卡(近 100 张,每张含 i18n/链接/复制条),慢设备上 INP 轻松破秒
const qInput = ref((route.query.q as string) ?? '')
const q = ref(qInput.value)
let qTimer: ReturnType<typeof setTimeout> | undefined
watch(qInput, (v: string) => {
  clearTimeout(qTimer)
  qTimer = setTimeout(() => (q.value = v), 180)
})
onBeforeUnmount(() => clearTimeout(qTimer))
const cat = ref((route.query.cat as string) ?? DEFAULT_CAT)
const sort = ref<'stars' | 'recent' | 'name'>(DEFAULT_SORT)

const cats = computed(() => categories(locale.value))

const results = computed(() =>
  query({ q: q.value, categoryKey: cat.value, sort: sort.value }))

// ItemList 结构化数据：与渲染列表共用 usePlugins() 同一份数据，
// 按默认渲染顺序（star 降序）列出全部插件，绝对 URL 走 runtimeConfig.siteUrl + localePath。
const siteUrl = config.public.siteUrl as string
const listPlugins = query({ q: '', categoryKey: DEFAULT_CAT, sort: DEFAULT_SORT })
const listItemJson = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: listPlugins.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.name,
    url: `${siteUrl}${localePath(`/plugins/${p.slug}`)}`,
  })),
})

useHead({
  title: t('meta.pluginsTitle'),
  meta: [{
    name: 'description',
    content: t('meta.pluginsDesc', { n: plugins.length }),
  }],
  script: [{
    type: 'application/ld+json',
    innerHTML: listItemJson,
  }],
})
</script>

<template>
  <div class="container plugins-flow">
    <div class="page-head">
      <h1>{{ t('plugins.title') }}</h1>
      <p class="sub">{{ t('plugins.sub', { n: plugins.length }) }}</p>
      <p class="sub" style="margin:0 0 6px"><NuxtLink :to="localePath('/install')">{{ t('plugins.installGuide') }}</NuxtLink></p>
      <!-- 导购入口：/store 的正文级内链（footer 之外的真实用户入口，防孤立页） -->
      <p class="sub" style="margin:0"><NuxtLink :to="localePath('/store')">{{ t('plugins.storeGuide') }}</NuxtLink></p>
    </div>

    <!-- 分类浏览入口（内链：每个分类一个落地页，承接分类搜索意图；数量运行时计算）。
         DOM 保持标题层级 h1→h2→卡片 h3 与桌面原位（搜索框上方）；≤620 经 .plugins-flow
         的 flex order 下沉到列表后——置顶时 14 个按钮换行成 ~380px 高的墙，把搜索框/筛选推出首屏 -->
    <section class="section cat-links-section">
      <div class="section-head">
        <h2>{{ t('catPages.browseH') }}</h2>
        <span class="count-note">{{ t('catPages.browseSub') }}</span>
      </div>
      <div class="filter-bar cat-links">
        <NuxtLink
          v-for="c in categoryEntries"
          :key="c.slug"
          class="btn"
          :to="localePath(`/plugins/${c.slug}`)"
        >
          {{ c.emoji }} {{ c.label }} ({{ c.count }})
        </NuxtLink>
      </div>
    </section>

    <!-- 全局 .search-wrap 是 margin:0 auto 居中（首页 hero 用），这里必须左对齐
         与标题/下拉框/计数保持同一视觉线，否则动线断裂 -->
    <div class="search-wrap" style="margin:0 0 14px">
      <span class="icon">🔍</span>
      <input v-model="qInput" type="search" :placeholder="t('plugins.searchPlaceholder')" aria-label="search">
    </div>

    <div class="filter-bar">
      <select v-model="cat" aria-label="category">
        <option value="all">{{ t('plugins.allCats') }}</option>
        <option v-for="c in cats" :key="c.key" :value="c.key">{{ c.emoji }} {{ c.label }} ({{ c.count }})</option>
      </select>
      <select v-model="sort" aria-label="sort">
        <option value="stars">{{ t('plugins.sortStars') }}</option>
        <option value="recent">{{ t('plugins.sortRecent') }}</option>
        <option value="name">{{ t('plugins.sortName') }}</option>
      </select>
    </div>

    <p class="result-note">{{ t('plugins.results', { n: results.length }) }}</p>

    <div v-if="results.length" class="grid cols-3" style="padding-bottom:50px">
      <PluginCard v-for="p in results" :key="p.slug" :plugin="p" />
    </div>
    <p v-else style="color:var(--text-3);padding-bottom:50px">{{ t('plugins.noResults') }}</p>
  </div>
</template>
