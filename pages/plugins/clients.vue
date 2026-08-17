<script setup lang="ts">
// 客户端与终端分类锚点页:承接 dsh TUI/终端 UI/桌面客户端/启动器 搜索意图
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins } = usePlugins()

// 筛选:客户端与终端类目 ∪ topics 含 tui/terminal,去重后按 stars 降序
const list = computed(() => {
  const picked = plugins.filter((p) =>
    p.category_zh === '客户端与终端'
    || p.topics.some((tp) => /tui|terminal/.test(tp)))
  const seen = new Set<string>()
  return picked
    .filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
    .sort((a, b) => b.stars - a.stars)
})

const siteUrl = config.public.siteUrl as string
const pageUrl = computed(() => `${siteUrl}${localePath('/plugins/clients')}`)
const title = computed(() => t('meta.clientsTitle'))
const desc = computed(() => t('meta.clientsDesc', { n: list.value.length }))

useHead({
  title,
  meta: [
    { name: 'description', content: desc },
    { property: 'og:title', content: title },
    { property: 'og:description', content: desc },
    { property: 'og:image', content: `${siteUrl}/images/dsh-tui.webp` },
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
          { '@type': 'ListItem', position: 3, name: t('clients.title'), item: pageUrl.value },
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
      / clients
    </div>
    <div class="page-head">
      <h1>{{ t('clients.title') }}</h1>
      <p class="sub">{{ t('clients.sub') }}</p>
      <p class="count-note" style="margin:0">{{ t('clients.count', { n: list.length }) }}</p>
    </div>

    <div class="prose">
      <h2>{{ t('clients.whatH') }}</h2>
      <p>{{ t('clients.whatP1') }}</p>
      <p>{{ t('clients.whatP2') }}</p>

      <h2>{{ t('clients.howH') }}</h2>
      <p>{{ t('clients.howP1') }}</p>
      <p>{{ t('clients.howP2') }}</p>
      <p><NuxtLink :to="localePath('/install')">{{ t('clients.howCta') }}</NuxtLink></p>
    </div>

    <section class="section">
      <div class="section-head">
        <h2>{{ t('clients.picksH') }}</h2>
      </div>
      <p class="sub" style="margin-top:0">{{ t('clients.picksP1') }}</p>
      <div class="grid cols-3" style="padding-bottom:50px">
        <PluginCard v-for="p in list" :key="p.slug" :plugin="p" />
      </div>
    </section>
  </div>
</template>
