<script setup lang="ts">
import { categoryBySlug } from '~/composables/useCategoryPages'
// /plugins/[slug] 路由分发器：同一个动态段服务两类页面——
//   1) slug 命中 data/seo/category-pages.json（enabled）→ 分类落地页（CategoryLanding）
//      含存量 URL：pets / skins / clients / ops / vision（原静态锚点页已删，由本路由承接，URL 不变）
//   2) 否则视为插件 slug → 插件详情页（PluginDetail，原 [slug].vue 逻辑原样迁入）
//   3) 都未命中 → 404
// 分类配置在配置文件里维护，本页不含任何分类业务逻辑。
const route = useRoute()
const { bySlug } = usePlugins()

const slug = route.params.slug as string
const category = categoryBySlug(slug)
const plugin = category ? undefined : bySlug(slug)

if (!category && !plugin) {
  throw createError({ statusCode: 404, statusMessage: 'Plugin not found', fatal: true })
}
</script>

<template>
  <CategoryLanding v-if="category" :cat="category" />
  <PluginDetail v-else-if="plugin" :plugin="plugin" />
</template>
