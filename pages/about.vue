<script setup lang="ts">
const { t } = useI18n()
useHead({
  title: t('meta.aboutTitle'),
  meta: [{
    name: 'description',
    content: t('meta.aboutDesc'),
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
