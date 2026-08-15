<script setup lang="ts">
import type { NuxtError } from '#app'
import { useI18n } from '#imports'

defineProps<{ error: NuxtError }>()
const { t, locale } = useI18n()

useHead({
  title: t('common.notFound'),
  htmlAttrs: { lang: locale.value === 'zh' ? 'zh-CN' : 'en' },
})
</script>

<template>
  <div style="min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:20px">
    <div style="font-size:64px">🐋</div>
    <h1 style="font-size:28px;margin:0">{{ error.statusCode === 404 ? t('common.notFound') : error.statusCode }}</h1>
    <p style="color:var(--text-2);margin:0">
      {{ locale === 'zh' ? '这只鲸鱼没找到你要的页面。' : 'The whale could not find that page.' }}
    </p>
    <NuxtLink class="btn green" :to="locale === 'zh' ? '/zh' : '/'">{{ t('common.backHome') }}</NuxtLink>
  </div>
</template>
