<script setup lang="ts">
// DSH Dojo 密钥配置模拟器（B3）：模拟 DSH 的 Settings → Models 页，
// 让学生亲手走一遍「粘密钥 → Save and continue → 绿点」。
// 零后端纯状态机：密钥值只活在本组件内存里，绝不持久化——
// localStorage 只写 step4 布尔（读-改-写），卸载即净。
// SSR 安全：整组件包 ClientOnly，localStorage 只在 onMounted / 事件回调里碰。
const props = withDefaults(
  defineProps<{
    /** 完成后写 localStorage['dsh-dojo-progress'][stepKey]=true */
    stepKey?: string
  }>(),
  { stepKey: 'step4' },
)

// DSH 源码里的真实报错，教学用，逐字照抄：
const MISSING_CREDENTIAL =
  'dsh: MISSING_CREDENTIAL: llm-deepseek: no API key for provider route "deepseek-official"; ' +
  'store DEEPSEEK_API_KEY through the credentials service (the web Models page writes it), ' +
  'or export DEEPSEEK_API_KEY in the launching environment'

type Feedback =
  | { kind: 'error'; intro: string; text: string }
  | { kind: 'warn'; text: string }
  | { kind: 'ok'; text: string; saved?: boolean }
  | { kind: 'later'; text: string }

const apiKey = ref('')
const showKey = ref(false)
// 状态点：灰 = 未配置，绿 = 已配置。只从灰变绿，不回退——检查点过了就是过了。
const configured = ref(false)
const feedback = ref<Feedback | null>(null)

onMounted(() => {
  // 回访且本课完成过：直接亮绿点 + 提示进度还在（读进度只在客户端做）
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    if (saved[props.stepKey] === true) {
      configured.value = true
      feedback.value = { kind: 'ok', text: '✓ 本课之前已完成，进度存在本机浏览器里', saved: true }
    }
  } catch {
    // localStorage 被禁用或数据损坏：当作没做过
  }
})

function onInput() {
  // 重新敲键盘时撤掉上次的报错/警告/稍后提示；成功态留着（绿点不灭）
  if (feedback.value && feedback.value.kind !== 'ok') feedback.value = null
}

function saveProgress() {
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    saved[props.stepKey] = true
    localStorage.setItem('dsh-dojo-progress', JSON.stringify(saved))
  } catch {
    // 存不进去（隐私模式等）就不存：绿点照给，别让进度问题挡住学习
  }
}

function save() {
  const key = apiKey.value
  if (key === '') {
    feedback.value = {
      kind: 'error',
      intro: '没配密钥时，DSH 一开口就是这个错——记住它的样子。',
      text: MISSING_CREDENTIAL,
    }
    return
  }
  if (!key.startsWith('sk-')) {
    feedback.value = { kind: 'warn', text: '密钥应以 sk- 开头，检查一下是不是复制完整了。' }
    return
  }
  if (/\s/.test(key)) {
    feedback.value = { kind: 'warn', text: '密钥中间不能有空格或换行，重新粘贴一次。' }
    return
  }
  if (key.length < 20) {
    feedback.value = { kind: 'warn', text: '太短了——真实密钥是 sk- 开头的一长串，检查是不是复制完整。' }
    return
  }
  configured.value = true
  feedback.value = { kind: 'ok', text: '✓ DeepSeek 已配置——看到右边这个绿点，第 4 步就算过了。' }
  saveProgress()
}

function configureLater() {
  feedback.value = {
    kind: 'later',
    text: '没关系，随时可以从 Settings → Models → DeepSeek 那行点 Edit 补上。',
  }
}
</script>

<template>
  <ClientOnly>
    <div class="dojo-config dojo-card">
      <div class="dojo-config-head">
        <span class="dojo-config-title">Settings → Models</span>
        <span class="dojo-config-tag">模拟面板 · 只在你浏览器里跑</span>
      </div>

      <div class="dojo-config-row">
        <span class="dojo-config-model">DeepSeek</span>
        <span
          class="dojo-config-dot"
          :class="{ 'dojo-config-dot--on': configured }"
          role="img"
          :aria-label="configured ? '已配置' : '未配置'"
        ></span>
      </div>

      <form class="dojo-config-form" @submit.prevent="save">
        <label class="dojo-config-label" for="dojo-config-key">API key</label>
        <div class="dojo-config-input-row">
          <input
            id="dojo-config-key"
            v-model="apiKey"
            class="dojo-config-input"
            :type="showKey ? 'text' : 'password'"
            placeholder="sk-..."
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            @input="onInput"
          />
          <button
            type="button"
            class="dojo-config-eye"
            :aria-label="showKey ? '隐藏密钥' : '显示密钥'"
            @click="showKey = !showKey"
          >
            {{ showKey ? '👁 隐藏' : '👁 显示' }}
          </button>
        </div>
        <p class="dojo-config-hint">形如 sk- 开头的一长串，只在创建时显示一次</p>

        <div class="dojo-config-actions">
          <button type="submit" class="dojo-btn-primary dojo-config-save">Save and continue</button>
          <button type="button" class="dojo-btn-secondary" @click="configureLater">
            Configure later
          </button>
        </div>
      </form>

      <!-- 报错 / 警告 / 成功 / 稍后，同一块反馈区一次只出一条 -->
      <div v-if="feedback" class="dojo-config-feedback" role="status">
        <template v-if="feedback.kind === 'error'">
          <p class="dojo-config-err-intro">{{ feedback.intro }}</p>
          <pre class="dojo-config-err-text"><code>{{ feedback.text }}</code></pre>
        </template>
        <p v-else-if="feedback.kind === 'warn'" class="dojo-config-warn">{{ feedback.text }}</p>
        <p v-else-if="feedback.kind === 'ok'" class="dojo-config-ok">{{ feedback.text }}</p>
        <p v-else class="dojo-config-later">{{ feedback.text }}</p>
      </div>

      <div class="dojo-callout dojo-config-safety">
        🔑 密钥等于你账户的钥匙：不要发给别人、不要贴到聊天群或代码里。
      </div>
    </div>

    <template #fallback>
      <!-- SSR 静态壳：同外观、内容为空，避免 hydration mismatch -->
      <div class="dojo-config dojo-card">
        <div class="dojo-config-head">
          <span class="dojo-config-title">Settings → Models</span>
        </div>
        <div class="dojo-config-row">
          <span class="dojo-config-model">DeepSeek</span>
          <span class="dojo-config-dot"></span>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.dojo-config {
  padding: 18px 20px 20px;
  margin-top: 18px;
}

.dojo-config-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.dojo-config-title {
  font-family: var(--dojo-font-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--dojo-text-primary);
}
.dojo-config-tag {
  font-family: var(--dojo-font-body);
  font-size: 11.5px;
  color: var(--dojo-text-desc);
  white-space: nowrap;
}

/* 模型行：名称 + 右侧状态点 */
.dojo-config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 2px 4px;
}
.dojo-config-model {
  font-size: 15px;
  font-weight: 600;
  color: var(--dojo-text-primary);
}
.dojo-config-dot {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.22); /* 灰点 = 未配置 */
  transition: background 0.2s ease;
}
.dojo-config-dot--on {
  background: var(--dojo-success);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
}

.dojo-config-form {
  margin-top: 6px;
}
.dojo-config-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--dojo-text-desc);
}
.dojo-config-input-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.dojo-config-input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: var(--dojo-radius);
  outline: none;
  background: #fff;
  font-family: var(--dojo-font-mono);
  font-size: 13px;
  color: var(--dojo-text-primary);
}
.dojo-config-input:focus-visible {
  border-color: var(--dojo-brand);
  box-shadow: 0 0 0 3px var(--dojo-brand-50);
}
.dojo-config-eye {
  flex-shrink: 0;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: var(--dojo-radius);
  background: #fff;
  font-family: var(--dojo-font-body);
  font-size: 12.5px;
  color: var(--dojo-text-desc);
  cursor: pointer;
}
.dojo-config-eye:hover,
.dojo-config-eye:focus-visible {
  color: var(--dojo-brand-deep);
  border-color: rgba(9, 45, 78, 0.38);
  background: var(--dojo-brand-50);
}

.dojo-config-hint {
  margin: 6px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--dojo-text-desc);
}

.dojo-config-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.dojo-config-save,
.dojo-config-actions .dojo-btn-secondary {
  padding: 10px 20px;
  font-size: 14px;
}

/* ---------- 反馈区 ---------- */
.dojo-config-feedback {
  margin-top: 16px;
}
.dojo-config-err-intro {
  margin: 0 0 8px;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.7;
  color: var(--dojo-text-primary);
}
.dojo-config-err-text {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgba(236, 19, 22, 0.35);
  border-radius: var(--dojo-radius);
  background: rgba(236, 19, 22, 0.06);
  overflow-x: auto;
  font-family: var(--dojo-font-mono);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dojo-error);
}
.dojo-config-warn,
.dojo-config-ok,
.dojo-config-later {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--dojo-radius);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.7;
}
.dojo-config-warn {
  border: 1px solid rgba(180, 83, 9, 0.35);
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
}
.dojo-config-ok {
  border: 1px solid rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
}
.dojo-config-later {
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.045);
  color: var(--dojo-text-secondary);
  font-weight: 500;
}

/* 安全警示：复用全局 .dojo-callout（--dojo-brand-50 底），只收紧边距 */
.dojo-config-safety {
  margin: 18px 0 0;
  font-size: 13px;
}
</style>
