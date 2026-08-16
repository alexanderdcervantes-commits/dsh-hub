<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins } = usePlugins()

const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
const isZh = computed(() => locale.value === 'zh')

const title = computed(() =>
  isZh.value ? '安装 DSH — DSH Meme Hub' : 'Install DSH — DSH Meme Hub')
const description = computed(() =>
  isZh.value
    ? '从打开终端到装好第一个插件：DSH 安装教程包含 Node.js 检查、npx 启动、插件安装、FAQ 和常见拼写错误。'
    : 'Step-by-step DSH install guide: open a terminal, check Node.js, start with npx, add plugins, plus FAQ and common misspellings.')

const pageUrl = `${siteUrl}${localePath('/install')}`

// 三块 JSON-LD：HowTo / FAQPage / BreadcrumbList，文案与正文同源（locale JSON），中英各自成套
const howtoLd = computed(() => isZh.value
  ? {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: '安装 DeepSeek Harness 和它的插件',
      step: [
        { '@type': 'HowToStep', name: '打开终端', text: 'macOS 按 Command + 空格打开终端，Windows 用 PowerShell，Linux 按 Ctrl + Alt + T。' },
        { '@type': 'HowToStep', name: '安装 Node.js', text: '去 Node.js 官网装 LTS 版本，终端里 node --version 能打印出 v20 或更高版本就对了。' },
        { '@type': 'HowToStep', name: '启动 DSH', text: '运行 npx @deepseek-ai/dsh web，浏览器会打开 Web UI。' },
        { '@type': 'HowToStep', name: '添加插件', text: '运行 dsh plugin add github:owner/repo，owner/repo 换成你想装的插件，然后去 Web UI 启用。' },
      ],
    }
  : {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Install DeepSeek Harness and its plugins',
      step: [
        { '@type': 'HowToStep', name: 'Open a terminal', text: 'On macOS press Command + Space and open Terminal; on Windows use PowerShell; on Linux press Ctrl + Alt + T.' },
        { '@type': 'HowToStep', name: 'Install Node.js', text: 'Get the LTS build from the Node.js website; node --version should print v20 or later.' },
        { '@type': 'HowToStep', name: 'Start DSH', text: 'Run npx @deepseek-ai/dsh web and the web UI opens in your browser.' },
        { '@type': 'HowToStep', name: 'Add a plugin', text: 'Run dsh plugin add github:owner/repo with the plugin you want, then enable it in the web UI.' },
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

useHead(() => ({
  title: title.value,
  meta: [
    { name: 'description', content: description.value },
    { property: 'og:title', content: title.value },
    { property: 'og:description', content: description.value },
    { property: 'og:url', content: pageUrl },
  ],
  script: [
    { type: 'application/ld+json', innerHTML: JSON.stringify(howtoLd.value) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(faqLd.value) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbLd.value) },
  ],
}))
</script>

<template>
  <div>
    <div class="container">
      <div class="page-head">
        <h1>{{ t('install.title') }}</h1>
        <p class="sub">{{ t('install.sub') }}</p>
      </div>

      <div class="install-page">
        <!-- 安装前速览 -->
        <section class="step-card overview">
          <h2>{{ t('install.overviewTitle') }}</h2>
          <ul class="overview-list">
            <li>{{ t('install.overview1') }}</li>
            <li>{{ t('install.overview2') }}</li>
            <li>{{ t('install.overview3') }}</li>
          </ul>
        </section>

        <!-- DSH 是什么 -->
        <section class="step-card">
          <h2>{{ t('install.whatH') }}</h2>
          <p>{{ t('install.whatP') }}</p>
        </section>

        <!-- 第 1 步：打开终端 -->
        <section class="step-card" id="terminal">
          <div class="step-head">
            <span class="step-no">1</span>
            <h2>{{ t('install.step1.title') }}</h2>
          </div>
          <p>{{ t('install.step1.intro') }}</p>
          <p class="label">{{ t('install.step1.os') }}</p>
          <ul class="os-list">
            <li>{{ t('install.step1.macos') }}</li>
            <li>{{ t('install.step1.windows') }}</li>
            <li>{{ t('install.step1.linux') }}</li>
          </ul>
          <p>{{ t('install.step1.look') }}</p>
          <p>{{ t('install.step1.pasteNote') }}</p>
          <p class="note">{{ t('install.step1.pasteShortcuts') }}</p>

          <div class="checkpoint">
            <h3>{{ t('install.checkpoint1.title') }}</h3>
            <p>{{ t('install.checkpoint1.desc') }}</p>
            <AppCopyCmd cmd="echo hello" />
            <p class="label">{{ t('install.checkpoint1.expectedLabel') }}</p>
            <pre class="output">hello</pre>
            <p class="note">{{ t('install.checkpoint1.fail') }}</p>
          </div>
        </section>

        <!-- 第 2 步：装 Node.js -->
        <section class="step-card" id="node">
          <div class="step-head">
            <span class="step-no">2</span>
            <h2>{{ t('install.step2.title') }}</h2>
          </div>
          <p>{{ t('install.step2.intro') }}</p>
          <p class="label">{{ t('install.needH') }}</p>
          <p>{{ t('install.needP') }}</p>
          <p class="label">{{ t('install.step2.checkLabel') }}</p>
          <AppCopyCmd cmd="node --version" />
          <p>{{ t('install.step2.haveIt') }}</p>
          <p>{{ t('install.step2.notFound') }}</p>
          <ol class="install-list">
            <li>{{ t('install.step2.install1') }}</li>
            <li>{{ t('install.step2.install2') }}</li>
            <li>{{ t('install.step2.install3') }}</li>
          </ol>
          <p class="note">{{ t('install.step2.lts') }}</p>
          <p class="warning">{{ t('install.step2.reopen') }}</p>

          <div class="checkpoint">
            <h3>{{ t('install.checkpoint2.title') }}</h3>
            <p>{{ t('install.checkpoint2.desc') }}</p>
            <AppCopyCmd cmd="node --version" />
            <p class="label">{{ t('install.checkpoint2.expectedLabel') }}</p>
            <pre class="output">v22.11.0</pre>
            <p>{{ t('install.checkpoint2.versionOk') }}</p>
            <p class="note">{{ t('install.checkpoint2.fail') }}</p>
          </div>
        </section>

        <!-- 第 3 步：启动 DSH -->
        <section class="step-card" id="start">
          <div class="step-head">
            <span class="step-no">3</span>
            <h2>{{ t('install.step3.title') }}</h2>
          </div>
          <p>{{ t('install.step3.intro') }}</p>
          <AppCopyCmd :cmd="'npx @deepseek-ai/dsh web'" />
          <p class="note">{{ t('install.step3.cmdNote') }}</p>
          <p>{{ t('install.startP1') }}</p>
          <p>{{ t('install.startP2') }}</p>
          <p>{{ t('install.startP3') }}</p>
          <AppCopyCmd cmd="git clone https://github.com/deepseek-ai/deepseek-harness.git" />

          <p class="label">{{ t('install.step3.optionalTitle') }}</p>
          <p>{{ t('install.step3.optionalDesc') }}</p>
          <AppCopyCmd cmd="npm install -g @deepseek-ai/dsh" />
          <p class="note">{{ t('install.step3.optionalNote') }}</p>

          <p>{{ t('install.step3.result') }}</p>
          <pre class="output">http://127.0.0.1:3080</pre>

          <div class="checkpoint">
            <h3>{{ t('install.checkpoint3.title') }}</h3>
            <p>{{ t('install.checkpoint3.desc') }}</p>
          </div>
        </section>

        <!-- 第 4 步：装第一个插件 -->
        <section class="step-card" id="plugins">
          <div class="step-head">
            <span class="step-no">4</span>
            <h2>{{ t('install.step4.title') }}</h2>
          </div>
          <p>{{ t('install.step4.intro') }}</p>
          <p>{{ t('install.pluginP', { n: plugins.length }) }}</p>
          <AppCopyCmd cmd="dsh plugin add github:your-name/your-plugin" />
          <p class="note">{{ t('install.step4.cmdNote') }}</p>
          <NuxtLink class="btn green" :to="localePath('/plugins')">
            {{ t('install.step4.browse') }} →
          </NuxtLink>
        </section>

        <!-- FAQ -->
        <section class="step-card">
          <h2>{{ t('install.faqH') }}</h2>
          <div v-for="i in 5" :key="i" class="faq-item">
            <h3>{{ t(`install.faq.q${i}`) }}</h3>
            <p>{{ t(`install.faq.a${i}`) }}</p>
          </div>
        </section>

        <!-- 拼写 -->
        <section class="step-card">
          <h2>{{ t('install.typoH') }}</h2>
          <p>{{ t('install.typoP') }}</p>
        </section>

        <!-- 内链区：装好了去逛逛 -->
        <section class="next-links">
          <h2>{{ t('install.relatedH') }}</h2>
          <p>{{ t('install.next.sub') }}</p>
          <div class="next-grid">
            <NuxtLink class="next-card" :to="localePath('/plugins')">
              <h3>{{ t('install.next.plugins.title') }}</h3>
              <p>{{ t('install.next.plugins.desc') }}</p>
            </NuxtLink>
            <NuxtLink class="next-card" :to="localePath('/meme')">
              <h3>{{ t('install.next.meme.title') }}</h3>
              <p>{{ t('install.next.meme.desc') }}</p>
            </NuxtLink>
            <NuxtLink class="next-card" :to="localePath('/submit')">
              <h3>{{ t('install.next.submit.title') }}</h3>
              <p>{{ t('install.next.submit.desc') }}</p>
            </NuxtLink>
            <NuxtLink class="next-card" :to="localePath('/about')">
              <h3>{{ t('install.next.about.title') }}</h3>
              <p>{{ t('install.next.about.desc') }}</p>
            </NuxtLink>
            <NuxtLink class="next-card" :to="localePath('/plugins/dsh-web-ui')">
              <h3>{{ t('install.relatedWebUi') }}</h3>
              <p>{{ t('install.relatedGithub') }}</p>
            </NuxtLink>
          </div>
          <p class="note" style="margin-top:14px">
            <a href="https://github.com/deepseek-ai/deepseek-harness" target="_blank" rel="noopener">{{ t('install.relatedGithub') }} ↗</a>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
