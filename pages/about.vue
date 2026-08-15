<script setup lang="ts">
const { t, locale } = useI18n()
const title = locale.value === 'zh' ? '关于 — DSH Meme Hub' : 'About — DSH Meme Hub'
useHead({
  title,
  meta: [{
    name: 'description',
    content: locale.value === 'zh'
      ? 'DSH Meme Hub：DeepSeek Harness (dsh) 插件的策展导航。别人罗列一切，我们只挑好东西——和好玩的。'
      : 'DSH Meme Hub: the curated guide to DeepSeek Harness (dsh) plugins. They list everything; we pick the good stuff — and the fun stuff.',
  }],
})
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1>{{ t('about.title') }}</h1>
    </div>
    <div class="prose" style="max-width:760px;padding-bottom:60px">
      <p>{{ t('about.p1') }}</p>
      <p>{{ t('about.p2') }}</p>
      <p>{{ t('about.p3') }}</p>
      <p class="hint" style="color:var(--text-3);font-size:13.5px">{{ t('about.disclaimer') }}</p>
    </div>
  </div>
</template>
