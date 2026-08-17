<script setup lang="ts">
// 底部/顶部广告横幅（728x90 iframe，highperformanceformat）。
// 纯客户端组件：根容器随 SSR 输出（稳定挂载点），广告只在 onMounted 注入。
// 小于 728px 的视口用 transform scale 等比缩小，高度同步修正，不裁切不塌陷。
//
// ⚠ iframe 隔离（2026-08-17，照搬 china-ai-arbitrage ADS_SYSTEM.md 的成熟方案）：
// 页面上有多个 banner（顶部 + 底部）时，若都在宿主页写全局 window.atOptions，
// 各组件 onMounted 同步覆盖同一个全局对象，invoke.js 异步加载完读到的总是最后写入的值，
// 导致除最后一个位外全部填充失败。因此每个广告位用独立 iframe 加载 /ads/728x90.html，
// iframe 各有独立 window，atOptions 彻底隔离。同 key 也隔离——防 Adsterra 端行为不确定。
const AD_WIDTH = 728
const AD_HEIGHT = 90
const AD_SRC = '/ads/728x90.html'

const root = ref<HTMLElement | null>(null)
const frame = ref<HTMLElement | null>(null)
const scale = ref(1)
const frameHeight = computed(() => Math.round(AD_HEIGHT * scale.value))

function measure() {
  const w = root.value?.clientWidth ?? AD_WIDTH
  scale.value = Math.min(1, w / AD_WIDTH)
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)

  if (!frame.value || frame.value.querySelector('iframe')) return
  const iframe = document.createElement('iframe')
  iframe.title = 'advertisement'
  iframe.setAttribute('scrolling', 'no')
  iframe.src = AD_SRC
  frame.value.appendChild(iframe)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <!-- ⚠ 不要包 <ClientOnly>：ClientOnly 的 slot 在它自己的 onMounted 才渲染，
       而本组件 onMounted 先触发 → frame.value 为 null → iframe 注入被跳过，广告永远空白。
       onMounted 只在客户端执行，SSR 不会跑广告逻辑，无需 ClientOnly
       （china-ai-arbitrage ADS_SYSTEM.md Pitfall #1，同一根因）。 -->
  <div ref="root" class="ad-banner" data-ad-banner :style="{ height: `${frameHeight}px` }">
    <div class="ad-scale" :style="{ transform: `scale(${scale})` }">
      <div ref="frame" class="ad-frame" />
    </div>
    <span class="ad-tag">Ad</span>
  </div>
</template>

<style scoped>
.ad-banner {
  position: relative;
  width: min(100%, 728px);
  max-width: 728px;
  margin: 32px auto;
  transition: height 0.15s ease-out;
}
.ad-scale {
  width: 728px;
  height: 90px;
  transform-origin: top left;
}
.ad-frame,
.ad-frame :deep(iframe) {
  display: block;
  width: 728px;
  height: 90px;
  border: 0;
  margin: 0;
}
.ad-tag {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  line-height: 1;
  padding: 2px 4px;
  color: var(--text-3);
  background: rgba(255, 255, 255, 0.72);
  border-radius: 3px;
  pointer-events: none;
  user-select: none;
}
</style>
