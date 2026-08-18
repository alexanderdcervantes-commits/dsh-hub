<script setup lang="ts">
import type { PluginScreenshot } from '~/composables/usePlugins'

interface GalleryItem {
  url: string
  w?: number | null
  h?: number | null
}

const props = defineProps<{
  /** 本地精修封面（优先级最高，排第一） */
  image: string | null
  /** 仓库自动抓取的截图，追加在封面之后 */
  screenshots?: PluginScreenshot[]
  name: string
  /** 封面像素宽高（防 CLS，对应 image_w/image_h） */
  imageW?: number
  imageH?: number
}>()

const { t } = useI18n()

/** 展示列表：封面第一 + 截图去重追加；为空则整个组件不渲染 */
const items = computed<GalleryItem[]>(() => {
  const list: GalleryItem[] = []
  const seen = new Set<string>()
  if (props.image) {
    list.push({ url: props.image, w: props.imageW, h: props.imageH })
    seen.add(props.image)
  }
  for (const s of props.screenshots ?? []) {
    if (!s?.url || seen.has(s.url)) continue
    seen.add(s.url)
    list.push({ url: s.url, w: s.w, h: s.h })
  }
  return list
})

/** 加载失败的 URL（整体替换 Set 触发响应式更新） */
const failedUrls = ref(new Set<string>())
const markFailed = (url: string) => {
  if (!url || failedUrls.value.has(url)) return
  failedUrls.value = new Set(failedUrls.value).add(url)
}

const viewable = computed(() => items.value.filter((i: GalleryItem) => !failedUrls.value.has(i.url)))

const activeUrl = ref('')
/* 当前图加载失败时自动切到其后第一张可用图；全部失败则清空进占位态 */
watch(viewable, (list: GalleryItem[]) => {
  if (list.some((i: GalleryItem) => i.url === activeUrl.value)) return
  const idx = items.value.findIndex((i: GalleryItem) => i.url === activeUrl.value)
  const after = items.value.slice(idx + 1).find((i: GalleryItem) => !failedUrls.value.has(i.url))
  activeUrl.value = (after ?? list[0])?.url ?? ''
}, { immediate: true })

const current = computed(() => viewable.value.find((i: GalleryItem) => i.url === activeUrl.value) ?? null)
const activeIndex = computed(() => viewable.value.findIndex((i: GalleryItem) => i.url === activeUrl.value))
/** 有真实宽高就用属性占位防 CLS，没有则交给 CSS aspect-ratio */
const hasDims = computed(() => Boolean(current.value?.w && current.value?.h))

const select = (url: string) => {
  activeUrl.value = url
}

const step = (d: number) => {
  const n = viewable.value.length
  if (n < 2) return
  activeUrl.value = viewable.value[(activeIndex.value + d + n) % n].url
}

/* ---------- 灯箱 ---------- */
const open = ref(false)
const openLightbox = () => {
  if (current.value) open.value = true
}
const close = () => {
  open.value = false
}

const onKey = (e: KeyboardEvent) => {
  if (!open.value) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') step(-1)
  else if (e.key === 'ArrowRight') step(1)
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

/* 灯箱打开时锁页面滚动 */
watch(open, (v: boolean) => {
  if (import.meta.client) document.documentElement.style.overflow = v ? 'hidden' : ''
})
onUnmounted(() => {
  if (import.meta.client) document.documentElement.style.overflow = ''
})

/* 高亮缩略图滚进可视区（灯箱左右切换时缩略图行跟手） */
const root = ref<HTMLElement | null>(null)
watch(activeUrl, async () => {
  if (!import.meta.client || !root.value) return
  await nextTick()
  root.value.querySelector(`[data-thumb="${activeUrl.value}"]`)
    ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
})
</script>

<template>
  <div v-if="items.length" ref="root" class="plugin-gallery">
    <!-- 主图：圆角白卡画框（CSS 变量来自 assets/css/main.css），点击进灯箱 -->
    <div class="main-frame">
      <button
        type="button" class="zoom-btn"
        :aria-label="t('plugin.galleryOpen')"
        @click="openLightbox"
      >
        <div class="img-wrap" :class="{ 'no-dims': !hasDims }">
          <img
            v-if="current"
            :src="current.url" :alt="name"
            :width="current.w ?? undefined" :height="current.h ?? undefined"
            loading="lazy" decoding="async"
            @error="markFailed(current.url)"
          >
          <div v-else class="placeholder">{{ t('plugin.imageUnavailable') }}</div>
        </div>
      </button>
    </div>

    <!-- 缩略图行：多图才显示，移动端横向滚动 -->
    <div v-if="viewable.length > 1" class="thumbs">
      <button
        v-for="(it, i) in viewable" :key="it.url"
        type="button" class="thumb" :class="{ active: it.url === activeUrl }"
        :data-thumb="it.url"
        :aria-label="t('plugin.galleryThumb', { n: i + 1 })"
        :aria-current="it.url === activeUrl ? 'true' : 'false'"
        @click="select(it.url)"
      >
        <img :src="it.url" alt="" loading="lazy" decoding="async" @error="markFailed(it.url)">
      </button>
    </div>

    <!-- 灯箱：Esc / 点遮罩关闭，左右箭头与键盘切换 -->
    <Teleport to="body">
      <div
        v-if="open" class="lightbox"
        role="dialog" aria-modal="true" :aria-label="name"
        @click="close"
      >
        <img
          v-if="current" class="lb-img"
          :src="current.url" :alt="name"
          loading="eager" decoding="async"
          @click.stop @error="markFailed(current.url)"
        >
        <div v-else class="lb-fallback">{{ t('plugin.imageUnavailable') }}</div>

        <span v-if="viewable.length > 1" class="lb-counter">{{ activeIndex + 1 }} / {{ viewable.length }}</span>
        <button type="button" class="lb-btn lb-close" :aria-label="t('plugin.galleryClose')" @click.stop="close">✕</button>
        <template v-if="viewable.length > 1">
          <button type="button" class="lb-btn lb-prev" :aria-label="t('plugin.galleryPrev')" @click.stop="step(-1)">‹</button>
          <button type="button" class="lb-btn lb-next" :aria-label="t('plugin.galleryNext')" @click.stop="step(1)">›</button>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.plugin-gallery { margin-bottom: 20px; }

/* 主图画框：圆角白卡观感（原 .detail-main .shot 全局规则已删，观感在此自治） */
.main-frame {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  background: var(--card);
  overflow: hidden;
}
.zoom-btn {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  border-radius: inherit;
  cursor: zoom-in;
}
.zoom-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

/* 有宽高属性时靠属性推算宽高比占位（防 CLS） */
.img-wrap { background: var(--bg); }
.img-wrap img { display: block; width: 100%; height: auto; }
.img-wrap.no-dims { aspect-ratio: 16 / 10; }
.img-wrap.no-dims img { height: 100%; object-fit: contain; }

.placeholder {
  aspect-ratio: 16 / 10;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  font-size: 13.5px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent-soft), #ddf1ff);
}

/* 缩略图行 */
.thumbs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-bottom: 4px;
  overflow-x: auto;
  scrollbar-width: thin;
}
.thumb {
  flex: 0 0 auto;
  width: 88px;
  aspect-ratio: 16 / 10;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  overflow: hidden;
  cursor: pointer;
  opacity: 0.72;
  transition: opacity 0.12s ease, border-color 0.12s ease;
}
.thumb:hover { opacity: 1; border-color: var(--accent); }
.thumb.active {
  opacity: 1;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}
.thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }

/* 灯箱 */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(13, 17, 23, 0.84);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 56px;
  cursor: zoom-out;
}
.lb-img {
  max-width: min(100%, 1400px);
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: var(--shadow-hover);
  cursor: default;
}
.lb-fallback { color: var(--text-3); font-size: 14px; font-weight: 600; }
.lb-btn {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(240, 246, 252, 0.12);
  background: rgba(22, 27, 34, 0.8);
  color: #e6edf3;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.lb-btn:hover { background: rgba(46, 164, 79, 0.85); border-color: var(--accent); }
.lb-close { top: 18px; right: 18px; }
.lb-prev { left: 14px; top: 50%; transform: translateY(-50%); }
.lb-next { right: 14px; top: 50%; transform: translateY(-50%); }
.lb-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(22, 27, 34, 0.8);
  color: #e6edf3;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 620px) {
  .lb-btn { width: 44px; height: 44px; }
  .lb-close { top: 14px; right: 14px; }
  .lightbox { padding: 40px 10px; }
  .lb-prev { left: 6px; }
  .lb-next { right: 6px; }
}
</style>
