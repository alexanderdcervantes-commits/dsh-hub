// DojoQuiz 的对外类型。独立成 .ts 的原因同 types/dojo-terminal.ts：
// <script setup> 里不能 export，而 step 页面要拿 QuizQuestion 给题表做类型标注。
// 注意：必须放在 components/ 之外——Nuxt 会把 components 目录下的 .ts
// 也按组件名扫描（与 DojoQuiz.vue 重名告警）。

export interface QuizQuestion {
  q: string
  options: string[]
  /** 正确选项下标，从 0 计 */
  answer: number
  explain: string
}
