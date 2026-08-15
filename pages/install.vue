<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins } = usePlugins()

const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
const isZh = computed(() => locale.value === 'zh')

const title = isZh.value
  ? 'DeepSeek Harness (dsh) 安装指南 — 两条命令装好本体和插件'
  : 'How to Install DeepSeek Harness (dsh) and Its Plugins'
const description = isZh.value
  ? '一条 npx 命令启动 DeepSeek Harness (dsh)，再一条命令装社区插件。附常见问题和错拼说明。'
  : 'Install DeepSeek Harness (dsh) with one npx command and add community plugins with one more. Node.js required, FAQ included.'

const pageUrl = `${siteUrl}${localePath('/install')}`

// 三块 JSON-LD：HowTo / FAQPage / BreadcrumbList，文案与正文同源（locale JSON），中英各自成套
const howtoLd = computed(() => isZh.value
  ? {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: '安装 DeepSeek Harness 和它的插件',
      step: [
        { '@type': 'HowToStep', name: '安装 Node.js', text: '去 Node.js 官网装 LTS 版本，终端里 node -v 能打印出版本号就对了。' },
        { '@type': 'HowToStep', name: '启动 DSH', text: '运行 npx @deepseek-ai/dsh web，浏览器会直接打开 Web UI。' },
        { '@type': 'HowToStep', name: '添加插件', text: '运行 dsh plugin add github:owner/repo，owner/repo 换成你想装的插件。' },
        { '@type': 'HowToStep', name: '启用插件', text: '打开 DSH Web UI 的插件页，把插件打开。' },
      ],
    }
  : {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Install DeepSeek Harness and its plugins',
      step: [
        { '@type': 'HowToStep', name: 'Install Node.js', text: 'Get the LTS build from the Node.js website, node -v should print a version.' },
        { '@type': 'HowToStep', name: 'Start DSH', text: 'Run npx @deepseek-ai/dsh web and the web UI opens in your browser.' },
        { '@type': 'HowToStep', name: 'Add a plugin', text: 'Run dsh plugin add github:owner/repo with the plugin you want.' },
        { '@type': 'HowToStep', name: 'Enable it', text: 'Open the DSH Web UI plugin page and turn the plugin on.' },
      ],
    })

const faqLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [1, 2, 3, 4, 5].map(i => ({
    '@type': 'Question',
    name: t(`install.faq.q${i}`),
    acceptedAnswer: { '@type': 'Answer', text: t(`install.faq.a${i}`) },
  })),
}))

const breadcrumbLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: isZh.value ? '首页' : 'Home', item: `${siteUrl}${isZh.value ? '/zh' : ''}` },
    { '@type': 'ListItem', position: 2, name: isZh.value ? '安装指南' : 'Install', item: pageUrl },
  ],
}))

useHead({
  title,
  meta: [
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: pageUrl },
  ],
  script: [
    { type: 'application/ld+json', innerHTML: JSON.stringify(howtoLd.value) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(faqLd.value) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbLd.value) },
  ],
})
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1>{{ t('install.title') }}</h1>
      <p class="sub">{{ t('install.sub') }}</p>
    </div>

    <div class="prose" style="max-width:760px;padding-bottom:60px">
      <h2>{{ t('install.whatH') }}</h2>
      <p>{{ t('install.whatP') }}</p>

      <h2>{{ t('install.needH') }}</h2>
      <p>{{ t('install.needP') }}</p>
      <AppCopyCmd cmd="node -v" />

      <h2>{{ t('install.startH') }}</h2>
      <p>{{ t('install.startP1') }}</p>
      <AppCopyCmd cmd="npx @deepseek-ai/dsh web" />
      <p>{{ t('install.startP2') }}</p>
      <p>{{ t('install.startP3') }}</p>
      <AppCopyCmd cmd="git clone https://github.com/deepseek-ai/deepseek-harness.git" />

      <h2>{{ t('install.pluginH') }}</h2>
      <p>{{ t('install.pluginP', { n: plugins.length }) }}</p>
      <AppCopyCmd cmd="dsh plugin add github:owner/repo" />

      <h2>{{ t('install.faqH') }}</h2>
      <div v-for="i in 5" :key="i" class="faq-item">
        <h3>{{ t(`install.faq.q${i}`) }}</h3>
        <p>{{ t(`install.faq.a${i}`) }}</p>
      </div>

      <h2>{{ t('install.typoH') }}</h2>
      <p>{{ t('install.typoP') }}</p>

      <h2>{{ t('install.relatedH') }}</h2>
      <ul>
        <li><NuxtLink :to="localePath('/plugins')">{{ t('install.relatedPlugins') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath('/meme')">{{ t('install.relatedMeme') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath('/submit')">{{ t('install.relatedSubmit') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath('/plugins/dsh-web-ui')">{{ t('install.relatedWebUi') }}</NuxtLink></li>
        <li><a href="https://github.com/deepseek-ai/deepseek-harness" target="_blank" rel="noopener">{{ t('install.relatedGithub') }} ↗</a></li>
      </ul>
    </div>
  </div>
</template>
