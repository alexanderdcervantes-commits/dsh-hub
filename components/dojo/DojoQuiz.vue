<script setup lang="ts">
// DSH Dojo 检查点测验（B3）：单选题、每题提交即判、提交后锁定（可重看不可改）。
// 纯客户端状态，整组件包 ClientOnly；localStorage 只在提交回调里碰（try/catch）。
import type { QuizQuestion } from '~/types/dojo-quiz'

const props = defineProps<{
  questions: QuizQuestion[]
  /** 可选：全部答对后写 localStorage['dsh-dojo-progress'][storageKey]=true（附加键） */
  storageKey?: string
}>()

// null = 还没选
const selections = ref<(number | null)[]>(props.questions.map(() => null))
const submitted = ref<boolean[]>(props.questions.map(() => false))

const correctCount = computed(
  () =>
    props.questions.filter((q, i) => submitted.value[i] && selections.value[i] === q.answer).length,
)
const allSubmitted = computed(
  () => props.questions.length > 0 && submitted.value.every(Boolean),
)
const allCorrect = computed(() => allSubmitted.value && correctCount.value === props.questions.length)

function saveProgress() {
  if (!props.storageKey) return
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    saved[props.storageKey] = true
    localStorage.setItem('dsh-dojo-progress', JSON.stringify(saved))
  } catch {
    // 存不进去（隐私模式等）就不存：横幅照给，别让进度问题挡住学习
  }
}

function submitQuestion(i: number) {
  if (submitted.value[i] || selections.value[i] === null) return
  submitted.value[i] = true
  if (allCorrect.value) saveProgress()
}

function isCorrect(i: number): boolean {
  return selections.value[i] === props.questions[i]!.answer
}
</script>

<template>
  <ClientOnly>
    <div class="dojo-quiz">
      <div class="dojo-quiz-head">
        <span class="dojo-quiz-title">检查点测验</span>
        <span class="dojo-quiz-score" aria-live="polite">
          答对 <b>{{ correctCount }}</b> / {{ questions.length }}
        </span>
      </div>

      <div v-for="(q, i) in questions" :key="i" class="dojo-card dojo-quiz-card">
        <p class="dojo-quiz-q">{{ i + 1 }}. {{ q.q }}</p>

        <div class="dojo-quiz-options" role="radiogroup" :aria-label="`第 ${i + 1} 题`">
          <label
            v-for="(opt, j) in q.options"
            :key="j"
            class="dojo-quiz-option"
            :class="{
              'dojo-quiz-option--selected': selections[i] === j,
              'dojo-quiz-option--right': submitted[i] && j === q.answer,
              'dojo-quiz-option--wrong': submitted[i] && selections[i] === j && j !== q.answer,
            }"
          >
            <input
              v-model="selections[i]"
              class="dojo-quiz-radio-input"
              type="radio"
              :name="`dojo-quiz-q${i}`"
              :value="j"
              :disabled="submitted[i]"
            />
            <span class="dojo-quiz-radio" aria-hidden="true"></span>
            <span class="dojo-quiz-option-text">{{ opt }}</span>
          </label>
        </div>

        <div class="dojo-quiz-foot">
          <button
            v-if="!submitted[i]"
            type="button"
            class="dojo-quiz-submit"
            :disabled="selections[i] === null"
            @click="submitQuestion(i)"
          >
            提交
          </button>
          <p v-else class="dojo-quiz-verdict" :class="isCorrect(i) ? 'dojo-quiz-verdict--ok' : 'dojo-quiz-verdict--bad'">
            <template v-if="isCorrect(i)">✓ 答对了</template>
            <template v-else>✗ 不对。正确答案：{{ q.options[q.answer] }}</template>
          </p>
        </div>

        <div v-if="submitted[i]" class="dojo-quiz-explain">
          <span class="dojo-quiz-explain-tag">为什么</span>
          <span>{{ q.explain }}</span>
        </div>
      </div>

      <div v-if="allCorrect" class="dojo-quiz-banner" role="status">✓ 检查点测验全部通过！</div>
      <div v-else-if="allSubmitted" class="dojo-quiz-banner dojo-quiz-banner--bad" role="status">
        有错题——读完解释再想想，实际教程里都讲过。
      </div>
    </div>

    <template #fallback>
      <!-- SSR 静态壳：同外观、内容为空，避免 hydration mismatch -->
      <div class="dojo-quiz">
        <div class="dojo-quiz-head">
          <span class="dojo-quiz-title">检查点测验</span>
        </div>
        <div class="dojo-card dojo-quiz-card"></div>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.dojo-quiz {
  margin-top: 18px;
}

.dojo-quiz-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.dojo-quiz-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--dojo-text-primary);
}
.dojo-quiz-score {
  font-size: 13px;
  color: var(--dojo-text-desc);
}
.dojo-quiz-score b {
  color: var(--dojo-brand-deep);
  font-family: var(--dojo-font-mono);
}

.dojo-quiz-card {
  padding: 16px 18px 18px;
}
.dojo-quiz-card + .dojo-quiz-card {
  margin-top: 12px;
}
.dojo-quiz-q {
  margin: 0 0 12px;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.75;
  color: var(--dojo-text-primary);
}

/* ---------- 选项：真 radio 藏起来，画自定义圈 ---------- */
.dojo-quiz-options {
  display: grid;
  gap: 8px;
}
.dojo-quiz-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--dojo-radius);
  background: #fff;
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease;
}
.dojo-quiz-option:hover {
  border-color: rgba(9, 45, 78, 0.3);
}
.dojo-quiz-option--selected {
  border-color: var(--dojo-brand);
  background: var(--dojo-brand-50);
}
/* 提交后判色压过选中态 */
.dojo-quiz-option--right {
  border-color: rgba(34, 197, 94, 0.55);
  background: rgba(34, 197, 94, 0.08);
}
.dojo-quiz-option--wrong {
  border-color: rgba(236, 19, 22, 0.45);
  background: rgba(236, 19, 22, 0.05);
}
/* 锁定后禁手型，但保留文字可读 */
.dojo-quiz-option:has(input:disabled) {
  cursor: default;
}

.dojo-quiz-radio-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  overflow: hidden;
  white-space: nowrap;
}
.dojo-quiz-radio {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border: 1.5px solid rgba(0, 0, 0, 0.25);
  border-radius: 50%;
  background: #fff;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}
/* 选中：品牌蓝圈 + 内芯 */
.dojo-quiz-option--selected .dojo-quiz-radio {
  border-color: var(--dojo-brand);
  box-shadow: inset 0 0 0 3.5px #fff, inset 0 0 0 16px var(--dojo-brand);
}
.dojo-quiz-option--right .dojo-quiz-radio {
  border-color: var(--dojo-success);
  box-shadow: inset 0 0 0 3.5px #fff, inset 0 0 0 16px var(--dojo-success);
}
.dojo-quiz-option--wrong .dojo-quiz-radio {
  border-color: var(--dojo-error);
  box-shadow: inset 0 0 0 3.5px #fff, inset 0 0 0 16px var(--dojo-error);
}
/* 键盘可达：焦点环画在自定义圈上 */
.dojo-quiz-radio-input:focus-visible + .dojo-quiz-radio {
  outline: 2px solid var(--dojo-brand);
  outline-offset: 2px;
}

.dojo-quiz-option-text {
  font-size: 14px;
  line-height: 1.65;
  color: var(--dojo-text-secondary);
}

/* ---------- 提交 / 判分 ---------- */
.dojo-quiz-foot {
  margin-top: 12px;
}
.dojo-quiz-submit {
  padding: 8px 22px;
  border: 1px solid transparent;
  border-radius: var(--dojo-radius);
  background: var(--dojo-btn-dark);
  font-family: var(--dojo-font-body);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.05s ease;
}
.dojo-quiz-submit:hover:not(:disabled),
.dojo-quiz-submit:focus-visible:not(:disabled) {
  background: var(--dojo-btn-dark-hover);
}
.dojo-quiz-submit:active:not(:disabled) {
  transform: scale(0.98);
}
.dojo-quiz-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dojo-quiz-verdict {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.7;
}
.dojo-quiz-verdict--ok {
  color: #15803d;
}
.dojo-quiz-verdict--bad {
  color: var(--dojo-error);
}

.dojo-quiz-explain {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: var(--dojo-radius);
  background: rgba(0, 0, 0, 0.035);
  font-size: 13px;
  line-height: 1.75;
  color: var(--dojo-text-secondary);
}
.dojo-quiz-explain-tag {
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--dojo-text-desc);
}

/* ---------- 底部横幅 ---------- */
.dojo-quiz-banner {
  margin-top: 14px;
  padding: 12px 16px;
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: var(--dojo-radius);
  background: rgba(34, 197, 94, 0.1);
  font-size: 14px;
  font-weight: 700;
  color: #15803d;
}
.dojo-quiz-banner--bad {
  border-color: rgba(236, 19, 22, 0.3);
  background: rgba(236, 19, 22, 0.05);
  color: var(--dojo-error);
}

/* 移动端:连点四题的提交/选项行加大触控 */
@media (max-width: 640px) {
  .dojo-quiz-submit { padding: 12px 24px; min-height: 44px; }
  .dojo-quiz-option { padding: 12px; }
}

</style>
