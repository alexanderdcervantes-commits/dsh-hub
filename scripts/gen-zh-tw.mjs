#!/usr/bin/env node
// 繁體中文(zh-TW)生成器：以简体 zh 为唯一源，OpenCC s2twp 词组级转换——
//   1. i18n/locales/zh.json  → i18n/locales/zh-TW.json（UI 全量文案）
//   2. public/data/plugins.json / launchers.json → 原位注入 *_zh_TW 数据字段
// 幂等：每次都从 *_zh 源字段重新转换，重跑结果稳定；zh 侧更新后重跑本脚本即可同步。
// 产物提交进仓库，运行时零依赖（不打包 opencc-js）。
import { readFileSync, writeFileSync } from 'node:fs'
import OpenCC from 'opencc-js'

const convert = OpenCC.Converter({ from: 'cn', to: 'twp' })

// OpenCC 词典覆盖不到或不符合本站语气的词，转换后按序替换。
// 只放「简繁同形但两岸用法不同」或词典误转的词，别放 OpenCC 已能处理的常规词。
const OVERRIDES = [
  // 例：[/软件/g, '軟體'] —— s2twp 已内置，无需重复
  [/這周/g, '這週'],
]

function tw(text) {
  let out = convert(text)
  for (const [re, to] of OVERRIDES) out = out.replace(re, to)
  return out
}

/** 递归转换 JSON 对象的所有字符串 value（key 不动，占位符 {n} 等原样保留） */
function convertDeep(node) {
  if (typeof node === 'string') return tw(node)
  if (Array.isArray(node)) return node.map(convertDeep)
  if (node && typeof node === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(node)) out[k] = convertDeep(v)
    return out
  }
  return node
}

function writeJson(path, data, indentSourcePath = path) {
  writeFileSync(path, `${JSON.stringify(data, null, indentOf(indentSourcePath))}\n`, 'utf8')
  console.log(`✓ ${path}`)
}

/** 保持源文件缩进（plugins.json 是 1 空格、其余 2 空格），避免无谓的全文件 diff */
function indentOf(path) {
  const raw = readFileSync(path, 'utf8')
  const m = raw.match(/^([ ]+)"/m)
  return m ? m[1].length : 2
}

// 1. UI 文案：zh.json → zh-TW.json
const zhUi = JSON.parse(readFileSync('i18n/locales/zh.json', 'utf8'))
writeJson('i18n/locales/zh-TW.json', convertDeep(zhUi), 'i18n/locales/zh.json')

// 2. 插件数据：由 *_zh 派生 *_zh_TW（有值才写字段，保持 JSON 干净）
const pluginsData = JSON.parse(readFileSync('public/data/plugins.json', 'utf8'))
for (const p of pluginsData.plugins) {
  p.description_zh_TW = tw(p.description_zh)
  p.category_zh_TW = tw(p.category_zh)
  if (p.meme_caption_zh) p.meme_caption_zh_TW = tw(p.meme_caption_zh)
}
writeJson('public/data/plugins.json', pluginsData)

// 3. 启动器数据：同上
const launchersData = JSON.parse(readFileSync('public/data/launchers.json', 'utf8'))
for (const l of launchersData.launchers) {
  l.description_zh_TW = tw(l.description_zh)
  l.highlights_zh_TW = l.highlights_zh.map(tw)
  if (l.platform_note_zh) l.platform_note_zh_TW = tw(l.platform_note_zh)
}
writeJson('public/data/launchers.json', launchersData)

console.log('✓ zh-TW 生成完成（UI + plugins + launchers）')
