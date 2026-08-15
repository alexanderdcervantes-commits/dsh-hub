<script setup lang="ts">
// 第 9 步：接下来可以做什么（B6）：纯内容页——再写几个技能 / 直接用现成的 / 什么时候写代码插件。
// 教学内容忠实转述 hello-dsh 教程第 9 节；外链全部指向真实仓库，target=_blank rel=noopener。
definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-09
defineI18nRoute(false)

useHead({
  title: '第 9 步：接下来可以做什么 · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 本页没有动手检查点：读到了就算过（onMounted 静默记一步，客户端 + try/catch）
onMounted(() => {
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    saved.step9 = true
    localStorage.setItem('dsh-dojo-progress', JSON.stringify(saved))
  } catch {
    // 存不进去（隐私模式等）就不存，不影响阅读
  }
})

// description 写法的三条经验：来自 DeepSeek 官方 11 个内置技能（教程原文）
const tips = [
  {
    lead: 'description 用「当……时使用」开头',
    rest: '——它决定模型什么时候想起你',
  },
  {
    lead: '写判断标准，不写清单',
    rest: '——官方原话 "This skill is guidance, not a complete checklist"',
  },
  {
    lead: '单独写一节「不要做的事」',
    rest: '——挡住的问题往往比「要做什么」更多',
  },
]

// 技能做不到的三类需求：教程原文表格
const pluginRows = [
  { need: '让它查天气、读数据库', why: '要调外部 API' },
  { need: '在网页界面上加一个面板', why: '要改 UI' },
  { need: '在每次对话前后做点什么', why: '要挂生命周期钩子' },
]

const REPO = 'https://github.com/pingfanfan/hello-dsh'
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">09</span>
    <h1 class="dojo-step-h1">第 9 步：接下来可以做什么</h1>

    <p class="dojo-step-p">
      你已经掌握了 DSH 最常用的扩展方式。大部分需求到这里就够了。
    </p>

    <h2 class="dojo-sub-h2">再写几个技能</h2>
    <p class="dojo-step-p">
      同样的套路，换个 <code>name</code> 和 <code>description</code> 就行——先建目录，然后写
      <code>SKILL.md</code>：
    </p>
    <DojoCodeBlock code="mkdir -p ~/.dsh/skills/我的技能名" label="换个名字，再写一个 SKILL.md" />
    <p class="dojo-step-p">
      写法上有几条经验，来自 DeepSeek 官方 11 个内置技能：
    </p>
    <ol class="dojo-tip-list">
      <li v-for="tip in tips" :key="tip.lead">
        <b>{{ tip.lead }}</b>{{ tip.rest }}
      </li>
    </ol>
    <p class="dojo-step-p">
      详细规则见 <code>dsh-skill-dev</code> 技能：
      <a :href="`${REPO}/blob/main/examples/skills/dsh-skill-dev/SKILL.md`" class="dojo-ext-link" target="_blank" rel="noopener">examples/skills/dsh-skill-dev/SKILL.md</a>。
    </p>

    <h2 class="dojo-sub-h2">直接用现成的</h2>
    <p class="dojo-step-p">
      这个仓库的 <a :href="`${REPO}/tree/main/examples/skills`" class="dojo-ext-link" target="_blank" rel="noopener">examples/skills/</a>
      里有 22 个写好的中文技能，覆盖代码审查、系统化排查、写提交信息、安全审查等：
    </p>
    <DojoCodeBlock
      code="git clone https://github.com/pingfanfan/hello-dsh.git && cd hello-dsh && ./install.sh"
      label="一键装上全部现成中文技能"
    />
    <p class="dojo-step-p">
      或者把
      <a :href="`${REPO}/blob/main/INSTALL-FOR-AGENTS.md`" class="dojo-ext-link" target="_blank" rel="noopener">INSTALL-FOR-AGENTS.md</a>
      的链接丢给任何 AI agent，说「照这个装」。
    </p>

    <h2 class="dojo-sub-h2">什么时候需要写代码插件</h2>
    <p class="dojo-step-p">
      技能改变模型的做事方式，但它不能给模型新能力。需要下面这些时，就得写 TypeScript 插件：
    </p>
    <div class="dojo-table-scroll">
      <table class="dojo-table">
        <thead>
          <tr>
            <th>需求</th>
            <th>为什么技能做不到</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pluginRows" :key="row.need">
            <td>{{ row.need }}</td>
            <td>{{ row.why }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="dojo-step-p">
      代码插件的完整流程见 <code>dsh-first-plugin</code> 技能（<a
        :href="`${REPO}/blob/main/examples/skills/dsh-first-plugin/SKILL.md`"
        class="dojo-ext-link"
        target="_blank"
        rel="noopener">examples/skills/dsh-first-plugin/SKILL.md</a>），以及可运行的例子
      <a :href="`${REPO}/tree/main/examples/hello-plugin`" class="dojo-ext-link" target="_blank" rel="noopener">examples/hello-plugin/</a>。
    </p>

    <div class="dojo-callout">
      但先别急着写。大多数人以为需要插件的场景，其实用技能就能解决。先问一句：<b>这件事能不能用大白话说清楚？</b>能，就写技能。
    </div>

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo/step-08" class="dojo-btn-secondary">← 上一步：看它的生命周期</NuxtLink>
      <NuxtLink to="/dojo/step-10" class="dojo-btn-primary">下一步：原理（选读） →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* ---------- 三条写法经验 ---------- */
.dojo-tip-list {
  margin: 0 0 18px;
  padding-left: 20px;
  font-size: 15px;
  line-height: 1.9;
  color: var(--dojo-text-secondary);
}
.dojo-tip-list li {
  margin: 8px 0;
}

/* ---------- 需求对照表 ---------- */
.dojo-table-scroll {
  margin: 6px 0 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--dojo-radius);
  background: var(--dojo-card);
  overflow-x: auto;
}
.dojo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.7;
  color: var(--dojo-text-secondary);
}
.dojo-table th {
  padding: 8px 14px;
  border-bottom: 1px solid var(--dojo-brand-100);
  background: var(--dojo-brand-50);
  text-align: left;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--dojo-brand-deep);
}
.dojo-table td {
  padding: 9px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  vertical-align: top;
}
.dojo-table tbody tr:last-child td {
  border-bottom: none;
}

/* ---------- 真实外链（新标签页打开） ---------- */
.dojo-ext-link {
  color: var(--dojo-brand-deep);
  word-break: break-word;
}
.dojo-ext-link:hover,
.dojo-ext-link:focus-visible {
  color: var(--dojo-brand);
}
</style>
