<script setup lang="ts">
// 插件详情页「仓库 README」区块:构建期用 import.meta.glob 收集 public/readmes/*.md 的
// 懒加载映射(内容按需取 chunk,不进主包),运行时按 slug 取正文渲染 GitHub 风格 markdown。
//
// 渲染链:md 原文 → markdown-it(html: true,README 里的表格/内联 HTML 需要它)→
// DOMPurify 消毒(默认 profile 已放行表格/图片/代码块/details 等 GitHub 常用标签,
// 显式再钉死 iframe/script/style)→ 给所有 <img> 补懒加载与 no-referrer → v-html。
//
// SSR/预渲染安全:DOMPurify 依赖真实 DOM,服务端 isSupported=false 时 html 恒为空串,
// 服务端输出与客户端水合前状态一致(整块不渲染),无 hydration mismatch;
// 正文在客户端 onMounted 取到数据后才出现。
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const props = defineProps<{ slug: string }>()

// 只收「路径 → 动态 import」映射,内容仍按需加载;目录为空/不存在时是空对象
const readmeModules = import.meta.glob('/public/readmes/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>

const { t } = useI18n()
const md = new MarkdownIt({ html: true })
const raw = ref('')

onMounted(async () => {
  const load = readmeModules[`/public/readmes/${props.slug}.md`]
  if (load) raw.value = await load()
})

// 显式钉死危险标签(默认 profile 本就不放行,双保险);style 属性一并去掉,对齐 GitHub 渲染策略
const SANITIZE_CFG = { FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'], FORBID_ATTR: ['style'] }

const html = computed(() => {
  if (!raw.value || !DOMPurify.isSupported) return ''
  return decorateImgs(DOMPurify.sanitize(md.render(raw.value), SANITIZE_CFG))
})

/** 消毒后的正文里所有 <img> 补懒加载与防 referer(走 DOMParser,不做字符串替换) */
function decorateImgs(safeHtml: string): string {
  const doc = new DOMParser().parseFromString(safeHtml, 'text/html')
  for (const img of doc.querySelectorAll('img')) {
    img.setAttribute('loading', 'lazy')
    img.setAttribute('referrerpolicy', 'no-referrer')
  }
  return doc.body.innerHTML
}
</script>

<template>
  <section v-if="html" class="readme-section section">
    <div class="section-head"><h2>{{ t('plugin.readmeTitle') }}</h2></div>
    <div class="markdown-body" v-html="html" />
  </section>
</template>
