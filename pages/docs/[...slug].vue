<script setup lang="ts">
// /docs/:slug(.*) 文档详情页（catch-all，slug 含斜杠如 getting-started/quickstart）。
// 三栏：左侧全量导航树（SEO 内链，无折叠）+ 中间正文 + 右侧本页目录（h2 锚点）。
// 未知 slug → 404；canonical/四语 hreflang 由 layouts/default.vue 全局注入。
import type { DocPage } from '~/composables/useDocs'
import { docBySlug, docGroups, docGroupLabel, docNeighbors, docSubgroupLabel, docTitle, useDocs } from '~/composables/useDocs'
import { docLead, renderDoc } from '~/composables/useDocsRender'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const config = useRuntimeConfig()
const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

const { version } = useDocs()

const slug = computed(() =>
  (Array.isArray(route.params.slug) ? route.params.slug : [route.params.slug]).map(String).join('/'))
const doc = computed(() => docBySlug(slug.value))
if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: `Docs page not found: ${slug.value}`, fatal: true })
}
// 客户端路由切换到无效 slug 时（setup 不会再跑）兜底进错误页
watchEffect(() => {
  if (import.meta.client && !doc.value) {
    showError(createError({ statusCode: 404, statusMessage: `Docs page not found: ${slug.value}` }))
  }
})
const page = doc as ComputedRef<DocPage>

const docsBase = computed(() => localePath('/docs'))
const rendered = computed(() => renderDoc(page.value.content, docsBase.value))
const html = computed(() => rendered.value.html)
const toc = computed(() => rendered.value.toc)
const lead = computed(() => docLead(page.value.content))
const prev = computed(() => docNeighbors(page.value.slug).prev)
const next = computed(() => docNeighbors(page.value.slug).next)
const pageTitle = computed(() => docTitle(page.value, locale.value))
const group = computed(() => docGroupLabel(page.value, locale.value))
const description = computed(() => lead.value.slice(0, 150))
const pageUrl = computed(() => `${siteUrl}${docsBase.value}/${page.value.slug}`)

useHead(() => ({
  title: `${pageTitle.value} | DSH ${t('docs.title')}`,
  meta: [
    { name: 'description', content: description.value },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: description.value },
    { property: 'og:url', content: pageUrl.value },
    { property: 'og:type', content: 'article' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('meta.breadcrumbHome'), item: `${siteUrl}${localePath('/')}` },
          { '@type': 'ListItem', position: 2, name: t('docs.title'), item: `${siteUrl}${docsBase.value}` },
          { '@type': 'ListItem', position: 3, name: group.value, item: `${siteUrl}${docsBase.value}` },
          { '@type': 'ListItem', position: 4, name: pageTitle.value, item: pageUrl.value },
        ],
      }),
    },
  ],
}))

/** 右侧目录滚动高亮（SSG 无副作用，仅客户端观察） */
const activeId = ref('')
let observer: IntersectionObserver | null = null

function observeToc() {
  observer?.disconnect()
  observer = null
  if (!import.meta.client || !toc.value.length) return
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) activeId.value = e.target.id
    }
  }, { rootMargin: '-70px 0px -65% 0px' })
  for (const item of toc.value) {
    const el = document.getElementById(item.id)
    if (el) observer.observe(el)
  }
}

onMounted(observeToc)
watch(toc, () => nextTick(observeToc))
onBeforeUnmount(() => observer?.disconnect())

function jumpTo(id: string) {
  activeId.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="docs-layout">
    <!-- 左侧：全组全篇渲染（内链 SEO），当前组/篇高亮 -->
    <aside class="docs-sidebar">
      <span class="ver">DSH {{ version }}</span>
      <div v-for="g in docGroups()" :key="g.group" class="group">
        <div class="group-title" :class="{ 'group-current': g.group === page.group }">
          {{ docGroupLabel(g, locale) }}
        </div>
        <template v-for="(sg, si) in g.subgroups" :key="si">
          <div v-if="sg.name" class="subgroup">{{ docSubgroupLabel(sg.name, locale) }}</div>
          <ul>
            <li v-for="p in sg.pages" :key="p.slug">
              <NuxtLink :to="localePath(`/docs/${p.slug}`)" :class="{ current: p.slug === page.slug }">
                {{ docTitle(p, locale) }}
              </NuxtLink>
            </li>
          </ul>
        </template>
      </div>
    </aside>

    <!-- 中间：正文 -->
    <main class="docs-main">
      <div class="breadcrumb">
        <NuxtLink :to="localePath('/docs')">{{ t('docs.title') }}</NuxtLink>
        <span class="sep">›</span>
        <span>{{ group }}</span>
        <span class="sep">›</span>
        <span>{{ pageTitle }}</span>
      </div>
      <h1>{{ pageTitle }}</h1>
      <p class="lead">{{ lead }}</p>

      <!-- 正文由自家数据渲染，已剥 script/转义内联 HTML -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="md-body" v-html="html" />

      <h2 class="next-title">{{ t('docs.nextStep') }}</h2>
      <div class="next-cards">
        <NuxtLink class="next-card" :to="localePath('/docs/user-guide/cli')">
          <h4>{{ t('docs.nextGuideT') }}</h4>
          <p>{{ t('docs.nextGuideD') }}</p>
        </NuxtLink>
        <NuxtLink class="next-card" :to="localePath('/docs/learn/intro/what-is-dsh')">
          <h4>{{ t('docs.nextLearnT') }}</h4>
          <p>{{ t('docs.nextLearnD') }}</p>
        </NuxtLink>
        <NuxtLink class="next-card" :to="localePath('/docs/learn/dev/hello-plugin')">
          <h4>{{ t('docs.nextDevT') }}</h4>
          <p>{{ t('docs.nextDevD') }}</p>
        </NuxtLink>
      </div>

      <div class="pager">
        <NuxtLink v-if="prev" :to="localePath(`/docs/${prev.slug}`)">
          <span class="dir">← {{ t('docs.prevPage') }}</span>
          {{ docTitle(prev, locale) }}
        </NuxtLink>
        <NuxtLink v-else :to="localePath('/docs')">
          <span class="dir">← {{ t('docs.prevPage') }}</span>
          {{ t('docs.title') }}
        </NuxtLink>
        <NuxtLink v-if="next" class="next" :to="localePath(`/docs/${next.slug}`)">
          <span class="dir">{{ t('docs.nextPage') }} →</span>
          {{ docTitle(next, locale) }}
        </NuxtLink>
        <span v-else />
      </div>
    </main>

    <!-- 右侧：本页目录 -->
    <aside v-if="toc.length" class="docs-toc">
      <div class="toc-title">{{ t('docs.tocTitle') }}</div>
      <ul>
        <li v-for="item in toc" :key="item.id">
          <a :href="`#${item.id}`" :class="{ active: item.id === activeId }" @click.prevent="jumpTo(item.id)">
            {{ item.text }}
          </a>
        </li>
      </ul>
    </aside>
  </div>
</template>
