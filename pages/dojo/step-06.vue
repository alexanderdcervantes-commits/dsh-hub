<script setup lang="ts">
// 第 6 步：亲眼看到插件（B7）：全程只看不动手——133 个内置插件 + skill 五人组，
// 再把视线接到社区收录的 92 个真实插件（道场 → 主站详情页的导流口）。
// 教学内容忠实转述 hello-dsh 教程第 6 节；截图来自 hello-dsh 仓库（MIT）。
definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-06
defineI18nRoute(false)

useHead({
  title: '第 6 步：亲眼看到插件 · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 本页无交互门槛：浏览即完成（客户端读-改-写，try/catch）
onMounted(() => {
  try {
    const raw = localStorage.getItem('dsh-dojo-progress')
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    saved.step6 = true
    localStorage.setItem('dsh-dojo-progress', JSON.stringify(saved))
  } catch {
    // 存不进去（隐私模式等）就不存，不影响阅读
  }
})

// 社区插件直接读主站数据（同一个 Nuxt 项目的 plugins.json，不建快照），按 star 降序
const plugins = usePlugins().byStars()

// 表一：往下翻插件列表看到的六根台柱（教程原文）
const coreRows = [
  { name: 'llm', what: '模型适配器——跟 DeepSeek API 说话的那一层' },
  { name: 'agent-loop', what: 'agent 的主循环——整个产品的心脏' },
  { name: 'tools', what: '工具注册表——管理模型能调用哪些工具' },
  { name: 'session', what: '会话记录' },
  { name: 'webserver', what: '你正在看的这个网页服务器' },
  { name: 'ui-sidebar', what: '左边那条侧边栏' },
]

// 表二：搜 skill 出来的五人组（教程原文）
const skillRows = [
  { name: 'skill', what: '定义「技能」这个能力是什么' },
  { name: 'skill-filesystem', what: '扫描目录、读取 Markdown 文件' },
  { name: 'tool-skill', what: '把技能列表给模型看，提供加载工具' },
  { name: 'skill-badge', what: '随包分发的技能' },
  { name: 'ui-skill', what: '网页上的技能界面' },
]
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">06</span>
    <h1 class="dojo-step-h1">第 6 步：亲眼看到插件</h1>

    <p class="dojo-step-p">
      这一步不用做任何操作，只是看。<b>但它是理解 DSH 的关键。</b>
    </p>
    <p class="dojo-step-p">
      在 Settings 里点左侧的 <code>Plugins</code>，再点上方的 <code>Plugin list</code> 标签。看右上角那个数字：<b>133</b>。
    </p>

    <figure class="dojo-shot dojo-shot-solo">
      <img
        src="/images/dojo/plugin-list.png"
        alt="DSH 设置里的 Plugin list 页，右上角显示插件总数 133"
        width="1280"
        height="720"
        loading="lazy"
        decoding="async"
      />
      <figcaption>Plugin list——右上角的数字就是插件总数</figcaption>
    </figure>

    <p class="dojo-step-p">往下翻这个列表，你会看到：</p>

    <div class="dojo-table-scroll">
      <table class="dojo-table dojo-table--code">
        <thead>
          <tr>
            <th>插件名</th>
            <th>它是什么</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in coreRows" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.what }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="dojo-callout dojo-eip">
      看明白了吗？不是「DSH 支持插件扩展」，而是 <b>DSH 本身就是 133 个插件拼出来的</b>。你现在正在用的每一个部分，都是一个可以被替换、被禁用、被重写的插件。这就是
      <b>"Everything is a Plugin"</b> 的字面意思。
    </div>

    <h2 class="dojo-sub-h2">再看一个具体的：搜 skill</h2>
    <p class="dojo-step-p">
      在搜索框里输入 <code>skill</code>，出来 5 个插件，它们协作实现了「技能」这个功能：
    </p>

    <figure class="dojo-shot dojo-shot-solo">
      <img
        src="/images/dojo/skill-is-plugin.png"
        alt="在 Plugin list 搜索框里输入 skill，列出 5 个协作实现技能功能的插件"
        width="1280"
        height="720"
        loading="lazy"
        decoding="async"
      />
      <figcaption>搜 skill——5 个插件协作实现「技能」</figcaption>
    </figure>

    <div class="dojo-table-scroll">
      <table class="dojo-table dojo-table--code">
        <thead>
          <tr>
            <th>插件</th>
            <th>职责</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in skillRows" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.what }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="dojo-step-p"><b>记住这五个名字</b>，第 7 步你就要用到其中一个。</p>
    <p class="dojo-step-p">
      现在这个列表还只是一堆名字。<b>第 7 步你会亲眼看到它们协作干活</b>——DSH
      会把每一步用了哪个插件显示出来。
    </p>

    <h2 class="dojo-sub-h2">从内置骨架，到社区长出来的东西</h2>
    <p class="dojo-step-p">
      教程里那 133 个是 DSH 内置的骨架。而社区在骨架上长出来的东西——我们已经收录了
      {{ plugins.length }} 个，在下面翻一翻，点任何一张卡片都能进它的详情页：
    </p>

    <DojoPluginBrowser :plugins="plugins" :limit="12" show-link-hint />

    <p class="dojo-more-row">
      <NuxtLink to="/dojo/catalog" class="dojo-more-link">看全部 {{ plugins.length }} 个 →</NuxtLink>
    </p>

    <div class="dojo-card dojo-checkpoint">
      <h3 class="dojo-checkpoint-title">✅ 检查点 6</h3>
      <p class="dojo-checkpoint-p">
        必须看到 Plugin list 右边有一个<b>三位数</b>（教程里是 133，你的版本可能略有不同）。
      </p>
      <p class="dojo-checkpoint-note">
        看不到 Plugins 标签的话，确认你点的是 Settings 而不是别的地方。
      </p>
    </div>

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo/step-05" class="dojo-btn-secondary">← 上一步：选一个工作区</NuxtLink>
      <NuxtLink to="/dojo/step-07" class="dojo-btn-primary">下一步：做第一个插件 →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* ---------- 教程对照表（台柱六件套 / skill 五人组） ---------- */
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
/* 第一列是插件名：等宽字体更贴近 Plugin list 里的样子 */
.dojo-table--code td:first-child {
  font-family: var(--dojo-font-mono);
  font-size: 12px;
  white-space: nowrap;
  color: var(--dojo-text-primary);
}

/* ---------- "Everything is a Plugin" 高亮：比普通 callout 多一条品牌色左边条 ---------- */
.dojo-eip {
  border-left: 3px solid var(--dojo-brand);
}

/* ---------- 单张宽截图（.dojo-shot 自身无外边距） ---------- */
.dojo-shot-solo {
  margin: 18px 0 0;
}

/* ---------- 「看全部」导流行 ---------- */
.dojo-more-row {
  margin: 14px 0 0;
  text-align: center;
}
.dojo-more-link {
  font-size: 14px;
  font-weight: 600;
  color: var(--dojo-brand-deep);
}
.dojo-more-link:hover,
.dojo-more-link:focus-visible {
  color: var(--dojo-brand);
}

/* 移动端:首列 mono 47 字符超视口 → 允许换行(scoped 特异性才压得过上面的 nowrap) */
@media (max-width: 640px) {
  .dojo-table--code td:first-child { white-space: normal; overflow-wrap: anywhere; }
  .dojo-table th, .dojo-table td { padding: 8px 10px; }
}

</style>
