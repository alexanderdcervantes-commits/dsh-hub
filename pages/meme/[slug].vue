<script setup lang="ts">
const { t, locale } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { bySlug, captionOf, descOf, memes } = usePlugins()

const plugin = bySlug(route.params.slug as string)
if (!plugin || !plugin.is_meme) {
  throw createError({ statusCode: 404, statusMessage: 'Meme not found', fatal: true })
}

const likes = useLikes()
onMounted(() => likes.load())

const siteUrl = config.public.siteUrl as string
const desc = computed(() => descOf(plugin, locale.value))
const caption = captionOf(plugin, locale.value)
const pageUrl = computed(() => `${siteUrl}${localePath(`/meme/${plugin.slug}`)}`)
const title = computed(() =>
  t('meta.memeDetailTitle', { name: plugin.name, caption }))

useHead({
  title,
  meta: [
    { name: 'description', content: `${caption} — ${desc.value}` },
    { property: 'og:title', content: plugin.name },
    { property: 'og:description', content: caption },
    { property: 'og:image', content: `${siteUrl}${plugin.image ?? '/images/dsh-deep-whale.webp'}` },
    { property: 'og:url', content: pageUrl.value },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      /* 整活内容身份用 CreativeWork，与 plugins 轨的 SoftwareApplication 区分，避免双轨同类型判重复 */
      '@type': 'CreativeWork',
      name: plugin.name,
      description: caption,
      url: pageUrl.value,
      inLanguage: locale.value,
      genre: 'meme',
      about: plugin.name,
      author: { '@type': 'Person', name: plugin.repo.split('/')[0] },
    }),
  }],
})

const rel = computed(() =>
  memes().filter(x => x.slug !== plugin.slug && x.meme_section === plugin.meme_section)
    .sort((a, b) => b.stars - a.stars).slice(0, 3))
</script>

<template>
  <div class="container">
    <div class="detail-head">
      <div class="breadcrumb">
        <NuxtLink :to="localePath('/meme')">🤪 {{ t('meme.title') }}</NuxtLink>
        / {{ t(`meme.sections.${plugin.meme_section}`) }}
      </div>
      <h1>{{ plugin.name }}</h1>
      <p class="lead" style="font-style:italic">「{{ caption }}」</p>
      <p class="lead">{{ desc }}</p>
      <div class="filter-bar" style="margin-bottom:0">
        <span class="stars" style="font-size:15px">{{ plugin.stars.toLocaleString() }} {{ t('plugin.stars') }}</span>
        <span class="chip orange">🔥 meme</span>
        <a class="btn" :href="plugin.url" target="_blank" rel="noopener">{{ t('plugin.viewOnGithub') }} ↗</a>
        <a v-if="plugin.video_url" class="btn" :href="plugin.video_url" target="_blank" rel="noopener">📺 {{ t('plugin.watchDemo') }} ↗</a>
      </div>
    </div>

    <div class="detail-layout">
      <div class="detail-main">
        <PluginGallery
          :image="plugin.image"
          :image-w="plugin.image_w"
          :image-h="plugin.image_h"
          :screenshots="plugin.screenshots"
          :name="plugin.name"
        />

        <div class="prose">
          <div class="lang-label">{{ t('plugin.descEn') }}</div>
          <p>{{ plugin.description_en }}</p>
          <div class="lang-label" style="margin-top:18px">{{ t('plugin.descZh') }}</div>
          <p>{{ plugin.description_zh }}</p>
        </div>

        <section v-if="rel.length" class="section">
          <div class="section-head"><h2>{{ t(`meme.sections.${plugin.meme_section}`) }}</h2></div>
          <div class="grid cols-3">
            <MemeCard v-for="p in rel" :key="p.slug" :plugin="p" :seed-likes="Math.floor(p.stars / 50)" />
          </div>
        </section>
      </div>

      <aside>
        <div class="side-card">
          <h3>{{ t('plugin.install') }}</h3>
          <AppCopyCmd :cmd="plugin.install_cmd" />
          <div style="margin-top:14px;display:flex;gap:10px">
            <button
              class="btn" :class="{ liked: likes.liked(plugin.slug) }"
              @click="likes.toggle(plugin.slug)"
            >
              {{ likes.liked(plugin.slug) ? '💚' : '🤍' }} {{ likes.liked(plugin.slug) ? t('meme.liked') : t('meme.like') }} {{ likes.countOf(plugin.slug, Math.floor(plugin.stars / 50)) }}
            </button>
          </div>
        </div>

        <div class="side-card">
          <h3>{{ t('plugin.evidence') }}</h3>
          <div class="evidence-row">
            <span class="k">manifest</span>
            <span class="v" :class="plugin.has_manifest ? 'ok' : 'no'">
              {{ plugin.has_manifest ? '✓' : '—' }}
            </span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.pushed') }}</span>
            <span class="v">{{ plugin.pushed_at || '—' }}</span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.license') }}</span>
            <span class="v">{{ plugin.license || '—' }}</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
