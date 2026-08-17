<script setup lang="ts">
// 底部广告横幅（728x90 iframe，highperformanceformat）。
// 纯客户端组件：根容器随 SSR 输出（稳定挂载点），广告脚本只在 onMounted 注入。
// 小于 728px 的视口用 transform scale 等比缩小，高度同步修正，不裁切不塌陷。
const AD_WIDTH = 728
const AD_HEIGHT = 90
const INVOKE_SRC = 'https://www.highperformanceformat.com/b0df5aed2571e457d256b6cc20556ded/invoke.js'

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

  // 先写 atOptions 再 append invoke.js，保证脚本执行时配置已就位
  const w = window as Window & { atOptions?: Record<string, unknown> }
  w.atOptions = {
    key: 'b0df5aed2571e457d256b6cc20556ded',
    format: 'iframe',
    height: AD_HEIGHT,
    width: AD_WIDTH,
    params: {},
  }
  const s = document.createElement('script')
  s.src = INVOKE_SRC
  s.async = true
  frame.value?.appendChild(s)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <div ref="root" class="ad-banner" data-ad-banner :style="{ height: `${frameHeight}px` }">
    <ClientOnly>
      <div class="ad-scale" :style="{ transform: `scale(${scale})` }">
        <div ref="frame" class="ad-frame" />
      </div>
      <span class="ad-tag">Ad</span>
    </ClientOnly>
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
