<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins, byStars, memes, fresh, categories, totalStars, updatedAt } = usePlugins()
const { launchers } = useLaunchers()

const q = ref('')
const router = useRouter()
function goSearch() {
  router.push(localePath({ path: '/plugins', query: { q: q.value.trim() } }))
}

const memePicks = computed(() =>
  [...memes()].sort((a, b) => b.stars - a.stars).slice(0, 5))

const top10 = computed(() => byStars().slice(0, 10))

const cats = computed(() => categories(locale.value).slice(0, 8))

const freshPicks = computed(() => fresh(7).slice(0, 8))

const siteUrl = config.public.siteUrl as string
const isZh = computed(() => locale.value === 'zh')
const heroSub = isZh.value
  ? 'DeepSeek Harness (dsh) 插件丛林的策展导航：人工精选的好东西、桌面鲸鱼娘，以及社区这周整出的最欢乐的活。'
  : 'The curated guide to the DeepSeek Harness (dsh) plugin wilds: hand-picked gems, desktop whale pets, and the funniest things the community shipped this week.'

useHead({
  title: isZh.value
    ? 'DSH Meme Hub — DeepSeek Harness 插件整活精选导航'
    : 'DSH Meme Hub — curated & fun DeepSeek Harness (dsh) plugins',
  meta: [
    { name: 'description', content: heroSub },
    { property: 'og:title', content: 'DSH Meme Hub' },
    { property: 'og:description', content: heroSub },
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
      description: heroSub,
      inLanguage: locale.value,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}${locale.value === 'zh' ? '/zh' : ''}/plugins?q={search_term_string}`,
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
        <img class="whale-mascot" src="/images/dsh-deep-whale.webp" alt="whale girl">
        <h1><template v-if="!isZh">Everything is a Plugin — <em>so go tinker with anything.</em></template><template v-else>一切皆插件——<em>所以，万物皆可整活。</em></template></h1>
        <p class="sub">{{ heroSub }}</p>
        <p style="margin:0 0 22px">
          <NuxtLink class="btn green" :to="localePath('/install')">
            <template v-if="!isZh">New here? Install dsh in one command →</template>
            <template v-else>第一次用？一条命令装好 dsh →</template>
          </NuxtLink>
        </p>
        <form class="search-wrap" @submit.prevent="goSearch">
          <span class="icon">🔍</span>
          <input
            v-model="q"
            type="search"
            :placeholder="isZh ? `搜索 ${plugins.length} 个插件…（试试：鲸鱼、皮肤、五子棋）` : `Search ${plugins.length} plugins… (try: whale, skin, gomoku)`"
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
          <NuxtLink class="more" :to="localePath('/plugins')">{{ t('nav.plugins') }} →</NuxtLink>
        </div>
        <div class="top-list">
          <NuxtLink v-for="(p, i) in top10" :key="p.slug" :to="localePath(`/plugins/${p.slug}`)" class="row">
            <span class="rank" :class="`r${i + 1}`">{{ i + 1 }}</span>
            <span class="name">{{ p.name }}</span>
            <span class="one-liner">{{ isZh ? p.description_zh : p.description_en }}</span>
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
            :to="localePath({ path: '/plugins', query: { cat: c.key } })"
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
    </div>
  </div>
</template>
