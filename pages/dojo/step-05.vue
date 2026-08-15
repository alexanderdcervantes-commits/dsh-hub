<script setup lang="ts">
// 第 5 步：选一个工作区（B5）：不选工作区网页版发不出消息——先建空目录，再在网页里选中它。
// 教学内容忠实转述 hello-dsh 教程第 5 节；截图来自 hello-dsh 仓库（MIT）。
import type { TerminalCommand } from '~/types/dojo-terminal'

definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-05
defineI18nRoute(false)

useHead({
  title: '第 5 步：选一个工作区 · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// mkdir 建练习目录（无输出）；ls 看一眼里面——空目录同样无输出，新手最怕的安静要有交代。
const commands: TerminalCommand[] = [
  {
    match: 'mkdir -p ~/Documents/dsh-test',
    output: [],
    emptyNote: '（无输出，正常）',
  },
  {
    match: 'ls ~/Documents/dsh-test',
    output: [],
    emptyNote: '（无输出——空目录，正常）',
  },
]

const successMatches = ['mkdir -p ~/Documents/dsh-test']
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">05</span>
    <h1 class="dojo-step-h1">第 5 步：选一个工作区</h1>

    <p class="dojo-step-p">
      不选工作区，网页版发不出任何消息。打开页面后输入框里写着 Choose a workspace to
      start，右下角发送按钮是灰的，点了没反应。这不是
      bug，是 DSH 要求你先指定它能在哪个目录里干活。
    </p>
    <div class="dojo-callout">
      命令行版（<code>--profile headless</code>）没有这个限制，直接就能对话。这也是为什么有人在命令行能跑通、在网页版却卡住。
    </div>

    <h2 class="dojo-sub-h2">先建一个空文件夹</h2>
    <p class="dojo-step-p">
      不要直接选你的真实项目。agent 会有这个目录的读写权限，先拿一个空目录练手最安全：
    </p>
    <DojoCodeBlock code="mkdir -p ~/Documents/dsh-test" label="建练习目录（整段复制粘贴）" />

    <p class="dojo-step-p">
      在模拟终端里走一遍这两条命令（只在你浏览器里跑，不会真的在你电脑上建目录）：
      先 <code>mkdir</code> 建目录，再用 <code>ls</code>
      看看里面有什么——两条都没有输出，这是正常的。
    </p>

    <DojoFakeTerminal
      :commands="commands"
      :success-matches="successMatches"
      step-key="step5"
      hint="mkdir -p ~/Documents/dsh-test"
    />

    <h2 class="dojo-sub-h2">在网页里选它</h2>
    <ol class="dojo-pick-list">
      <li>点页面中间的 <code>Choose workspace</code>，或左侧边栏 Workspaces 右边的加号图标</li>
      <li>会弹出 macOS 的文件选择框</li>
      <li>选中刚才建的 <code>dsh-test</code> 文件夹</li>
    </ol>
    <p class="dojo-step-p">选好之后，输入框的提示文字会变，发送按钮变成可点击的蓝色。</p>

    <figure class="dojo-shot dojo-shot-solo">
      <img
        src="/images/dojo/ready-to-send.png"
        alt="选好工作区后的 DSH 网页版：左上角显示工作区名，右下角发送按钮变蓝"
        width="1584"
        height="544"
        loading="lazy"
        decoding="async"
      />
      <figcaption>选好工作区后，左上角显示工作区名，右下角发送按钮变蓝</figcaption>
    </figure>

    <div class="dojo-card dojo-checkpoint">
      <h3 class="dojo-checkpoint-title">✅ 检查点 5</h3>
      <ol class="dojo-checkpoint-list">
        <li>输入框里不再写着 <code>Choose a workspace to start</code></li>
        <li>右下角发送按钮是蓝色的，不是灰的</li>
        <li>能在输入框里打字</li>
      </ol>
      <p class="dojo-checkpoint-note">
        发送按钮还是灰的，就是工作区没选上，重新点一次 Choose workspace。
      </p>
    </div>

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo/step-04" class="dojo-btn-secondary">← 上一步：配置密钥</NuxtLink>
      <NuxtLink to="/dojo/step-06" class="dojo-btn-primary">下一步：亲眼看到插件 →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* 「在网页里选它」三步清单（本页专属） */
.dojo-pick-list {
  margin: 0 0 18px;
  padding-left: 20px;
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--dojo-text-secondary);
}
.dojo-pick-list li {
  margin: 8px 0;
}

/* 单张宽截图：不进两列网格，独占整行（.dojo-shot 自身无外边距） */
.dojo-shot-solo {
  margin: 18px 0 0;
}
</style>
