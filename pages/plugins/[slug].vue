<script setup lang="ts">
const { t, locale } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { bySlug, related, catOf, emojiOf } = usePlugins()

const plugin = bySlug(route.params.slug as string)
if (!plugin) {
  throw createError({ statusCode: 404, statusMessage: 'Plugin not found', fatal: true })
}

const siteUrl = config.public.siteUrl as string
const isZh = computed(() => locale.value === 'zh')
const desc = computed(() => (isZh.value ? plugin.description_zh : plugin.description_en))
const pageUrl = computed(() => `${siteUrl}${localePath(`/plugins/${plugin.slug}`)}`)
const ogImage = computed(() => `${siteUrl}${plugin.image ?? '/images/dsh-deep-whale.webp'}`)

const title = isZh.value
  ? `${plugin.name} — ${plugin.category_zh}插件 | DeepSeek Harness (dsh)`
  : `${plugin.name} — ${plugin.category_en} Plugin for DeepSeek Harness (dsh)`

useHead({
  title,
  meta: [
    { name: 'description', content: desc.value },
    { property: 'og:title', content: plugin.name },
    { property: 'og:description', content: desc.value },
    { property: 'og:image', content: ogImage.value },
    { property: 'og:url', content: pageUrl.value },
    { property: 'og:type', content: 'website' },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: plugin.name,
      description: desc.value,
      url: pageUrl.value,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform',
      softwareVersion: 'community',
      author: { '@type': 'Person', name: plugin.repo.split('/')[0] },
      codeRepository: plugin.url,
      installUrl: plugin.url,
      ...(plugin.license ? { license: `https://spdx.org/licenses/${plugin.license}.html` } : {}),
      aggregateRating: plugin.stars > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(Math.min(5, 3.5 + Math.log10(plugin.stars + 1) / 2).toFixed(1)),
            bestRating: '5',
            ratingCount: plugin.stars,
          }
        : undefined,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    }),
  }],
})

const rel = computed(() => related(plugin, 4))
</script>

<template>
  <div class="container">
    <div class="detail-head">
      <div class="breadcrumb">
        <NuxtLink :to="localePath('/plugins')">{{ t('nav.plugins') }}</NuxtLink>
        / {{ catOf(plugin, locale) }}
      </div>
      <h1>{{ plugin.name }}</h1>
      <p class="lead">{{ desc }}</p>
      <div class="filter-bar" style="margin-bottom:0">
        <span class="stars" style="font-size:15px">{{ plugin.stars.toLocaleString() }} {{ t('plugin.stars') }}</span>
        <span class="chip">{{ emojiOf(plugin) }} {{ catOf(plugin, locale) }}</span>
        <span v-if="plugin.is_meme" class="chip orange">🔥 meme</span>
        <a class="btn" :href="plugin.url" target="_blank" rel="noopener">{{ t('plugin.viewOnGithub') }} ↗</a>
        <a v-if="plugin.video_url" class="btn" :href="plugin.video_url" target="_blank" rel="noopener">📺 {{ t('plugin.watchDemo') }} ↗</a>
      </div>
    </div>

    <div class="detail-layout">
      <div class="detail-main">
        <div v-if="plugin.image" class="shot">
          <img :src="plugin.image" :alt="plugin.name">
        </div>

        <div class="prose">
          <div class="lang-label">{{ t('plugin.descEn') }}</div>
          <p>{{ plugin.description_en }}</p>
          <div class="lang-label" style="margin-top:18px">{{ t('plugin.descZh') }}</div>
          <p>{{ plugin.description_zh }}</p>
        </div>

        <section v-if="rel.length" class="section">
          <div class="section-head"><h2>{{ t('plugin.related') }}</h2></div>
          <div class="grid cols-2">
            <PluginCard v-for="p in rel" :key="p.slug" :plugin="p" />
          </div>
        </section>
      </div>

      <aside>
        <div class="side-card">
          <h3>{{ t('plugin.install') }}</h3>
          <AppCopyCmd :cmd="plugin.install_cmd" />
        </div>

        <div class="side-card">
          <h3>{{ t('plugin.evidence') }}</h3>
          <div class="evidence-row">
            <span class="k">manifest</span>
            <span class="v" :class="plugin.has_manifest ? 'ok' : 'no'">
              {{ plugin.has_manifest ? '✓ ' + t('plugin.manifestYes') : t('plugin.manifestNo') }}
            </span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.pushed') }}</span>
            <span class="v">{{ plugin.pushed_at || '—' }}</span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.stars') }}</span>
            <span class="v">★ {{ plugin.stars.toLocaleString() }}</span>
          </div>
          <div v-if="plugin.forks" class="evidence-row">
            <span class="k">{{ t('plugin.forks') }}</span>
            <span class="v">{{ plugin.forks.toLocaleString() }}</span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.license') }}</span>
            <span class="v">{{ plugin.license || '—' }}</span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.language') }}</span>
            <span class="v">{{ plugin.language || '—' }}</span>
          </div>
        </div>

        <div v-if="plugin.topics.length" class="side-card">
          <h3>{{ t('plugin.topics') }}</h3>
          <span v-for="topic in plugin.topics" :key="topic" class="chip" style="margin:0 6px 6px 0">{{ topic }}</span>
        </div>
      </aside>
    </div>
  </div>
</template>
