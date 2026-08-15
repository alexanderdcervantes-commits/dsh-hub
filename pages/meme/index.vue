<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { memes, query } = usePlugins()

const tab = ref('all')
const SECTIONS = ['absurd', 'skins', 'pets', 'slackoff', 'useful', 'textclub'] as const

const list = computed(() =>
  query({ memeSection: tab.value, sort: 'stars' }))

const siteUrl = config.public.siteUrl as string
const title = locale.value === 'zh'
  ? '整活专区 — DSH 社区最欢乐的插件 | DSH Meme Hub'
  : 'Meme Zone — the funniest dsh community plugins | DSH Meme Hub'
const sub = locale.value === 'zh'
  ? '鲸鱼娘桌宠、QQ2006 皮肤、贪玩蓝鲸广告网络……DeepSeek Harness 社区整活精选，附一键安装。'
  : 'Whale-girl pets, QQ2006 skins, a knockoff ad network for your terminal — the funniest DeepSeek Harness community picks, one click to install.'

useHead({
  title,
  meta: [
    { name: 'description', content: sub },
    { property: 'og:title', content: title },
    { property: 'og:description', content: sub },
    { property: 'og:image', content: `${siteUrl}/images/dsh-qq2006.gif` },
    { property: 'og:url', content: `${siteUrl}${localePath('/meme')}` },
  ],
})
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1>🤪 {{ t('meme.title') }}</h1>
      <p class="sub">{{ t('meme.sub') }}</p>
    </div>

    <div class="tabs">
      <button :class="{ active: tab === 'all' }" @click="tab = 'all'">{{ t('meme.all') }}</button>
      <button
        v-for="s in SECTIONS" :key="s"
        :class="{ active: tab === s }" @click="tab = s"
      >{{ t(`meme.sections.${s}`) }}</button>
    </div>

    <div class="grid cols-3" style="padding-bottom:30px">
      <MemeCard v-for="p in list" :key="p.slug" :plugin="p" :seed-likes="Math.floor(p.stars / 50)" />
    </div>

    <div class="meme-zone" style="margin-bottom:50px">
      <div class="section-head" style="margin-bottom:8px">
        <h2 style="font-size:19px">{{ t('meme.submitCta') }}</h2>
      </div>
      <NuxtLink class="btn green" :to="localePath('/submit')">{{ t('meme.submitCtaBtn') }} →</NuxtLink>
    </div>
  </div>
</template>
