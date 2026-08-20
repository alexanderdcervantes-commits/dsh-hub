<div align="center">

<img src="https://raw.githubusercontent.com/GooodWei/arcana/82f910c0b5e645c65c2a34be0b0e47035d0489a7/pic.png" alt="Arcana — 命令甲板" width="100%">

<br>
</div>

<p align="center"><a href="./README.en.md">English</a> · 中文</p>

# Arcana

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

> 把 DeepSeek Harness 的全部斜杠命令做成一块可拖动、可折叠、按使用次数排序的悬浮「命令甲板」。

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供右侧悬浮「命令甲板」，把当前 Harness 支持的所有 `/` 命令（内置的 + 各插件提供的）都列成按钮：悬停看介绍、点击即执行，按使用次数排序，多命令自动分页（每页 10 条）。

## ✨ 特性

- 🔍 **全量命令发现** —— 直接读取 Harness 的命令目录（`remote.commands` RPC），与你在输入框敲 `/` 时看到的候选**完全同源**，内置命令和第三方插件命令一网打尽。
- 🧭 **悬停即见介绍** —— 鼠标停在按钮上，显示该命令的 `description`（与聊天栏提示一致）；带参数的命令还额外显示用法提示。
- ⚡ **点击即执行** —— 无参数命令一键运行；有参数的命令点击后弹出内联输入框，回车运行。
- 🪟 **可拖动、可折叠** —— 拖拽标题栏上下移动（位置记忆）；标题栏右侧「▸/◂」折叠/展开，收起后只留标题栏（同 context-vista）。
- 📊 **按使用次数排序** —— 每个命令的使用次数存本地（localStorage），高频命令自动浮到前面，跨刷新、跨重启保留使用习惯。
- 📄 **每页 10 条分页** —— 命令较多时自动分页翻页，列表区可滚动。
- 🌐 **中英双语** —— 跟随 Harness 语言自动切换。
- 🎨 **纯客户端、零构建** —— 无 host 逻辑、无打包步骤，随主题 `--dsw-*` token 自适应明暗色。

## 🚀 安装

```sh
npx @deepseek-ai/dsh plugin --profile web add github:GooodWei/arcana
npx @deepseek-ai/dsh web
```

> 需先安装 pnpm（`dsh plugin add` 内部会调用它）。已全局安装 dsh 时，`npx @deepseek-ai/dsh` 可简写为 `dsh`。

安装后**重启 DSH**（`dsh --profile web`），右上角即出现命令甲板。

## 🧭 使用

- **运行命令**：点击某个命令按钮，无参数命令立即执行；带参数的命令（如 `/resume-claude`）会弹出输入框，填完回车运行。
- **查看介绍**：悬停在按钮上，看完整描述与用法。
- **翻页**：底部 `‹ 1/3 ›` 前后翻页，每页 10 条。
- **拖动**：按住标题栏上下拖动，位置自动记忆。
- **折叠/展开**：点标题栏右侧「▸/◂」折叠或展开；收起后只留标题栏。
- **排序**：命令按使用次数降序排列（同次数按名称），使用次数越多越靠前。

## 🗂 项目结构

```
package.json          npm 元数据 + dsh.client 声明
cordis.patch.yml      bundle 声明（插入 host 行）
lib/index.js          空 host 半（纯客户端插件）
lib/client.js         客户端半：命令枚举 + 悬浮甲板 + 分页
README.md / README.en.md  中英双语说明
```

## 🛠 兼容性

- 面向 `dsh 0.1.0-rc.6`（web profile）。
- 纯客户端实现，不修改 DSH 引擎；只消费公开的 `remote.commands`、`sessions`、`slots`、`locale` 服务。

## 📄 License

MIT
