<script setup lang="ts">
// 第 4 步：配置密钥（B3）：拿密钥 → 填进去 → 模拟面板练一遍 → 检查点测验。
// 教学内容忠实转述 hello-dsh 教程第 4 节；截图来自 hello-dsh 仓库（MIT）。
import type { QuizQuestion } from '~/types/dojo-quiz'

definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-04
defineI18nRoute(false)

useHead({
  title: '第 4 步：配置密钥 · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// 答案序号从 0 计
const questions: QuizQuestion[] = [
  {
    q: 'API 密钥配置成功时，DSH 里的标志是？',
    options: [
      '终端打印 HELLO DSH',
      'Settings → Models 里 DeepSeek 右边出现绿点',
      '浏览器弹出 Continue 按钮',
      '插件列表变成 133 个',
    ],
    answer: 1,
    explain: '绿点 = 凭证就位。没绿点说明密钥没存上或粘贴不完整。',
  },
  {
    q: '没配密钥就让 DSH 干活，它会？',
    options: [
      '静默跳过，自己编答案',
      '报 MISSING_CREDENTIAL，点名要 DEEPSEEK_API_KEY',
      '自动帮你创建一个试用密钥',
      '直接退出并卸载',
    ],
    answer: 1,
    explain:
      '报错原文会点名 provider route "deepseek-official" 和环境变量 DEEPSEEK_API_KEY——看到它就知道是缺 key，不是别的问题。',
  },
  {
    q: '关于密钥的安全做法，哪个是对的？',
    options: [
      '贴在团队聊天群里方便大家用',
      '提交进 git 仓库防止忘记',
      '只在创建时复制一次，不发给任何人',
      '把 sk- 前缀去掉再保存',
    ],
    answer: 2,
    explain: '密钥只在创建时显示一次，等于账户钥匙：不发给别人、不贴群、不进代码仓库。',
  },
  {
    q: '点了 Configure later，之后去哪补密钥？',
    options: [
      '重新安装 DSH',
      'Settings → Models → DeepSeek 那行点 Edit',
      '终端里输入 npx dsh key',
      '没法补，只能重开',
    ],
    answer: 1,
    explain: '随时可以从 Settings → Models → DeepSeek 行点 Edit 补上，不用重装。',
  },
]
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">04</span>
    <h1 class="dojo-step-h1">第 4 步：配置密钥</h1>

    <p class="dojo-step-p">
      DSH 需要 DeepSeek 的 API 密钥才能调用模型。这一步全程在网页上点，不用碰命令行。
    </p>

    <h2 class="dojo-sub-h2">拿密钥</h2>
    <ol class="dojo-step-ol">
      <li>打开 <a href="https://platform.deepseek.com" target="_blank" rel="noopener">https://platform.deepseek.com</a></li>
      <li>注册或登录</li>
      <li>找到「API keys」，创建一个新的</li>
      <li>复制它（形如 sk- 开头的一长串）</li>
    </ol>
    <div class="dojo-callout">
      密钥<b>只在创建时显示一次</b>，关掉就看不到了，务必先复制。它等于你账户的钥匙，不要发给别人、不要贴到聊天群或代码里。
    </div>

    <h2 class="dojo-sub-h2">填进去</h2>
    <p class="dojo-step-p">
      第一次打开 DSH 时，它会自己弹出密钥框（截图 1）。把密钥粘进去，点 Save and continue。
    </p>
    <p class="dojo-step-p">
      点了 Configure later 也没关系，随时可以从 Settings → Models → 在 DeepSeek
      那行点 Edit 补上（截图 2）。
    </p>
    <p class="dojo-step-p">配好之后，Settings → Models 里 DeepSeek 右边会有一个绿点。</p>

    <div class="dojo-shots">
      <figure class="dojo-shot">
        <img
          src="/images/dojo/api-key-dialog.png"
          alt="DSH 首次启动时自动弹出的 API 密钥输入框"
          width="2658"
          height="1620"
          loading="lazy"
          decoding="async"
        />
        <figcaption>截图 1 · 首次启动自动弹出密钥框</figcaption>
      </figure>
      <figure class="dojo-shot">
        <img
          src="/images/dojo/api-key-settings.png"
          alt="DSH 设置页 Models 列表，在 DeepSeek 那行点 Edit 补填密钥"
          width="1280"
          height="720"
          loading="lazy"
          decoding="async"
        />
        <figcaption>截图 2 · 事后从 Settings → Models 补</figcaption>
      </figure>
    </div>

    <p class="dojo-step-p dojo-step-lead">下面这个模拟面板和真的一模一样，练一遍：</p>

    <DojoConfigBuilder step-key="step4" />

    <div class="dojo-card dojo-checkpoint">
      <h3 class="dojo-checkpoint-title">✅ 检查点 4</h3>
      <p class="dojo-checkpoint-p">
        必须看到 DeepSeek 右边有<b>绿点</b>。没有绿点就是没配好，重新检查密钥有没有粘贴完整（sk-
        开头，中间不能有空格或换行）。
      </p>
    </div>

    <h2 class="dojo-sub-h2">过一遍检查点</h2>
    <DojoQuiz :questions="questions" storage-key="step4quiz" />

    <nav class="dojo-pager" aria-label="步骤导航">
      <NuxtLink to="/dojo/step-03" class="dojo-btn-secondary">← 上一步：启动 DSH</NuxtLink>
      <NuxtLink to="/dojo/step-05" class="dojo-btn-primary">下一步：选一个工作区 →</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* 拿密钥四步：有序列表（页面级小样式，复用 --dojo-* token） */
.dojo-step-ol {
  margin: 0 0 18px;
  padding-left: 24px;
  font-size: 15px;
  line-height: 1.9;
  color: var(--dojo-text-secondary);
}
.dojo-step-ol li {
  margin: 4px 0;
}
.dojo-step-ol a {
  color: var(--dojo-brand-deep);
  word-break: break-all;
}
.dojo-step-ol a:hover,
.dojo-step-ol a:focus-visible {
  text-decoration: none;
}

/* 引出模拟面板的过渡句 */
.dojo-step-lead {
  margin-top: 22px;
  font-weight: 600;
  color: var(--dojo-text-primary);
}
</style>
