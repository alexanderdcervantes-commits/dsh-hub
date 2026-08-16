#!/usr/bin/env node
// 读取 public/data/plugins.json 里每条 image 的真实尺寸,回填 image_w / image_h。
// 组件 <img :width :height> 用它预留布局,消灭详情页大图加载引起的 CLS。
// 纯 Node 实现(不引依赖):PNG 读 IHDR,GIF 读逻辑屏幕,JPEG 扫 SOFn,WebP 读 VP8X/VP8/VP8L。
// build:data 之后链式执行,保证再生成数据时字段不丢。
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
// 与各数据文件既有缩进保持一致,避免整文件 diff
const TARGETS = [
  { file: 'public/data/plugins.json', indent: 1 },
  { file: 'public/data/launchers.json', indent: 2 },
]

/** @returns {{w:number,h:number}|null} */
function imageSize(buf) {
  // PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR(width u32be @16, height u32be @20)
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  }
  // GIF87a/GIF89a: width u16le @6, height u16le @8
  if (buf.length > 10 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) }
  }
  // JPEG: 逐段扫描,取第一个 SOFn(C0-CF,除 C4/C8/CC)里的高/宽
  if (buf.length > 4 && buf[0] === 0xFF && buf[1] === 0xD8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xFF) { i++; continue }
      const marker = buf[i + 1]
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
      }
      const size = buf.readUInt16BE(i + 2)
      if (size <= 0) break
      i += 2 + size
    }
    return null
  }
  // SVG: width/height 属性,退回 viewBox(launchers 里的 dsh-web-desktop.svg 等)
  if (buf.length > 5 && buf[0] === 0x3C /* < */) {
    const head = buf.toString('utf8', 0, Math.min(buf.length, 600))
    const tag = head.match(/<svg[^>]*>/)?.[0] ?? ''
    const num = (s) => Number.parseFloat(String(s).replace(/px$/, ''))
    const w = num(tag.match(/\bwidth="([\d.]+)/)?.[1] ?? tag.match(/\bwidth='([\d.]+)/)?.[1] ?? NaN)
    const h = num(tag.match(/\bheight="([\d.]+)/)?.[1] ?? tag.match(/\bheight='([\d.]+)/)?.[1] ?? NaN)
    if (Number.isFinite(w) && Number.isFinite(h)) return { w, h }
    const vb = tag.match(/viewBox=["']\s*([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/)
    if (vb) return { w: Number(vb[3]), h: Number(vb[4]) }
    return null
  }
  // WebP: RIFF....WEBP,按子块 FOURCC 分派
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fourcc = buf.toString('ascii', 12, 16)
    if (fourcc === 'VP8X') {
      // canvas 宽-1 / 高-1,各 24bit LE
      const w = 1 + (buf[24] | buf[25] << 8 | buf[26] << 16)
      const h = 1 + (buf[27] | buf[28] << 8 | buf[29] << 16)
      return { w, h }
    }
    if (fourcc === 'VP8 ') {
      // 关键帧:3bit 保留 + 14bit 宽 @26,14bit 高 @28
      return { w: buf.readUInt16LE(26) & 0x3FFF, h: buf.readUInt16LE(28) & 0x3FFF }
    }
    if (fourcc === 'VP8L') {
      // signature 0x2F 后:14bit 宽、14bit 高(含 1bit alpha 缩放),均 LE 位序
      const b = buf.readUInt32LE(21)
      return { w: (b & 0x3FFF) + 1, h: ((b >> 14) & 0x3FFF) + 1 }
    }
    return null
  }
  return null
}

let missing = 0
for (const { file: rel, indent } of TARGETS) {
  const file = resolve(ROOT, rel)
  let data
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  }
  catch {
    console.log(`skip ${rel} (not found or invalid JSON)`)
    continue
  }
  const list = Array.isArray(data.plugins) ? data.plugins
    : Array.isArray(data.launchers) ? data.launchers
    : null
  if (!list) { console.log(`skip ${rel} (no plugins/launchers array)`); continue }

  for (const item of list) {
    if (!item.image) continue
    try {
      const size = imageSize(readFileSync(resolve(ROOT, 'public', String(item.image).replace(/^\//, ''))))
      if (size && size.w > 0 && size.h > 0) {
        item.image_w = size.w
        item.image_h = size.h
      }
      else {
        missing++
        console.warn(`  ? cannot parse ${item.image}`)
      }
    }
    catch (e) {
      missing++
      console.warn(`  ! missing ${item.image}: ${e.code ?? e.message}`)
    }
  }
  writeFileSync(file, JSON.stringify(data, null, indent) + '\n')
  console.log(`${rel}: dims written for ${list.filter(x => x.image_w).length}/${list.filter(x => x.image).length} entries`)
}
process.exit(missing ? 1 : 0)
