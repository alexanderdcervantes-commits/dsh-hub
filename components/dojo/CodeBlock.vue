<script setup lang="ts">
// Dojo 教程代码块：等宽展示 + 一键复制。教程的工作流就是「整段复制粘进终端」，
// 复制按钮是刚需。clipboard 只在点击回调里碰，SSR 安全。
const props = defineProps<{ code: string; label?: string }>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
  } catch {
    // 非安全上下文（http）降级：临时 textarea + execCommand
    const ta = document.createElement('textarea')
    ta.value = props.code
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1600)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <figure class="dojo-code">
    <figcaption class="dojo-code-head">
      <span>{{ label ?? '整段复制，粘进终端按回车' }}</span>
      <button type="button" class="dojo-code-copy" @click="copy">
        {{ copied ? '✓ 已复制' : '复制' }}
      </button>
    </figcaption>
    <pre class="dojo-code-pre"><code>{{ code }}</code></pre>
  </figure>
</template>

<style scoped>
.dojo-code {
  margin: 12px 0 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--dojo-radius);
  background: var(--dojo-term-bg, rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.dojo-code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 8px 7px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-family: var(--dojo-font-body);
  font-size: 12px;
  color: var(--dojo-text-desc);
}
.dojo-code-copy {
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: var(--dojo-font-body);
  font-size: 12px;
  color: var(--dojo-text-desc);
  cursor: pointer;
}
.dojo-code-copy:hover,
.dojo-code-copy:focus-visible {
  color: var(--dojo-brand-deep);
  background: rgba(0, 0, 0, 0.05);
}
.dojo-code-pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  font-family: var(--dojo-font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--dojo-text-primary);
}
.dojo-code-pre code {
  font-family: inherit;
  white-space: pre;
}

/* 移动端:命令允许换行(复制内容取 props.code 不受影响);复制钮是道场高频主操作,加大 */
@media (max-width: 640px) {
  .dojo-code-pre code { white-space: pre-wrap; overflow-wrap: anywhere; }
  .dojo-code-copy { padding: 8px 12px; min-height: 32px; }
}

</style>
