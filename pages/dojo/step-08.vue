<script setup lang="ts">
// 第 8 步：看它的生命周期（B6）：整份教程的核心——删掉技能不重启看反应，放回去再观察。
// 教学内容忠实转述 hello-dsh 教程第 8 节；本页核心是上面的 LifecycleSim 对比实验，
// 文字部分的轨迹/回答原文与组件里逐字同源。
definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-08
defineI18nRoute(false)

useHead({
  title: '第 8 步：看它的生命周期 · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 删除后的轨迹解读：教程原文表格（与 LifecycleSim 删除态轨迹逐字同源）
const removedRows = [
  { seen: 'Context injection · skill-catalog', what: 'DSH 每一步之前都会重新扫一遍技能目录' },
  { seen: 'Read · Error: cannot read ".../hello-dsh/SKILL.md": not found', what: '它真的去读了那个文件，文件没了所以读失败' },
  { seen: 'Think · The skill catalog is now empty', what: '技能清单已经空了' },
  { seen: '最后那段中文回答', what: '它明确拒绝凭记忆复述暗号' },
]

// 命令行验证「技能在不在」的一句话问法；两种状态下的回答（教程原文：删掉时答没有、放回后答有）
const HEADLESS_ASK = 'npx @deepseek-ai/dsh --profile headless "你现在有没有一个叫 hello-dsh 的技能？只回答有或没有"'
const headlessRows = [
  { state: '删掉时', answer: '没有' },
  { state: '放回后', answer: '有' },
]
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">08</span>
    <h1 class="dojo-step-h1">第 8 步：看它的生命周期</h1>

    <p class="dojo-step-p">
      这一步是整份教程的核心。要做的事情只有一条纪律：<b>全程不要重启 DSH。</b>
    </p>

    <p class="dojo-step-p dojo-step-lead">
      下面这个模拟把「删除 → 观察 → 放回 → 再观察」做成了可切换的对比实验，注意右上角那个「未重启」标记全程不变：
    </p>

    <DojoLifecycleSim step-key="step8" />

    <h2 class="dojo-sub-h2">删掉它</h2>
    <p class="dojo-step-p">在终端执行（另开一个窗口，别动跑着 DSH 的那个）：</p>
    <DojoCodeBlock code="rm -rf ~/.dsh/skills/hello-dsh" label="删掉刚才创建的技能目录" />
    <p class="dojo-step-p">
      然后回到网页，不要重启 DSH，直接再说一次 <code>hello dsh</code>。
    </p>
    <p class="dojo-step-p">轨迹把整件事说清楚了：</p>

    <div class="dojo-table-scroll">
      <table class="dojo-table dojo-table--code">
        <thead>
          <tr>
            <th>你看到的</th>
            <th>说明了什么</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in removedRows" :key="row.seen">
            <td>{{ row.seen }}</td>
            <td>{{ row.what }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="dojo-step-p">最有意思的是最后那句——模型的原话：</p>
    <blockquote class="dojo-quote">
      所以这次我没法再从本地文件读出那句暗号了 ——
      如果我现在把「HELLO DSH — 这句话来自我电脑上的一个文件」再输出一遍，那就会是凭记忆复述而不是读自本地文件，那样就不诚实了。
    </blockquote>

    <p class="dojo-step-p">
      这就是技能生效的最好证明：模型这一轮对话里见过那句暗号（在上下文里），但它知道那不算数——因为暗号的来源是磁盘上的文件，而那个文件已经没了。
    </p>

    <h2 class="dojo-sub-h2">放回来</h2>
    <p class="dojo-step-p">
      把<NuxtLink to="/dojo/step-07" class="dojo-inline-link">第 7 步那段 cat &gt; ... 命令</NuxtLink>再执行一遍，依然不重启，再问一次
      <code>hello dsh</code>。暗号又回来了。
    </p>
    <p class="dojo-step-p">也可以用命令行验证，问它技能还在不在：</p>
    <DojoCodeBlock :code="HEADLESS_ASK" label="headless 一问一答，验证技能在不在" />
    <p class="dojo-step-p">同一个问题，两种状态，两种回答：</p>
    <div class="dojo-table-scroll">
      <table class="dojo-table">
        <thead>
          <tr>
            <th>此时技能</th>
            <th>它的回答</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in headlessRows" :key="row.state">
            <td>{{ row.state }}</td>
            <td>{{ row.answer }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 class="dojo-sub-h2">这意味着什么</h2>
    <p class="dojo-step-p">
      <b>文件出现，功能就在；文件消失，功能就没了。</b>中间没有任何重启、安装、注册的动作。对比：装浏览器插件要重启浏览器，装
      VSCode 扩展要重载窗口——DSH 不用。
    </p>
    <p class="dojo-step-p">
      这不是小聪明，是底层设计的直接结果，<NuxtLink to="/dojo/step-10" class="dojo-inline-link">第 10 步</NuxtLink>会讲为什么。
    </p>

    <div class="dojo-card dojo-checkpoint">
      <h3 class="dojo-checkpoint-title">✅ 检查点 8</h3>
      <p class="dojo-checkpoint-p">必须看到两种截然不同的反应，且中间没有重启过任何东西：</p>
      <ol class="dojo-checkpoint-list">
        <li>
          删掉之后：轨迹出现 <code>Read · Error: ... not found</code>，模型明确说读不到文件、拒绝复述暗号
        </li>
        <li>
          放回之后：轨迹出现 <code>Skill · hello-dsh</code> 和 <code>Read · .../SKILL.md</code>，暗号又出来了
        </li>
      </ol>
      <p class="dojo-checkpoint-note">
        如果删掉之后模型还是照常输出暗号，说明它在凭上下文记忆复述，不是真的读文件——开一个新会话（点左上角
        New Session）再试一次。
      </p>
    </div>

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo/step-07" class="dojo-btn-secondary">← 上一步：做第一个插件</NuxtLink>
      <NuxtLink to="/dojo/step-09" class="dojo-btn-primary">下一步：接下来可以做什么 →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* ---------- 教程对照表（删除后的轨迹解读） ---------- */
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
/* 第一列是终端轨迹：等宽字体贴近 DSH 里的样子 */
.dojo-table--code td:first-child {
  font-family: var(--dojo-font-mono);
  font-size: 12px;
  white-space: nowrap;
  color: var(--dojo-text-primary);
}

/* ---------- 模型原话引用 ---------- */
.dojo-quote {
  margin: 6px 0 18px;
  padding: 12px 16px;
  border-left: 3px solid var(--dojo-brand);
  border-radius: 0 var(--dojo-radius) var(--dojo-radius) 0;
  background: var(--dojo-card);
  font-size: 14px;
  line-height: 1.9;
  color: var(--dojo-text-secondary);
}

/* 引出模拟的过渡句 */
.dojo-step-lead {
  margin-top: 22px;
  font-weight: 600;
  color: var(--dojo-text-primary);
}

/* 正文里的站内跳转链接 */
.dojo-inline-link {
  color: var(--dojo-brand-deep);
}
.dojo-inline-link:hover,
.dojo-inline-link:focus-visible {
  text-decoration: none;
}
</style>
