<script setup lang="ts">
// DSH Dojo 技能编辑器（B4）：左侧手写 SKILL.md，右侧实时跑 DSH 的加载校验。
// 五条校验规则逐条对应 DSH 源码 packages/skill/skill-filesystem/src/index.ts，
// 告警原文（skill file SKILL.md ignored: …）逐字照抄——教学时要让学生看到真报错长什么样。
// 零后端纯前端：编辑内容只活在本组件内存里，不持久化；
// localStorage 只写 step7 布尔（读-改-写，try/catch）。整组件包 ClientOnly。
const props = withDefaults(
  defineProps<{
    /** 「加载示例」填入的全文（教程第 7 步的 SKILL.md，由页面传入，和上方代码块同源） */
    example: string
    /** 校验通过后写 localStorage['dsh-dojo-progress'][stepKey]=true */
    stepKey?: string
  }>(),
  { stepKey: 'step7' },
)

interface SkillIssue {
  // 'error' = DSH 源码硬规则（红，技能被忽略）；'hint' = 教学软提示（橙，DSH 照样收）
  kind: 'error' | 'hint'
  // 硬规则时为 DSH 源码告警原文；软提示时为教程建议
  text: string
  // 灰色小字解释
  explain?: string
  // 教学高亮框（驼峰陷阱这种「最难查的坑」用强调样式）
  hot?: boolean
}

// DSH 源码原样的 name 校验正则：严格 kebab-case（全小写字母/数字 + 单连字符分段）
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// 空编辑器的骨架提示（真正的换行要靠 JS 字符串字面量，静态 attribute 里的 \n 不会转义）
const PLACEHOLDER = `---
name: my-skill
description: 当……时使用
---

# 正文：告诉模型该怎么做`

const content = ref('')
// 本课完成判定就在这里：内容首次通过全部硬校验时写一次进度
const progressSaved = ref(false)

// 极简 frontmatter 解析（教学够用）：只认「顶格 key:」，缩进的续行并入上一个键的值。
// DSH 用的是完整 YAML 解析器，但 name/description 这种简单键两种解析结果一致。
function parseFrontmatter(bodyLines: string[]): { fields: Record<string, string>; keys: string[] } {
  const fields: Record<string, string> = {}
  const keys: string[] = []
  let lastKey: string | null = null
  for (const line of bodyLines) {
    const m = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line)
    if (m) {
      const key = m[1] ?? ''
      fields[key] = unquote((m[2] ?? '').trim())
      if (!keys.includes(key)) keys.push(key)
      lastKey = key
    } else if (lastKey !== null && /^\s+\S/.test(line)) {
      fields[lastKey] = `${fields[lastKey] ?? ''} ${line.trim()}`.trim()
    }
    // 其余顶格行（注释、列表项等）忽略
  }
  return { fields, keys }
}

function unquote(v: string): string {
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1)
  }
  return v
}

// userInvocable → user-invocable（驼峰键的建议写法就是它的连字符形式）
function toKebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

const validation = computed(() => {
  const text = content.value
  if (!text.trim()) {
    return { status: 'empty' as const, issues: [] as SkillIssue[], name: '', description: '' }
  }

  const lines = text.split('\n')
  const issues: SkillIssue[] = []

  // 规则 1：必须有 YAML frontmatter——首行 ---，后面还有一行 --- 闭合
  const hasOpen = /^---\s*$/.test(lines[0] ?? '')
  const closeIdx = hasOpen
    ? lines.findIndex((line: string, i: number) => i > 0 && /^---\s*$/.test(line))
    : -1
  if (!hasOpen || closeIdx === -1) {
    issues.push({
      kind: 'error',
      text: 'skill file SKILL.md ignored: missing YAML frontmatter',
      explain: '文件必须以一行 --- 开头，中间写 name / description 等元信息，再以一行 --- 闭合。',
    })
    return { status: 'invalid' as const, issues, name: '', description: '' }
  }

  const { fields, keys } = parseFrontmatter(lines.slice(1, closeIdx))

  // 规则 2：name 与 description 都是必填
  if (!('name' in fields) || !('description' in fields)) {
    issues.push({
      kind: 'error',
      text: 'skill file SKILL.md ignored: frontmatter requires name and description',
      explain: 'name 和 description 两个字段都必填——缺一个，整个文件被忽略。',
    })
  }

  // 规则 3：name 必须是严格 kebab-case（正则照抄 DSH 源码）
  const name = fields.name ?? ''
  if ('name' in fields && !NAME_RE.test(name)) {
    issues.push({
      kind: 'error',
      text: `skill file SKILL.md ignored: invalid skill name "${name}"`,
      explain: '只能用小写字母、数字和连字符，且必须与文件夹同名。Hello_DSH、mySkill 都不行。',
    })
  }

  // 规则 4（教学重头戏）：驼峰键陷阱——DSH 只认连字符风格，写成驼峰整个技能被静默丢弃
  for (const key of keys) {
    if (/[A-Z]/.test(key)) {
      const kebab = toKebab(key)
      issues.push({
        kind: 'error',
        hot: true,
        text: `frontmatter field "${key}" is unsupported; use "${kebab}"`,
        explain:
          key === 'userInvocable'
            ? '写成驼峰不会报错，但整个技能会被静默丢弃——DSH 里最难查的坑之一。正确写法：user-invocable: true'
            : `写成驼峰不会报错，但整个技能会被静默丢弃——DSH 里最难查的坑之一。正确写法：${kebab}（连字符、全小写）`,
      })
    }
  }

  // 规则 5（软提示，DSH 不拦）：description 建议用「当……时使用」开头
  const description = fields.description ?? ''
  if ('description' in fields && !description.startsWith('当') && !description.includes('时使用')) {
    issues.push({
      kind: 'hint',
      text: '建议用「当……时使用」开头——模型靠这句话判断什么时候该用你的技能。官方 11 个内置技能都是这个写法。',
    })
  }

  return {
    status: issues.some((i) => i.kind === 'error') ? ('invalid' as const) : ('valid' as const),
    issues,
    name,
    description,
  }
})

function saveProgress() {
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    saved[props.stepKey] = true
    localStorage.setItem('dsh-dojo-progress', JSON.stringify(saved))
  } catch {
    // 存不进去（隐私模式等）就不存：绿灯照给，别让进度问题挡住学习
  }
}

// 首次变为「DSH 可识别」时记一次进度；之后反复改不再重写
watch(
  () => validation.value.status,
  (status: 'empty' | 'invalid' | 'valid') => {
    if (status === 'valid' && !progressSaved.value) {
      progressSaved.value = true
      saveProgress()
    }
  },
)

function loadExample() {
  content.value = props.example
}

function clearEditor() {
  content.value = ''
}
</script>

<template>
  <ClientOnly>
    <div class="dojo-card dojo-skill">
      <div class="dojo-skill-head">
        <div class="dojo-skill-head-left">
          <span class="dojo-skill-title">SKILL.md 编辑器</span>
          <span class="dojo-skill-tag">模拟校验 · 只在你浏览器里跑</span>
        </div>
        <div class="dojo-skill-head-actions">
          <button type="button" class="dojo-skill-btn" @click="loadExample">加载示例</button>
          <button type="button" class="dojo-skill-btn" @click="clearEditor">清空</button>
        </div>
      </div>

      <div class="dojo-skill-grid">
        <textarea
          v-model="content"
          class="dojo-skill-textarea"
          spellcheck="false"
          aria-label="SKILL.md 内容"
          :placeholder="PLACEHOLDER"
        ></textarea>

        <div class="dojo-skill-panel">
          <div class="dojo-skill-panel-head">
            <span class="dojo-skill-panel-title">实时校验</span>
            <span class="dojo-skill-panel-src">规则来自 DSH 源码</span>
          </div>
          <div class="dojo-skill-panel-body" aria-live="polite">
            <p v-if="validation.status === 'empty'" class="dojo-skill-empty">
              开始敲你的 SKILL.md——左边写，这里实时告诉你 DSH 会怎么判。也可以先点「加载示例」看看长什么样。
            </p>
            <template v-else>
              <div v-if="validation.status === 'valid'" class="dojo-skill-pass" role="status">
                ✓ 技能可被 DSH 识别
              </div>
              <div v-if="validation.status === 'valid'" class="dojo-skill-catalog">
                <p class="dojo-skill-catalog-label">DSH 技能清单里会出现这一行（模拟）：</p>
                <p class="dojo-skill-catalog-line">
                  <span class="dojo-skill-catalog-name">{{ validation.name }}</span>
                  — {{ validation.description }}<span class="dojo-skill-catalog-on">（Enabled）</span>
                </p>
                <p v-if="progressSaved" class="dojo-skill-saved">
                  检查点完成——进度存在本机浏览器里
                </p>
              </div>

              <div
                v-for="(issue, i) in validation.issues"
                :key="i"
                class="dojo-skill-issue"
                :class="{
                  'dojo-skill-issue--error': issue.kind === 'error',
                  'dojo-skill-issue--hint': issue.kind === 'hint',
                  'dojo-skill-issue--hot': issue.hot,
                }"
              >
                <p class="dojo-skill-issue-text">{{ issue.text }}</p>
                <p v-if="issue.explain" class="dojo-skill-issue-explain">{{ issue.explain }}</p>
                <p class="dojo-skill-issue-src">
                  {{ issue.kind === 'error' ? '—— DSH 源码 skill-filesystem' : '—— 教程教学建议，不是 DSH 的硬规则' }}
                </p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <template #fallback>
      <!-- SSR 静态壳：同外观、内容为空，避免 hydration mismatch -->
      <div class="dojo-card dojo-skill">
        <div class="dojo-skill-head">
          <div class="dojo-skill-head-left">
            <span class="dojo-skill-title">SKILL.md 编辑器</span>
          </div>
        </div>
        <div class="dojo-skill-grid">
          <div class="dojo-skill-textarea dojo-skill-textarea--shell"></div>
          <div class="dojo-skill-panel">
            <div class="dojo-skill-panel-head">
              <span class="dojo-skill-panel-title">实时校验</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.dojo-skill {
  margin-top: 18px;
  padding: 16px 18px 18px;
}

/* ---------- 头部：标题 + 加载示例 / 清空 ---------- */
.dojo-skill-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.dojo-skill-head-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.dojo-skill-title {
  font-family: var(--dojo-font-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--dojo-text-primary);
}
.dojo-skill-tag {
  font-family: var(--dojo-font-body);
  font-size: 11.5px;
  color: var(--dojo-text-desc);
  white-space: nowrap;
}
.dojo-skill-head-actions {
  display: flex;
  gap: 8px;
}
.dojo-skill-btn {
  padding: 5px 14px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: var(--dojo-radius);
  background: #fff;
  font-family: var(--dojo-font-body);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--dojo-text-secondary);
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
}
.dojo-skill-btn:hover,
.dojo-skill-btn:focus-visible {
  border-color: rgba(9, 45, 78, 0.38);
  background: var(--dojo-brand-50);
  color: var(--dojo-brand-deep);
}

/* ---------- 左编辑 / 右校验 双栏 ---------- */
.dojo-skill-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 14px;
  margin-top: 14px;
  align-items: stretch;
}
@media (max-width: 760px) {
  .dojo-skill-grid {
    grid-template-columns: 1fr;
  }
}

.dojo-skill-textarea {
  height: 280px;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: var(--dojo-radius);
  outline: none;
  background: #fff;
  resize: vertical;
  font-family: var(--dojo-font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--dojo-text-primary);
}
.dojo-skill-textarea:focus-visible {
  border-color: var(--dojo-brand);
  box-shadow: 0 0 0 3px var(--dojo-brand-50);
}
.dojo-skill-textarea::placeholder {
  color: rgba(0, 0, 0, 0.32);
}
/* SSR 壳占位（textarea 换成同尺寸空框） */
.dojo-skill-textarea--shell {
  background: rgba(0, 0, 0, 0.02);
}

/* ---------- 右侧校验面板 ---------- */
.dojo-skill-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--dojo-radius);
  background: rgba(0, 0, 0, 0.02);
  overflow: hidden;
}
.dojo-skill-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.dojo-skill-panel-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--dojo-text-primary);
}
.dojo-skill-panel-src {
  font-size: 11px;
  color: var(--dojo-text-desc);
  white-space: nowrap;
}
.dojo-skill-panel-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  max-height: 320px;
  font-size: 13px;
}
@media (max-width: 760px) {
  .dojo-skill-panel-body {
    max-height: 280px;
  }
}

.dojo-skill-empty {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--dojo-text-desc);
}

/* 通过：绿色大字 + 模拟技能清单行 */
.dojo-skill-pass {
  padding: 10px 12px;
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: var(--dojo-radius);
  background: rgba(34, 197, 94, 0.1);
  font-size: 16px;
  font-weight: 800;
  line-height: 1.5;
  color: #15803d;
}
.dojo-skill-catalog {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--dojo-radius);
  background: #fff;
}
.dojo-skill-catalog-label {
  margin: 0 0 6px;
  font-size: 11.5px;
  color: var(--dojo-text-desc);
}
.dojo-skill-catalog-line {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--dojo-text-secondary);
  word-break: break-word;
}
.dojo-skill-catalog-name {
  font-family: var(--dojo-font-mono);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--dojo-text-primary);
}
.dojo-skill-catalog-on {
  color: #15803d;
  font-weight: 600;
}
.dojo-skill-saved {
  margin: 8px 0 0;
  font-size: 11.5px;
  color: var(--dojo-text-desc);
}

/* ---------- 告警条目 ---------- */
.dojo-skill-issue {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--dojo-radius);
  background: #fff;
}
.dojo-skill-issue:first-of-type {
  margin-top: 0;
}
.dojo-skill-pass + .dojo-skill-issue,
.dojo-skill-catalog + .dojo-skill-issue {
  margin-top: 10px;
}
.dojo-skill-issue-text {
  margin: 0;
  font-family: var(--dojo-font-mono);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dojo-text-secondary);
}
.dojo-skill-issue--error .dojo-skill-issue-text {
  color: var(--dojo-error);
}
/* 驼峰陷阱：教学高亮框——更重的红边，DSH 里最难查的坑 */
.dojo-skill-issue--error.dojo-skill-issue--hot {
  border-color: rgba(236, 19, 22, 0.55);
  background: rgba(236, 19, 22, 0.05);
}
.dojo-skill-issue--error.dojo-skill-issue--hot .dojo-skill-issue-text {
  font-weight: 700;
}
/* 软提示：橙，不是错误 */
.dojo-skill-issue--hint {
  border-color: rgba(180, 83, 9, 0.35);
  background: rgba(245, 158, 11, 0.08);
}
.dojo-skill-issue--hint .dojo-skill-issue-text {
  font-family: var(--dojo-font-body);
  font-size: 12.5px;
  color: #b45309;
}
.dojo-skill-issue-explain {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--dojo-text-desc);
}
.dojo-skill-issue-src {
  margin: 6px 0 0;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.42);
}

/* 移动端:SKILL.md 编辑器是 step-07 核心练习,16px 防放大;头部按钮加大防点串 */
@media (max-width: 640px) {
  .dojo-skill-textarea { font-size: 16px; }
  .dojo-skill-btn { padding: 10px 16px; }
}

</style>
