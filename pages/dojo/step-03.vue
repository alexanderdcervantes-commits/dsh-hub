<script setup lang="ts">
// 第 3 步：启动 DSH（B2）：三小节（开技能 → 清端口 → 启动）+ 剧情式大终端。
// 教学内容忠实转述 hello-dsh 教程第 3 节；截图来自 hello-dsh 仓库（MIT）。
import type { TerminalCommand } from '~/types/dojo-terminal'

definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-03
defineI18nRoute(false)

useHead({
  title: '第 3 步：启动 DSH · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const SKILLS_YML = `cat > ~/enable-skills.yml <<'EOF'
- id: skill-filesystem
  disabled: false
- id: tool-skill
  disabled: false
- id: skill-badge
  disabled: false
EOF`

const PORT_CHECK = `lsof -nP -iTCP:3080 -sTCP:LISTEN        # 没有任何输出才能继续
kill $(lsof -t -nP -iTCP:3080 -sTCP:LISTEN)   # 有输出就先杀掉，杀完再确认`

const START_CMD = 'npx @deepseek-ai/dsh web --patch ~/enable-skills.yml'

// 剧情式命令表：把 A（写配置）→ B（清端口）→ C（启动）串成一条完整故事线。
// - lsof 用 when/notWhen 门控：kill 之前查端口能「抓到」上次没关干净的旧进程（剧情设定，
//   正是教学点），kill 之后（setFlag: killed）再查就干干净净。
// - 裸 npx（不带 --patch）用 exact 只认全等：它是错误姿势，但照样「能跑」，
//   故意让学生踩一次坑再 ctrl+c 重来——比直接告诉答案记得牢。
const commands: TerminalCommand[] = [
  // A：真实终端里是整段 heredoc 粘贴；模拟终端里敲到 cat > ~/enable-skills.yml 即算写好
  {
    match: 'cat > ~/enable-skills.yml',
    output: [],
    emptyNote: '（无输出，正常）',
  },
  // B-1：第一次查端口——剧情：上次没关干净，正好抓到旧进程
  {
    match: 'lsof -nP -iTCP:3080 -sTCP:LISTEN',
    output: ['dsh     48213  user   21u  IPv6 0x1234  TCP 127.0.0.1:3080 (LISTEN)'],
    kind: 'plain',
    notWhen: 'killed',
  },
  // B-2：杀掉旧进程（无输出），此后端口才算真空了
  {
    match: 'kill',
    output: [],
    emptyNote: '（无输出——旧进程杀掉了。再敲一遍上面的 lsof 确认端口空了）',
    setFlag: 'killed',
  },
  // B-3：再查一次，这次必须什么都没有
  {
    match: 'lsof -nP -iTCP:3080 -sTCP:LISTEN',
    output: [],
    emptyNote: '（无输出——端口空了，可以启动）',
    when: 'killed',
  },
  // C-错误姿势：不带 --patch 照样能跑，但技能没打开——先让学生踩这一次
  {
    match: 'npx @deepseek-ai/dsh web',
    exact: true,
    ask: 'Ok to proceed? (y)',
    output: [
      'dsh web: http://127.0.0.1:3080',
      {
        text: '⚠️ 你漏了 --patch ~/enable-skills.yml —— 技能功能没打开，第 7 步的插件不会生效。Ctrl+C 停掉，用完整命令重来。',
        kind: 'warn',
      },
    ],
  },
  // 停掉跑歪的进程（模拟终端里直接敲 ctrl+c 四个字）
  { match: /^ctrl\+c$/i, output: ['^C'] },
  // C-正确姿势：带 --patch 的完整命令（前缀匹配，路径写全也能命中）
  {
    match: 'npx @deepseek-ai/dsh web --patch',
    ask: 'Ok to proceed? (y)',
    output: [
      'Downloading @deepseek-ai/dsh... done',
      'Applying patch: enable-skills.yml (skill-filesystem, tool-skill, skill-badge → enabled)',
      'dsh web: http://127.0.0.1:3080',
    ],
    kind: 'ok',
  },
]

const successMatches = [/npx @deepseek-ai\/dsh web --patch/]
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">03</span>
    <h1 class="dojo-step-h1">第 3 步：启动 DSH</h1>

    <p class="dojo-step-p">
      三件事按顺序做：打开技能功能 → 确认端口是空的 → 启动。每件事都有坑，一步都别跳。
    </p>

    <h2 class="dojo-sub-h2">A · 先做一件事——打开技能功能</h2>
    <p class="dojo-step-p">
      ⚠️ DSH 的网页版出厂时把技能功能关掉了（命令行版是开着的）。不打开的话，第 7
      步做的东西不会生效，而且不报错，模型只会自己瞎编。当前版本（0.1.0-rc.6）的实际情况，一分钟解决。
    </p>
    <p class="dojo-step-p">创建配置文件，整段复制粘贴到终端按回车（不会有任何输出，正常）：</p>
    <DojoCodeBlock :code="SKILLS_YML" label="enable-skills.yml · 整段复制粘贴" />

    <h2 class="dojo-sub-h2">B · 启动前先确认端口是空的（端口是 3080）</h2>
    <p class="dojo-step-p">
      这一步别跳过。之前启动过 DSH 没关干净，新的会起不来，而浏览器照样能打开页面——打开的是旧进程，后面所有配置改动都不会生效。
    </p>
    <DojoCodeBlock :code="PORT_CHECK" label="查端口 / 杀旧进程" />

    <h2 class="dojo-sub-h2">C · 启动</h2>
    <DojoCodeBlock :code="START_CMD" label="启动命令（--patch 别漏）" />
    <p class="dojo-step-p">
      注意末尾 <code>--patch ~/enable-skills.yml</code> 不要漏掉。漏了 DSH 照样能跑，但技能不生效——最容易踩的坑。
    </p>
    <p class="dojo-step-p">
      必须看到 <code>dsh web: http://127.0.0.1:3080</code> 才算成功。看到
      <code>EADDRINUSE: address already in use</code> 说明端口被占，回去杀干净。
    </p>
    <p class="dojo-step-p">
      第一次运行下载几十兆，等一到几分钟，没动静是正常的，不是卡死。中途问
      <code>Ok to proceed? (y)</code> 就输 y 回车。
    </p>
    <p class="dojo-step-p">
      保持终端窗口开着，关掉 DSH 就停了。打开浏览器访问
      <code>http://127.0.0.1:3080</code>，测试期提示点 Continue，主界面中间写着 "Into the Unknown"。
    </p>

    <div class="dojo-shots">
      <figure class="dojo-shot">
        <img
          src="/images/dojo/01-first-launch.png"
          alt="DSH 首次启动时的测试期提示弹窗"
          width="1280"
          height="720"
          loading="lazy"
          decoding="async"
        />
        <figcaption>首次启动提示（点 Continue）</figcaption>
      </figure>
      <figure class="dojo-shot">
        <img
          src="/images/dojo/02-main-ui.png"
          alt="DSH 主界面，中间写着 Into the Unknown"
          width="1280"
          height="720"
          loading="lazy"
          decoding="async"
        />
        <figcaption>主界面 "Into the Unknown"</figcaption>
      </figure>
    </div>

    <h2 class="dojo-sub-h2">把 A、B、C 在模拟终端里走一遍</h2>
    <p class="dojo-step-p">
      只在你浏览器里跑，不会碰你的电脑。两点说明：① 真实终端里 A
      是整段粘贴，模拟终端里敲 <code>cat > ~/enable-skills.yml</code> 这一行就算写好；②
      剧情里故意留了个坑——可以先试试不带 <code>--patch</code>
      的启动命令，看看会发生什么，再敲 <code>ctrl+c</code> 停掉，用完整命令重来。
    </p>

    <DojoFakeTerminal
      :commands="commands"
      :success-matches="successMatches"
      :height="'420px'"
      step-key="step3"
      hint="完整命令：npx @deepseek-ai/dsh web --patch ~/enable-skills.yml"
    />

    <div class="dojo-card dojo-checkpoint">
      <h3 class="dojo-checkpoint-title">✅ 检查点 3</h3>
      <ol class="dojo-checkpoint-list">
        <li>浏览器里能打开 <code>http://127.0.0.1:3080</code></li>
        <li>关掉提示弹窗后，看到中间写着 "Into the Unknown"</li>
        <li>终端窗口还开着，没有报错</li>
        <li>
          技能功能确实打开了：Settings → Plugins → Plugin list → 搜 skill → 5 个插件，skill-filesystem
          和 tool-skill 标 Enabled；标 Disabled 说明漏了 --patch，Ctrl+C 重启
        </li>
      </ol>
    </div>

    <div class="dojo-callout">
      ⚠️ 更隐蔽的情况：页面能打开但行为不对——之前启动过没关干净，新进程因端口被占退出，浏览器连上的是旧进程，看起来一切正常但配置全没生效。用
      lsof 那条命令确认端口上跑的是谁。
    </div>

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo/step-01" class="dojo-btn-secondary">← 上一步：打开终端</NuxtLink>
      <NuxtLink to="/dojo/step-04" class="dojo-btn-primary">下一步：配置密钥 →</NuxtLink>
    </nav>
  </div>
</template>
