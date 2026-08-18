<script setup lang="ts">
// 分类落地页主体：文案/筛选/FAQ 全部来自 data/seo/category-pages.json（单一数据源），
// 插件列表复用 usePlugins() 数据 + PluginCard，数量与 star 一律运行时计算（数字纪律）。
// canonical 与四语 hreflang（含 x-default）由 layouts/default.vue 的 useLocaleHead 全局注入，此处不重复。
import type { CategoryPageConfig } from '~/composables/useCategoryPages'
import { categoryPlugins, fillN, pickL10n } from '~/composables/useCategoryPages'

const props = defineProps<{ cat: CategoryPageConfig }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins } = usePlugins()

// 分类插件：filter 并集 → 去重 → star 降序（与主目录页默认排序一致）
const list = computed(() => categoryPlugins(props.cat, plugins))
const top3 = computed(() => list.value.slice(0, 3))
// 内容不足保护（规范 §2.3）：运行时过滤后不足 3 条 → 该页 noindex，不再进索引
const thin = computed(() => list.value.length < 3)

const siteUrl = config.public.siteUrl as string
const pageUrl = computed(() => `${siteUrl}${localePath(`/plugins/${props.cat.slug}`)}`)
const n = computed(() => list.value.length)
const title = computed(() => fillN(pickL10n(props.cat.title, locale.value), n.value))
const desc = computed(() => fillN(pickL10n(props.cat.desc, locale.value), n.value))
const h1 = computed(() => pickL10n(props.cat.h1, locale.value))
const label = computed(() => pickL10n(props.cat.label, locale.value))
const intro = computed(() => pickL10n(props.cat.intro, locale.value))
const installNote = computed(() => pickL10n(props.cat.installNote, locale.value))
const faqs = computed(() =>
  props.cat.faqs.map(f => ({ q: pickL10n(f.q, locale.value), a: pickL10n(f.a, locale.value) })))

useHead(() => ({
  title: title.value,
  meta: [
    { name: 'description', content: desc.value },
    { property: 'og:title', content: title.value },
    { property: 'og:description', content: desc.value },
    { property: 'og:image', content: `${siteUrl}${props.cat.ogImage}` },
    { property: 'og:url', content: pageUrl.value },
    { property: 'og:type', content: 'website' },
    // 数量跌破门槛：保留页面但退出索引（不 404，外链不至于断）
    ...(thin.value ? [{ name: 'robots', content: 'noindex' }] : []),
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
          { '@type': 'ListItem', position: 3, name: label.value, item: pageUrl.value },
        ],
      }),
    },
    {
      // 与渲染列表同一数据源、同一排序，永不漂移
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
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.value.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }),
    },
  ],
}))
</script>

<template>
  <div class="container">
    <div class="breadcrumb">
      <NuxtLink :to="localePath('/plugins')">{{ t('nav.plugins') }}</NuxtLink>
      / {{ cat.emoji }} {{ label }}
    </div>

    <div class="page-head">
      <h1>{{ h1 }}</h1>
      <p class="sub">{{ t('catPages.countNote', { n }) }}</p>
      <p class="count-note" style="margin:0">{{ t('catPages.dataSync') }}</p>
    </div>

    <div class="prose">
      <p v-for="(para, i) in intro" :key="i">{{ para }}</p>
    </div>

    <!-- Top 3 推荐：仅本分类内按 star 取前三 -->
    <section class="section">
      <div class="section-head">
        <h2>{{ t('catPages.top3H') }}</h2>
        <span class="count-note">{{ t('catPages.top3P') }}</span>
      </div>
      <div class="grid cols-3 top3-grid">
        <div v-for="(p, i) in top3" :key="p.slug" class="top3-item">
          <span class="top3-rank" :class="`r${i + 1}`">#{{ i + 1 }}</span>
          <PluginCard :plugin="p" />
        </div>
      </div>
    </section>

    <!-- 全量列表：star 降序，与 ItemList schema 同源 -->
    <section class="section">
      <div class="section-head">
        <h2>{{ t('catPages.listH', { n }) }}</h2>
      </div>
      <div class="grid cols-3" style="padding-bottom:50px">
        <PluginCard v-for="p in list" :key="p.slug" :plugin="p" />
      </div>
    </section>

    <!-- 安装引导：该分类的注意点 + /install -->
    <section class="section">
      <div class="section-head"><h2>{{ t('catPages.installH') }}</h2></div>
      <div class="prose" style="padding-bottom:4px">
        <p>{{ installNote }}</p>
        <p><NuxtLink :to="localePath('/install')">{{ t('catPages.installCta') }}</NuxtLink></p>
      </div>
    </section>

    <!-- 分类专属 FAQ（输出上方 FAQPage JSON-LD） -->
    <section class="section">
      <div class="section-head"><h2>{{ t('catPages.faqH') }}</h2></div>
      <div class="faq-list">
        <details v-for="(f, i) in faqs" :key="i" :open="i === 0">
          <summary>{{ f.q }}</summary>
          <p>{{ f.a }}</p>
        </details>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Top 3 角标：金银铜三色，与全站 .top-list .rank 配色一致 */
/* min-width:0 必须：本元素是 grid item 包装层（不像别处直接放 .plugin-card），
   缺它时 ≤620 的 1fr 轨道按 min-content(auto 最小值)被卡内 nowrap 命令撑到 400-600px → 整页横滚 */
.top3-item { position: relative; min-width: 0; }
.top3-rank {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  font-weight: 800;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--card);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow);
  /* 纯装饰角标：不吞下方卡片链接的点击 */
  pointer-events: none;
}
/* 角标悬于卡片右上(y≈10-32)正对 .title-row 首行(y≈16-44)：给首行留出角标投影区，
   长标题/分类 chip 换行避开而不是钻到角标底下被盖住 */
.top3-item :deep(.title-row) { padding-right: 56px; }
.top3-rank.r1 { color: #e3b341; }
.top3-rank.r2 { color: #a371f7; }
.top3-rank.r3 { color: #bc4c00; }

/* FAQ 折叠面板（预渲染 HTML 全量输出，details 仅做交互） */
.faq-list { display: flex; flex-direction: column; gap: 10px; max-width: 780px; }
.faq-list details {
  background: var(--card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  padding: 12px 16px;
  box-shadow: var(--shadow);
}
.faq-list summary { font-weight: 700; font-size: 15px; cursor: pointer; }
.faq-list summary:hover { color: var(--accent-strong); }
.faq-list p { margin: 10px 0 2px; color: var(--text-2); font-size: 14.5px; }
</style>
