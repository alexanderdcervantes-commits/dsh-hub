<script setup lang="ts">
// DSH Dojo 生命周期对比实验（B6）：删掉技能 → 不重启 → 观察反应；放回技能 → 再观察。
// 教学重点是让学生亲眼看到「文件在不在决定功能在不在，全程无重启」——
// 所以状态条右上角的「DSH 运行中 · 未重启」标记永远不变，切换状态时只是闪一下强调它。
// 轨迹文案逐字照抄教程第 8 步在真实 DSH 里看到的样子。
// 零后端纯前端：skillExists 只活在本组件内存里；
// localStorage 只在两个状态都看过之后写一次 step8（读-改-写，try/catch）。
const props = withDefaults(
  defineProps<{
    /** 两种反应都看过之后写 localStorage['dsh-dojo-progress'][stepKey]=true */
    stepKey?: string
  }>(),
  { stepKey: 'step8' },
)

interface TraceLine {
  text: string
  // true = 红色高亮（删除后的 Read 报错行——整场实验的主角）
  hot?: boolean
}

// skillExists=true 的轨迹：第 7 步结尾看到的那四行灰字
const EXISTS_TRACE: TraceLine[] = [
  { text: 'Context injection · skill-catalog' },
  { text: 'Think · matches the hello-dsh skill' },
  { text: 'Skill · hello-dsh' },
  { text: 'Read · /Users/you/.dsh/skills/hello-dsh/SKILL.md' },
]

// skillExists=false 的轨迹：同一个问题，文件没了之后的反应
const REMOVED_TRACE: TraceLine[] = [
  { text: 'Context injection · skill-catalog' },
  { text: 'Read · Error: cannot read ".../hello-dsh/SKILL.md": not found', hot: true },
  { text: 'Think · The skill catalog is now empty' },
]

const RM_CMD = 'rm -rf ~/.dsh/skills/hello-dsh'
const CAT_CMD = "cat > ~/.dsh/skills/hello-dsh/SKILL.md <<'EOF'"
// 网页输入框里预置的那句话（不用真敲）
const HELLO_INPUT = 'hello dsh'

// 初始 = 第 7 步结束时的状态：技能在
const skillExists = ref(true)
// 完成判定：初始状态是白给的，不算「看过」——必须亲手删一次、再放回一次，
// 两种反应都亲眼看到（对应检查点 8 的两条）才算过
const seenRemoved = ref(false)
const seenRestored = ref(false)
const saved = ref(false)

// 切换瞬间的「未重启」闪光：加类 600ms 再摘掉（transition 平滑来回）
const flashing = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | undefined

const activeTrace = computed(() => (skillExists.value ? EXISTS_TRACE : REMOVED_TRACE))
// 轨迹逐行浮现的节奏；回答气泡排在最后一行之后
const STAGGER_MS = 110
function lineDelay(i: number): string {
  return `${(i + 1) * STAGGER_MS}ms`
}
const bubbleDelay = computed(() => `${(activeTrace.value.length + 1) * STAGGER_MS}ms`)

function flashRunning() {
  flashing.value = true
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => (flashing.value = false), 600)
}

function saveProgress() {
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const progress = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    progress[props.stepKey] = true
    localStorage.setItem('dsh-dojo-progress', JSON.stringify(progress))
  } catch {
    // 存不进去（隐私模式等）就不存：实验照玩，别让进度问题挡住学习
  }
}

function completeIfBothSeen() {
  if (seenRemoved.value && seenRestored.value && !saved.value) {
    saved.value = true
    saveProgress()
  }
}

function removeSkill() {
  if (!skillExists.value) return
  skillExists.value = false
  seenRemoved.value = true
  flashRunning()
  completeIfBothSeen()
}

function restoreSkill() {
  if (skillExists.value) return
  skillExists.value = true
  seenRestored.value = true
  flashRunning()
  completeIfBothSeen()
}

onMounted(() => {
  // 回访且已完成过：直接亮已保存提示（读进度也是客户端才做的事）
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const progress = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    if (progress[props.stepKey] === true) saved.value = true
  } catch {
    // localStorage 被禁用或数据损坏：当作没做过
  }
})

onBeforeUnmount(() => clearTimeout(flashTimer))
</script>

<template>
  <ClientOnly>
    <div class="dojo-lc">
      <!-- 状态条：左边技能在不在，右边「没重启」——全程不变的那个标记 -->
      <div class="dojo-lc-status">
        <span
          class="dojo-lc-pill"
          :class="skillExists ? 'dojo-lc-pill--ok' : 'dojo-lc-pill--gone'"
          role="status"
        >
          <i class="dojo-lc-dot" aria-hidden="true" />
          hello-dsh：{{ skillExists ? '存在' : '已删除' }}
        </span>
        <span
          class="dojo-lc-pill dojo-lc-pill--running"
          :class="{ 'dojo-lc-pill--flash': flashing }"
        >
          <i class="dojo-lc-dot dojo-lc-dot--brand" aria-hidden="true" />
          DSH 运行中 · 未重启
        </span>
      </div>

      <!-- 两个操作：删掉 / 放回。当前状态对应的按钮不可点 -->
      <div class="dojo-lc-actions">
        <button type="button" class="dojo-btn-danger" :disabled="!skillExists" @click="removeSkill">
          删除技能 <code>rm -rf</code>
        </button>
        <button
          type="button"
          class="dojo-btn-secondary"
          :disabled="skillExists"
          @click="restoreSkill"
        >
          放回技能 <code>cat &gt;</code>
        </button>
      </div>

      <!-- DSH 网页对话框模拟：预置的输入 → 灰字轨迹 → 模型回答 -->
      <div class="dojo-card dojo-lc-chat">
        <div class="dojo-lc-chat-head">
          <span class="dojo-lc-chat-title">DSH 网页对话框</span>
          <span class="dojo-lc-chat-tag">对话模拟 · 只在你浏览器里跑</span>
        </div>

        <div class="dojo-lc-chat-body">
          <!-- 预置的输入行：不用真敲，问的还是那句 hello dsh -->
          <div class="dojo-lc-input-row">
            <span class="dojo-lc-input-text">{{ HELLO_INPUT }}</span>
            <span class="dojo-lc-send" aria-hidden="true">发送</span>
          </div>

          <Transition name="dojo-lc-swap" mode="out-in">
            <div :key="skillExists ? 'exists' : 'removed'" class="dojo-lc-turn">
              <p
                v-for="(line, i) in activeTrace"
                :key="line.text"
                class="dojo-lc-trace-line"
                :class="{ 'dojo-lc-trace-line--hot': line.hot }"
                :style="{ animationDelay: lineDelay(i) }"
              >
                {{ line.text }}
              </p>

              <div class="dojo-lc-answer" :style="{ animationDelay: bubbleDelay }">
                <span class="dojo-lc-answer-who">DSH</span>
                <template v-if="skillExists">
                  <p class="dojo-lc-answer-secret">HELLO DSH — 这句话来自我电脑上的一个文件</p>
                  <p class="dojo-lc-answer-note">
                    这句话不在我的训练数据里，是刚才从本地文件读到的。
                  </p>
                </template>
                <p v-else class="dojo-lc-answer-p">
                  所以这次我没法再从本地文件读出那句暗号了 ——
                  如果我现在把「HELLO DSH — 这句话来自我电脑上的一个文件」再输出一遍，那就会是凭记忆复述而不是读自本地文件，那样就不诚实了。
                </p>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 结论：整份教程最想让学生带走的一句话 -->
      <div class="dojo-callout dojo-lc-conclusion">
        <b>文件出现，功能就在；文件消失，功能就没了。</b>中间没有任何重启、安装、注册的动作。对比：装浏览器插件要重启浏览器，装
        VSCode 扩展要重载窗口——DSH 不用。
      </div>

      <p v-if="saved" class="dojo-lc-saved" role="status">
        ✓ 检查点完成——进度存在本机浏览器里
      </p>
      <p v-else-if="seenRemoved" class="dojo-lc-saved">
        已看到删除后的反应——再把技能放回去，看看另一种
      </p>
    </div>

    <template #fallback>
      <!-- SSR 静态壳：同外观、内容为空，避免 hydration mismatch -->
      <div class="dojo-lc">
        <div class="dojo-lc-status">
          <span class="dojo-lc-pill dojo-lc-pill--ok">
            <i class="dojo-lc-dot" aria-hidden="true" />
            hello-dsh：存在
          </span>
          <span class="dojo-lc-pill dojo-lc-pill--running">
            <i class="dojo-lc-dot dojo-lc-dot--brand" aria-hidden="true" />
            DSH 运行中 · 未重启
          </span>
        </div>
        <div class="dojo-lc-actions">
          <button type="button" class="dojo-btn-danger" disabled>删除技能 <code>rm -rf</code></button>
          <button type="button" class="dojo-btn-secondary" disabled>放回技能 <code>cat &gt;</code></button>
        </div>
        <div class="dojo-card dojo-lc-chat">
          <div class="dojo-lc-chat-head">
            <span class="dojo-lc-chat-title">DSH 网页对话框</span>
            <span class="dojo-lc-chat-tag">对话模拟 · 只在你浏览器里跑</span>
          </div>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.dojo-lc {
  margin: 18px 0 0;
}

/* ---------- 状态条：技能徽标 + 永不变的「未重启」标记 ---------- */
.dojo-lc-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.dojo-lc-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  font-family: var(--dojo-font-mono);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--dojo-text-primary);
}
.dojo-lc-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
}
.dojo-lc-pill--ok {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.08);
  color: #15803d;
}
.dojo-lc-pill--ok .dojo-lc-dot {
  background: var(--dojo-success);
}
.dojo-lc-pill--gone {
  border-color: rgba(236, 19, 22, 0.35);
  background: rgba(236, 19, 22, 0.05);
  color: var(--dojo-error);
}
.dojo-lc-pill--gone .dojo-lc-dot {
  background: rgba(0, 0, 0, 0.35);
}
/* 「DSH 运行中 · 未重启」：品牌蓝，全程不变；切换状态时闪光强调 */
.dojo-lc-pill--running {
  border-color: var(--dojo-brand-100);
  background: var(--dojo-brand-50);
  color: var(--dojo-brand-deep);
  transition: box-shadow 0.25s ease, transform 0.25s ease, background 0.25s ease;
}
.dojo-lc-dot--brand {
  background: var(--dojo-brand);
}
.dojo-lc-pill--flash {
  background: var(--dojo-brand-100);
  box-shadow: 0 0 0 5px rgba(77, 107, 254, 0.22);
  transform: scale(1.06);
}

/* ---------- 操作按钮行 ---------- */
.dojo-lc-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.dojo-lc-actions code {
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.06);
  font-family: var(--dojo-font-mono);
  font-size: 0.85em;
}

/* ---------- 对话框模拟区 ---------- */
.dojo-lc-chat {
  overflow: hidden;
}
.dojo-lc-chat-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.dojo-lc-chat-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--dojo-text-primary);
}
.dojo-lc-chat-tag {
  font-size: 11.5px;
  color: var(--dojo-text-desc);
  white-space: nowrap;
}
.dojo-lc-chat-body {
  padding: 14px;
}

/* 预置的输入行：hello dsh 已填好 + 蓝色发送按钮 */
.dojo-lc-input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 999px;
  background: #fff;
}
.dojo-lc-input-text {
  font-family: var(--dojo-font-mono);
  font-size: 13px;
  color: var(--dojo-text-primary);
}
.dojo-lc-send {
  flex-shrink: 0;
  padding: 3px 12px;
  border-radius: 999px;
  background: var(--dojo-brand-500);
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

/* 灰字轨迹：逐行浮现（教学重点是「看着它一行行走出来」） */
.dojo-lc-trace-line {
  margin: 0;
  padding-top: 10px;
  font-family: var(--dojo-font-mono);
  font-size: 12px;
  line-height: 1.7;
  word-break: break-word;
  color: rgba(0, 0, 0, 0.48);
  animation: dojo-lc-line-in 0.32s ease both;
}
.dojo-lc-trace-line--hot {
  color: var(--dojo-error);
  font-weight: 700;
}
@keyframes dojo-lc-line-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 模型回答气泡：正常色（和灰字轨迹的对比就是教学点） */
.dojo-lc-answer {
  margin-top: 12px;
  padding: 11px 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--dojo-radius);
  background: var(--dojo-bg-page);
  animation: dojo-lc-line-in 0.32s ease both;
}
.dojo-lc-answer-who {
  display: block;
  margin-bottom: 4px;
  font-family: var(--dojo-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--dojo-brand-deep);
}
.dojo-lc-answer-secret {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.6;
  color: var(--dojo-text-primary);
}
.dojo-lc-answer-note {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--dojo-text-desc);
}
.dojo-lc-answer-p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--dojo-text-secondary);
}

/* 两种状态的整块切换：轻过渡 */
.dojo-lc-swap-enter-active,
.dojo-lc-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.dojo-lc-swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.dojo-lc-swap-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 动效弱化偏好：浮现动画全部关掉，切换只剩瞬切 */
@media (prefers-reduced-motion: reduce) {
  .dojo-lc-trace-line,
  .dojo-lc-answer {
    animation: none;
  }
  .dojo-lc-swap-enter-active,
  .dojo-lc-swap-leave-active,
  .dojo-lc-pill--running {
    transition: none;
  }
}

/* ---------- 结论与进度提示 ---------- */
.dojo-lc-conclusion {
  margin-top: 18px;
}
.dojo-lc-saved {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--dojo-text-desc);
}
</style>
