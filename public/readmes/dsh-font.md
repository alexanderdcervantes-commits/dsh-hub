# dsh-font

为 DeepSeek Harness Web GUI 换字体的插件：**99 个界面字体 + 31 个代码字体**，
中文（黑体/宋体/楷仿/手写创意）+ 西文（衬线/无衬线/展示）全分组覆盖，
中西文自动搭配，即选即生效，刷新不丢。

- 界面字体（改 `--dsw-font-family`）：正文、按钮、侧边栏、标题、菜单
- 代码字体（改 `--ds-font-family-code`）：代码块、终端、JSON 树、diff

## 安装

```powershell
# 1. 在 web profile 的 package.json 中注册（dependencies + dsh.profile.bundles）
# 2. 在 profile 目录安装
cd $env:USERPROFILE\.dsh\profiles\web
pnpm install --no-frozen-lockfile
# 3. 重启 dsh web，然后在 设置 → 常规 → 字体 中选择
```

## 使用

打开 **设置 → 常规**，找到「字体」行：

- **界面字体**：99 个选项，按下拉分组：默认 / 中文黑体 / 中文宋体 /
  中文楷体仿宋 / 中文手写创意 / 西文衬线 / 西文无衬线 / 西文展示手写
- **代码字体**：31 个选项（默认 / 30 个等宽）
- 下拉选项以各自字体渲染，下方有实时预览条；选择立即全局生效
- 「默认」恢复内置字体

## 字体清单

### 界面字体 — 中文 · 黑体（29）

微软雅黑、思源黑体、鸿蒙黑体、苹方、阿里巴巴普惠体、小米 MiSans、
OPPO Sans、vivo Sans、荣耀 Honor Sans、得意黑、站酷快乐体、站酷文艺体、
站酷小薇 LOGO 体、站酷高端黑、站酷庆科黄油体、优设标题黑、庞门正道标题体、
钉钉进步体、方正黑体、方正中等线、方正兰亭黑、方正准圆、汉仪旗黑、汉仪文黑、
华文细黑、更纱黑体 Sarasa UI SC、黑体、等线、幼圆

### 界面字体 — 中文 · 宋体（8）

宋体、思源宋体、华文中宋、方正小标宋简体、方正书宋简体、
京华老宋体、悠哉明朝、装甲明朝

### 界面字体 — 中文 · 楷体仿宋（8）

楷体、华文楷体、仿宋、仿宋_GB2312、方正仿宋简体、朱雀仿宋、
霞鹜文楷、孤鹜别体

### 界面字体 — 中文 · 手写创意（11）

华文行楷、华文琥珀、华文彩云、隶书、方正卡通体、方正综艺体、
阿里巴巴刀隶体、汉仪尚巍手书、演示春风楷、沐瑶随心手写体、沐瑶软笔手写体

### 界面字体 — 西文 · 衬线（14）

Times New Roman、Cambria、Georgia、Garamond、Palatino Linotype、
Book Antiqua、Baskerville、Didot、Bodoni MT、Goudy Old Style、
Rockwell、Century Schoolbook、Bookman Old Style、Constantia

### 界面字体 — 西文 · 无衬线（19）

Arial、Calibri、Verdana、Tahoma、Segoe UI、Helvetica、Trebuchet MS、
Futura、Century Gothic、Gill Sans、Franklin Gothic、Lucida Sans、Candara、
Corbel、Optima、Avant Garde、Geneva、Arial Narrow、Bahnschrift

### 界面字体 — 西文 · 展示手写（9）

Comic Sans MS、Brush Script MT、Lucida Handwriting、Segoe Script、
Segoe Print、Copperplate、Impact、Arial Black、Papyrus

### 代码字体（30 个等宽）

Consolas、Cascadia Code、Cascadia Mono、JetBrains Mono、Fira Code、
Fira Mono、Source Code Pro、IBM Plex Mono、Roboto Mono、Ubuntu Mono、
Inconsolata、Hack、Droid Sans Mono、DejaVu Sans Mono、Liberation Mono、
PT Mono、Space Mono、Victor Mono、Iosevka、Maple Mono、SF Mono、Menlo、
Monaco、Meslo、Courier New、Cousine、更纱黑体 Sarasa Mono SC、
等距更纱黑体 Sarasa Term SC、思源等宽 Noto Sans Mono、霞鹜文楷等宽

## 原理

Web shell 的所有字号 token（`--dsw-font-*`、`--dsw-font-markdown-*`）都引用
`:root` 上的两个变量；插件注入一个 `<style>` 覆盖这两个变量，一处生效、全局换肤，
不打包任何字体文件、不联网、不涉及付费字体。选择存于 localStorage
（`dsh-font:ui` / `dsh-font:code`）。

## License / 字体授权声明

- 本插件**不包含任何字体文件**，仓库中只有代码与字体名称字符串；
  字体名称引用（`font-family`）是行业标准做法，不构成对字体版权的复制或分发。
- 列表中的字体由**用户自行安装**，实际渲染使用用户本机已安装的字体；
  各字体的使用授权（尤其商用场景）由用户自行确认与负责。
- 字体授权速览（仅作提示，以各家官方协议为准）：
  - **开源可再分发**（OFL/Apache 等）：思源黑体/宋体、霞鹜文楷、得意黑、
    更纱黑体、孤鹜别体、朱雀仿宋、Cascadia Code、JetBrains Mono、Fira Code、
    IBM Plex、Source Code Pro、Iosevka、Maple Mono 等；
  - **免费商用（打包需遵守各家协议）**：MiSans、OPPO Sans、vivo Sans、
    HarmonyOS Sans、阿里巴巴普惠体、钉钉进步体、站酷系列、优设标题黑、
    演示/沐瑶系列等；
  - **不可再分发（随系统/Office 授权，商用需评估）**：方正全系、汉仪全系、
    华文全系、微软雅黑/宋体/黑体/仿宋/楷体/等线等系统字体、
    Times New Roman / Arial / Calibri 等 Office 字体、SF Mono / Menlo / Monaco。

## 开发

```powershell
node --check client.js   # 语法检查（零构建，手写 CJS bundle）
```

- `cordis.patch.yml` — host 侧 loader 入口（`id: font`）
- `index.js` — host 半部（no-op）
- `client.js` — 浏览器半部（全部功能）
