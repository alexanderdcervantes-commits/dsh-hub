<script setup lang="ts">
// SEO-PLACEHOLDER: 待升级（画廊预览/更多教程）
// 皮肤/换肤分类锚点页：承接 dsh 皮肤/换肤/theme/wallpaper 搜索意图
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins } = usePlugins()

// 筛选：换皮肤色类目 ∪ topics 含 skin/theme，去重后按 stars 降序
const list = computed(() => {
  const picked = plugins.filter((p) =>
    p.category_zh === '换皮肤色'
    || p.topics.some((tp) => tp.includes('skin') || tp.includes('theme')))
  const seen = new Set<string>()
  return picked
    .filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
    .sort((a, b) => b.stars - a.stars)
})

const siteUrl = config.public.siteUrl as string
const pageUrl = computed(() => `${siteUrl}${localePath('/plugins/skins')}`)
const title = computed(() => t('meta.skinsTitle'))
const desc = computed(() => t('meta.skinsDesc', { n: list.value.length }))

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
          { '@type': 'ListItem', position: 3, name: t('skins.title'), item: pageUrl.value },
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
  <!-- SEO-PLACEHOLDER: 待升级（画廊预览/更多教程） -->
  <div class="container">
    <div class="breadcrumb">
      <NuxtLink :to="localePath('/plugins')">{{ t('nav.plugins') }}</NuxtLink>
      / skins
    </div>
    <div class="page-head">
      <h1>{{ t('skins.title') }}</h1>
      <p class="sub">{{ t('skins.sub') }}</p>
      <p class="count-note" style="margin:0">{{ t('skins.count', { n: list.length }) }}</p>
    </div>

    <div class="prose">
      <h2>{{ t('skins.whatH') }}</h2>
      <p>{{ t('skins.whatP1') }}</p>
      <p>{{ t('skins.whatP2') }}</p>

      <h2>{{ t('skins.howH') }}</h2>
      <p>{{ t('skins.howP1') }}</p>
      <p>{{ t('skins.howP2') }}</p>
      <p><NuxtLink :to="localePath('/install')">{{ t('skins.howCta') }}</NuxtLink></p>
    </div>

    <section class="section">
      <div class="section-head">
        <h2>{{ t('skins.picksH') }}</h2>
      </div>
      <p class="sub" style="margin-top:0">{{ t('skins.picksP1') }}</p>
      <div class="grid cols-3" style="padding-bottom:50px">
        <PluginCard v-for="p in list" :key="p.slug" :plugin="p" />
      </div>
    </section>
  </div>
</template>
