<script setup lang="ts">
import type { NuxtError } from '#app'
import { useI18n } from '#imports'

defineProps<{ error: NuxtError }>()
const { t, locale, localeProperties, localePath } = useI18n()

useHead({
  title: t('common.notFound'),
  htmlAttrs: { lang: localeProperties.value.language ?? locale.value },
})
</script>

<template>
  <div style="min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:20px">
    <div style="font-size:64px">🐋</div>
    <h1 style="font-size:28px;margin:0">{{ error.statusCode === 404 ? t('common.notFound') : error.statusCode }}</h1>
    <p style="color:var(--text-2);margin:0">
      {{ t('common.whaleLine') }}
    </p>
    <NuxtLink class="btn green" :to="localePath('/')">{{ t('common.backHome') }}</NuxtLink>
  </div>
</template>
