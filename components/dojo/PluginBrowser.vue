<script setup lang="ts">
// DSH Dojo 插件浏览器（B7）：道场通往主站的门——卡片整链到主站详情页 /plugins/{slug}。
// 数据由页面传入（主站 plugins.json，经 usePlugins 读入，不建快照）；本组件纯展示：
// 无 localStorage，搜索 / 排序都是内存态。按道场惯例（铁律 4）交互组件整包 ClientOnly，
// SSR 只出同外观静态壳（计数一行是确定的，可以安全出现在壳里）。

// 结构子集而非复用 DshPlugin 全量类型：道场只关心卡片要画的这几个字段，
// DshPlugin 天然可赋值给它（image 允许 null——没传 logo 的插件走 🐋 占位）。
interface PluginCard {
  slug: string
  name: string
  description_zh: string
  stars: number
  image?: string | null
  repo?: string
  url?: string
  is_meme?: boolean
  category_zh?: string
}

const props = withDefaults(
  defineProps<{
    plugins: PluginCard[]
    /** 只显示前 N 个（过滤排序之后截断）；不传 = 全显示 */
    limit?: number
    /** 顶部是否显示「点击卡片查看主站详情页」提示 */
    showLinkHint?: boolean
  }>(),
  { limit: 0, showLinkHint: false },
)

const query = ref('')
const sort = ref<'stars' | 'name'>('stars')
// logo 加载失败的 slug 集合：换 🐋 占位（图片字段存在但 404 时兜底）
const failedLogos = ref(new Set<string>())

const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = props.plugins.filter(
    (p) => p.name.toLowerCase().includes(q) || p.description_zh.toLowerCase().includes(q),
  )
  if (sort.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
  else list.sort((a, b) => b.stars - a.stars)
  return props.limit > 0 ? list.slice(0, props.limit) : list
})

function onLogoError(slug: string) {
  failedLogos.value.add(slug)
  // 触发响应式更新（Set 原地 mutate 不被追踪）
  failedLogos.value = new Set(failedLogos.value)
}

function hasLogo(p: PluginCard): boolean {
  return Boolean(p.image) && !failedLogos.value.has(p.slug)
}
</script>

<template>
  <ClientOnly>
    <div class="dojo-pb">
      <p v-if="showLinkHint" class="dojo-pb-hint">👆 点击任意卡片，查看它的主站详情页</p>

      <div class="dojo-pb-bar">
        <input
          v-model="query"
          class="dojo-pb-search"
          type="search"
          placeholder="搜索插件名或描述…"
          aria-label="搜索插件"
        />
        <div class="dojo-pb-sort" role="group" aria-label="排序方式">
          <button
            type="button"
            class="dojo-pb-sort-btn"
            :class="{ 'is-active': sort === 'stars' }"
            :aria-pressed="sort === 'stars'"
            @click="sort = 'stars'"
          >
            按 star
          </button>
          <button
            type="button"
            class="dojo-pb-sort-btn"
            :class="{ 'is-active': sort === 'name' }"
            :aria-pressed="sort === 'name'"
            @click="sort = 'name'"
          >
            按名称
          </button>
        </div>
        <span class="dojo-pb-count">共 {{ shown.length }} 个插件</span>
      </div>

      <div v-if="shown.length" class="dojo-pb-grid">
        <NuxtLink
          v-for="p in shown"
          :key="p.slug"
          :to="`/plugins/${p.slug}`"
          class="dojo-pb-card"
        >
          <span class="dojo-pb-logo" :class="{ 'is-fallback': !hasLogo(p) }">
            <img
              v-if="hasLogo(p)"
              :src="p.image ?? ''"
              alt=""
              loading="lazy"
              decoding="async"
              @error="onLogoError(p.slug)"
            />
            <template v-else>🐋</template>
          </span>
          <span class="dojo-pb-name">
            {{ p.name }}
            <em v-if="p.is_meme" class="dojo-pb-meme">整活</em>
          </span>
          <span class="dojo-pb-desc">{{ p.description_zh }}</span>
          <span class="dojo-pb-stars">⭐ {{ p.stars }}</span>
        </NuxtLink>
      </div>
      <p v-else class="dojo-pb-empty">没有匹配的插件——试试别的关键词</p>
    </div>

    <template #fallback>
      <!-- SSR 静态壳：工具条同外观（不可交互）+ 确定的计数，避免 hydration mismatch -->
      <div class="dojo-pb">
        <p v-if="showLinkHint" class="dojo-pb-hint">👆 点击任意卡片，查看它的主站详情页</p>
        <div class="dojo-pb-bar">
          <span class="dojo-pb-search is-shell" aria-hidden="true"></span>
          <span class="dojo-pb-count">共 {{ limit > 0 ? limit : plugins.length }} 个插件</span>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.dojo-pb {
  margin: 6px 0 18px;
}

/* ---------- 顶部提示 ---------- */
.dojo-pb-hint {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--dojo-text-desc);
}

/* ---------- 工具条：搜索 + 排序 + 计数 ---------- */
.dojo-pb-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.dojo-pb-search {
  flex: 1;
  min-width: 180px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: var(--dojo-radius);
  background: #fff;
  font-family: var(--dojo-font-body);
  font-size: 14px;
  color: var(--dojo-text-primary);
  outline: none;
}
.dojo-pb-search:focus-visible {
  border-color: var(--dojo-brand-450);
  box-shadow: 0 0 0 3px var(--dojo-brand-50);
}
/* SSR 壳里的假搜索框：只占位不交互 */
.dojo-pb-search.is-shell {
  display: inline-block;
  box-sizing: border-box;
}

.dojo-pb-sort {
  display: inline-flex;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: var(--dojo-radius);
  background: #fff;
  overflow: hidden;
}
.dojo-pb-sort-btn {
  border: none;
  background: none;
  padding: 8px 12px;
  font-family: var(--dojo-font-body);
  font-size: 13px;
  color: var(--dojo-text-desc);
  cursor: pointer;
}
.dojo-pb-sort-btn + .dojo-pb-sort-btn {
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}
.dojo-pb-sort-btn:hover,
.dojo-pb-sort-btn:focus-visible {
  color: var(--dojo-brand-deep);
}
.dojo-pb-sort-btn.is-active {
  background: var(--dojo-brand-50);
  color: var(--dojo-brand-deep);
  font-weight: 700;
}

.dojo-pb-count {
  font-size: 13px;
  white-space: nowrap;
  color: var(--dojo-text-desc);
}

/* ---------- 卡片网格：3 列 / 平板 2 列 / 手机 1 列 ---------- */
.dojo-pb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 900px) {
  .dojo-pb-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .dojo-pb-grid {
    grid-template-columns: 1fr;
  }
}

.dojo-pb-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: var(--dojo-radius-lg);
  background: var(--dojo-card);
  box-shadow: var(--dojo-shadow);
  text-decoration: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.dojo-pb-card:hover,
.dojo-pb-card:focus-visible {
  border-color: var(--dojo-brand-450);
  box-shadow: var(--dojo-shadow-hover);
  transform: translateY(-2px);
  text-decoration: none;
}

/* logo：方形小图，没图 / 加载失败换 🐋 占位 */
.dojo-pb-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: var(--dojo-radius);
  background: var(--dojo-brand-50);
  font-size: 22px;
  line-height: 1;
  overflow: hidden;
}
.dojo-pb-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dojo-pb-name {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-family: var(--dojo-font-mono);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--dojo-text-primary);
  word-break: break-all;
}
/* 「整活」小徽标（is_meme） */
.dojo-pb-meme {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(234, 88, 12, 0.1);
  border: 1px solid rgba(234, 88, 12, 0.3);
  font-family: var(--dojo-font-body);
  font-style: normal;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
  color: #c2410c;
}

.dojo-pb-desc {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--dojo-text-desc);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dojo-pb-stars {
  margin-top: auto;
  font-family: var(--dojo-font-mono);
  font-size: 12.5px;
  color: var(--dojo-text-secondary);
}

/* ---------- 空态 ---------- */
.dojo-pb-empty {
  margin: 0;
  padding: 26px 14px;
  border: 1px dashed rgba(0, 0, 0, 0.14);
  border-radius: var(--dojo-radius);
  text-align: center;
  font-size: 13.5px;
  color: var(--dojo-text-desc);
}
</style>
