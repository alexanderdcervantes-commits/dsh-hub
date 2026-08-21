<script setup lang="ts">
// /meme/[slug] 薄壳：查询 + is_meme 校验 + 渲染 PluginDetail(meme 变体)。
// 头部/梗图注/点赞/同分区推荐/CreativeWork schema 等全部逻辑住在 components/PluginDetail.vue。
const route = useRoute()
const { bySlug } = usePlugins()

const plugin = bySlug(route.params.slug as string)
if (!plugin || !plugin.is_meme) {
  throw createError({ statusCode: 404, statusMessage: 'Meme not found', fatal: true })
}
</script>

<template>
  <PluginDetail :plugin="plugin" variant="meme" />
</template>
