<script setup lang="ts">
// 深色安装命令条 + 一键复制（截断提示走 toast）
const props = defineProps<{ cmd: string }>()
const { t } = useI18n()
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.cmd)
  }
  catch {
    // http 环境降级
    const ta = document.createElement('textarea')
    ta.value = props.cmd
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
  <div class="install-cmd">
    <span class="cmd"><span class="prompt">$</span>{{ cmd }}</span>
    <button class="copy-btn" :class="{ ok: copied }" @click="copy">
      {{ copied ? t('common.copied') : t('common.copy') }}
    </button>
  </div>
</template>
