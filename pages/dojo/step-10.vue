<script setup lang="ts">
// 第 10 步：原理（选读）（B6）：Cordis 论文视角解释第 8 步为什么成立。
// 教学内容忠实转述 hello-dsh 教程第 10 节——学术内容，§编号、作者、"87 个"、英文原文引述全部保留。
// 本页没有动手检查点：读到末尾就算走完（onMounted 静默记一步，客户端 + try/catch）。
definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-10
defineI18nRoute(false)

useHead({
  title: '第 10 步：原理（选读）· DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 撤销操作的正确写法：setup 和 teardown 写在一起（教程原文代码，仅排版分行）
const EFFECT_CODE = `ctx.effect(() => {
  const timer = setInterval(tick, 1000)
  return () => clearInterval(timer)
})`

const TOTAL = 10
// SSR 与客户端首帧都渲染 0，onMounted 后再回填，避免 hydration mismatch
const doneCount = ref(0)
onMounted(() => {
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    saved.step10 = true
    localStorage.setItem('dsh-dojo-progress', JSON.stringify(saved))
    doneCount.value = Array.from({ length: TOTAL }, (_, i) => saved[`step${i + 1}`] === true).filter(
      Boolean,
    ).length
  } catch {
    // 进度数据损坏 / 存不进去：按 0 处理，不影响阅读
  }
})
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">10</span>
    <h1 class="dojo-step-h1">第 10 步：原理（选读）</h1>

    <p class="dojo-step-p">
      <span class="dojo-optional-tag">选读 · 跳过不影响使用</span>
      到这里你已经会用了。这一节解释为什么。
    </p>

    <p class="dojo-step-p">
      DSH 建立在一个叫 <b>Cordis</b> 的框架上，Cordis 有一篇论文：
    </p>

    <div class="dojo-card dojo-paper">
      <p class="dojo-paper-title">A Programming Paradigm for Spatiotemporal Composability</p>
      <dl class="dojo-paper-meta">
        <div class="dojo-paper-row">
          <dt>作者</dt>
          <dd>Yifan Shi、Wei Zhang、Tianyi Cui</dd>
        </div>
        <div class="dojo-paper-row">
          <dt>机构</dt>
          <dd>北京大学 / DeepSeek-AI</dd>
        </div>
      </dl>
    </div>

    <p class="dojo-step-p">
      第 8 步那个演示，正是这篇论文形式化描述的东西的最小可观察实例。论文把「动态组合」拆成两个互相独立的维度。
    </p>

    <h2 class="dojo-sub-h2">时间维度：撤得干净</h2>
    <p class="dojo-step-p">
      组件被移除时，它对环境的修改必须被完整、安全、有序地撤销。
    </p>
    <p class="dojo-step-p">
      论文做法：每一次改动都自带一个撤销操作，运行时全程追踪，卸载时按相反顺序执行（§3.1）。
    </p>
    <div class="dojo-callout">
      论文数据（§1.2.1）：VSCode 安装量前 100 的扩展中，有 <b>87 个</b>含可执行代码，因此禁用或卸载它们必须重启整个扩展宿主。而你在第
      8 步删掉那个技能时，什么都没重启。
    </div>

    <h2 class="dojo-sub-h2">空间维度：依赖变了自己知道</h2>
    <p class="dojo-step-p">
      组件声明它需要什么，运行时在这些东西出现、消失、或换了提供者时，重新判断它能不能运行。
    </p>
    <p class="dojo-step-p">
      论文称之为<b>反应式 coeffect</b>（§3.2）：依赖满足就激活，不满足就停用，无关的变化不动它。
    </p>
    <p class="dojo-step-p">
      写代码插件时用的 <code>export const inject = ['tools']</code> 就是这个声明。
    </p>
    <div class="dojo-callout">
      重要细节：依赖不满足时，组件是<b>静默不激活</b>的，不报错。所以「插件装了但没反应」时，第一个要怀疑的就是依赖没满足。
    </div>

    <h2 class="dojo-sub-h2">只有两个状态</h2>
    <p class="dojo-step-p">
      论文 §4.1 图 1，整个生命周期就这么简单：
    </p>

    <div class="dojo-states" role="img" aria-label="生命周期状态图：Inactive 与 Active 两个状态，L-Reload 转为 Active，L-Unload 退回 Inactive">
      <span class="dojo-states-pill dojo-states-pill--inactive">Inactive</span>
      <span class="dojo-states-arrows" aria-hidden="true">
        <span class="dojo-states-arrow">→ L-Reload</span>
        <span class="dojo-states-arrow">← L-Unload</span>
      </span>
      <span class="dojo-states-pill dojo-states-pill--active">Active</span>
    </div>

    <p class="dojo-step-p">
      驱动转换的是一次比较：当前生效的状态和应该处于的状态是否一致，不一致就切换。
    </p>
    <p class="dojo-step-p">
      第 8 步那三步，就是这个比较在文件系统上的表现：文件在不在，决定了「应该处于的状态」是什么。
    </p>

    <h2 class="dojo-sub-h2">一条对写插件的人很重要的提醒</h2>
    <p class="dojo-step-p">
      论文 §5.1.1：撤销操作写得对不对，是插件作者的责任，运行时不会验证（原文
      "an obligation on the component author rather than a property the runtime verifies"）。
    </p>
    <p class="dojo-step-p">
      也就是说你 <code>setInterval</code> 忘了配 <code>clearInterval</code>，没人会告诉你，只会在插件卸载后留下一个还在跑的定时器。
    </p>
    <p class="dojo-step-p">正确写法是把两者写在一起：</p>
    <DojoCodeBlock :code="EFFECT_CODE" label="effect：setup 和它的撤销写在一起" />

    <div class="dojo-callout dojo-finale">
      <template v-if="doneCount >= TOTAL">
        🎓 <b>完成全部 {{ TOTAL }} 步！</b>从打开终端到读懂生命周期，这门课的路你走完了——接下来最好的巩固方式是回去写一个真正用得上的技能。
      </template>
      <template v-else>
        🎓 教程到这里就完了——你已完成 <b>{{ doneCount }} / {{ TOTAL }}</b> 步，剩下的随时回道场补。
      </template>
    </div>

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo/step-09" class="dojo-btn-secondary">← 上一步：接下来可以做什么</NuxtLink>
      <NuxtLink to="/dojo" class="dojo-btn-primary">回到道场首页 →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* ---------- 选读标注 ---------- */
.dojo-optional-tag {
  display: inline-block;
  margin-right: 10px;
  padding: 2px 10px;
  border: 1px solid var(--dojo-brand-100);
  border-radius: 999px;
  background: var(--dojo-brand-50);
  font-size: 12px;
  font-weight: 700;
  color: var(--dojo-brand-deep);
  vertical-align: 2px;
}

/* ---------- 论文信息卡 ---------- */
.dojo-paper {
  margin: 6px 0 18px;
  padding: 16px 18px;
}
.dojo-paper-title {
  margin: 0 0 10px;
  font-family: var(--dojo-font-mono);
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.6;
  color: var(--dojo-text-primary);
}
.dojo-paper-meta {
  margin: 0;
}
.dojo-paper-row {
  display: flex;
  gap: 10px;
  font-size: 13.5px;
  line-height: 1.8;
}
.dojo-paper-row dt {
  flex-shrink: 0;
  color: var(--dojo-text-desc);
}
.dojo-paper-row dt::after {
  content: '：';
}
.dojo-paper-row dd {
  margin: 0;
  color: var(--dojo-text-secondary);
}

/* ---------- Inactive ⇄ Active 状态图 ---------- */
.dojo-states {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  margin: 6px 0 18px;
  padding: 18px 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--dojo-radius);
  background: var(--dojo-card);
}
.dojo-states-pill {
  padding: 8px 20px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  font-family: var(--dojo-font-mono);
  font-size: 13.5px;
  font-weight: 700;
}
.dojo-states-pill--inactive {
  background: rgba(0, 0, 0, 0.04);
  color: var(--dojo-text-secondary);
}
.dojo-states-pill--active {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.08);
  color: #15803d;
}
.dojo-states-arrows {
  display: grid;
  gap: 4px;
  font-family: var(--dojo-font-mono);
  font-size: 12px;
  color: var(--dojo-text-desc);
  text-align: center;
}

/* ---------- 收尾 callout ---------- */
.dojo-finale {
  margin-top: 28px;
}
</style>
