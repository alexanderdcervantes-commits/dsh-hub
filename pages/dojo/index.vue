<script setup lang="ts">
// DSH Dojo 首页（B1 地基批）：Hero + 进度条 + 10 步卡片网格。
// 交互组件（FakeTerminal 等）是后续批次的事，这里只做静态骨架。
definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo
defineI18nRoute(false)

useHead({
  title: 'DSH Dojo · 边做边学的 DSH 插件课',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content: 'DeepSeek Harness 插件开发互动课：10 步，每步动手敲，不是干读。',
    },
  ],
})

// 步骤标题忠实 hello-dsh 教程的十步结构
const steps = [
  { n: '01', title: '打开终端', desc: '所有练习都在终端里敲。macOS 用「终端」，Windows 用 PowerShell，命令一样。' },
  { n: '02', title: '装 Node.js', desc: 'DSH 跑在 Node 上。装 LTS 版，敲 node -v 能出版本号就过关。' },
  { n: '03', title: '启动 DSH', desc: '一条 npx 命令拉起 DeepSeek Harness，浏览器自动打开 Web UI。' },
  { n: '04', title: '配置密钥', desc: '把你的 API Key 填进 DSH，保存在本机，它才能替你调用模型。' },
  { n: '05', title: '选一个工作区', desc: '新建一个空文件夹当工作区，这门课的所有动手练习都在里面做。' },
  { n: '06', title: '亲眼看到插件', desc: '装一个现成插件、启用它，亲眼看到它出现在 DSH 界面上。' },
  { n: '07', title: '做第一个插件', desc: '从零写一个最小可用插件：一个目录、一份清单、一段入口代码。' },
  { n: '08', title: '看它的生命周期', desc: '盯着日志看插件如何被加载、命令如何注册、停用后发生什么。' },
  { n: '09', title: '接下来做什么', desc: '结课方向：进阶文档、值得读的源码、可以拿来改的插件骨架。' },
  { n: '10', title: '原理（选读）', desc: 'DSH 是怎么发现、加载和管理插件的——好奇为什么再看这步。' },
]

const TOTAL = steps.length

// localStorage['dsh-dojo-progress'] = {"step1":true,...}；首访无数据按 0/10。
// SSR 与客户端首帧都渲染 0，onMounted 后再回填，避免 hydration mismatch。
const doneCount = ref(0)
onMounted(() => {
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    if (!raw) return
    const saved = JSON.parse(raw) as Record<string, unknown>
    doneCount.value = steps.filter((_, i) => saved[`step${i + 1}`] === true).length
  } catch {
    // 进度数据损坏时按 0 处理，不崩页面
  }
})
const progressPct = computed(() => Math.round((doneCount.value / TOTAL) * 100))
</script>

<template>
  <div>
    <section class="dojo-hero">
      <h1 class="dojo-hero-title">
        Learn DSH <em class="dojo-hero-key">by doing</em>, not reading
      </h1>
      <p class="dojo-hero-sub">
        DeepSeek Harness 插件开发互动课：10 步，每步动手敲，不是干读。
      </p>
      <div class="dojo-hero-actions">
        <NuxtLink to="/dojo/step-01" class="dojo-btn-primary">开始第 1 步 →</NuxtLink>
      </div>

      <div class="dojo-card dojo-progress-card">
        <div class="dojo-progress-head">
          <span class="dojo-progress-label">我的进度</span>
          <span class="dojo-progress-count">已完成 <b>{{ doneCount }}</b> / {{ TOTAL }} 步</span>
        </div>
        <div
          class="dojo-progress-bar"
          role="progressbar"
          :aria-valuenow="doneCount"
          aria-valuemin="0"
          :aria-valuemax="TOTAL"
          aria-label="Dojo 完成进度"
        >
          <div class="dojo-progress-bar-fill" :style="{ width: `${progressPct}%` }" />
        </div>
      </div>
    </section>

    <section class="dojo-steps">
      <h2 class="dojo-section-title">10 步路线</h2>
      <div class="dojo-steps-grid">
        <NuxtLink
          v-for="s in steps"
          :key="s.n"
          :to="`/dojo/step-${s.n}`"
          class="dojo-card dojo-step"
        >
          <span class="dojo-badge">{{ s.n }}</span>
          <div class="dojo-step-body">
            <h3 class="dojo-step-title">{{ s.title }}</h3>
            <p class="dojo-step-desc">{{ s.desc }}</p>
          </div>
          <span class="dojo-step-arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---------- Hero ---------- */
.dojo-hero {
  padding: 48px 0 8px;
  text-align: center;
}
.dojo-hero-title {
  margin: 0 0 16px;
  font-size: clamp(30px, 6vw, 44px);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--dojo-text-primary);
}
.dojo-hero-key {
  font-style: normal;
  color: var(--dojo-brand);
}
.dojo-hero-sub {
  margin: 0 auto 28px;
  max-width: 560px;
  font-size: 17px;
  line-height: 1.7;
  color: var(--dojo-text-secondary);
}
.dojo-hero-actions {
  margin-bottom: 36px;
}

/* ---------- 进度卡 ---------- */
.dojo-progress-card {
  max-width: 560px;
  margin: 0 auto;
  padding: 18px 22px;
  text-align: left;
}
.dojo-progress-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}
.dojo-progress-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--dojo-text-primary);
}
.dojo-progress-count {
  font-size: 13px;
  color: var(--dojo-text-desc);
}
.dojo-progress-count b {
  color: var(--dojo-brand);
  font-size: 15px;
}

/* ---------- 步骤网格 ---------- */
.dojo-steps {
  margin-top: 48px;
}
.dojo-section-title {
  margin: 0 0 18px;
  font-size: 20px;
  font-weight: 700;
  color: var(--dojo-text-primary);
}
.dojo-steps-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
@media (max-width: 640px) {
  .dojo-steps-grid {
    grid-template-columns: 1fr;
  }
}

.dojo-step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 18px 16px;
  text-decoration: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.dojo-step:hover,
.dojo-step:focus-visible {
  border-color: var(--dojo-brand-450);
  box-shadow: var(--dojo-shadow-hover);
  transform: translateY(-2px);
}
.dojo-step-body {
  flex: 1;
  min-width: 0;
}
.dojo-step-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--dojo-text-primary);
}
.dojo-step-desc {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--dojo-text-desc);
}
.dojo-step-arrow {
  align-self: center;
  color: var(--dojo-brand);
  font-size: 16px;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dojo-step:hover .dojo-step-arrow,
.dojo-step:focus-visible .dojo-step-arrow {
  opacity: 1;
  transform: translateX(0);
}
</style>
