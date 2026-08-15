<script setup lang="ts">
const { t, locale } = useI18n()
const config = useRuntimeConfig()

const repoUrl = ref('')
const oneLiner = ref('')
const category = ref('')
const screenshot = ref('')

const { categories } = usePlugins()
const cats = computed(() => categories(locale.value))

const issueTitle = computed(() =>
  `[Submission] ${repoUrl.value.replace(/^https:\/\/github\.com\//i, '') || 'plugin'}`)

const issueBody = computed(() => [
  '### Plugin submission',
  '',
  `- **Repo**: ${repoUrl.value || '_(please fill)_ '}`,
  `- **One-liner**: ${oneLiner.value || '_(please fill)_ '}`,
  `- **Category**: ${category.value || '_(pick one)_ '}`,
  `- **Screenshot**: ${screenshot.value || '—'}`,
  '',
  '<!-- 一句话介绍请用自己的话写；有精选截图会优先排进整活精选。Thanks! -->',
].join('\n'))

const issueUrl = computed(() => {
  const repo = config.public.githubRepo as string
  return `https://github.com/${repo}/issues/new`
    + `?title=${encodeURIComponent(issueTitle.value)}`
    + `&body=${encodeURIComponent(issueBody.value)}`
})

const title = locale.value === 'zh' ? '投稿插件 — DSH Meme Hub' : 'Submit a Plugin — DSH Meme Hub'
useHead({
  title,
  meta: [{
    name: 'description',
    content: locale.value === 'zh'
      ? '给 DSH Meme Hub 投稿一个 dsh 插件：填仓库地址和一句话介绍，生成预填 issue，人工审核后收录。'
      : 'Submit a dsh plugin to DSH Meme Hub: fill in the repo URL and a one-liner, open a pre-filled issue, and we review it by hand.',
  }],
})
</script>

<template>
  <div class="container">
    <div class="page-head" style="text-align:center">
      <h1>{{ t('submit.title') }}</h1>
      <p class="sub" style="margin:0 auto">{{ t('submit.sub') }}</p>
    </div>

    <div class="form-card">
      <label>{{ t('submit.repoUrl') }} <span class="req">*</span></label>
      <input v-model="repoUrl" type="url" placeholder="https://github.com/you/your-dsh-plugin" required>

      <label>{{ t('submit.oneLiner') }} <span class="req">*</span></label>
      <input v-model="oneLiner" type="text" maxlength="200" :placeholder="locale === 'zh' ? '一句话说清它干了啥、为什么好笑/好用' : 'One line: what it does, and why it is great (or hilarious)'">

      <label>{{ t('submit.category') }}</label>
      <select v-model="category">
        <option value="">—</option>
        <option v-for="c in cats" :key="c.key" :value="c.label">{{ c.emoji }} {{ c.label }}</option>
      </select>

      <label>{{ t('submit.screenshot') }}</label>
      <input v-model="screenshot" type="url" placeholder="https://...">
      <p class="hint">{{ t('submit.screenshotHint') }}</p>

      <div style="margin-top:22px">
        <div class="lang-label" style="margin-bottom:8px">{{ t('submit.generate') }}</div>
        <div class="issue-preview">{{ issueBody }}</div>
      </div>

      <div style="margin-top:18px">
        <a
          class="btn green" :href="issueUrl" target="_blank" rel="noopener"
          :aria-disabled="!repoUrl || !oneLiner"
          :style="(!repoUrl || !oneLiner) ? 'opacity:0.5;pointer-events:none' : ''"
        >{{ t('submit.openIssue') }}</a>
      </div>

      <p class="hint" style="margin-top:16px">{{ t('submit.hint') }}</p>
    </div>
  </div>
</template>
