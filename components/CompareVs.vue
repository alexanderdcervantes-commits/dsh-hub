<script setup lang="ts">
// SEO-PLACEHOLDER: 待升级（性能实测数据 / GitHub API 动态星数 / 更多对比维度）
// S3 对比详情页共用骨架：cc=Claude Code / oc=OpenCode / cx=Codex。
// 页面文案全走 i18n（compare.{hub,tbl,cmn,cc,oc,cx}.*）；数字集中在本文件的
// 2026-08-17 GitHub 快照常量里，与 locale 文案里的数字同源同快照——改数请两边一起改。
const props = defineProps<{ rival: 'cc' | 'oc' | 'cx' }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

/** 2026-08-17 GitHub 实抓快照（唯一数字来源，别处不许再写死） */
const DSH = { repo: 'deepseek-ai/deepseek-harness', stars: 143374 } as const

const RIVALS = {
  cc: {
    key: 'cc', name: 'Claude Code', path: '/compare/deepseek-harness-vs-claude-code',
    repo: 'anthropics/claude-code', stars: 141712, lang: 'Python',
    license: null, // null = 闭源 → 显示 t('compare.tbl.closed')
    ecoKey: 'ecoCc', titleKey: 'meta.vsCcTitle', descKey: 'meta.vsCcDesc',
  },
  oc: {
    key: 'oc', name: 'OpenCode', path: '/compare/deepseek-harness-vs-opencode',
    repo: 'sst/opencode', stars: 198275, lang: 'TypeScript',
    license: 'MIT', ecoKey: 'ecoOc', titleKey: 'meta.vsOcTitle', descKey: 'meta.vsOcDesc',
  },
  cx: {
    key: 'cx', name: 'Codex', path: '/compare/deepseek-harness-vs-codex',
    repo: 'openai/codex', stars: 106397, lang: 'Rust',
    license: 'Apache-2.0', ecoKey: 'ecoCx', titleKey: 'meta.vsCxTitle', descKey: 'meta.vsCxDesc',
  },
} as const
type RivalKey = keyof typeof RIVALS

const rival = computed(() => RIVALS[props.rival])
const others = computed(() => (Object.keys(RIVALS) as RivalKey[]).filter(k => k !== props.rival))

/** 星数按页面 locale 分组分隔符展示（de=143.374，其余=143,374），与各语言正文数字写法一致 */
const fmt = (n: number) => n.toLocaleString(locale.value)

const pageUrl = `${siteUrl}${localePath(rival.value.path)}`
const title = computed(() => t(rival.value.titleKey))
const desc = computed(() => t(rival.value.descKey))

const faqLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: ([1, 2, 3] as const).map(i => ({
    '@type': 'Question',
    name: t(`compare.${rival.value.key}.faq.q${i}`),
    acceptedAnswer: { '@type': 'Answer', text: t(`compare.${rival.value.key}.faq.a${i}`) },
  })),
}))

const breadcrumbLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: t('meta.breadcrumbHome'), item: `${siteUrl}${localePath('/')}` },
    { '@type': 'ListItem', position: 2, name: t('meta.breadcrumbCompare'), item: `${siteUrl}${localePath('/compare')}` },
    { '@type': 'ListItem', position: 3, name: `vs ${rival.value.name}`, item: pageUrl },
  ],
}))

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
    { type: 'application/ld+json', innerHTML: JSON.stringify(faqLd.value) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbLd.value) },
  ],
})
</script>

<template>
  <!-- SEO-PLACEHOLDER: 待升级（性能实测数据 / 动态星数 / 更多对比维度） -->
  <div class="container">
    <div class="breadcrumb">
      <NuxtLink :to="localePath('/')">{{ t('meta.breadcrumbHome') }}</NuxtLink>
      / <NuxtLink :to="localePath('/compare')">{{ t('meta.breadcrumbCompare') }}</NuxtLink>
      / vs {{ rival.name }}
    </div>

    <div class="page-head">
      <h1>{{ t(`compare.${rival.key}.h1`) }}</h1>
      <p class="sub">{{ t(`compare.${rival.key}.intro`) }}</p>
    </div>

    <div class="prose">
      <h2>{{ t('compare.tbl.tableH') }}</h2>
      <div class="vs-table-wrap">
        <table class="vs-table">
          <thead>
            <tr>
              <th scope="col">{{ t('compare.tbl.dimension') }}</th>
              <th scope="col">
                DeepSeek Harness (dsh)
                <span class="vendor">{{ t('compare.tbl.dshSub') }}</span>
              </th>
              <th scope="col">
                {{ rival.name }}
                <span class="vendor">{{ t(`compare.tbl.${rival.key}Sub`) }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{{ t('compare.tbl.repo') }}</th>
              <td><a :href="`https://github.com/${DSH.repo}`" target="_blank" rel="noopener">{{ DSH.repo }}</a></td>
              <td><a :href="`https://github.com/${rival.repo}`" target="_blank" rel="noopener">{{ rival.repo }}</a></td>
            </tr>
            <tr>
              <th scope="row">{{ t('compare.tbl.stars') }}</th>
              <td class="num">{{ fmt(DSH.stars) }}</td>
              <td class="num">{{ fmt(rival.stars) }}</td>
            </tr>
            <tr>
              <th scope="row">{{ t('compare.tbl.license') }}</th>
              <td>MIT</td>
              <td>{{ rival.license ?? t('compare.tbl.closed') }}</td>
            </tr>
            <tr>
              <th scope="row">{{ t('compare.tbl.lang') }}</th>
              <td>TypeScript</td>
              <td>{{ rival.lang }}</td>
            </tr>
            <tr>
              <th scope="row">{{ t('compare.tbl.eco') }}</th>
              <td>{{ t('compare.tbl.ecoDsh') }}</td>
              <td>{{ t(`compare.tbl.${rival.ecoKey}`) }}</td>
            </tr>
            <tr>
              <th scope="row">{{ t('compare.tbl.released') }}</th>
              <td>{{ t('compare.tbl.relDsh') }}</td>
              <td>{{ t('compare.tbl.relRival') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="note">{{ t('compare.tbl.snapshot') }}</p>

      <h2>{{ t(`compare.${rival.key}.s1h`) }}</h2>
      <p>{{ t(`compare.${rival.key}.s1p`) }}</p>
      <h2>{{ t(`compare.${rival.key}.s2h`) }}</h2>
      <p>{{ t(`compare.${rival.key}.s2p`) }}</p>
      <h2>{{ t(`compare.${rival.key}.s3h`) }}</h2>
      <p>{{ t(`compare.${rival.key}.s3p`) }}</p>

      <h2>{{ t(`compare.${rival.key}.faqH`) }}</h2>
      <div v-for="i in 3" :key="i" class="faq-item">
        <h3>{{ t(`compare.${rival.key}.faq.q${i}`) }}</h3>
        <p>{{ t(`compare.${rival.key}.faq.a${i}`) }}</p>
      </div>

      <h2>{{ t('compare.cmn.ctaH') }}</h2>
      <p>{{ t('compare.cmn.ctaP') }}</p>
      <div class="cta-row">
        <NuxtLink class="btn green" :to="localePath('/plugins')">{{ t('compare.cmn.ctaBtn') }}</NuxtLink>
        <NuxtLink class="btn" :to="localePath('/install')">{{ t('compare.cmn.ctaInstall') }}</NuxtLink>
      </div>

      <h2>{{ t('compare.cmn.moreH') }}</h2>
      <ul class="more-vs">
        <li v-for="k in others" :key="k">
          <NuxtLink :to="localePath(RIVALS[k].path)">DeepSeek Harness vs {{ RIVALS[k].name }}</NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath('/compare')">{{ t('compare.cmn.backHub') }}</NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* 对比表：容器横向滚动兜底窄屏，全局 main.css 没有表格样式 */
.vs-table-wrap { overflow-x: auto; margin: 10px 0 6px; }
.vs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14.5px;
  background: var(--card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
}
.vs-table th, .vs-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-soft);
  text-align: left;
  vertical-align: top;
}
.vs-table thead th { background: var(--bg); font-size: 14px; }
.vs-table tbody tr:last-child th, .vs-table tbody tr:last-child td { border-bottom: none; }
.vs-table tbody th { color: var(--text-2); font-weight: 600; white-space: nowrap; }
.vs-table .vendor { display: block; font-size: 12px; color: var(--text-3); font-weight: 500; margin-top: 2px; }
.vs-table td.num { font-variant-numeric: tabular-nums; font-weight: 700; }
/* 长仓库名(owner/repo)可断行,否则一列 token 就 220px+,窄屏全靠盲拖 */
.vs-table td a { overflow-wrap: anywhere; }
.faq-item { margin: 14px 0; }
.faq-item h3 { margin: 0 0 4px; }
.faq-item p { margin: 0; color: var(--text-2); font-size: 14.5px; }
/* CTA 两按钮:窄屏必然换行,gap 替代内联 margin,避免换行后贴边错位 */
.cta-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 6px 0 10px; }
.more-vs { margin: 8px 0 50px; padding-left: 22px; }
.more-vs li { margin: 6px 0; }
.more-vs a { display: inline-block; }
@media (max-width: 620px) {
  /* 配合上方 td a 的 overflow-wrap:anywhere:长仓库名断行后三列收进 335px 视口,
     免横向拖动(sticky 方案在 anywhere 收窄 min-content 后永不触发,已弃) */
  .vs-table th, .vs-table td { padding: 10px 10px; }
  .more-vs li { margin: 10px 0; }
}
</style>
