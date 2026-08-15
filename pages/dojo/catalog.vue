<script setup lang="ts">
// /dojo/catalog（B7）：插件 & 技能目录——道场通往主站的完整门户。
// 插件区直接读主站 plugins.json（同一个 Nuxt 项目，不建快照），卡片链到 /plugins/{slug}；
// 技能区是 hello-dsh 仓库 examples/skills/ 的 22 个中文技能实例，整卡外链 SKILL.md。
definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/catalog
defineI18nRoute(false)

useHead({
  title: '目录 · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 按 star 降序的社区插件全量（92 个）
const plugins = usePlugins().byStars()

// hello-dsh 仓库 examples/skills/ 的 22 个目录名（逐一对应，数量必须是 22）
const SKILLS = [
  'api-design',
  'ask-good-questions',
  'code-review-cn',
  'commit-message',
  'debug-systematically',
  'dsh-first-plugin',
  'dsh-onboarding',
  'dsh-plugin-dev',
  'dsh-skill-dev',
  'dsh-troubleshoot',
  'error-handling',
  'explain-codebase',
  'hello-dsh',
  'perf-optimize',
  'plan-before-code',
  'pr-description',
  'refactor-safely',
  'security-review-cn',
  'test-first',
  'web-research',
  'write-docs-cn',
  'write-tech-cn',
]

const REPO = 'https://github.com/pingfanfan/hello-dsh'
</script>

<template>
  <div class="dojo-catalog">
    <header class="dojo-catalog-head">
      <h1 class="dojo-catalog-title">插件 & 技能目录</h1>
      <p class="dojo-catalog-sub">
        {{ plugins.length }} 个社区插件，按 star 排趋势榜；点卡片进主站详情页
      </p>
    </header>

    <DojoPluginBrowser :plugins="plugins" />

    <section class="dojo-catalog-skills">
      <h2 class="dojo-catalog-h2">{{ SKILLS.length }} 个中文技能实例</h2>
      <p class="dojo-catalog-skills-p">
        hello-dsh 仓库里写好的现成技能，每张卡直达它的 <code>SKILL.md</code>（新标签页打开）——
        第 7 步写过 <code>hello-dsh</code>，这里能看到 21 种更正经的写法。
      </p>
      <div class="dojo-skill-grid">
        <a
          v-for="s in SKILLS"
          :key="s"
          :href="`${REPO}/blob/main/examples/skills/${s}/SKILL.md`"
          target="_blank"
          rel="noopener"
          class="dojo-skill-card"
        >
          <span class="dojo-skill-name-row">
            <span class="dojo-skill-name">{{ s }}</span>
            <span class="dojo-skill-extern" aria-hidden="true">↗</span>
          </span>
          <span class="dojo-skill-desc">中文技能实例——点开看写法</span>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 目录页是工具页不是阅读页：比 step 页（680px）宽一档，给三列卡片留余地 */
.dojo-catalog {
  max-width: 860px;
  padding-top: 24px;
}

.dojo-catalog-head {
  margin-bottom: 22px;
}
.dojo-catalog-title {
  margin: 0 0 10px;
  font-size: 28px;
  font-weight: 800;
  color: var(--dojo-text-primary);
}
.dojo-catalog-sub {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--dojo-text-secondary);
}

.dojo-catalog-skills {
  margin-top: 44px;
}
.dojo-catalog-h2 {
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 700;
  color: var(--dojo-text-primary);
}
.dojo-catalog-skills-p {
  margin: 0 0 16px;
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--dojo-text-secondary);
}
.dojo-catalog-skills-p code {
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.05);
  font-family: var(--dojo-font-mono);
  font-size: 0.9em;
  color: var(--dojo-text-primary);
}

/* ---------- 技能卡网格：3 列 / 平板 2 列 / 手机 1 列（与插件网格同断点） ---------- */
.dojo-skill-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 900px) {
  .dojo-skill-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .dojo-skill-grid {
    grid-template-columns: 1fr;
  }
}

.dojo-skill-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: var(--dojo-radius-lg);
  background: var(--dojo-card);
  box-shadow: var(--dojo-shadow);
  text-decoration: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.dojo-skill-card:hover,
.dojo-skill-card:focus-visible {
  border-color: var(--dojo-brand-450);
  box-shadow: var(--dojo-shadow-hover);
  transform: translateY(-2px);
  text-decoration: none;
}

.dojo-skill-name-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.dojo-skill-name {
  font-family: var(--dojo-font-mono);
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--dojo-text-primary);
  word-break: break-all;
}
/* 外链角标：提示这不是站内跳转 */
.dojo-skill-extern {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--dojo-text-desc);
}
.dojo-skill-card:hover .dojo-skill-extern,
.dojo-skill-card:focus-visible .dojo-skill-extern {
  color: var(--dojo-brand);
}

.dojo-skill-desc {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--dojo-text-desc);
}
</style>
