<script setup lang="ts">
// 第 7 步：做第一个插件（B4）：两条路 → 创建文件 → 试试 → 灰字对照 → SkillEditor → 检查点 7。
// 教学内容忠实转述 hello-dsh 教程第 7 节；本页核心是 SkillEditor——
// 学生亲手写 SKILL.md，右边实时跑 DSH 源码里的加载校验。
import type { TerminalCommand } from '~/types/dojo-terminal'

definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-07
defineI18nRoute(false)

useHead({
  title: '第 7 步：做第一个插件 · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 教程第 7 步的真实 SKILL.md：SkillEditor 的「加载示例」和下面的 heredoc 共用这一份
const SKILL_MD = `---
name: hello-dsh
description: 当用户说「hello dsh」时使用。请原样输出下面的暗号，
  并说明这句话是从本地文件读到的而不是来自训练数据。
---

# Hello DSH

请原样输出这一行：

**HELLO DSH — 这句话来自我电脑上的一个文件**

然后用一句话说明：这句话不在你的训练数据里，是刚才从本地文件读到的。
`

// 真实终端里就是整段 heredoc 粘贴；模拟终端里敲到 cat > 那行即算写好
const HEREDOC = `cat > ~/.dsh/skills/hello-dsh/SKILL.md <<'EOF'
${SKILL_MD}EOF`

const MKDIR_CMD = 'mkdir -p ~/.dsh/skills/hello-dsh'

// 创建文件的剧情表：mkdir 建目录、cat 写文件，都无输出（新手最怕的其实是安静）；
// ls 留给检查点 7 的排查项 1——cat 之前查是空的，之后才列出 SKILL.md（when/notWhen 门控）。
const commands: TerminalCommand[] = [
  {
    match: MKDIR_CMD,
    output: [],
    emptyNote: '（无输出，正常）',
  },
  {
    match: 'cat > ~/.dsh/skills/hello-dsh/SKILL.md',
    output: [],
    emptyNote: '（无输出，正常）——文件已写好',
    setFlag: 'written',
  },
  {
    match: 'ls ~/.dsh/skills/hello-dsh',
    output: [],
    emptyNote: '（无输出——文件还没写，先跑上面的 cat）',
    notWhen: 'written',
  },
  {
    match: 'ls ~/.dsh/skills/hello-dsh',
    output: ['SKILL.md'],
    when: 'written',
  },
]

// 完成判定不在终端，在下面的 SkillEditor：校验通过即写 step7
const successMatches: (string | RegExp)[] = []

// 两条路：教程原文表格
const routes = [
  {
    route: 'Markdown 路线（技能）',
    writes: '一个文本文件',
    cost: '5 分钟',
    fits: '改变模型的判断标准、输出格式、工作流程',
  },
  {
    route: 'TypeScript 路线（代码插件）',
    writes: '一个代码模块',
    cost: '半小时起',
    fits: '注册新工具、接外部服务、改界面',
  },
]

// 试试：网页里那几行灰字，一行一行拆开看
const traceRows = [
  { seen: 'Context injection · skill-catalog', what: 'DSH 把技能清单注入了对话' },
  { seen: 'Think · matches the hello-dsh skill', what: '模型靠 description 认出这个场景该用它' },
  { seen: 'Skill · hello-dsh', what: '加载这个技能的正文' },
  { seen: 'Read · /Users/.../hello-dsh/SKILL.md', what: '真的去读了磁盘上那个文件' },
]

// 同样这几行灰字，换一个视角：每一行背后是哪个插件在干活
const pluginRows = [
  { seen: 'Context injection · @deepseek-ai/dsh-system-prompt', who: 'system-prompt 插件注入系统提示' },
  { seen: 'Context injection · skill-catalog', who: 'tool-skill 插件注入技能清单' },
  { seen: 'Skill · hello-dsh', who: 'tool-skill 提供的加载工具' },
  { seen: 'Glob · **/*', who: 'tool-fs-search 插件' },
  { seen: 'Read · .../SKILL.md', who: 'tool-fs 插件' },
  { seen: 'Think · ...', who: 'agent-loop 插件驱动的推理步骤' },
]
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">07</span>
    <h1 class="dojo-step-h1">第 7 步：做第一个插件</h1>

    <p class="dojo-step-p">现在你要给 DSH 加东西了。给 DSH 加东西有两条路：</p>

    <div class="dojo-table-scroll">
      <table class="dojo-table">
        <thead>
          <tr>
            <th>路线</th>
            <th>写什么</th>
            <th>门槛</th>
            <th>适合</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in routes" :key="r.route">
            <td>{{ r.route }}</td>
            <td>{{ r.writes }}</td>
            <td>{{ r.cost }}</td>
            <td>{{ r.fits }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="dojo-step-p">
      判断依据：<b>能用大白话说清楚要它怎么做的，走 Markdown 路线。</b>
    </p>
    <p class="dojo-step-p">
      这一步走 Markdown 路线，由第 6 步看到的 skill-filesystem 插件负责加载。
    </p>

    <h2 class="dojo-sub-h2">创建文件</h2>
    <p class="dojo-step-p">在终端新开一个窗口（别关掉正在跑 DSH 的那个）：</p>
    <DojoCodeBlock :code="MKDIR_CMD" label="建目录 · 无输出是正常的" />
    <p class="dojo-step-p">然后整段复制粘贴创建文件：</p>
    <DojoCodeBlock :code="HEREDOC" label="创建 SKILL.md · 从 cat 到 EOF 整段复制" />
    <p class="dojo-step-p">
      命令没有任何输出，这是正常的。就这样——<b>没有编译，没有安装，没有重启。</b>
    </p>

    <DojoFakeTerminal
      :commands="commands"
      :success-matches="successMatches"
      step-key="step7"
      hint="先 mkdir 建目录，再 cat 写文件；可以 ls 查看目录"
    />

    <h2 class="dojo-sub-h2">试试</h2>
    <p class="dojo-step-p">
      在 DSH 的网页对话框输入 <code>hello dsh</code>。
    </p>
    <p class="dojo-step-p">
      这句暗号不可能来自模型的训练数据，因为是你三十秒前刚写的。
    </p>
    <p class="dojo-step-p">
      上面那几行灰字比暗号本身更值得看，它们是模型的完整思考过程：
    </p>

    <div class="dojo-table-scroll">
      <table class="dojo-table dojo-table--code">
        <thead>
          <tr>
            <th>你看到的</th>
            <th>发生了什么</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in traceRows" :key="row.seen">
            <td>{{ row.seen }}</td>
            <td>{{ row.what }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="dojo-step-p">
      注意最后一步：它不是「想起」了什么，是打开文件读的。第 8 步会把这一点验证得更彻底。
    </p>

    <h2 class="dojo-sub-h2">这几行灰字，就是插件在干活</h2>

    <div class="dojo-table-scroll">
      <table class="dojo-table dojo-table--code">
        <thead>
          <tr>
            <th>轨迹里的这一行</th>
            <th>是哪个插件干的</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pluginRows" :key="row.seen">
            <td>{{ row.seen }}</td>
            <td>{{ row.who }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="dojo-step-p">
      这是整个教程里最能「看见」插件的地方：<b>插件列表告诉你有什么，这几行灰字告诉你它们实际怎么协作。</b>
    </p>
    <p class="dojo-step-p">
      也可以用命令行：<code>npx @deepseek-ai/dsh --profile headless "hello dsh"</code>
    </p>

    <h2 class="dojo-sub-h2">这个文件的两个必填项</h2>
    <p class="dojo-step-p">
      <b>name</b>（必填，只能小写字母和连字符，和文件夹同名）+ <b>description</b>（必填）。
    </p>
    <p class="dojo-step-p">
      description 决定模型什么时候会想起用它。模型一开始只看到一份清单（每项只有名字和这句描述），正文要等它决定用了才读。
    </p>

    <div class="dojo-desc-ex">
      <p class="dojo-desc-ex-row dojo-desc-ex-row--bad">
        <span class="dojo-desc-ex-tag">✗ 没用</span>
        <code>description: 一个用于代码审查的技能</code>
        <span class="dojo-desc-ex-note">——模型不知道什么场合该用</span>
      </p>
      <p class="dojo-desc-ex-row dojo-desc-ex-row--good">
        <span class="dojo-desc-ex-tag">✓ 有用</span>
        <code>description: 当需要审查代码改动、pull request 或 diff 时使用，按正确性、生命周期、安全、测试强度的顺序给出中文审查意见。</code>
      </p>
    </div>

    <p class="dojo-step-p">
      用「当……时使用」开头——DeepSeek 官方 11 个内置技能的统一写法。
    </p>

    <p class="dojo-step-p dojo-step-lead">
      不想复制粘贴？在下面这个编辑器里亲手写一遍，右边实时告诉你 DSH 会怎么判：
    </p>

    <DojoSkillEditor :example="SKILL_MD" step-key="step7" />

    <div class="dojo-card dojo-checkpoint">
      <h3 class="dojo-checkpoint-title">✅ 检查点 7</h3>
      <p class="dojo-checkpoint-p">必须看到模型输出了你写的那句暗号。看不到的话按顺序查：</p>
      <ol class="dojo-checkpoint-list">
        <li>
          文件路径：<code>ls ~/.dsh/skills/hello-dsh/</code> 应列出 <code>SKILL.md</code>
        </li>
        <li>name 是不是写成了 <code>Hello_DSH</code>（必须小写加连字符）</li>
        <li>
          网页版启动时有没有带 <code>--patch ~/enable-skills.yml</code>（<NuxtLink
            to="/dojo/step-03"
            class="dojo-checkpoint-link"
            >回检查点 3 验证</NuxtLink
          >）
        </li>
      </ol>
    </div>

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo/step-05" class="dojo-btn-secondary">← 上一步：选一个工作区</NuxtLink>
      <NuxtLink to="/dojo/step-08" class="dojo-btn-primary">下一步：看它的生命周期 →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* ---------- 教程对照表（两条路 / 灰字轨迹） ---------- */
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
/* 第一列是终端轨迹/路线名：等宽字体更贴近 DSH 里的样子 */
.dojo-table--code td:first-child {
  font-family: var(--dojo-font-mono);
  font-size: 12px;
  white-space: nowrap;
  color: var(--dojo-text-primary);
}

/* ---------- description 没用 / 有用 对照 ---------- */
.dojo-desc-ex {
  display: grid;
  gap: 8px;
  margin: 6px 0 18px;
}
.dojo-desc-ex-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--dojo-radius);
  font-size: 13px;
  line-height: 1.7;
}
.dojo-desc-ex-row--bad {
  border: 1px solid rgba(236, 19, 22, 0.3);
  background: rgba(236, 19, 22, 0.04);
}
.dojo-desc-ex-row--good {
  border: 1px solid rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.06);
}
.dojo-desc-ex-tag {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
}
.dojo-desc-ex-row--bad .dojo-desc-ex-tag {
  color: var(--dojo-error);
}
.dojo-desc-ex-row--good .dojo-desc-ex-tag {
  color: #15803d;
}
.dojo-desc-ex-row code {
  font-size: 12px;
  word-break: break-all;
}
.dojo-desc-ex-note {
  color: var(--dojo-text-desc);
}

/* 引出编辑器的过渡句 */
.dojo-step-lead {
  margin-top: 22px;
  font-weight: 600;
  color: var(--dojo-text-primary);
}

/* 检查点列表里的回跳链接 */
.dojo-checkpoint-link {
  color: var(--dojo-brand-deep);
}
.dojo-checkpoint-link:hover,
.dojo-checkpoint-link:focus-visible {
  text-decoration: none;
}
</style>
