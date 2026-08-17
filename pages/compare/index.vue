<script setup lang="ts">
// SEO-PLACEHOLDER: 待升级（对比维度扩充 / 胜者流过滤器 / 更多工具）
// S3 对比专区 hub：承接 "deepseek harness vs claude code / opencode / codex" 决策词，
// 导流到三张对比详情页。数字只在 locale 文案里（2026-08-17 快照），本页无表格。
const { t } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

// 三张对比卡：hook{Cc,Oc,Cx} 与详情页路由一一对应
const CARDS = [
  { key: 'cc', hookKey: 'hookCc', name: 'Claude Code', path: '/compare/deepseek-harness-vs-claude-code' },
  { key: 'oc', hookKey: 'hookOc', name: 'OpenCode', path: '/compare/deepseek-harness-vs-opencode' },
  { key: 'cx', hookKey: 'hookCx', name: 'Codex', path: '/compare/deepseek-harness-vs-codex' },
] as const

const pageUrl = `${siteUrl}${localePath('/compare')}`
const title = computed(() => t('meta.cmpHubTitle'))
const desc = computed(() => t('meta.cmpHubDesc'))

useHead({
  title: title.value,
  meta: [
    { name: 'description', content: desc.value },
    { property: 'og:title', content: title.value },
    { property: 'og:description', content: desc.value },
    { property: 'og:image', content: `${siteUrl}/images/dsh-deep-whale-hero.webp` },
    { property: 'og:url', content: pageUrl },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('meta.breadcrumbHome'), item: `${siteUrl}${localePath('/')}` },
          { '@type': 'ListItem', position: 2, name: t('meta.breadcrumbCompare'), item: pageUrl },
        ],
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: CARDS.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `DeepSeek Harness vs ${c.name}`,
          url: `${siteUrl}${localePath(c.path)}`,
        })),
      }),
    },
  ],
})
</script>

<template>
  <!-- SEO-PLACEHOLDER: 待升级（对比维度扩充 / 胜者流过滤器 / 更多工具） -->
  <div class="container">
    <div class="breadcrumb">
      <NuxtLink :to="localePath('/')">{{ t('meta.breadcrumbHome') }}</NuxtLink>
      / {{ t('meta.breadcrumbCompare') }}
    </div>

    <div class="page-head">
      <h1>{{ t('compare.hub.title') }}</h1>
      <p class="sub">{{ t('compare.hub.sub') }}</p>
    </div>

    <div class="prose">
      <p>{{ t('compare.hub.intro') }}</p>
      <p class="note">{{ t('compare.tbl.snapshot') }}</p>
    </div>

    <section class="section" style="padding-bottom:50px">
      <div class="grid cols-3">
        <NuxtLink v-for="c in CARDS" :key="c.key" class="cmp-card" :to="localePath(c.path)">
          <h3>DeepSeek Harness vs {{ c.name }}</h3>
          <p>{{ t(`compare.hub.${c.hookKey}`) }}</p>
          <span class="go">{{ t('compare.hub.go') }}</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* hub 三张入口卡：视觉对齐全站 cat-card，但带钩子文案，不复用其 emoji 结构 */
.cmp-card {
  display: block;
  padding: 20px 22px;
  background: var(--card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  text-decoration: none;
}
.cmp-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }
.cmp-card h3 { margin: 0 0 8px; font-size: 16px; }
.cmp-card p { margin: 0 0 12px; color: var(--text-2); font-size: 14px; line-height: 1.55; }
.cmp-card .go { color: var(--accent-strong); font-size: 13.5px; font-weight: 700; }
</style>
