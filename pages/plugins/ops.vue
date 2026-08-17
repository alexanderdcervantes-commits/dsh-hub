<script setup lang="ts">
// 安全与运维分类锚点页:承接 dsh 安全/审计/用量监控/费用 搜索意图
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins } = usePlugins()

// 筛选:安全与运维类目 ∪ topics 含 security/telemetry/audit,去重后按 stars 降序
const list = computed(() => {
  const picked = plugins.filter((p) =>
    p.category_zh === '安全与运维'
    || p.topics.some((tp) => /security|telemetry|audit/.test(tp)))
  const seen = new Set<string>()
  return picked
    .filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
    .sort((a, b) => b.stars - a.stars)
})

const siteUrl = config.public.siteUrl as string
const pageUrl = computed(() => `${siteUrl}${localePath('/plugins/ops')}`)
const title = computed(() => t('meta.opsTitle'))
const desc = computed(() => t('meta.opsDesc', { n: list.value.length }))

useHead({
  title,
  meta: [
    { name: 'description', content: desc },
    { property: 'og:title', content: title },
    { property: 'og:description', content: desc },
    { property: 'og:image', content: `${siteUrl}/images/dsh-deep-whale.webp` },
    { property: 'og:url', content: pageUrl.value },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'DSH Meme Hub', item: `${siteUrl}${localePath('/')}` },
          { '@type': 'ListItem', position: 2, name: t('nav.plugins'), item: `${siteUrl}${localePath('/plugins')}` },
          { '@type': 'ListItem', position: 3, name: t('ops.title'), item: pageUrl.value },
        ],
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: list.value.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.name,
          url: `${siteUrl}${localePath(`/plugins/${p.slug}`)}`,
        })),
      }),
    },
  ],
})
</script>

<template>
  <div class="container">
    <div class="breadcrumb">
      <NuxtLink :to="localePath('/plugins')">{{ t('nav.plugins') }}</NuxtLink>
      / ops
    </div>
    <div class="page-head">
      <h1>{{ t('ops.title') }}</h1>
      <p class="sub">{{ t('ops.sub') }}</p>
      <p class="count-note" style="margin:0">{{ t('ops.count', { n: list.length }) }}</p>
    </div>

    <div class="prose">
      <h2>{{ t('ops.whatH') }}</h2>
      <p>{{ t('ops.whatP1') }}</p>
      <p>{{ t('ops.whatP2') }}</p>

      <h2>{{ t('ops.howH') }}</h2>
      <p>{{ t('ops.howP1') }}</p>
      <p>{{ t('ops.howP2') }}</p>
      <p><NuxtLink :to="localePath('/install')">{{ t('ops.howCta') }}</NuxtLink></p>
    </div>

    <section class="section">
      <div class="section-head">
        <h2>{{ t('ops.picksH') }}</h2>
      </div>
      <p class="sub" style="margin-top:0">{{ t('ops.picksP1') }}</p>
      <div class="grid cols-3" style="padding-bottom:50px">
        <PluginCard v-for="p in list" :key="p.slug" :plugin="p" />
      </div>
    </section>
  </div>
</template>
