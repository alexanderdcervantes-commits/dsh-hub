<script setup lang="ts">
// SEO-PLACEHOLDER: 待升级（桌宠互动展示/IP 专题）
// 桌宠/桌面宠物分类锚点页：承接 dsh 桌宠/桌面宠物/pet/mascot 搜索意图
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins } = usePlugins()

// 筛选：赛博宠物类目 ∪ meme pets 分区，去重后按 stars 降序
const list = computed(() => {
  const picked = plugins.filter((p) =>
    p.category_zh === '赛博宠物' || p.meme_section === 'pets')
  const seen = new Set<string>()
  return picked
    .filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
    .sort((a, b) => b.stars - a.stars)
})

const siteUrl = config.public.siteUrl as string
const pageUrl = computed(() => `${siteUrl}${localePath('/plugins/pets')}`)
const title = computed(() => t('meta.petsTitle'))
const desc = computed(() => t('meta.petsDesc'))

useHead({
  title,
  meta: [
    { name: 'description', content: desc },
    { property: 'og:title', content: title },
    { property: 'og:description', content: desc },
    { property: 'og:image', content: `${siteUrl}/images/dsh-client-ui-pet.webp` },
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
          { '@type': 'ListItem', position: 3, name: t('pets.title'), item: pageUrl.value },
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
  <!-- SEO-PLACEHOLDER: 待升级（桌宠互动展示/IP 专题） -->
  <div class="container">
    <div class="breadcrumb">
      <NuxtLink :to="localePath('/plugins')">{{ t('nav.plugins') }}</NuxtLink>
      / pets
    </div>
    <div class="page-head">
      <h1>{{ t('pets.title') }}</h1>
      <p class="sub">{{ t('pets.sub') }}</p>
      <p class="count-note" style="margin:0">{{ t('pets.count', { n: list.length }) }}</p>
    </div>

    <div class="prose">
      <h2>{{ t('pets.cultureH') }}</h2>
      <p>{{ t('pets.cultureP1') }}</p>
      <p>{{ t('pets.cultureP2') }}</p>

      <h2>{{ t('pets.howH') }}</h2>
      <p>{{ t('pets.howP1') }}</p>
      <p><NuxtLink :to="localePath('/install')">{{ t('pets.howCta') }}</NuxtLink></p>
    </div>

    <section class="section">
      <div class="section-head">
        <h2>{{ t('pets.picksH') }}</h2>
      </div>
      <p class="sub" style="margin-top:0">{{ t('pets.picksP1') }}</p>
      <div class="grid cols-3" style="padding-bottom:50px">
        <PluginCard v-for="p in list" :key="p.slug" :plugin="p" />
      </div>
    </section>
  </div>
</template>
