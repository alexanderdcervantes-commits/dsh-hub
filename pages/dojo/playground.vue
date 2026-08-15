<script setup lang="ts">
// /dojo/playground（B7）：自由终端练习场——把教程全系列出现过的命令汇进一个终端随便敲。
// 不计进度：successMatches 传空数组、stepKey 传空串（FakeTerminal 对空 stepKey
// 不读不写 localStorage），敲什么都不会污染 /dojo 首页的进度计数。
import type { TerminalCommand } from '~/types/dojo-terminal'

definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/playground
defineI18nRoute(false)

useHead({
  title: 'Playground · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 命令表汇总教程全系列（文案与各步页面保持一致）；练习场无剧情状态，全部静态输出。
const commands: TerminalCommand[] = [
  // 彩蛋：第 7 步的暗号。在练习场里它不是对话，是打招呼
  {
    match: 'hello dsh',
    exact: true,
    output: ['这里是练习场，不是 DSH 对话框——不过你记得这句话，说明第 7 步没白做 🐋'],
    kind: 'ok',
  },
  { match: 'echo hello', exact: true, output: ['hello'] },
  // 第 2 步：装好 Node 的验收命令
  { match: 'node --version', output: ['v22.11.0'] },
  // 第 3 步 B：查端口——练习场里端口永远是空的
  {
    match: 'lsof -nP -iTCP:3080 -sTCP:LISTEN',
    output: [],
    emptyNote: '（无输出——端口空着，正常）',
  },
  // 第 3 步 B：杀旧进程（前缀 kill，$(lsof ...) 整条也命中）
  { match: 'kill', output: [], emptyNote: '（无输出，正常）' },
  // 第 3 步 A：写技能开关配置（真实终端是整段 heredoc，敲到 cat > 这行即算写好）
  {
    match: 'cat > ~/enable-skills.yml',
    output: [],
    emptyNote: '（无输出，正常）',
  },
  // 第 3 步 C：漏 --patch 的启动姿势（exact 只认全等）——照样能跑，但技能没打开
  {
    match: 'npx @deepseek-ai/dsh web',
    exact: true,
    ask: 'Ok to proceed? (y)',
    output: [
      'dsh web: http://127.0.0.1:3080',
      {
        text: '⚠️ 你漏了 --patch ~/enable-skills.yml —— 技能功能没打开，第 7 步的插件不会生效。',
        kind: 'warn',
      },
    ],
  },
  // 第 3 步 C：带 --patch 的完整命令
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
  // 第 7 步：命令行版验证暗号——先出答案，后面四行灰字就是网页里那四层轨迹
  {
    match: 'npx @deepseek-ai/dsh --profile headless',
    output: [
      { text: 'HELLO DSH — 这句话来自我电脑上的一个文件', kind: 'ok' },
      { text: 'Context injection · skill-catalog', kind: 'faint' },
      { text: 'Think · matches the hello-dsh skill', kind: 'faint' },
      { text: 'Skill · hello-dsh', kind: 'faint' },
      { text: 'Read · /Users/.../hello-dsh/SKILL.md', kind: 'faint' },
    ],
  },
  // 第 7 步：建技能目录 / 删掉重来 / 查看产物
  {
    match: 'mkdir -p ~/.dsh/skills/hello-dsh',
    output: [],
    emptyNote: '（无输出，正常）',
  },
  {
    match: 'rm -rf ~/.dsh/skills/hello-dsh',
    output: [],
    emptyNote: '（无输出，正常——反悔了就再跑一遍上面的 mkdir）',
  },
  { match: 'ls ~/.dsh/skills/hello-dsh', output: ['SKILL.md'] },
]

// 练习场不设完成判定：任何命令都不触发检查点横幅，也不写进度
const successMatches: (string | RegExp)[] = []
</script>

<template>
  <div class="dojo-play">
    <h1 class="dojo-play-title">Playground · 终端练习场</h1>
    <p class="dojo-play-p">
      随便敲。这里预置了教程里出现过的所有命令，敲错的会告诉你为什么错。
    </p>

    <DojoFakeTerminal
      :commands="commands"
      :success-matches="successMatches"
      step-key=""
      :height="'520px'"
      hint="预置命令都在教程里出现过：echo、node、lsof、kill、cat、npx、mkdir、rm、ls"
    />
  </div>
</template>

<style scoped>
/* 练习场是工具页：比 step 页（680px）宽一档，大终端横向好施展 */
.dojo-play {
  max-width: 800px;
  padding-top: 24px;
}
.dojo-play-title {
  margin: 0 0 14px;
  font-size: 28px;
  font-weight: 800;
  color: var(--dojo-text-primary);
}
.dojo-play-p {
  margin: 0 0 18px;
  font-size: 15.5px;
  line-height: 1.85;
  color: var(--dojo-text-secondary);
}
</style>
