<script setup lang="ts">
// DSH Dojo 假终端（B2）：纯前端模拟终端，学生敲命令看预设输出。
// 零后端、零第三方库，只在浏览器里跑，不会碰用户的电脑。
// SSR 安全三件套：整组件包 ClientOnly（服务端只出同外观静态壳）、
// localStorage 只在 onMounted / 事件回调里碰、无 window/document 顶层引用。
import type { TerminalCommand, TermTone } from '~/types/dojo-terminal'

interface TermLine {
  text: string
  // echo = 用户敲的命令行（渲染带 $ 提示符）；其余为输出行的色调
  tone: TermTone | 'echo'
}

const props = withDefaults(
  defineProps<{
    commands: TerminalCommand[]
    /** 命中任一即视为本课完成：string 按全等/前缀，RegExp 用 test */
    successMatches: (string | RegExp)[]
    /** 完成后写 localStorage['dsh-dojo-progress'][stepKey]=true，/dojo 首页进度条读同一个键 */
    stepKey: string
    /** 命令没命中任何条目时的提示文案 */
    hint: string
    /** 滚动区高度，默认 320px */
    height?: string
  }>(),
  { height: '320px' },
)

const INTRO: TermLine = {
  text: '模拟终端：输入命令后回车；↑ ↓ 键翻历史。',
  tone: 'faint',
}

const input = ref('')
const lines = ref<TermLine[]>([{ ...INTRO }])
const history = ref<string[]>([])
// -1 = 不在历史里（正在敲新命令）
const historyIndex = ref(-1)
// 剧情状态机（step-03 在用）：命令条目用 setFlag / when / notWhen 在这里攒状态
const flags = ref(new Set<string>())
// ask 等待态：上一条命令问了 y/n，接下来的输入被拦截、只认 y / n
const askPending = ref<TerminalCommand | null>(null)
// 带提问的命令答了 y 才算数，成功横幅要等到那时再弹
const pendingSuccess = ref(false)
// '' 无 / 'done' 刚完成 / 'saved' 之前就完成过（回访）
const banner = ref<'' | 'done' | 'saved'>('')

const bodyEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

onMounted(() => {
  // stepKey 为空（如 playground 练习场）：不参与进度，读也跳过
  if (!props.stepKey) return
  // 回访且已完成过：直接亮横幅（读进度也是客户端才做的事）
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    if (saved[props.stepKey] === true) banner.value = 'saved'
  } catch {
    // localStorage 被禁用或数据损坏：当作没做过
  }
})

function pushLine(text: string, tone: TermTone | 'echo' = 'plain') {
  lines.value.push({ text, tone })
}

function pushEcho(raw: string) {
  pushLine(raw, 'echo')
}

async function scrollBottom() {
  await nextTick()
  const el = bodyEl.value
  if (el) el.scrollTop = el.scrollHeight
}

function isMatch(cmd: string, entry: TerminalCommand): boolean {
  if (entry.when && !flags.value.has(entry.when)) return false
  if (entry.notWhen && flags.value.has(entry.notWhen)) return false
  if (typeof entry.match === 'string') {
    return cmd === entry.match || (!entry.exact && cmd.startsWith(entry.match))
  }
  return entry.match.test(cmd)
}

function findEntry(cmd: string): TerminalCommand | null {
  for (const entry of props.commands) {
    if (isMatch(cmd, entry)) return entry
  }
  return null
}

function isSuccess(cmd: string): boolean {
  return props.successMatches.some((m) =>
    typeof m === 'string' ? cmd === m || cmd.startsWith(m) : m.test(cmd),
  )
}

function printOutput(entry: TerminalCommand) {
  const out = typeof entry.output === 'string' ? [entry.output] : entry.output
  if (!out.length) {
    // 真实终端无输出；淡灰一行说明「这是正常的」，新手最怕的其实是安静
    if (entry.emptyNote) pushLine(entry.emptyNote, 'faint')
    return
  }
  for (const item of out) {
    if (typeof item === 'string') pushLine(item, entry.kind ?? 'plain')
    else pushLine(item.text, item.kind ?? entry.kind ?? 'plain')
  }
}

function completeCheckpoint() {
  // stepKey 为空（如 playground 练习场）：不计进度、不落盘，也不亮「检查点完成」横幅
  if (!props.stepKey) return
  banner.value = 'done'
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    saved[props.stepKey] = true
    localStorage.setItem('dsh-dojo-progress', JSON.stringify(saved))
  } catch {
    // 存不进去（隐私模式等）就不存：横幅照给，别让进度问题挡住学习
  }
}

function answerAsk(cmd: string) {
  if (cmd === 'y') {
    const entry = askPending.value
    askPending.value = null
    if (entry) printOutput(entry)
    if (pendingSuccess.value) completeCheckpoint()
    pendingSuccess.value = false
  } else if (cmd === 'n') {
    askPending.value = null
    pendingSuccess.value = false
    pushLine('Operation aborted.', 'plain')
  } else {
    pushLine('Please answer with "y" or "n"', 'plain')
  }
}

function submit() {
  const raw = input.value
  const cmd = raw.trim()
  input.value = ''
  historyIndex.value = -1
  if (cmd && history.value[history.value.length - 1] !== cmd) history.value.push(cmd)

  if (askPending.value) {
    pushEcho(raw)
    answerAsk(cmd)
    scrollBottom()
    return
  }

  pushEcho(raw)
  if (!cmd) {
    scrollBottom()
    return
  }

  const entry = findEntry(cmd)
  if (!entry) {
    pushLine(`command not found: ${cmd}（提示：${props.hint}）`, 'err')
    scrollBottom()
    return
  }

  if (entry.setFlag) flags.value.add(entry.setFlag)
  // 条目可显式覆盖完成判定（step-02：同一条命令，报错那次不算过、装好后的那次才算）
  const success = entry.success ?? isSuccess(cmd)
  if (entry.ask) {
    pushLine(entry.ask, 'plain')
    askPending.value = entry
    pendingSuccess.value = success
    scrollBottom()
    return
  }

  printOutput(entry)
  if (success) completeCheckpoint()
  scrollBottom()
}

function clearScreen() {
  lines.value = [{ ...INTRO }]
  historyIndex.value = -1
  // flags / askPending 不动：清屏只是清屏，剧情状态（进程杀没杀）不该回滚
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp') {
    if (!history.value.length) return
    e.preventDefault()
    historyIndex.value =
      historyIndex.value === -1 ? history.value.length - 1 : Math.max(0, historyIndex.value - 1)
    input.value = history.value[historyIndex.value] ?? ''
  } else if (e.key === 'ArrowDown' && historyIndex.value !== -1) {
    e.preventDefault()
    historyIndex.value += 1
    if (historyIndex.value >= history.value.length) {
      historyIndex.value = -1
      input.value = ''
    } else {
      input.value = history.value[historyIndex.value] ?? ''
    }
  }
}

function focusInput() {
  // 用户正在选中输出文本准备复制时别抢焦点
  const sel = window.getSelection()
  if (sel && sel.toString()) return
  inputEl.value?.focus()
}
</script>

<template>
  <ClientOnly>
    <div class="dojo-term">
      <div class="dojo-term-head">
        <span class="dojo-term-dots" aria-hidden="true"><i /><i /><i /></span>
        <span class="dojo-term-title">终端 · 模拟练习（不会碰你的电脑）</span>
        <button type="button" class="dojo-term-clear" @click="clearScreen">清屏</button>
      </div>

      <div
        ref="bodyEl"
        class="dojo-term-body"
        :style="{ height }"
        aria-live="polite"
        @click="focusInput"
      >
        <p
          v-for="(line, i) in lines"
          :key="i"
          class="dojo-term-line"
          :class="`dojo-term-line--${line.tone}`"
        >
          <template v-if="line.tone === 'echo'">
            <span class="dojo-term-prompt" aria-hidden="true">$</span>{{ line.text }}
          </template>
          <template v-else>{{ line.text }}</template>
        </p>
      </div>

      <form class="dojo-term-input-row" @submit.prevent="submit">
        <span class="dojo-term-prompt" aria-hidden="true">$</span>
        <input
          ref="inputEl"
          v-model="input"
          class="dojo-term-input"
          type="text"
          :aria-label="`模拟终端输入框（提示：${hint}）`"
          :placeholder="askPending ? '输入 y 回车继续，n 放弃' : hint"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          @keydown="onKeydown"
        />
      </form>

      <div v-if="banner" class="dojo-term-banner" role="status">
        {{ banner === 'saved' ? '✓ 本课之前已完成，进度存在本机浏览器里' : '✓ 检查点完成！进度已保存' }}
      </div>
    </div>

    <template #fallback>
      <!-- SSR 静态壳：同外观、内容为空，避免 hydration mismatch -->
      <div class="dojo-term">
        <div class="dojo-term-head">
          <span class="dojo-term-dots" aria-hidden="true"><i /><i /><i /></span>
          <span class="dojo-term-title">终端 · 模拟练习（不会碰你的电脑）</span>
        </div>
        <div class="dojo-term-body" :style="{ height }"></div>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.dojo-term {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--dojo-radius-lg);
  background: var(--dojo-term-bg, rgba(0, 0, 0, 0.05));
  overflow: hidden;
  font-family: var(--dojo-font-mono);
}

.dojo-term-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.03);
}
.dojo-term-dots {
  display: inline-flex;
  gap: 6px;
}
.dojo-term-dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.15);
}
.dojo-term-title {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-family: var(--dojo-font-body);
  font-size: 12px;
  color: var(--dojo-text-desc);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dojo-term-clear {
  border: none;
  background: none;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: var(--dojo-font-body);
  font-size: 12px;
  color: var(--dojo-text-desc);
  cursor: pointer;
}
.dojo-term-clear:hover,
.dojo-term-clear:focus-visible {
  color: var(--dojo-brand-deep);
  background: rgba(0, 0, 0, 0.05);
}

.dojo-term-body {
  padding: 12px 14px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.75;
  cursor: text;
}
.dojo-term-line {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dojo-text-primary);
}
.dojo-term-line--err {
  color: var(--dojo-error);
}
.dojo-term-line--warn {
  color: #b45309;
}
.dojo-term-line--faint {
  color: rgba(0, 0, 0, 0.45);
}
.dojo-term-prompt {
  margin-right: 8px;
  color: var(--dojo-brand);
  font-weight: 700;
  user-select: none;
}

.dojo-term-input-row {
  display: flex;
  align-items: center;
  padding: 10px 14px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 13px;
}
.dojo-term-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--dojo-font-mono);
  font-size: 13px;
  color: var(--dojo-text-primary);
  caret-color: var(--dojo-brand);
}
.dojo-term-input::placeholder {
  color: rgba(0, 0, 0, 0.35);
  font-family: var(--dojo-font-body);
  font-size: 12.5px;
}

.dojo-term-banner {
  margin: 0 12px 12px;
  padding: 8px 12px;
  border-radius: var(--dojo-radius);
  border: 1px solid rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  font-family: var(--dojo-font-body);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

/* 移动端:iOS 聚焦 <16px 输入框自动放大不回弹(道场核心交互,必守 16px);清屏钮触控加大 */
@media (max-width: 640px) {
  .dojo-term-input { font-size: 16px; }
  .dojo-term-clear { padding: 8px 10px; min-height: 32px; }
}

</style>
