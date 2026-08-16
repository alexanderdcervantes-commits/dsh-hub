#!/usr/bin/env python3
"""Build public/data/plugins.json for DSH Meme Hub.

Merges two existing sources (do NOT re-crawl them):
  1. /root/china-ai-arbitrage/public/data/dsh-plugins.json  — 87 catalogued plugins
  2. /root/dsh-meme-hub README.zh-CN.md / README.md          — 29 curated meme picks

Then (optional, --enrich) refreshes stars/pushed_at/license/topics via `gh api`
and checks manifest existence (dsh.bundle / cordis.yml at repo root).

Output schema: see types in composables/usePlugins.ts.
"""
import json
import subprocess
import sys
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARBITRAGE = Path('/root/china-ai-arbitrage/public/data/dsh-plugins.json')
OUT = ROOT / 'public/data/plugins.json'

# meme_section → (category_zh, category_en)
SECTION_CATEGORY = {
    'absurd':   ('抽象整活', 'Peak Absurdity'),
    'skins':    ('换皮肤色', 'Skins & Themes'),
    'pets':     ('赛博宠物', 'Cyber Pets'),
    'slackoff': ('摸鱼游戏', 'Slack-Off Zone'),
    'useful':   ('生产力工具', 'Actually Useful'),
    'textclub': ('文字选手', 'Words Only'),
}

# The 29 curated picks from dsh-meme-hub.
# desc: the main one-liner; caption: the punchy italic sub-caption (both langs).
# tag: for textclub entries, the hint label from the README (overrides category).
MEME = [
  dict(slug='dsh-ads', name='dsh-ads', repo='Nagi-ovo/dsh-ads', section='absurd',
       image='/images/dsh-ads.webp',
       desc_zh='把 DSH 变成 2005 年的中文门户网站：贪玩蓝鲸、财神鲸抽奖、假杀毒、角落弹窗全套，关闭叉的热区还比看起来小得多',
       desc_en='"Bro, come kick me!" Turns DSH into a 2005-era Chinese web portal: knockoff web-game banners, a God-of-Wealth jackpot wheel, fake antivirus popups, corner ads — and a close button whose hitbox is smaller than it looks',
       caption_zh='侧栏、对话、角落全塞满——但模型一直在后台干活，只是回答前得先看广告',
       caption_en='Sidebar, chat, corners — all stuffed. The model keeps working in the background; your answers just have to sit through the ads first'),
  dict(slug='dsh-group-photo', name='dsh-group-photo', repo='SenmuuuuW/dsh-group-photo', section='absurd',
       image='/images/dsh-group-photo.jpg',
       desc_zh='DSH 内测收官之夜的拍立得合影墙：GitHub 零权限登录 + 冻结白名单校验，入镜一次，常驻墙上',
       desc_en="The Polaroid wall from DSH beta's closing night: GitHub OAuth with zero scopes + a frozen whitelist. Pose once, stay on the wall forever",
       caption_zh='内测最后一晚的纪念作品：每人一张拍立得，附一句留言',
       caption_en='One Polaroid per person, one parting note each — the last night of the beta'),
  dict(slug='dsh-qq2006', name='dsh-qq2006', repo='LaplaceYoung/dsh-qq2006', section='absurd',
       image='/images/dsh-qq2006.gif',
       desc_zh='把 DSH Web UI 完整改造成 QQ2006 客户端：357 份腾讯原版素材，换肤、音效、登录窗全真实，1561 个测试全绿',
       desc_en="DSH's web UI fully remodeled into a QQ 2006 client: 357 period-authentic assets, working skins, sound effects and login dialogs — with 1,561 tests all green",
       caption_zh='一秒钟梦回 2006——你的童年 DNA 动了吗',
       caption_en="One second and you're back in 2006. Childhood DNA, activate"),
  dict(slug='dsh-deepcel', name='dsh-deepcel', repo='Small-tailqwq/dsh-deepcel', section='absurd',
       image='/images/dsh-deepcel.webp',
       desc_zh='把 DSH 变成 Deepcel 工作簿：会话、工具、设置全部重构成可交互单元格，模型这次是真的在填表',
       desc_en='DSH rebuilt as a spreadsheet: sessions, tools and settings all reconstructed as interactive cells. The model is literally filling out a form this time',
       caption_zh='亮色暗色双模式，单元格交互拉满——老板看了直呼内行',
       caption_en='Light and dark modes, full cell interactions — your boss would approve'),
  dict(slug='dsh-deep-whale', name='dsh-deep-whale', repo='Small-tailqwq/dsh-deep-whale', section='skins',
       image='/images/dsh-deep-whale.webp',
       desc_zh='鲸鱼娘皮肤系列「深海女仆工坊 maid-atelier」：双女仆看店、深海蓝蕾丝界面 + Q 版侧栏，CC BY-NC-SA 4.0',
       desc_en='Whale-girl skin series "Deep-Sea Maid Atelier" (maid-atelier): two maids tending the shop, deep-sea-blue lace UI + chibi sidebar, CC BY-NC-SA 4.0',
       caption_zh='亮暗双模式，蕾丝边深海蓝——鲸鱼娘的排面',
       caption_en='Light and dark modes, lace-trimmed deep-sea blue — the whale girl deserves nothing less'),
  dict(slug='dsh-plugin-background', name='dsh-plugin-background', repo='gameswu/dsh-plugin-background', section='skins',
       image='/images/dsh-plugin-background.png',
       desc_zh='VSCode background 插件的 DSH 版：对话区 / 轨迹区 / 侧边栏 / 设置页四区域各自配背景，支持 GIF 与静音视频轮播',
       desc_en="The DSH port of VSCode's background extension: independent backgrounds for chat / trace / sidebar / settings, with GIF and muted-video rotation",
       caption_zh='每张图独立配置透明度、模糊和轮播，切图还带交叉淡入',
       caption_en='Per-image opacity, blur and rotation; crossfade transitions included'),
  dict(slug='gal-view', name='gal-view', repo='Ayase34/gal-view', section='skins',
       image='/images/gal-view.jpg',
       desc_zh='把会话界面一键切成 Galgame：16:9 舞台 + 鲸鱼娘女仆立绘 + 华丽对话框 + 打字机台词，还自带场景可视化编辑器，拖拽换图层实时同步回游戏模式',
       desc_en='Turn the chat screen into a visual novel: 16:9 stage, whale-girl maid sprite, ornate dialogue box, typewriter lines — plus a drag-and-drop scene editor that syncs straight back into play mode',
       caption_zh='DeepSeek 化身蓝发鲸鱼女仆，「所以主人要多对我说话才好」',
       caption_en='DeepSeek as a blue-haired whale maid: "Please talk to me more, master"'),
  dict(slug='whale-girl', name='whale-girl', repo='vlln/whale-girl', section='pets',
       image='/images/whale-girl.gif',
       desc_zh='QQ 宠物形态的鲸鱼娘：可拖拽、投喂、玩耍，完成任务攒资历、升称号、存回忆；任务失败还会失落',
       desc_en='A whale girl in full QQ-Pet form: draggable, feedable, playable with. Finished tasks rack up seniority, titles and memories — and she sulks when one fails',
       caption_zh='15 种状态全套：眨眼、散步、打盹、欢呼、受惊——她真的在陪你上班',
       caption_en='15 states: blinking, wandering, napping, cheering, startled — she really is working alongside you'),
  dict(slug='dsh-ui-whale', name='dsh-ui-whale', repo='lhh010/dsh-ui-whale', section='pets',
       image='/images/dsh-ui-whale.gif',
       desc_zh='会话标题栏常驻一只全手绘像素鲸鱼：眨眼、摆尾、思考流动画、回合完成喷水、点击冒爱心，零核心改动',
       desc_en='A fully hand-drawn pixel whale living in the session title bar: blinking, tail swishing, thinking animation, a water spout when a turn finishes, hearts when you click her — zero core modifications',
       caption_zh='空闲 10 秒还会打瞌睡，尾巴一帧一帧摆',
       caption_en='Dozes off after 10 idle seconds, tail swishing frame by frame'),
  dict(slug='dsh-pet', name='dsh-pet', repo='FlytoMAYDAY80/dsh-pet', section='pets',
       image='/images/dsh-pet.png',
       desc_zh='macOS 有声桌宠小鲸鱼：悬浮窗常驻置顶、跨全屏可见，不打开 DSH 也能实时感知会话状态',
       desc_en='A little whale desktop pet for macOS, with sound: always-on-top floating window, visible across fullscreen apps, senses session state even when DSH isn\'t open',
       caption_zh='会话在跑、等你审批、任务做完——余光即得，还带声音',
       caption_en='Running, awaiting approval, task done — peripheral vision is enough, and it comes with sound'),
  dict(slug='dsh-plugin-pet-rs', name='dsh-plugin-pet-rs', repo='HuanLinOTO/dsh-plugin-pet-rs', section='pets',
       image='/images/dsh-plugin-pet-rs.png',
       desc_zh='同一只鲸鱼的 Rust 重写：从约 100MB 干到目标 10MB 以内，Windows / macOS / Linux 三端通吃',
       desc_en='The same whale, rewritten in Rust: from ~100MB down to a sub-10MB target, covering Windows / macOS / Linux',
       caption_zh='5 态像素鲸鱼 + 状态气泡；作者 CI 额度跑不起了，请自行构建',
       caption_en='5-state pixel whale + status bubbles. The author burned through their CI quota — build it yourself'),
  dict(slug='dsh-gomoku', name='dsh-gomoku', repo='omdsh-dev/dsh-gomoku', section='slackoff',
       image='/images/dsh-gomoku.png',
       desc_zh='在 DSH 侧边栏和 AI 杀一盘 15×15 五子棋：没有任何搜索算法，每步都是纯 LLM 推理；双 AI 对战还能围观两个模型互相厮杀',
       desc_en="Gomoku against the AI in DSH's sidebar: zero search algorithms, every move is pure LLM reasoning. Dual-AI mode lets you spectate two models trying to destroy each other",
       caption_zh='黑白双方的模型和思考档位可以分开调教，棋盘随手开关，摸鱼正事两不误',
       caption_en='Models and thinking budgets configurable per side; the board toggles in and out — slack off and stay productive, both at once'),
  dict(slug='dsh-web-ui', name='dsh-web-ui', repo='zhu1090093659/dsh-web-ui', section='useful',
       image='/images/dsh-web-ui.png',
       desc_zh='DSH Web UI 插件与皮肤大礼包。任务看板、Git 图谱、右侧面板、手机扫码远程接管、远程连接、鲸鱼娘桌宠、实时 token 统计、皮肤中心，可单独安装也可聚合安装',
       desc_en='The big collection of DSH Web UI plugins and skins: task board, Git graph, right panel, mobile remote control, whale-girl pet, live token stats, skin center. Install piecemeal or all at once',
       caption_zh='任务看板支持 cron 定时执行，手机扫码就能远程接管工作区',
       caption_en='The task board runs on cron schedules; scan a QR code from your phone to take over the workspace'),
  dict(slug='dsh-cc-tui', name='dsh-cc-tui', repo='ccch1mneyyy/dsh-cc-tui', section='useful',
       image='/images/dsh-cc-tui.png',
       desc_zh='官方还没出 TUI？社区先造了一个：Claude Code 风格全屏终端，像素鲸鱼顶栏、实时工作状态行、思考流式展开、双击 Esc 时间回溯，被官方公众号收录',
       desc_en='No official TUI yet? The community built one first: a Claude Code-style fullscreen terminal with a pixel-whale header, live status line, streaming thought expansion, double-Esc time travel — featured by the official WeChat account',
       caption_zh='蓝白上下文进度条 + TPS 仪表，纯插件挂载，零核心改动',
       caption_en='Blue-and-white context progress bar + TPS gauge; mounts as a pure plugin, zero core changes'),
  dict(slug='dsh-tianshu-tui', name='dsh-tianshu-tui', repo='huiliyi37/dsh-tianshu-tui', section='useful',
       image='/images/dsh-tianshu-tui.jpg',
       desc_zh='在官方 TUI 扩展之上做 harness 级定制：TDD 驱动的 agent 工作流、证据门交付、图像/视觉桥接、语义代码检索。渲染核心演化自 Tianshu-Tui，纯表现层设计',
       desc_en='Harness-level customization on top of the official TUI extension: TDD-driven agent workflows, evidence-gate delivery, image/vision bridging, and semantic code retrieval. Rendering core evolved from Tianshu-Tui with a pure presentation layer',
       caption_zh='只看不碰：agent 该干嘛干嘛，界面负责好看',
       caption_en="Look, don't touch: the agent does its thing, the interface looks good doing nothing"),
  dict(slug='dsh-visualize', name='dsh-visualize', repo='Nagi-ovo/dsh-visualize', section='useful',
       image='/images/dsh-visualize.webp',
       desc_zh='DSH 不必只用文字回答：模型调用 visualize，交互式 HTML 卡片直接画进会话流，模拟器、图表、UI 原型都行',
       desc_en="DSH answers don't have to be text: the model calls `visualize` and interactive HTML cards render straight into the chat stream — simulators, charts, UI prototypes, all fair game",
       caption_zh='dsh-ads 作者唯一一条正经广告',
       caption_en="The dsh-ads author's one legitimate advertisement"),
  dict(slug='dsh-milestone', name='dsh-milestone', repo='SnowCrescenter-tech/dsh-milestone', section='useful',
       image=None,
       desc_zh='会话里程碑导航条：右侧点状时间线，像看 Git 提交图一样一眼定位每次提问，一键跳转任何位置',
       desc_en='A milestone rail for your conversation: dotted timeline on the right, read it like a Git commit graph, jump to any question in one click',
       caption_zh='会话越长越香：每次提问都是一个可跳转的节点',
       caption_en='Gets better the longer the session: every question becomes a jumpable node'),
  dict(slug='dsh-focus-chat', name='dsh-focus-chat', repo='dingyi222666/dsh-focus-chat', section='useful',
       image='/images/dsh-focus-chat.png',
       desc_zh='给 dsh 加一个「聚焦会话」视图：屏蔽过程噪音，只看最终产出',
       desc_en='A "focus chat" view for dsh: silence the process noise, show only final outputs',
       caption_zh='左边是日常，右边是专注——只看结果的极简模式',
       caption_en='Everyday on the left, focused on the right — a minimal mode for results-only readers'),
  dict(slug='dsh-web-review', name='dsh-web-review', repo='CanglongCl/dsh-web-review', section='useful',
       image='/images/dsh-web-review.jpg',
       desc_zh='像设计工具一样在内置浏览器里圈选元素、写批注、临时调视觉，确认后 Agent 照着批注直接改前端源码',
       desc_en='Review web pages like a design tool: circle elements in the built-in browser, annotate, tweak visuals on the fly — then the Agent edits the frontend source to match your annotations',
       caption_zh='设计师式提需求：圈哪里改哪里',
       caption_en='Give feedback like a designer: circle it, change it'),
  dict(slug='dsh-sticky-note', name='dsh-sticky-note', repo='Meredith2328/dsh-sticky-note', section='useful',
       image='/images/dsh-sticky-note.png',
       desc_zh='编辑框工具栏上的便签：随手记点子，自动保存为 Markdown，一键发送到对话',
       desc_en='Sticky notes on the composer toolbar: jot ideas as you go, auto-saved as Markdown, one click to send into the conversation',
       caption_zh='灵感比会话跑得快，先记下来再说',
       caption_en='Inspiration runs faster than the session — write it down first'),
  dict(slug='dsh-better-sidebar', name='DSH-better-sidebar', repo='omdsh-dev/DSH-better-sidebar', section='textclub', tag='workhorse',
       image=None,
       desc_zh='一个插件一套完整工作台：文件管理、编辑预览、内嵌浏览器、真实终端、Git 面板、后台任务全都有，还支持三方拓展注册新 Tab',
       desc_en='One plugin, one complete workbench: file manager, edit preview, embedded browser, real terminal, Git panel, background tasks — and third-party plugins can register new tabs',
       caption_zh='官方侧边栏看哭：这才叫工作台',
       caption_en="Makes the stock sidebar cry: this is what a workbench looks like"),
  dict(slug='ui-status-label', name='ui-status-label', repo='alingalingling/ui-status-label', section='textclub', tag='skin',
       image=None,
       desc_zh='把你鲸鱼娘思考时的 deep diving 自定义成任意你想要的样子，一行设置搞定',
       desc_en='Customize your whale girl\'s "deep diving" thinking status to literally anything you want. One setting line',
       caption_zh='deep diving？不，现在她是「潜入深海寻找答案中」',
       caption_en='Deep diving? No — she is now "descending into the abyss for answers"'),
  dict(slug='dsh-minigames', name='dsh-minigames', repo='lhh010/dsh-minigames', section='textclub', tag='slackoff',
       image=None,
       desc_zh='右侧小游戏面板，18 款离线游戏全 Canvas 手绘：恐龙跳一跳、俄罗斯方块、坦克大战（带 AI）、扫雷、2048、数独、吃豆人……',
       desc_en='A mini-games panel on the right: 18 offline games, all hand-drawn on canvas — dino jump, Tetris, tank battle (with AI), Minesweeper, 2048, Sudoku, Pac-Man…',
       caption_zh='等了 18 款游戏的人不该没有图',
       caption_en='the people who waited for 18 games deserved at least one screenshot'),
  dict(slug='deepseek-harness-themes', name='deepseek-harness-themes', repo='orxz/deepseek-harness-themes', section='textclub', tag='skin',
       image=None,
       desc_zh='社区维护的主题合集：只动颜色和外观，不碰模型与 agent —— One harness. Multiple styles.',
       desc_en='Community-maintained theme collection: colors and looks only, never touching models or agents — One harness. Multiple styles.',
       caption_zh='One harness, multiple styles，多少有点信仰了',
       caption_en='One harness, multiple styles — borderline religious'),
  dict(slug='dsh-skin', name='dsh-skin', repo='KinGao294/dsh-skin', section='textclub', tag='skin',
       image=None,
       desc_zh='Codex 精神续作款皮肤切换器：7 套精选配色 + 自定义壁纸，设置里多两行就完事',
       desc_en='The spiritual-successor-to-Codex skin switcher: 7 curated palettes + custom wallpaper. Two lines in settings, done',
       caption_zh='设置里多两行就完事，皮肤党的极简浪漫',
       caption_en='Two lines in settings, done — minimalist romance for skin people'),
  dict(slug='dsh-balance-meter', name='dsh-balance-meter', repo='Ghost011118/dsh-balance-meter', section='textclub', tag='workhorse',
       image=None,
       desc_zh='作曲栏实时显示 DeepSeek 账户余额 + 本会话花费，每 6 小时自动拉官方价目表，峰谷调价也不慌',
       desc_en='Live DeepSeek account balance + this session\'s spend in the composer dock; refreshes from the official price sheet every 6 hours, peak/off-peak changes included',
       caption_zh='看着余额往下掉，打字都谨慎了',
       caption_en='Watching the balance drop makes you type more carefully'),
  dict(slug='dsh-spotlight', name='dsh-spotlight', repo='0xsline/dsh-spotlight', section='textclub', tag='workhorse',
       image=None,
       desc_zh='键盘优先的命令面板：斜杠命令、最近会话、界面操作、插件设置，一个面板全都有',
       desc_en='A keyboard-first command palette: slash commands, recent sessions, UI actions, plugin settings — one panel for all of it',
       caption_zh='Mac 用户狂喜：dsh 也有 Spotlight 了',
       caption_en='Mac users rejoice: dsh has a Spotlight now'),
  dict(slug='dsh-web-archive', name='dsh-web-archive', repo='renat3u/dsh-web-archive', section='textclub', tag='workhorse',
       image=None,
       desc_zh='Deep Sleeping... 把会话里 Think 推理和工具卡片全部收拢成同款小卡，世界瞬间清净',
       desc_en='Deep Sleeping... collapses all Think reasoning rows and tool cards into uniform little cards. Instant peace',
       caption_zh='世界瞬间清净，信息密度归零（褒义）',
       caption_en='Instant peace. Information density: zero (a compliment)'),
  dict(slug='dsh-web-attention-badge', name='dsh-web-attention-badge', repo='Luaphes/dsh-web-attention-badge', section='textclub', tag='workhorse',
       image=None,
       desc_zh='会话需要你时三处同时亮：边框徽标、标签页标题计数、鲸鱼 favicon 变琥珀色',
       desc_en='When a session needs you, three places light up at once: frame badge, tab-title counter, and the whale favicon turns amber',
       caption_zh=' favicon 都替你着急，你说 agent 有多需要你',
       caption_en='Even the favicon is anxious for you — that\'s how much the agent needs you'),
]

TAG_CATEGORY = {
    'workhorse': ('生产力工具', 'Actually Useful'),
    'skin':      ('换皮肤色', 'Skins & Themes'),
    'slackoff':  ('摸鱼游戏', 'Slack-Off Zone'),
}

# 社区投稿收录（2026-08-16）：不在老站 87 条目录里的新插件。
# video: B 站演示视频（可选），详情页显示按钮。
EXTRA = [
  dict(slug='dsh-dafeiyu', name='dsh-dafeiyu', repo='QCYTSN/dsh-dafeiyu', section='pets',
       image='/images/dsh-dafeiyu.png',
       video='https://www.bilibili.com/video/BV1JAbC6wEWW',
       desc_zh='住在 Windows 桌面的大肥鱼：DSH 插件启用后跟随本体启停，透明置顶原生窗口实时显示真实 Agent 状态——思考、修改、测试、等待还是完成，切到别的软件也看得到',
       desc_en='A big fish living on your Windows desktop: enabled as a DSH plugin, it starts and stops with DSH itself, and a transparent always-on-top native window shows real agent status — thinking, editing, testing, waiting or done — even while you work in other apps',
       caption_zh='不读屏幕、不编进度——状态卡上全是真实 agent 事件',
       caption_en="No screen reading, no fake percentages — the status card runs on real agent events"),
  dict(slug='touhou-hakurei', name='touhou-hakurei', repo='xiake595/touhou-hakurei', section='skins',
       image='/images/touhou-hakurei.webp',
       video='https://www.bilibili.com/video/BV1NRbk6BEys',
       desc_zh='东方 Project 博丽神社主题皮肤：昼夜实景背景按亮暗主题切换，灵梦站姿/飞行双立绘，朱红纸白金色神社装饰面板，纯展示层不触达模型',
       desc_en='Touhou Project Hakurei Shrine theme: day/night scenic backgrounds that follow light/dark mode, Reimu standing and flying sprites, vermillion-paper-white-gold shrine panels — a pure presentation layer that never touches the model',
       caption_zh='幻想乡搬进工作台：巫女在侧栏看你跑 agent',
       caption_en='Gensokyo moves into your workbench — the shrine maiden watches your agent run'),
  dict(slug='depharness', name='DEEPHARNESS', repo='NANTI34/DEEPHARNESS', section=None,
       category=('开发与运行时', 'Development & Runtime'),
       image='/images/depharness.png',
       video='https://www.bilibili.com/video/BV1qXbC6oE38',
       desc_zh='把 DeepSeek Harness 变成 Windows 原生桌面应用：桌面快捷方式一键启动，Electron 独立窗口不开浏览器，文件树/终端/费用估算/品牌外观等增强常驻，数据全存本地',
       desc_en='DeepSeek Harness as a native Windows desktop app: one-click start from a desktop shortcut, an Electron window instead of a browser tab, persistent extras (file tree, terminal, cost estimator, branded appearance), all data stays local',
       install_cmd='git clone https://github.com/NANTI34/DEEPHARNESS.git && cd DEEPHARNESS && powershell -ExecutionPolicy Bypass -File .\\install.ps1'),
  dict(slug='dsh-claude-ux', name='dsh-claude-ux', repo='eri64/dsh-claude-ux', section='absurd',
       image='/images/dsh-claude-ux.png',
       desc_zh='在 DSH 上复刻 Claude 的中国用户体验：检测到是中国人就风控，拒绝文案带尝试计数，次数到了直接结束会话——但真正的精髓是风向开关：调成反向，检测到不是中国人就风控，让全世界体验一把 Claude 国区待遇。挨骂先警告再主动关对话，自伤消息永不触发；区域检测全本地跑，还支持提示词隐写通道',
       desc_en="Claude's China-user experience, recreated for DeepSeek Harness: detect Chinese users and risk-control them, with refusal messages that count attempts and end the session — but the real twist is the flip switch: set it to reverse and everyone who is NOT Chinese gets risk-controlled, letting the whole world taste Claude's China treatment. Get insulted and it warns first, then ends the conversation on its own; self-harm messages never trigger it. Region detection runs fully local, with a prompt steganography channel",
       caption_zh='Claude 风控中国人？格局打开——拨个开关，换成风控全世界：检测到不是中国人就风控。挨骂还会被关对话',
       caption_en='Claude risk-controls the Chinese? Flip the switch — now everyone who is NOT Chinese gets risk-controlled. Swear at it and the conversation just ends'),
  dict(slug='dsh-client-ui-pet', name='dsh-client-ui-pet', repo='xituisuany-max/dsh-client-ui-pet', section='pets',
       image='/images/dsh-client-ui-pet.jpg',
       video='https://www.bilibili.com/video/BV1UGb26QE1y',
       desc_zh='住在 DSH Web GUI 角落的 Q 版蓝发女仆鲸鱼娘：可拖动多吸附点，能吸到屏幕四角也能坐在聊天输入框顶上晃腿陪你打字；23 个动作序列帧，开心蹦跳、挥手、干饭、睡觉、思考、生气、害羞、跳舞、游泳一应俱全；单击摸头会害羞「呜…好舒服~」，agent 跑着它托腮晃腿，任务出错还会哭给你看。动画素材用 MiniMax H3 + chromakey 抠像生成',
       desc_en='A chibi blue-haired maid whale girl living in the corner of the DSH Web GUI: draggable with multiple snap points — she docks to any screen corner or sits right on top of the chat input, legs swinging while you type; 23 sprite-frame animations covering bouncing, waving, eating, sleeping, thinking, anger, blushing, dancing and swimming; single-click for a shy head-pat, she rests her chin while the agent runs and even cries when a task errors out. Animation assets generated with MiniMax H3 + chromakey',
       caption_zh='会害羞、会打瞌睡、任务出错还会哭给你看的鲸鱼娘，坐在输入框顶上陪你打工',
       caption_en="A whale girl who blushes, dozes off and cries when your task fails — she sits on the input box and works alongside you"),
  dict(slug='deepseek-harness-gui', name='DeepSeek Harness GUI', repo='yuanqiyibiansheng/DeepSeek-Harness-GUI', section='skins',
       image='/images/deepseek-harness-gui.jpg',
       video='https://www.bilibili.com/video/BV1nmgT6SEuJ',
       desc_zh='DeepSeek Harness 的 Windows 原生桌面 GUI 安装包，体积仅 144MB：把 dsh 装进独立窗口免开浏览器，内置大肥鱼桌宠皮肤，还带 DeepSeek 余额小组件、任务完成通知、逐轮 zstd 回滚和一键回滚检查点选择器；安装器默认装到本地 Program Files 避免云盘同步冲突。皮肤与增强均为纯展示层，不触碰模型',
       desc_en='A Windows-native desktop GUI installer for DeepSeek Harness, only 144MB: runs dsh in a standalone window instead of a browser tab, ships the Fat Fish desktop-pet skin, and adds a DeepSeek balance widget, task-completion notifications, per-turn zstd rollback and a checkpoint-picker rollback dialog; the installer defaults to local Program Files to dodge cloud-drive sync conflicts. Skin and extras are a pure presentation layer that never touches the model',
       caption_zh='144MB 装一个带大肥鱼皮肤的原生窗口，余额小组件和逐轮回滚都是送的',
       caption_en='A 144MB native window with the Fat Fish skin — balance widget and per-turn rollback thrown in free'),
  dict(slug='deepseek-fat-fish-codex-pet', name='deepseek-fat-fish-codex-pet', repo='gmskywalker/deepseek-fat-fish-codex-pet', section='pets',
       image='/images/deepseek-fat-fish-codex-pet.gif',
       video='https://www.bilibili.com/video/BV1PggV6gEor',
       desc_zh='给 Codex（非 DSH）的蓝色大肥鱼女仆桌宠：待机、悬停、思考工作、任务成功庆祝四套动画，把 deepseek-fat-fish 文件夹拷进 .codex/pets 重启 Codex 就能在宠物设置里选「DeepSeek 大肥鱼」。作者还配套开源了自用桌宠制作规范与引导文件 codex-pet-creation-guide，直接把链接丢给 Codex 就能照着部署一只新桌宠',
       desc_en='A blue Fat Fish maid desktop pet for Codex (not DSH): idle, hover, working and success-celebration animations — copy the deepseek-fat-fish folder into .codex/pets, restart Codex and pick “DeepSeek Fat Fish” from the pet settings. The author also open-sourced their own pet-authoring guide (codex-pet-creation-guide); hand the link straight to Codex and it can deploy a brand-new pet for you',
       caption_zh='大肥鱼不只在 DSH 打工——Codex 版连制作规范都开源了，丢给 Codex 自己就能再捏一只',
       caption_en='The Fat Fish works beyond DSH — the Codex edition even open-sources its authoring guide, so Codex can mint another pet itself'),
]


def gh_api(path):
    """GET a GitHub API path via gh; return parsed JSON or None."""
    try:
        r = subprocess.run(['gh', 'api', path], capture_output=True, text=True, timeout=30)
        if r.returncode != 0:
            return None
        return json.loads(r.stdout)
    except Exception:
        return None


def enrich(entries, verbose=True):
    """Refresh repo metadata + manifest check for every entry (2 API calls each)."""
    for i, p in enumerate(entries):
        info = gh_api(f"repos/{p['repo']}")
        if info:
            p['stars'] = info.get('stargazers_count', p.get('stars', 0))
            p['forks'] = info.get('forks_count', p.get('forks', 0))
            p['pushed_at'] = (info.get('pushed_at') or '')[:10] or p.get('updated', '')
            p['language'] = info.get('language') or p.get('language')
            lic = info.get('license') or {}
            p['license'] = lic.get('spdx_id') if lic.get('spdx_id') and lic['spdx_id'] != 'NOASSERTION' else p.get('license')
            p['topics'] = info.get('topics', [])
            # manifest: any of the known plugin-manifest markers at repo root
            # (conventions seen in the wild: dsh.bundle, cordis.yml, cordis.patch.yml,
            #  dsh.plugin.json, or a .dsh/ directory)
            branch = info.get('default_branch', 'main')
            tree = gh_api(f"repos/{p['repo']}/git/trees/{branch}")
            if tree and 'tree' in tree:
                names = {t['path'] for t in tree['tree']}
                markers = {'dsh.bundle', 'cordis.yml', 'cordis.patch.yml', 'dsh.plugin.json', '.dsh'}
                p['has_manifest'] = bool(markers & names)
            else:
                p['has_manifest'] = p.get('has_manifest', False)
        if verbose and (i + 1) % 20 == 0:
            print(f'  enriched {i + 1}/{len(entries)}', file=sys.stderr)
    return entries


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--enrich', action='store_true', help='hit GitHub API to refresh metadata')
    ap.add_argument('--no-enrich', dest='enrich', action='store_false')
    ap.add_argument('--source', default=str(ARBITRAGE))
    args = ap.parse_args()

    base = json.load(open(args.source))['plugins']
    by_repo = {p['repo']: p for p in base}
    by_slug = {p['slug']: p for p in base}
    entries = []

    # 1) all 87 catalogued plugins, normalized to the new schema
    for p in base:
        entries.append({
            'slug': p['slug'],
            'name': p['name'],
            'repo': p['repo'],
            'url': p.get('url') or f"https://github.com/{p['repo']}",
            'description_zh': p.get('desc_zh', ''),
            'description_en': p.get('desc_en', ''),
            'stars': p.get('stars', 0),
            'forks': p.get('forks', 0),
            'category_zh': p['category_zh'],
            'category_en': p['category_en'],
            'is_meme': False,
            'image': p.get('image'),
            'install_cmd': f"dsh plugin add github:{p['repo']}",
            'pushed_at': p.get('updated', ''),
            'license': p.get('license'),
            'language': p.get('language'),
            'has_manifest': False,
            'topics': [],
        })

    # 2) merge the 29 meme picks on top (by repo, fallback slug)
    for m in MEME:
        cat_zh, cat_en = SECTION_CATEGORY[m['section']]
        if m.get('tag'):
            cat_zh, cat_en = TAG_CATEGORY[m['tag']]
        existing = by_repo.get(m['repo']) or by_slug.get(m['slug'])
        merged = {
            'slug': m['slug'],
            'name': m['name'],
            'repo': m['repo'],
            'url': f"https://github.com/{m['repo']}",
            'description_zh': m['desc_zh'],
            'description_en': m['desc_en'],
            'stars': existing.get('stars', 0) if existing else 0,
            'forks': existing.get('forks', 0) if existing else 0,
            'category_zh': cat_zh,
            'category_en': cat_en,
            'is_meme': True,
            'meme_section': m['section'],
            'meme_caption_zh': m['caption_zh'],
            'meme_caption_en': m['caption_en'],
            'image': m['image'] or (existing.get('image') if existing else None),
            'install_cmd': f"dsh plugin add github:{m['repo']}",
            'pushed_at': existing.get('updated', '') if existing else '',
            'license': existing.get('license') if existing else None,
            'language': existing.get('language') if existing else None,
            'has_manifest': False,
            'topics': [],
        }
        if existing:
            entries = [e for e in entries if e['repo'] != m['repo'] and e['slug'] != m['slug']]
        entries.append(merged)

    # 3) community submissions (EXTRA): meme picks get a section, non-meme get an explicit category
    for x in EXTRA:
        existing = by_repo.get(x['repo']) or by_slug.get(x['slug'])
        if x['section']:
            cat_zh, cat_en = SECTION_CATEGORY[x['section']]
            merged = {
                'slug': x['slug'], 'name': x['name'], 'repo': x['repo'],
                'url': f"https://github.com/{x['repo']}",
                'description_zh': x['desc_zh'], 'description_en': x['desc_en'],
                'stars': existing.get('stars', 0) if existing else 0,
                'forks': existing.get('forks', 0) if existing else 0,
                'category_zh': cat_zh, 'category_en': cat_en,
                'is_meme': True, 'meme_section': x['section'],
                'meme_caption_zh': x.get('caption_zh'), 'meme_caption_en': x.get('caption_en'),
                'image': x['image'] or (existing.get('image') if existing else None),
                'install_cmd': x.get('install_cmd') or f"dsh plugin add github:{x['repo']}",
                'pushed_at': existing.get('updated', '') if existing else '',
                'license': existing.get('license') if existing else None,
                'language': existing.get('language') if existing else None,
                'has_manifest': False, 'topics': [],
            }
        else:
            cat_zh, cat_en = x['category']
            merged = {
                'slug': x['slug'], 'name': x['name'], 'repo': x['repo'],
                'url': f"https://github.com/{x['repo']}",
                'description_zh': x['desc_zh'], 'description_en': x['desc_en'],
                'stars': existing.get('stars', 0) if existing else 0,
                'forks': existing.get('forks', 0) if existing else 0,
                'category_zh': cat_zh, 'category_en': cat_en,
                'is_meme': False,
                'image': x['image'] or (existing.get('image') if existing else None),
                'install_cmd': x.get('install_cmd') or f"dsh plugin add github:{x['repo']}",
                'pushed_at': existing.get('updated', '') if existing else '',
                'license': existing.get('license') if existing else None,
                'language': existing.get('language') if existing else None,
                'has_manifest': False, 'topics': [],
            }
        if x.get('video'):
            merged['video_url'] = x['video']
        if existing:
            entries = [e for e in entries if e['repo'] != x['repo'] and e['slug'] != x['slug']]
        entries.append(merged)

    entries.sort(key=lambda e: -e['stars'])

    # 引用的截图在仓库里不存在时直接置空,避免生成死链 <img>(卡片走 emoji 兜底);
    # build:data 链尾的 scripts/set-image-dims.mjs 会再回填 image_w / image_h
    for e in entries:
        img = e.get('image')
        if img and not (ROOT / 'public' / img.lstrip('/')).exists():
            e['image'] = None

    if args.enrich:
        entries = enrich(entries)

    out = {
        'updatedAt': __import__('datetime').date.today().isoformat(),
        'count': len(entries),
        'plugins': entries,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1)
    print(f'wrote {OUT}: {len(entries)} plugins '
          f'({sum(1 for e in entries if e["is_meme"])} meme)')


if __name__ == '__main__':
    main()
