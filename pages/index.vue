<script setup lang="ts">
import { enabledCategoryPages } from '~/composables/useCategoryPages'
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins, byStars, memes, fresh, categories, totalStars, updatedAt, descOf } = usePlugins()
const { launchers } = useLaunchers()

const q = ref('')
const router = useRouter()
function goSearch() {
  router.push(localePath({ path: '/plugins', query: { q: q.value.trim() } }))
}

const memePicks = computed(() =>
  [...memes()].sort((a, b) => b.stars - a.stars).slice(0, 5))

const top10 = computed(() => byStars().slice(0, 10))

const cats = computed(() => categories(locale.value))

// 分类卡优先链去分类落地页（data/seo/category-pages.json 驱动），无落地配置的分类回退 ?cat= 筛选
const landingForCat = (key: string) => {
  const hit = enabledCategoryPages().find(cat => cat.filter.categoryZh?.includes(key))
  return hit ? localePath(`/plugins/${hit.slug}`) : null
}

const freshPicks = computed(() => fresh(7).slice(0, 8))

const siteUrl = config.public.siteUrl as string
const heroSub = computed(() => t('hero.sub'))
// 首页 description 走 SEO 导向的 meta.homeDesc；hero.sub 只当可见文案
const homeDesc = computed(() => t('meta.homeDesc'))

useHead({
  title: computed(() => t('meta.homeTitle')),
  meta: [
    { name: 'description', content: homeDesc.value },
    { property: 'og:title', content: 'DSH Meme Hub' },
    { property: 'og:description', content: homeDesc.value },
    { property: 'og:image', content: `${siteUrl}/images/dsh-deep-whale.webp` },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}${localePath('/')}` },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'DSH Meme Hub',
      url: siteUrl,
      description: homeDesc.value,
      inLanguage: locale.value,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}${localePath('/plugins')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }),
  }],
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <img class="whale-mascot" src="/images/dsh-deep-whale-hero.webp" alt="whale girl" width="480" height="259" decoding="async" fetchpriority="high">
        <h1>{{ t('hero.title') }} <em>{{ t('hero.titleAccent') }}</em></h1>
        <p class="sub">{{ heroSub }}</p>
        <p style="margin:0 0 22px">
          <NuxtLink class="btn green" :to="localePath('/install')">
            {{ t('hero.installCta') }}
          </NuxtLink>
        </p>
        <form class="search-wrap" @submit.prevent="goSearch">
          <span class="icon">🔍</span>
          <input
            v-model="q"
            type="search"
            :placeholder="t('meta.homeSearchPh', { n: plugins.length })"
            aria-label="search"
          >
        </form>
      </div>
    </section>

    <div class="container">
      <!-- 今日整活 -->
      <section class="section">
        <div class="meme-zone">
          <div class="section-head">
            <h2>{{ t('home.memeTitle') }}</h2>
            <NuxtLink class="more" :to="localePath('/meme')">{{ t('meme.title') }} →</NuxtLink>
          </div>
          <p class="count-note" style="margin:-8px 0 16px">{{ t('home.memeSub') }}</p>
          <div class="grid cols-3">
            <MemeCard v-for="p in memePicks" :key="p.slug" :plugin="p" :seed-likes="Math.floor(p.stars / 50)" />
          </div>
        </div>
      </section>

      <!-- 热门排行 -->
      <section class="section">
        <div class="section-head">
          <h2>{{ t('home.hotTitle') }}</h2>
          <span class="count-note">{{ t('home.hotSub') }}</span>
          <NuxtLink class="more" :to="localePath('/best')">{{ t('home.viewBest') }}</NuxtLink>
          <NuxtLink class="more" :to="localePath('/plugins')">{{ t('nav.plugins') }} →</NuxtLink>
        </div>
        <div class="top-list">
          <NuxtLink v-for="(p, i) in top10" :key="p.slug" :to="localePath(`/plugins/${p.slug}`)" class="row">
            <span class="rank" :class="`r${i + 1}`">{{ i + 1 }}</span>
            <span class="name">{{ p.name }}</span>
            <span class="one-liner">{{ descOf(p, locale) }}</span>
            <span class="stars">{{ p.stars.toLocaleString() }}</span>
          </NuxtLink>
        </div>
      </section>

      <!-- 分类 -->
      <section class="section">
        <div class="section-head">
          <h2>{{ t('home.catsTitle') }}</h2>
        </div>
        <div class="cat-grid">
          <NuxtLink
            v-for="c in cats" :key="c.key"
            class="cat-card"
            :to="landingForCat(c.key) ?? localePath({ path: '/plugins', query: { cat: c.key } })"
          >
            <div class="emoji">{{ c.emoji }}</div>
            <h3>{{ c.label }}</h3>
            <div class="n">{{ c.count }} plugins</div>
          </NuxtLink>
        </div>
      </section>

      <!-- 最新收录 -->
      <section v-if="freshPicks.length" class="section">
        <div class="section-head">
          <h2>{{ t('home.newTitle') }}</h2>
          <span class="count-note">{{ t('home.newSub') }}</span>
        </div>
        <div class="grid cols-4">
          <PluginCard v-for="p in freshPicks" :key="p.slug" :plugin="p" />
        </div>
      </section>

      <!-- 一键启动器 -->
      <section class="section">
        <div class="section-head">
          <h2>{{ t('launcher.homeTitle') }}</h2>
          <span class="count-note">{{ t('launcher.homeSub') }}</span>
          <NuxtLink class="more" :to="localePath('/launcher')">{{ t('nav.launchers') }} →</NuxtLink>
        </div>
        <p style="color:var(--text-2);font-size:14.5px;margin:0 0 14px">{{ t('launcher.homeDesc', { n: launchers.length }) }}</p>
        <NuxtLink class="btn green" :to="localePath('/launcher')">{{ t('launcher.homeCta') }} →</NuxtLink>
      </section>

      <!-- 数据看板 -->
      <section class="section" style="padding-bottom:20px">
        <div class="section-head">
          <h2>{{ t('home.statsTitle') }}</h2>
          <span class="count-note">{{ t('common.updated') }} {{ updatedAt }}</span>
        </div>
        <div class="stats-board">
          <div class="stat-tile"><div class="num">{{ plugins.length }}</div><div class="label">{{ t('home.statTotal') }}</div></div>
          <div class="stat-tile"><div class="num">{{ memes().length }}</div><div class="label">{{ t('home.statMeme') }}</div></div>
          <div class="stat-tile"><div class="num">{{ totalStars().toLocaleString() }}</div><div class="label">{{ t('home.statStars') }}</div></div>
          <div class="stat-tile"><div class="num">{{ categories(locale).length }}</div><div class="label">{{ t('home.statCats') }}</div></div>
        </div>
      </section>

      <!-- DeepSeek Harness 是什么（认知词承接：deepseek harness 是什么/what is） -->
      <section class="section" style="padding-bottom:50px">
        <div class="prose">
          <h2>{{ t('home.whatTitle') }}</h2>
          <p>{{ t('home.whatP1') }}</p>
          <p>{{ t('home.whatP2') }}</p>
          <p>{{ t('home.whatP3') }}</p>
          <p>
            <NuxtLink class="btn green" :to="localePath('/install')" style="margin-right:10px">{{ t('home.whatCta') }}</NuxtLink>
            <NuxtLink :to="localePath('/plugins')">{{ t('home.whatCta2') }}</NuxtLink>
            <NuxtLink :to="localePath('/compare')" style="margin-left:10px">{{ t('home.whatCta3') }}</NuxtLink>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
