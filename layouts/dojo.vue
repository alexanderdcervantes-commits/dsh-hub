<script setup lang="ts">
// DSH Dojo 独立布局：雪藏教程区专用，与主站 default 布局零共享。
// 顶部不放任何导航（除 logo 回 /dojo）；JetBrains Mono 只在这里引入。
import '~/assets/css/dojo.css'

useHead({
  htmlAttrs: { lang: 'zh-CN' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
    },
  ],
})
</script>

<template>
  <div class="dojo-shell">
    <header class="dojo-header">
      <div class="dojo-header-inner">
        <NuxtLink to="/dojo" class="dojo-logo">
          <span class="dojo-logo-whale" aria-hidden="true">🐋</span>
          <span>DSH Dojo</span>
        </NuxtLink>
        <span class="dojo-beta">beta · 隐藏测试</span>
      </div>
    </header>

    <main class="dojo-main">
      <slot />
    </main>

    <footer class="dojo-footer">
      <p>
        内容参考
        <a href="https://github.com/pingfanfan/hello-dsh" target="_blank" rel="noopener">pingfanfan/hello-dsh</a>
        (MIT) · DSH Dojo 是教学模拟，与 DeepSeek 官方无关
      </p>
    </footer>
  </div>
</template>

<style scoped>
.dojo-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--dojo-bg-page);
  color: var(--dojo-text-primary);
  font-family: var(--dojo-font-body);
}

.dojo-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.dojo-header-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dojo-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  color: var(--dojo-brand);
  text-decoration: none;
}
.dojo-logo:hover {
  color: var(--dojo-brand-deep);
  text-decoration: none;
}
.dojo-logo-whale {
  font-size: 20px;
  line-height: 1;
}
.dojo-beta {
  font-size: 12px;
  color: var(--dojo-text-desc);
}

.dojo-main {
  flex: 1;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px 64px;
}

.dojo-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 18px 20px 26px;
  text-align: center;
}
.dojo-footer p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--dojo-text-desc);
}
.dojo-footer a {
  color: var(--dojo-brand-deep);
}
.dojo-footer a:hover {
  color: var(--dojo-brand);
}
</style>
