<script setup lang="ts">
// /store 插件目录导购页：认领「DeepSeek Harness 插件目录 / DSH 插件库」关键词
// （「插件市场」主词已归 /plugins，本页仅正文自然提及保持主题相关），结构与文案
// 基调沿用已确认的预览稿。全部数字运行时计算（数字纪律：页面不写死任何数量）。
// canonical / 四语 hreflang（含 x-default）由 layouts/default.vue 的 useLocaleHead 全局注入。
import { categoryPlugins, enabledCategoryPages, pickL10n } from '~/composables/useCategoryPages'

const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins, byStars, catOf, descOf, emojiOf } = usePlugins()

// 分类货架：data/seo/category-pages.json 单一数据源，计数走 categoryPlugins 的
// 并集 filter（与 /plugins/{slug} 分类落地页同源，永不漂移）；代表插件 = 该分类 star 前 2
const shelves = computed(() =>
  enabledCategoryPages().map((c) => {
    const list = categoryPlugins(c, plugins)
    return {
      slug: c.slug,
      emoji: c.emoji,
      label: pickL10n(c.label, locale.value),
      count: list.length,
      reps: list.slice(0, 2).map((p) => p.name),
    }
  }))

// 市场精选 Top 10：全站 star 降序，排除「生态与开发」（那些是清单/仓库，不是可安装插件）
const top10 = computed(() =>
  byStars().filter((p) => p.category_zh !== '生态与开发').slice(0, 10))

// 中日文顿号、拉丁语系逗号
const repSep = computed(() => (locale.value === 'zh' || locale.value === 'zh-TW' ? '、' : ', '))

const langCount = (locales.value as Array<{ code: string }>).length

// FAQ 与页面文案同源（同 vue-i18n key），FAQPage JSON-LD 由此输出
const faqs = computed(() =>
  [1, 2, 3, 4].map((i) => ({ q: t(`store.faq${i}q`), a: t(`store.faq${i}a`) })))

const siteUrl = config.public.siteUrl as string
const pageUrl = computed(() => `${siteUrl}${localePath('/store')}`)
const title = computed(() => t('meta.storeTitle', { n: plugins.length, c: shelves.value.length }))
const desc = computed(() =>
  t('meta.storeDesc', { n: plugins.length, c: shelves.value.length }))

useHead(() => ({
  title: title.value,
  meta: [
    { name: 'description', content: desc.value },
    { property: 'og:title', content: title.value },
    { property: 'og:description', content: desc.value },
    { property: 'og:image', content: `${siteUrl}/images/dsh-deep-whale-hero.webp` },
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
          { '@type': 'ListItem', position: 1, name: 'DSH Meme Hub', item: `${siteUrl}${localePath('/')}` },
          { '@type': 'ListItem', position: 2, name: `${t('store.h1Lead')} ${t('store.h1Main')}`, item: pageUrl.value },
        ],
      }),
    },
    {
      // 与页面 Top 10 同一数据源、同一排序（含排除逻辑），永不漂移
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: top10.value.map((p, i) => ({
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
    <!-- ① Hero：H1 + 副标题 + 4 动态统计卡 -->
    <div class="page-head store-hero">
      <h1>{{ t('store.h1Lead') }} <em>{{ t('store.h1Main') }}</em></h1>
      <p class="sub">{{ t('store.heroSub', { n: plugins.length }) }}</p>
      <div class="stats-board">
        <div class="stat-tile"><div class="num">{{ plugins.length }}</div><div class="label">{{ t('store.statCurated') }}</div></div>
        <div class="stat-tile"><div class="num">{{ shelves.length }}</div><div class="label">{{ t('store.statCats') }}</div></div>
        <div class="stat-tile"><div class="num">{{ langCount }}</div><div class="label">{{ t('store.statLangs') }}</div></div>
        <div class="stat-tile"><div class="num">{{ t('store.statFreeNum') }}</div><div class="label">{{ t('store.statFreeLabel') }}</div></div>
      </div>
    </div>

    <!-- ② 这是什么市场：装机前发现层 vs 官方 dsh-market 装机后货架 -->
    <section class="section">
      <div class="section-head"><h2>{{ t('store.whatH') }}</h2></div>
      <div class="prose store-intro">
        <p>{{ t('store.introP1', { n: plugins.length }) }}</p>
        <p>{{ t('store.introP2') }}</p>
      </div>
    </section>

    <!-- ③ 分类货架（按预览稿顺序放在精选前面） -->
    <section class="section">
      <div class="section-head">
        <h2>{{ t('store.shelvesH', { n: shelves.length }) }}</h2>
        <span class="count-note">{{ t('store.shelvesSub') }}</span>
      </div>
      <div class="grid cols-3">
        <NuxtLink
          v-for="s in shelves"
          :key="s.slug"
          :to="localePath(`/plugins/${s.slug}`)"
          class="shelf-card"
        >
          <div class="shelf-head">
            <span class="emoji">{{ s.emoji }}</span>
            <h3>{{ s.label }}</h3>
            <span class="n">{{ s.count }}</span>
          </div>
          <p class="pitch">{{ t(`store.cats.${s.slug}`) }}</p>
          <p class="eg">{{ t('store.repPrefix') }}{{ s.reps.join(repSep) }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- ④ 市场精选 Top 10（排除生态与开发） -->
    <section class="section">
      <div class="section-head">
        <h2>{{ t('store.topH') }}</h2>
        <span class="count-note">{{ t('store.topSub') }}</span>
      </div>
      <div class="top10-list">
        <div v-for="(p, i) in top10" :key="p.slug" class="top10-card">
          <div class="card-head">
            <span class="rank" :class="`r${i + 1}`">#{{ i + 1 }}</span>
            <h3><NuxtLink :to="localePath(`/plugins/${p.slug}`)">{{ p.name }}</NuxtLink></h3>
            <span class="stars">{{ p.stars.toLocaleString() }}</span>
          </div>
          <p class="desc">{{ descOf(p, locale) }}</p>
          <div class="card-foot">
            <span class="chip green">{{ emojiOf(p) }} {{ catOf(p, locale) }}</span>
            <AppCopyCmd :cmd="p.install_cmd" />
          </div>
        </div>
      </div>
    </section>

    <!-- ⑤ 怎么安装 -->
    <section class="section">
      <div class="section-head"><h2>{{ t('store.installH') }}</h2></div>
      <div class="prose store-install">
        <p>{{ t('store.installP1') }}</p>
        <AppCopyCmd cmd="dsh plugin add github:owner/repo" />
        <p>{{ t('store.installP2') }}</p>
        <p><NuxtLink class="btn green" :to="localePath('/install')">{{ t('store.installCta') }}</NuxtLink></p>
      </div>
    </section>

    <!-- ⑥ FAQ（上方输出 FAQPage JSON-LD） -->
    <section class="section">
      <div class="section-head"><h2>{{ t('store.faqH') }}</h2></div>
      <div class="faq-list">
        <details v-for="(f, i) in faqs" :key="i" :open="i === 0">
          <summary>{{ f.q }}</summary>
          <p>{{ f.a }}</p>
        </details>
      </div>
    </section>

    <!-- 数据来源声明（措辞纪律：只写定时同步） -->
    <p class="source-note">{{ t('store.sourceNote') }}</p>
  </div>
</template>

<style scoped>
/* Hero：居中 + 绿色强调（与首页 .hero 同基调，但走 page-head 布局） */
.store-hero { text-align: center; padding-bottom: 14px; }
.store-hero h1 em { font-style: normal; color: var(--accent-strong); }
.store-hero .sub { margin: 0 auto; max-width: 640px; }
.store-hero .stats-board { margin-top: 22px; max-width: 760px; margin-left: auto; margin-right: auto; }

.store-intro { max-width: 860px; }

/* 分类货架卡片 */
.shelf-card {
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px 20px;
  color: var(--text);
  transition: transform .15s, box-shadow .15s;
}
.shelf-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); text-decoration: none; }
.shelf-head { display: flex; align-items: center; gap: 8px; }
.shelf-head .emoji { font-size: 24px; }
.shelf-head h3 { font-size: 16px; margin: 0; flex: 1; }
.shelf-head .n { color: var(--text-3); font-size: 13px; font-weight: 600; }
.pitch { color: var(--text-2); font-size: 13.5px; margin: 10px 0 12px; flex: 1; line-height: 1.55; }
.eg {
  color: var(--accent-strong);
  font-size: 12.5px;
  font-weight: 600;
  border-top: 1px dashed var(--border-soft);
  padding-top: 8px;
  margin: 0;
}

/* Top 10 精选卡片 */
.top10-list { display: flex; flex-direction: column; gap: 14px; }
.top10-card {
  background: var(--card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px 20px;
  transition: box-shadow .15s, transform .15s;
}
.top10-card:hover { box-shadow: var(--shadow-hover); transform: translateY(-2px); }
.top10-card .card-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.top10-card .card-head h3 { font-size: 16.5px; margin: 0; flex: 1; }
.top10-card .card-head h3 a { color: var(--text); }
.top10-card .rank { font-weight: 800; font-size: 14px; }
.top10-card .rank.r1 { color: #e3b341; }
.top10-card .rank.r2 { color: #a371f7; }
.top10-card .rank.r3 { color: #bc4c00; }
.top10-card .desc {
  color: var(--text-2);
  font-size: 14px;
  margin: 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.top10-card .card-foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.top10-card .card-foot .install-cmd { flex: 1; min-width: 220px; }

/* 安装区命令条与段落间距 */
.store-install .install-cmd { margin: 10px 0 16px; max-width: 560px; }

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

/* 页脚数据来源行 */
.source-note { text-align: center; color: var(--text-3); font-size: 12.5px; margin-top: 40px; }
</style>
