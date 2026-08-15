<script setup lang="ts">
// 第 1 步：打开终端（B2）：FakeTerminal 首秀。
// 教学内容忠实转述 hello-dsh 教程第 1 节（可润色排版，事实不动）。
import type { TerminalCommand } from '~/types/dojo-terminal'

definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-01
defineI18nRoute(false)

useHead({
  title: '第 1 步：打开终端 · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 唯一一条「真」命令：echo 把参数原样吐回来，用它确认终端活着。
// 其余任何输入都走未命中分支吃到 command not found——正好教会他们看报错。
const commands: TerminalCommand[] = [{ match: 'echo hello', output: 'hello', kind: 'ok' }]
const successMatches = ['echo hello']
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">01</span>
    <h1 class="dojo-step-h1">第 1 步：打开终端</h1>

    <p class="dojo-step-p">
      DSH 需要用命令行启动。命令行就是一个可以输入文字命令的窗口，不可怕。
    </p>

    <ul class="dojo-os-list">
      <li class="dojo-card dojo-os-item">
        <strong class="dojo-os-name">macOS</strong>
        <span><span class="dojo-kbd">Command</span> + <span class="dojo-kbd">空格</span>，输入「终端」，回车。</span>
      </li>
      <li class="dojo-card dojo-os-item">
        <strong class="dojo-os-name">Windows</strong>
        <span>按 <span class="dojo-kbd">Win</span> 键，输入 PowerShell，回车。</span>
      </li>
      <li class="dojo-card dojo-os-item">
        <strong class="dojo-os-name">Linux</strong>
        <span><span class="dojo-kbd">Ctrl</span> + <span class="dojo-kbd">Alt</span> + <span class="dojo-kbd">T</span>。</span>
      </li>
    </ul>

    <p class="dojo-step-p">
      打开后看到一个黑色或白色的窗口，一行字末尾闪烁光标，这就对了。
    </p>

    <div class="dojo-callout">
      后面所有 <code>$</code> 开头的命令都是复制粘贴进去按回车。粘贴：macOS
      <span class="dojo-kbd">Command</span> + <span class="dojo-kbd">V</span>，Windows
      <span class="dojo-kbd">Ctrl</span> + <span class="dojo-kbd">V</span> 或右键。
    </div>

    <h2 class="dojo-sub-h2">热身：敲第一条命令</h2>
    <p class="dojo-step-p">
      下面是一个模拟终端（只在你浏览器里跑，不会碰你的电脑）。输入
      <code>echo hello</code> 然后回车——echo 的意思是「把后面的话原样念一遍」。
    </p>

    <DojoFakeTerminal
      :commands="commands"
      :success-matches="successMatches"
      step-key="step1"
      hint="试试输入 echo hello 然后回车"
    />

    <div class="dojo-card dojo-checkpoint">
      <h3 class="dojo-checkpoint-title">✅ 检查点 1</h3>
      <p class="dojo-checkpoint-p">看到 hello 了吗？看到了就继续。</p>
      <p class="dojo-checkpoint-note">
        敲了别的命令也没事：终端会回你一行红字 command not
        found——学会看报错长什么样，也是这门课的一部分。
      </p>
    </div>

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo" class="dojo-btn-secondary">← 上一步：Dojo 首页</NuxtLink>
      <NuxtLink to="/dojo/step-03" class="dojo-btn-primary">下一步：启动 DSH →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* 三大系统的「怎么打开终端」卡片（本页专属） */
.dojo-os-list {
  list-style: none;
  margin: 0 0 18px;
  padding: 0;
  display: grid;
  gap: 10px;
}
.dojo-os-item {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 12px 16px;
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--dojo-text-secondary);
}
.dojo-os-name {
  flex-shrink: 0;
  min-width: 64px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--dojo-brand-deep);
}
</style>
