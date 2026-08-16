<script setup lang="ts">
const { locale, t } = useI18n()
const route = useRoute()
const head = useLocaleHead({ dir: true, lang: true, seo: true })
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs?.lang ?? 'en' },
  link: [...(head.value.link ?? [])],
  meta: [...(head.value.meta ?? [])],
}))

const other = computed(() => (locale.value === 'en' ? 'zh' : 'en'))

function switchLang() {
  navigateTo(switchLocalePath(other.value))
}

const navActive = (path: string) => {
  const localized = localePath(path)
  return route.path === localized || route.path.startsWith(`${localized}/`)
}

const toast = useState<string | null>('toast', () => null)
</script>

<template>
  <div>
    <header class="site-header">
      <div class="container inner">
        <NuxtLink :to="localePath('/')" class="brand" aria-label="DSH Meme Hub">
          <img class="whale" src="/images/dsh-ui-whale.webp" alt="whale" width="348" height="220" decoding="async">
          DSH<em>Meme</em>Hub
        </NuxtLink>
        <nav class="main-nav">
          <NuxtLink :to="localePath('/meme')" :class="{ active: navActive('/meme') }">{{ t('nav.meme') }}</NuxtLink>
          <NuxtLink :to="localePath('/plugins')" :class="{ active: navActive('/plugins') }">{{ t('nav.plugins') }}</NuxtLink>
          <NuxtLink :to="localePath('/install')" :class="{ active: navActive('/install') }">{{ t('nav.install') }}</NuxtLink>
          <NuxtLink :to="localePath('/launcher')" :class="{ active: navActive('/launcher') }">{{ t('nav.launchers') }}</NuxtLink>
          <NuxtLink :to="localePath('/submit')" :class="{ active: navActive('/submit') }">{{ t('nav.submit') }}</NuxtLink>
          <NuxtLink :to="localePath('/about')" :class="{ active: navActive('/about') }">{{ t('nav.about') }}</NuxtLink>
        </nav>
        <button class="lang-switch" @click="switchLang">
          {{ other === 'zh' ? '中文' : 'EN' }}
        </button>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="inner">
          <div class="col">
            <h4>DSH Meme Hub</h4>
            <ul>
              <li><NuxtLink :to="localePath('/about')">{{ t('footer.about') }}</NuxtLink></li>
              <li><NuxtLink :to="localePath('/install')">{{ t('footer.install') }}</NuxtLink></li>
              <li><NuxtLink :to="localePath('/launcher')">{{ t('footer.launchers') }}</NuxtLink></li>
              <li><NuxtLink :to="localePath('/submit')">{{ t('footer.submit') }}</NuxtLink></li>
            </ul>
          </div>
          <div class="col">
            <h4>{{ t('footer.official') }}</h4>
            <ul>
              <li><a href="https://github.com/deepseek-ai/deepseek-harness" target="_blank" rel="noopener">{{ t('footer.dshRepo') }}</a></li>
              <li><a href="https://github.com/topics/dsh-plugin" target="_blank" rel="noopener">{{ t('footer.pluginTopic') }}</a></li>
            </ul>
          </div>
          <div class="col">
            <h4>GitHub</h4>
            <ul>
              <li><a href="https://github.com/the-beating-light-of-the-nail/dsh-meme-hub-site" target="_blank" rel="noopener">dsh-meme-hub-site</a></li>
              <li><a href="https://github.com/the-beating-light-of-the-nail/dsh-meme-hub" target="_blank" rel="noopener">dsh-meme-hub</a></li>
            </ul>
          </div>
        </div>
        <p class="legal">{{ t('footer.legal') }}</p>
      </div>
    </footer>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>
