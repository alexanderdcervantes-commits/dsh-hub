<script setup lang="ts">
// 第 1 步占位页（B1）：只保证路由通。可练手的模拟终端（FakeTerminal）是 B2 的活。
definePageMeta({ layout: 'dojo' })
// dojo 雪藏区不走 i18n：关掉本页的本地化路由，避免生成 /zh/dojo/step-01
defineI18nRoute(false)

useHead({
  title: '第 1 步：打开终端 · DSH Dojo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <div class="dojo-step-page">
    <span class="dojo-badge dojo-step-badge">01</span>
    <h1 class="dojo-step-h1">第 1 步：打开终端</h1>
    <p class="dojo-step-p">
      这门课的每一节都在终端里度过：macOS 打开「终端」App，Windows 用
      PowerShell，Linux 用户你已经有了。先做到两件事——把终端打开，随便敲点什么都行，回车能执行。
      后面的步骤会在这里一条条敲出真正的命令。
    </p>

    <div class="dojo-card dojo-wip">
      ⏳ 交互练习组件开发中——下一批会在这里放一个可以直接敲命令的模拟终端。
    </div>

    <div class="dojo-step-actions">
      <NuxtLink to="/dojo" class="dojo-btn-secondary">← 返回 DSH Dojo 首页</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.dojo-step-page {
  max-width: 640px;
  padding-top: 24px;
}
.dojo-step-badge {
  margin-bottom: 18px;
}
.dojo-step-h1 {
  margin: 0 0 14px;
  font-size: 28px;
  font-weight: 800;
  color: var(--dojo-text-primary);
}
.dojo-step-p {
  margin: 0 0 22px;
  font-size: 15.5px;
  line-height: 1.8;
  color: var(--dojo-text-secondary);
}
.dojo-wip {
  padding: 14px 18px;
  margin-bottom: 26px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--dojo-text-desc);
  background: var(--dojo-brand-50);
  border-color: var(--dojo-brand-100);
}
</style>
