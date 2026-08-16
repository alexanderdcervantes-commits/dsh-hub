<script setup lang="ts">
import type { DshLauncher } from '~/composables/useLaunchers'

const props = defineProps<{ launcher: DshLauncher }>()
const { t, locale } = useI18n()
const { descOf, highlightsOf, noteOf } = useLaunchers()
</script>

<template>
  <article class="plugin-card launcher-card">
    <a v-if="launcher.image" class="launcher-thumb" :href="launcher.url" target="_blank" rel="noopener">
      <img :src="launcher.image" :alt="launcher.name" loading="lazy">
    </a>
    <div class="title-row">
      <h3><a :href="launcher.url" target="_blank" rel="noopener">{{ launcher.name }}</a></h3>
      <span class="chip purple">{{ launcher.stack }}</span>
    </div>
    <p class="repo">{{ launcher.repo }}</p>
    <p class="desc">{{ descOf(launcher, locale) }}</p>
    <div class="chip-row">
      <span v-for="pf in launcher.platforms" :key="pf" class="chip">{{ pf }}</span>
    </div>
    <div class="chip-row">
      <span v-for="h in highlightsOf(launcher, locale).slice(0, 3)" :key="h" class="chip green">{{ h }}</span>
    </div>
    <div class="meta-row">
      <span class="stars">{{ launcher.stars.toLocaleString() }}</span>
      <span>⚖ {{ launcher.license ?? t('launcher.licenseUndeclared') }}</span>
      <span>{{ launcher.language }}</span>
    </div>
    <p v-if="noteOf(launcher, locale)" class="note platform-note">ℹ️ {{ noteOf(launcher, locale) }}</p>
  </article>
</template>
