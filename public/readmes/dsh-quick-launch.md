# dsh-quick-launch 🐳

DeepSeek Harness Web GUI 的桌面快捷方式管理插件：一键创建/更新/删除桌面快捷方式，图标可自定义上传切换。蓝白金鲸鱼悬浮按钮（DeepSeek 鲸鱼标）可拖动，点击旋转 90° 从按钮弹出面板——按钮不消失、不移动。

## 效果预览

![效果预览](https://raw.githubusercontent.com/acebang0303/dsh-quick-launch/205327a2b17ee9ca7836db7554358bb540be8389/docs/preview.png)

## 特性

- 一键创建/更新/删除「deepseek harness桌面快捷方式」（`.lnk`，默认名可自行修改）
- 图标自定义：内置贴纸图标 + 上传 PNG/JPEG（≤ 2.5MB）自动转 `.ico`，即时切换
- 鲸鱼悬浮按钮：点击原地旋转 90° 弹出面板；可拖动定位并记忆位置（localStorage）
- 启动脚本内置 dsh 入口三级解析链（记录真实入口 → PATH 上的 dsh → npx 兜底），兼容任何安装方式
- 双击快捷方式即启动 harness（最小化控制台）并自动打开浏览器；已运行时仅打开浏览器
- 零运行时依赖：宿主 half 纯 Node 内建，客户端 half 纯 DOM 手写（官方 `__ModuleLoader__` 契约），素材内嵌于客户端捆绑包，激活不依赖远程资源
- 仅支持 Windows

## 安装

```sh
git clone https://github.com/acebang0303/dsh-quick-launch
cd <harness>
dsh plugin --profile web add ../dsh-quick-launch
```

重启 web 加载即生效——左下角出现鲸鱼悬浮按钮（点击弹出面板、拖动移动、上传即换图标）。

> 注：本地目录安装路径不能含空格（上游 `dsh plugin` CLI 限制）；git 源不受影响。

## 素材来源与许可

本插件 `assets/` 素材为「鲸鱼娘」角色的衍生创作，以 **CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享）发布，禁止任何商业性使用。

署名链（详见 `NOTICE`）：

- **一创** 上善（[Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili：上善无形](https://b23.tv/8h5L4xz)）——鲸鱼娘角色形象原作者
- **二创** ZipZipPipe（[Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili：ZipZipPipe](https://b23.tv/Pnw6nG8)）——《鲸鱼娘》表情包角色二次设计
- **三创（本插件）** acebang0303 —— 基于角色设定生成的 AI 二创贴纸图（默认图标），二创同协议授权

完整许可文本见 `LICENSE`；素材来源文件在 `assets/`（含 `assets/README.md` 提取声明）。

## 开发与构建

零构建步骤：`lib/` 即分发产物，客户端 `lib/client.js` 为手写 bundle，无需脚手架。

```sh
node --test tests/            # 单元测试（纯逻辑面）
node scripts/e2e-windows.mjs  # Windows 端到端自检（.lnk / PNG→ICO）
node scripts/inject-whale.mjs <favicon.svg>  # 官方更换鲸鱼 logo 后重新注入客户端
```

## 许可

- 素材（`assets/`）：CC BY-NC-SA 4.0，全文见 `LICENSE`，署名链见 `NOTICE` 与 `assets/README.md`
- 代码：MIT License，见 `LICENSE-MIT`
