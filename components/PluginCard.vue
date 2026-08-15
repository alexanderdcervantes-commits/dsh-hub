<script setup lang="ts">
import type { DshPlugin } from '~/composables/usePlugins'

const props = defineProps<{ plugin: DshPlugin }>()
const { locale } = useI18n()
const { catOf, descOf, emojiOf } = usePlugins()
const localePath = useLocalePath()
</script>

<template>
  <article class="plugin-card">
    <div class="title-row">
      <h3><NuxtLink :to="localePath(`/plugins/${plugin.slug}`)">{{ plugin.name }}</NuxtLink></h3>
      <span class="chip">{{ emojiOf(plugin) }} {{ catOf(plugin, locale) }}</span>
      <span v-if="plugin.is_meme" class="chip orange">🔥 meme</span>
    </div>
    <div v-if="plugin.image" class="card-thumb">
      <img :src="plugin.image" :alt="plugin.name" loading="lazy">
    </div>
    <p class="desc">{{ descOf(plugin, locale) }}</p>
    <div class="meta-row">
      <span class="stars">{{ plugin.stars.toLocaleString() }}</span>
      <span v-if="plugin.pushed_at">{{ plugin.pushed_at }}</span>
      <span v-if="plugin.has_manifest" class="chip green">✓ manifest</span>
    </div>
    <AppCopyCmd :cmd="plugin.install_cmd" />
  </article>
</template>
