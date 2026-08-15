// FakeTerminal 的对外类型。独立成 .ts 是因为 <script setup> 里不能 export，
// 而 step 页面要拿 TerminalCommand 给命令表做类型标注（kind 这类字面量联合，
// 不标注会被推宽成 string，vue-tsc 过不去）。
// 注意：必须放在 components/ 之外——Nuxt 会把 components 目录下的 .ts
// 也按组件名扫描（与 FakeTerminal.vue 重名告警）。

export type TermTone = 'ok' | 'err' | 'warn' | 'plain' | 'faint'

/** 单行输出：纯字符串走命令级默认色调，对象可单独指定本行色调（混排 warn 用） */
export type TermOutputLine = string | { text: string; kind?: TermTone }

export interface TerminalCommand {
  /**
   * string：输入与它完全相等、或以它为前缀即命中（声明 exact: true 则只认完全相等，
   * 用于「短命令是错误姿势、长命令才是对的」这类必须区分的场景，见 step-03 的 npx）；
   * RegExp：test 命中。命令表按数组顺序匹配，第一条命中即止——更具体的前缀要放前面。
   */
  match: string | RegExp
  /** 命中后打印的行；空数组 = 真实终端的「无输出」，可配 emptyNote 给淡灰教学提示 */
  output: string | TermOutputLine[]
  /** 本条输出的默认色调；行内对象可覆盖 */
  kind?: TermTone
  /** 输出提问行并进入等待态：下一条输入必须是 y 才打印 output，n 放弃，其他提示重输 */
  ask?: string
  /** 命中即设置一个剧情 flag（when / notWhen 的门控来源） */
  setFlag?: string
  /** 仅当该 flag 已设置时本条才参与匹配 */
  when?: string
  /** 该 flag 已设置时本条不参与匹配 */
  notWhen?: string
  /** output 为空时打印的淡灰说明行 */
  emptyNote?: string
  /** 只认完全相等，不做前缀匹配（仅 string match 有意义） */
  exact?: boolean
}
