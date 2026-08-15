<script setup lang="ts">
const { t, locale } = useI18n()
const route = useRoute()
const { query, categories } = usePlugins()

const q = ref((route.query.q as string) ?? '')
const cat = ref((route.query.cat as string) ?? 'all')
const sort = ref<'stars' | 'recent' | 'name'>('stars')

const cats = computed(() => categories(locale.value))

const results = computed(() =>
  query({ q: q.value, categoryKey: cat.value, sort: sort.value }))

useHead({
  title: locale.value === 'zh'
    ? '全部 dsh 插件目录 — DSH Meme Hub'
    : 'All dsh Plugins — DSH Meme Hub',
  meta: [{
    name: 'description',
    content: locale.value === 'zh'
      ? '已收录的全部 DeepSeek Harness (dsh) 社区插件：搜索、分类筛选、按 star 或最近推送排序，附一键安装命令。'
      : 'Every catalogued DeepSeek Harness (dsh) community plugin: search, filter by category, sort by stars or recency, with one-click install commands.',
  }],
})
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1>{{ t('plugins.title') }}</h1>
      <p class="sub">{{ t('plugins.sub') }}</p>
    </div>

    <div class="search-wrap" style="margin-bottom:14px">
      <span class="icon">🔍</span>
      <input v-model="q" type="search" :placeholder="t('plugins.searchPlaceholder')" aria-label="search">
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
