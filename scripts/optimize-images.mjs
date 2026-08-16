#!/usr/bin/env node
// 压缩 public/images 里被数据文件引用的位图(可重复执行,devDependency: sharp):
//   - PNG/JPG/WebP → WebP q82,长边缩到 ≤1600px(小图只重压不放大)
//   - 动图 GIF → 动画 WebP q70(像素风页头鲸鱼先试无损)
//   - 首页吉祥物单独出 480px 显示副本(dsh-deep-whale-hero.webp);
//     1920px 原图保留给 og:image / favicon 等社交与站点引用
//   - 只有输出更小时才采纳并删除原图,否则原样保留;SVG、favicon(dsh-ui-whale.gif)不动
//   - 同步改写 public/data/*.json 里的 image 字段扩展名
// 硬编码引用(layouts/default.vue 页头、pages/index.vue 吉祥物、pages/meme/index.vue og:image)
// 需要手动跟进,脚本跑完会打印清单。跑完再执行 scripts/set-image-dims.mjs 刷新宽高。
import { readFileSync, writeFileSync, statSync, unlinkSync, existsSync, renameSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import sharp from 'sharp'

const ROOT = resolve(import.meta.dirname, '..')
const DATA = [
  { file: 'public/data/plugins.json', indent: 1 },
  { file: 'public/data/launchers.json', indent: 2 },
]
const LONG_EDGE = 1600
// 页头像素鲸鱼:先无损,压不下去再 q80;只有省 ≥40% 才换(favicon 继续用原 gif)
const HEADER_GIF = '/images/dsh-ui-whale.gif'
const HERO_SRC = '/images/dsh-deep-whale.webp'
const HERO_OUT = '/images/dsh-deep-whale-hero.webp'

const fmt = n => `${(n / 1024).toFixed(0)}KB`

async function toWebp(file, { animated = false, lossless = false, quality = 82 } = {}) {
  // 整文件读进内存:避免 sharp 持有源文件句柄,Windows 上 rename/unlock 才不炸
  const input = readFileSync(file)
  const meta = await sharp(input).metadata()
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0)
  let img = sharp(input, { animated })
  if (longEdge > LONG_EDGE) {
    img = meta.width >= meta.height
      ? img.resize({ width: LONG_EDGE })
      : img.resize({ height: LONG_EDGE })
  }
  // 注意:sharp 实例是 thenable,中途 await 会被解包成 Buffer,所以这里直接把 Buffer 返回出去
  return img.webp(lossless
    ? { lossless: true, effort: 6 }
    : { quality, effort: 5, alphaQuality: 90 }).toBuffer()
}

async function convert(rel, opts = {}) {
  const src = resolve(ROOT, 'public', rel.replace(/^\//, ''))
  const out = src.slice(0, -extname(src).length) + '.webp'
  const buf = await toWebp(src, opts)
  const oldSize = statSync(src).size
  if (buf.length >= oldSize) return { rel, adopted: false, oldSize, newSize: oldSize }
  if (out === src) {
    // webp 原地重压:先写临时文件再覆盖,避免读写同一文件(杀软扫描可能短暂锁文件,重试一次)
    writeFileSync(`${out}.tmp`, buf)
    try {
      renameSync(`${out}.tmp`, out)
    }
    catch {
      await new Promise(r => setTimeout(r, 300))
      renameSync(`${out}.tmp`, out)
    }
  }
  else {
    writeFileSync(out, buf)
    unlinkSync(src)
  }
  return { rel, adopted: true, oldSize, newSize: buf.length }
}

const results = []
const srcOf = rel => resolve(ROOT, 'public', rel.replace(/^\//, ''))

// 1) 数据文件引用的图(JSON 逐条回写,中断后重跑可自动对账:磁盘上已有 .webp 就改引用)
const rewritten = []
for (const { file, indent } of DATA) {
  const abs = resolve(ROOT, file)
  if (!existsSync(abs)) continue
  const data = JSON.parse(readFileSync(abs, 'utf8'))
  const list = data.plugins ?? data.launchers ?? []
  for (const item of list) {
    if (!item.image || extname(item.image) === '.svg') continue
    if (!existsSync(srcOf(item.image))) {
      const alt = item.image.replace(/\.[^.]+$/, '.webp')
      if (existsSync(srcOf(alt))) {
        item.image = alt
        rewritten.push(`${item.image}(reconciled)`)
        writeFileSync(abs, JSON.stringify(data, null, indent) + '\n')
      }
      else {
        console.warn(`  ! ${item.image} not on disk, skip`)
        continue
      }
    }
    if (extname(item.image) === '.webp' && statSync(srcOf(item.image)).size < 100 * 1024) continue
    const animated = extname(item.image) === '.gif'
    const r = await convert(item.image, animated ? { animated: true, quality: 70 } : {})
    results.push(r)
    if (r.adopted) {
      rewritten.push(`${item.image} → ${item.image.replace(/\.[^.]+$/, '.webp')}`)
      item.image = item.image.replace(/\.[^.]+$/, '.webp')
      writeFileSync(abs, JSON.stringify(data, null, indent) + '\n')
    }
  }
}

// 2) 页头像素鲸鱼:数据循环已顺带产出 dsh-ui-whale.webp(动画);这里只在缺失时补一份,原 gif 留给 favicon
{
  const src = resolve(ROOT, 'public', HEADER_GIF.replace(/^\//, ''))
  const out = src.replace(/\.gif$/, '.webp')
  if (existsSync(out)) {
    console.log('· header whale webp already exists, skip')
  }
  else {
    for (const lossless of [true, false]) {
      const buf = await sharp(readFileSync(src), { animated: true }).webp(lossless
        ? { lossless: true, effort: 6 }
        : { quality: 80, effort: 5 }).toBuffer()
      if (buf.length < statSync(src).size * 0.6) {
        writeFileSync(out, buf)
        results.push({ rel: HEADER_GIF, adopted: true, oldSize: statSync(src).size, newSize: buf.length, note: 'header copy (gif kept for favicon)' })
        break
      }
    }
  }
}

// 3) 首页吉祥物 480px 显示副本(og:image 继续用 1920px 原图)
{
  const src = resolve(ROOT, 'public', HERO_SRC.replace(/^\//, ''))
  const out = resolve(ROOT, 'public', HERO_OUT.replace(/^\//, ''))
  if (!existsSync(out)) {
    const buf = await sharp(readFileSync(src)).resize({ width: 480 }).webp({ quality: 85, effort: 5 }).toBuffer()
    writeFileSync(out, buf)
    results.push({ rel: HERO_OUT, adopted: true, oldSize: statSync(src).size, newSize: buf.length, note: 'hero display copy' })
  }
}

let saved = 0
for (const r of results) {
  if (r.adopted) saved += r.oldSize - r.newSize
  console.log(`${r.adopted ? '✓' : '·'} ${r.rel} ${fmt(r.oldSize)} → ${fmt(r.newSize)}${r.note ? ` (${r.note})` : ''}`)
}
console.log(`\nsaved ${fmt(saved)}; JSON rewritten: ${rewritten.length} refs`)
if (rewritten.length) console.log('manual refs to update:\n  layouts/default.vue → /images/dsh-ui-whale.webp (if adopted)\n  pages/index.vue hero <img> → /images/dsh-deep-whale-hero.webp\n  pages/meme/index.vue og:image → dsh-qq2006.webp (if adopted)')
