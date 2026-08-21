// 文档正文渲染：markdown-it（构建期/SSR 同步执行，无高亮库）。
// 链路：原始 content → 规范化（剥来源站面包屑残渣 + 首个 h1）→ 修断栏围栏 →
// 剥 <script>（双保险，html:false 本就把内联 HTML 转义为字面文本）→
// 单遍 parse（h2 加 h2-N 锚点 + 提取本页目录；站内 /docs 链接补 locale 前缀；
// http(s) 外链补 target=_blank rel=noopener）→ 渲染 HTML。
// 代码块输出深色 pre.code-block.lang-xxx（样式见 main.css，与 AppCopyCmd 同底色）。
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: false, linkify: true, breaks: false })

// 围栏块：pre.code-block + 语言 class（不需要语法高亮，仅作样式钩子）
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const info = (token.info || '').trim().split(/\s+/)[0]
  const lang = info ? ` lang-${md.utils.escapeHtml(info)}` : ''
  return `<pre class="code-block${lang}"><code>${md.utils.escapeHtml(token.content)}</code></pre>\n`
}

export interface DocTocItem { id: string; text: string }
export interface RenderedDoc { html: string; toc: DocTocItem[] }

/** 去掉来源站抓下来的导航残渣：开头连续的空行/`- ` 行 + 首个 h1 行（页面模板自己渲染标题） */
export function normalizeDocContent(raw: string): string {
  const lines = raw.split('\n')
  let i = 0
  while (i < lines.length && (lines[i].trim() === '' || lines[i].trim() === '-' || lines[i].startsWith('- '))) i++
  if (i < lines.length && lines[i].startsWith('# ')) i++
  return lines.slice(i).join('\n')
}

/**
 * 修抓取损坏的围栏：``` 后跟空格 + 非 ASCII 文本（正常语言标识是 ASCII），
 * markdown-it 会当成未闭合围栏吞掉后半篇 → 转义为字面反引号。
 */
function fixBrokenFences(s: string): string {
  return s.replace(/^```(?= \S*[^\x00-\x7F])/gm, '\\```')
}

/**
 * 重建抓取时被剥掉管道头的伪表格：源数据里 GFM 表格丢失了行首 `|` 与分隔行，
 * 只剩「表头行 + 数据行」（每行含 " | "，不以 "|" 开头）。
 * 判定条件收紧到：围栏外、≥2 行连续、每行含 " | "、行首非 "|"（真表格全以 "|" 开头），
 * 命中后在表头后补分隔行还原成 GFM 表格。
 */
function rebuildPseudoTables(s: string): string {
  const lines = s.split('\n')
  const out: string[] = []
  let runStart = -1
  let inFence = false
  for (let i = 0; i <= lines.length; i++) {
    const l = i < lines.length ? lines[i] : ''
    if (/^```/.test(l)) inFence = !inFence
    if (i < lines.length && !inFence && l.includes(' | ') && !l.startsWith('|')) {
      if (runStart < 0) runStart = i
      continue
    }
    if (runStart >= 0) {
      if (i - runStart >= 2) {
        for (let j = runStart; j < i; j++) {
          out.push(lines[j])
          if (j === runStart) out.push(Array(lines[j].split(' | ').length).fill('---').join(' | '))
        }
      }
      else {
        for (let j = runStart; j < i; j++) out.push(lines[j])
      }
      runStart = -1
    }
    if (i < lines.length) out.push(l)
  }
  return out.join('\n')
}

/** 剥 <script> 标签（成对与自闭合都处理）；内容是自家数据，此处仅双保险 */
function stripScripts(s: string): string {
  return s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<script\b[^>]*\/?>/gi, '')
}

/** 行内 markdown 标记 → 纯文本（目录/导语用） */
export function docPlainText(s: string): string {
  return s
    .replace(/^#{1,6}\s+/, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 正文第一段（规范化后第一个非空块，跳过标题/围栏）作为导语；也是 SEO description 的取材处 */
export function docLead(raw: string): string {
  const lines = normalizeDocContent(raw).split('\n')
  let start = 0
  for (;;) {
    while (start < lines.length && lines[start].trim() === '') start++
    // 首块若是标题或代码围栏，整块跳过找下一段（如「## 一、路径」当导语没有信息量）
    if (start < lines.length && /^#{1,6} /.test(lines[start])) {
      start++
      while (start < lines.length && lines[start].trim() !== '') start++
      continue
    }
    if (start < lines.length && lines[start].startsWith('```')) {
      start++
      while (start < lines.length && !lines[start].startsWith('```')) start++
      start++
      continue
    }
    break
  }
  let end = start
  while (end < lines.length && lines[end].trim() !== '') end++
  return docPlainText(lines.slice(start, end + 1).join(' '))
}

/**
 * 渲染一篇文档：返回 HTML + 本页目录（h2 级，锚点 id 为 h2-N 序号）。
 * @param raw      数据文件里的 content 原文
 * @param docsBase 当前语言下 /docs 的路由前缀（如 /docs 或 /zh/docs），站内文档链接自动补齐
 */
export function renderDoc(raw: string, docsBase: string): RenderedDoc {
  const content = rebuildPseudoTables(stripScripts(fixBrokenFences(normalizeDocContent(raw))))
  const tokens = md.parse(content, {})

  // 单遍：h2 加序号锚点并同步提取目录；链接改写要走 inline token 的 children
  const toc: DocTocItem[] = []
  let n = 0
  const rewriteLinks = (toks: ReturnType<typeof md.parse>) => {
    for (const tok of toks) {
      if (tok.type === 'link_open') {
        const href = String(tok.attrGet('href') ?? '')
        if (/^https?:\/\//i.test(href)) {
          tok.attrSet('target', '_blank')
          tok.attrSet('rel', 'noopener')
        }
        else if (href.startsWith('/docs/') || href === '/docs') {
          // 站内文档链接：补当前语言前缀，避免点过去掉到默认语言
          tok.attrSet('href', docsBase + href.slice('/docs'.length))
        }
      }
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]
    if (tok.type === 'heading_open' && tok.tag === 'h2') {
      const id = `h2-${++n}`
      tok.attrSet('id', id)
      const inline = tokens[i + 1]
      if (inline?.type === 'inline') toc.push({ id, text: docPlainText(inline.content) })
    }
    else if (tok.type === 'inline' && tok.children?.some(c => c.type === 'link_open')) {
      rewriteLinks(tok.children)
    }
  }

  return { html: md.renderer.render(tokens, md.options, {}), toc }
}
