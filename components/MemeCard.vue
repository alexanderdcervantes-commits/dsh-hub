<script setup lang="ts">
import type { DshPlugin } from '~/composables/usePlugins'

const props = defineProps<{ plugin: DshPlugin, seedLikes?: number }>()
const { locale, t } = useI18n()
const { captionOf } = usePlugins()
const likes = useLikes()
const localePath = useLocalePath()
const config = useRuntimeConfig()

const toast = useState<string | null>('toast', () => null)
let toastTimer: ReturnType<typeof setTimeout> | undefined

/** 缩略图回退：无本地精修封面时用仓库截图首图（同 PluginCard；容器 .thumb 已定 16/10 + cover 裁切防拉伸） */
const fallbackShot = computed(() =>
  props.plugin.image ? null : (props.plugin.screenshots?.[0]?.url ?? null))
/** 截图首图加载失败（commit 被删/图床失效）→ 回退 🐋 占位，不留破图 */
const shotFailed = ref(false)

onMounted(() => likes.load())
onBeforeUnmount(() => clearTimeout(toastTimer))

async function share() {
  const url = `${config.public.siteUrl}${localePath(`/meme/${props.plugin.slug}`)}`
  try {
    if (navigator.share) {
      await navigator.share({ title: props.plugin.name, text: captionOf(props.plugin, locale.value), url })
      return
    }
  }
  catch {}
  try {
    await navigator.clipboard.writeText(url)
    toast.value = t('meme.shareCopied')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = null), 2200)
  }
  catch {}
}
</script>

<template>
  <article class="meme-card">
    <NuxtLink :to="localePath(`/meme/${plugin.slug}`)" class="thumb" :aria-label="plugin.name">
      <img
        v-if="plugin.image" :src="plugin.image" :alt="plugin.name"
        :width="plugin.image_w" :height="plugin.image_h"
        loading="lazy" decoding="async"
      >
      <img
        v-else-if="fallbackShot && !shotFailed"
        :src="fallbackShot" :alt="plugin.name"
        loading="lazy" decoding="async"
        @error="shotFailed = true"
      >
      <div v-else class="fallback">🐋</div>
    </NuxtLink>
    <div class="body">
      <h3><NuxtLink :to="localePath(`/meme/${plugin.slug}`)">{{ plugin.name }}</NuxtLink></h3>
      <p class="caption">「{{ captionOf(plugin, locale) }}」</p>
      <div class="foot">
        <span class="stars">{{ plugin.stars.toLocaleString() }}</span>
        <button
          class="btn small" :class="{ liked: likes.liked(plugin.slug) }"
          :aria-label="t('meme.like')"
          @click="likes.toggle(plugin.slug)"
        >
          {{ likes.liked(plugin.slug) ? '💚' : '🤍' }} {{ likes.countOf(plugin.slug, seedLikes ?? 0) }}
        </button>
        <button class="btn small" :aria-label="t('meme.share')" @click="share">🔗 {{ t('meme.share') }}</button>
      </div>
    </div>
  </article>
</template>
