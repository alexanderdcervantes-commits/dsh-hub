<script setup lang="ts">
// 第 2 步：装 Node.js（B5）：FakeTerminal 双分支剧情——第一次 node --version 必须报错。
// 教学内容忠实转述 hello-dsh 教程第 2 节（可润色排版，事实不动）。
import type { TerminalCommand } from '~/types/dojo-terminal'

definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-02
defineI18nRoute(false)

useHead({
  title: '第 2 步：装 Node.js · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 双分支剧情：同一条命令，敲两次结果不同。
// 第一次：还没装 → command not found（教学点：认报错），setFlag 推进剧情；
// 之后：你照下面卡片装好了、也重开了终端 → v22.11.0。
// 完成判定用条目级 success 覆盖：第一次命中显式 success: false，报错不能算过关。
const commands: TerminalCommand[] = [
  {
    match: 'node --version',
    output: [
      'command not found: node',
      {
        text: '还没装——去 nodejs.org 点 LTS 绿色按钮下载安装，装完记得重开终端窗口。',
        kind: 'warn',
      },
    ],
    kind: 'err',
    setFlag: 'installed',
    notWhen: 'installed',
    success: false,
  },
  {
    match: 'node --version',
    output: 'v22.11.0',
    kind: 'ok',
    when: 'installed',
  },
]

const successMatches = ['node --version']
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">02</span>
    <h1 class="dojo-step-h1">第 2 步：装 Node.js</h1>

    <p class="dojo-step-p">
      DSH 是用 JavaScript 写的，需要 Node.js 这个运行环境。先看你有没有——在终端里敲：
    </p>
    <DojoCodeBlock code="node --version" label="检查命令" />

    <p class="dojo-step-p">两种结果：</p>
    <ul class="dojo-outcome-list">
      <li>输出了一个版本号（比如 <code>v22.11.0</code>）——已经装了，直接跳到下面的检查点。</li>
      <li>提示 <code>command not found</code>——没装，照下面的三步装好。</li>
    </ul>

    <h2 class="dojo-sub-h2">在模拟终端里试一试</h2>
    <p class="dojo-step-p">
      只在你浏览器里跑，不会碰你的电脑。这里演的是「还没装」的情形：第一次敲
      <code>node --version</code> 会吃到 command not
      found——记住这个报错长什么样，没装的时候它就是长这样。等你照下面卡片装好、重开终端之后，回到这里再敲一次同样的命令。
    </p>

    <DojoFakeTerminal
      :commands="commands"
      :success-matches="successMatches"
      step-key="step2"
      hint="输入 node --version 检查版本"
    />

    <h2 class="dojo-sub-h2">没装？三步装好</h2>
    <div class="dojo-card dojo-install-card">
      <ol class="dojo-install-list">
        <li>
          打开
          <a href="https://nodejs.org" target="_blank" rel="noopener">https://nodejs.org</a>
        </li>
        <li>点页面上那个写着 LTS 的绿色大按钮下载</li>
        <li>双击下载好的文件，一路点「继续」</li>
      </ol>
      <p class="dojo-install-note">LTS = 长期支持版，是给普通用户的稳定版本。</p>
      <p class="dojo-install-warn">
        ⚠️ 装完之后必须关掉终端窗口再重新打开，否则新装的东西不会生效。重开之后回到上面的模拟终端，再敲一次
        <code>node --version</code> 验证。
      </p>
    </div>

    <div class="dojo-card dojo-checkpoint">
      <h3 class="dojo-checkpoint-title">✅ 检查点 2</h3>
      <p class="dojo-checkpoint-p">
        在你自己的终端里敲 <code>node --version</code>，必须看到一个版本号，比如
        <code>v22.11.0</code>。版本号是 v20 或更高就行。
      </p>
      <p class="dojo-checkpoint-note">
        看到 command not found 就不能往下走——回到上面重装，注意装完要重开终端。
      </p>
    </div>

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo/step-01" class="dojo-btn-secondary">← 上一步：打开终端</NuxtLink>
      <NuxtLink to="/dojo/step-03" class="dojo-btn-primary">下一步：启动 DSH →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* 「两种结果」清单（本页专属） */
.dojo-outcome-list {
  margin: 0 0 18px;
  padding-left: 20px;
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--dojo-text-secondary);
}
.dojo-outcome-list li {
  margin: 6px 0;
}

/* 安装指引卡片（本页专属） */
.dojo-install-card {
  padding: 16px 20px;
}
.dojo-install-list {
  margin: 0;
  padding-left: 20px;
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--dojo-text-secondary);
}
.dojo-install-list li {
  margin: 8px 0;
}
.dojo-install-list a {
  color: var(--dojo-brand-deep);
}
.dojo-install-note {
  margin: 12px 0 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--dojo-text-desc);
}
/* 「装完必须重开终端」警示：琥珀色左边条，与终端里的 warn 同色 */
.dojo-install-warn {
  margin: 14px 0 0;
  padding: 10px 14px;
  border-left: 3px solid #b45309;
  border-radius: var(--dojo-radius);
  background: rgba(180, 83, 9, 0.07);
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--dojo-text-secondary);
}
</style>
