<script setup lang="ts">
// /docs 文档总览：欢迎语 + 七组卡片（组名 + 篇数 + 前 5 篇内链）。
// 左侧导航树全量渲染（SEO 内链），无当前页高亮；canonical/四语 hreflang 由
// layouts/default.vue 的 useLocaleHead 全局注入。
import { docGroups, docGroupLabel, docSubgroupLabel, docTitle, useDocs } from '~/composables/useDocs'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

const { version } = useDocs()

const docsBase = computed(() => localePath('/docs'))
const pageUrl = computed(() => `${siteUrl}${docsBase.value}`)
const title = computed(() => t('meta.docsTitle'))
const description = computed(() => t('meta.docsDesc'))

/** 每组卡片：篇数 + 前 5 篇链接 */
const cards = computed(() =>
  docGroups().map(g => ({
    key: g.group,
    label: docGroupLabel(g, locale.value),
    count: g.subgroups.reduce((n, sg) => n + sg.pages.length, 0),
    intro: t(`docs.homeIntro.groups.${groupKey(g.group_en)}`),
    pages: g.subgroups.flatMap(sg => sg.pages).slice(0, 5),
  })))

/** group_en → i18n key 段（homeIntro.groups.*） */
function groupKey(groupEn: string): string {
  const map: Record<string, string> = {
    'Get Started': 'getStarted',
    'User Guide': 'userGuide',
    'Capabilities': 'capabilities',
    'How It Works': 'howItWorks',
    'Plugin Dev': 'pluginDev',
    'Guides': 'guides',
    'Reference': 'reference',
  }
  return map[groupEn] ?? groupEn
}

useHead(() => ({
  title: title.value,
  meta: [
    { name: 'description', content: description.value },
    { property: 'og:title', content: title.value },
    { property: 'og:description', content: description.value },
    { property: 'og:url', content: pageUrl.value },
    { property: 'og:type', content: 'website' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('meta.breadcrumbHome'), item: `${siteUrl}${localePath('/')}` },
          { '@type': 'ListItem', position: 2, name: t('docs.title'), item: pageUrl.value },
        ],
      }),
    },
  ],
}))
</script>

<template>
  <div class="docs-layout docs-overview">
    <aside class="docs-sidebar">
      <span class="ver">DSH {{ version }}</span>
      <div v-for="g in docGroups()" :key="g.group" class="group">
        <div class="group-title">{{ docGroupLabel(g, locale) }}</div>
        <template v-for="(sg, si) in g.subgroups" :key="si">
          <div v-if="sg.name" class="subgroup">{{ docSubgroupLabel(sg.name, locale) }}</div>
          <ul>
            <li v-for="p in sg.pages" :key="p.slug">
              <NuxtLink :to="localePath(`/docs/${p.slug}`)">{{ docTitle(p, locale) }}</NuxtLink>
            </li>
          </ul>
        </template>
      </div>
    </aside>

    <main class="docs-main">
      <h1>{{ t('docs.homeIntro.h1') }}</h1>
      <p class="lead">{{ t('docs.homeIntro.welcome') }}</p>

      <div class="docs-groups">
        <section v-for="c in cards" :key="c.key" class="docs-group-card">
          <div class="head">
            <h2>{{ c.label }}</h2>
            <span class="n">{{ t('docs.pageCount', { n: c.count }) }}</span>
          </div>
          <p class="intro">{{ c.intro }}</p>
          <ul>
            <li v-for="p in c.pages" :key="p.slug">
              <NuxtLink :to="localePath(`/docs/${p.slug}`)">{{ docTitle(p, locale) }}</NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </main>
  </div>
</template>
