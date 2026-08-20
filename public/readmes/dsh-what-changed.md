# dsh-what-changed

**看得见 Agent 到底改了什么。一个会话里所有文件改动，一屏看完再决定要不要提交。**

[English](./README.en.md)

<p>
<img src="https://img.shields.io/badge/状态-已在真实会话中跑通-2b7?style=flat-square" alt="status">
<img src="https://img.shields.io/badge/platform-any-2b7?style=flat-square" alt="platform">
<img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT">
</p>

![会话顶栏的按钮和展开后的面板](https://raw.githubusercontent.com/sjh9714/dsh-what-changed/d668b8097be1e77bb3694224378e62a23fcd2ccc/assets/panel-zh.png)

真实 `dsh web` 会话，不是拼的图。顶栏上的「1 个文件 · 1 处编辑」就是这个插件，点开是这一屏。

## 它解决的那句话

DSH 讨论区**赞数最高**的一条是 [#172](https://github.com/deepseek-ai/deepseek-harness/discussions/172)（163 赞，第二名 46 赞）。大家在那里要独立客户端、CLI 和 VSCode 插件。但底下赞数最高的两条回复说的不是界面。

> 这个WEB版本**总是看不见它编辑了啥代码**，总感觉怪怪的

> 还是喜欢用cli模式，**web太黑盒了**

想要 CLI 的真正理由是**看不见 Agent 对自己代码做了什么**。官方已经在那条帖子里回复「后面会有的」，所以客户端和 CLI 不该由社区来抢；**但「它到底改了什么」是另一回事，现在没有人回答。**

单次调用的 diff 卡片本来就会渲染。缺的是那个你在提交前真正想要的东西：**这一整个会话，一共动了哪些文件。**

## 装

```sh
dsh plugin --profile web add dsh-what-changed
```

装完会话顶栏多一个按钮，写着改了几个文件、几处编辑。点开就是那一屏。

**会话中途装也没关系。** 这一点不是我们做的，是 session-projection 这个座子给的：晚注册的单元第一次被读取时，会从头把整条日志重放一遍。所以你在 Agent 干完活之后才想起来装，照样能看到它这一路改了什么。

## 它坚持做的几件事

**被拒绝的写入不算改动。** 权限围栏挡下来的编辑没有落到工作区，把它显示成一处改动，等于把这个插件想消灭的问题重新造一遍。它们按文件单独计数，不进编辑总数。

**分清「请求」和「结果」。** `tool/result` 可能带上工具真正写下去的那段 diff，有就用那个。`str_replace_editor`（极简模式挂的编辑器）不带，那就退回到调用参数。每条编辑都标出自己是哪一种，屏幕上直接写着「按请求显示，工具没有回报实际写入的 diff」。把请求当结果展示，本身就是一个小谎。

**说你的语言。** 按钮和面板上的每一句都走 shell 自己的 locale 座子，中英两套字典跟着你在设置里选的语言走。两边的键集互相约束，少一条编译就过不去。

**零也要显示。** 「它什么都没改」也是一个答案。按钮消失了会被当成插件坏了。

**不完整的答案要承认自己不完整。** Agent 也会用 shell 写文件，而 shell 的 `tool/result` 不带任何文件信息，从事件流里根本无法知道它动了哪些文件。所以看起来在写的命令会被数出来，面板直接写明还有多少条不在列表里，按钮上标「不完整」。**路径绝不猜。** 从命令行里读路径，一个引号、一根管道或一次变量展开就会读错，而错的路径比承认缺口更糟。这条由 [#1](https://github.com/sjh9714/dsh-what-changed/issues/1) 提出，报告人指出这不是边角情况而是常态。在这台机器的 11 个真实会话里实测，`bash` 12 次、`write` 3 次、`read` 1 次，`str_replace_editor` 和 `edit` 一次都没被调用。

![不完整提示](https://raw.githubusercontent.com/sjh9714/dsh-what-changed/d668b8097be1e77bb3694224378e62a23fcd2ccc/assets/panel-shell.png)

那次会话跑了三条 bash，`echo > NOTES.md`、`sed -i`、`ls -la`。前两条被数进去，列目录那条没有。在这之前，同样这一屏只写「没有文件改动」就结束了，而磁盘上有两个文件变了。

**然后它把问题真正答完。** 数出缺口只是诚实的底线，你真正想要的是文件名。所以面板还会把工作区和 `HEAD` 对照一遍，这条路不关心是哪个工具写的，并且**故意单独成一节**。两种读法在两个方向上都会不一致，而每一处不一致都是信息。git 看得见 shell 写了什么而折叠看不见；折叠看得见一处后来又被改回去的写入而 git 看不见。合成一个数字会把两边都藏起来。

![工作区对照 HEAD](https://raw.githubusercontent.com/sjh9714/dsh-what-changed/d668b8097be1e77bb3694224378e62a23fcd2ccc/assets/panel-worktree.png)

同样的思路，多跑一条命令。Agent 用 bash 跑了 `echo > NOTES.md`、`sed -i`、`rm README.md`，折叠承认有三条 shell 写入但叫不出名字，git 把三个文件连同行数一起列了出来。

路由是 `POST /what-changed/worktree`，只走 loopback、只收 POST、只认 `application/json`，浏览器给的路径会先规范化再和工作区注册表比对，然后 git 才会在任何地方运行。全程只读。


## 它怎么拿到数据

不改核心一行，不读磁盘上的日志，不自己订阅事件。

用的是 `ctx.sessionProjections`，[session-projection 座子](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/session-projection.md)。它自己的文档就写着插件应该在 `ctx.inject(['sessionProjections'], …)` 下面注册，没有这个能力的组合里我们干脆不运行，客户端把它读成「能力缺席」而不是报错。

浏览器那半只做一件事：往 `conversation.session.header.actions` 挂一个按钮，值通过框架的 `useProjection` 拿。它不折叠事件，不订阅任何东西。

## 诚实的状态

**在真实的 `dsh web` 里，用真实模型跑了一个真实会话。** 上面那张图是那次跑出来的。

那一轮确认的：

- 按钮挂进了会话顶栏，计数跟着 Agent 干活实时变（「没有文件改动」变成「2 个文件 · 2 处编辑」）
- 数字对得上，Agent 确实改了 `greet.js` 又新建了 `NOTES.md`
- 重启 `dsh web` 再打开同一个会话，计数照样是对的。折叠是从落盘的日志重新算出来的，不是靠内存里那份
- 面板用的是 shell 自己的颜色变量，浅色深色两套主题下都没崩
- **展开后显示的是工具真正写下去的那段 diff**，不是调用参数。`edit` 工具确实在 `tool/result` 的 `meta` 里带了 applied hunk，所以那行没有「按请求显示」标记。这条分支单元测试只能假装，跑真会话才算数
- 在设置里把语言从 English 切到中文，按钮和面板当场跟着换，不用刷新

跑出来才发现的两个问题，都已经修了。

**第一个把所有插件的 UI 都打挂了。** 第一版客户端产物是 tsc 出的普通 ESM：

```
Failed to load plugins
bundle .../client.js loaded without registering "dsh-what-changed" via __ModuleLoader__.load
```

不是这个插件不显示，是全部。19 个测试全绿、tsc 干净、配置树也进去了，照样是这个结果。修法是 esbuild 打成 CJS 再包一层 `window.__ModuleLoader__.load({id, factory})`，`react` 和框架包留作 external 由加载器的模块表回答。

**第二个是面板的位置。** 面板是 `position:absolute`，但我们没给它一个定位过的父元素。它于是拿了 flex 顶栏的 static position 角落，整个飘到窗口最上面，前两行被切掉。改完发现还有一半问题，右对齐的 680px 面板会往回钻到工作区侧边栏底下，路径被切成 `space/greet.js`。现在按钮左边缘对齐，宽度按内容收。jsdom 不排版，这两条测试一条都看不见。

单元和集成层面验证的：

- 真实注册表会驱动这个单元，zod schema 在出口做校验
- 会话中途注册后，读到的是整条日志的结果（这条是断言出来的，不是从文档抄的）
- 没注册时读成 `undefined`，客户端渲染 `null`，不抛错
- 被拒绝的写入不进编辑总数

写这个插件的过程里，有八处契约我先猜错了再去查源码改对的。其中两处会**安静地**失败，编译通过、运行正常、面板永远是空的。

- `callId` 在 `message.source.callId`，不在 `message.callId`
- `tool/call` **不能**带 `surfaceOp`，`tool/result` **必须**带。两个方向都会 throw

第二条是把测试接到真实 `SessionStore` 上才发现的，单元测试看不见，因为它直接喂 `apply()`。

## 限制

- 按文件列出的只有三个写入工具，`str_replace_editor`、`write`、`edit`。别的插件自带的写入工具不在其中。shell 写入只计数，不归到任何路径，理由见上
- 行数是按调用携带的文本数的，不是 git 意义上的行级 diff
- 会话那一节显示的是「Agent 通过工具写了什么」。工作区那一节显示的是「工作区和 `HEAD` 差多少」，里面会包含你自己手改的和磁盘上的其他改动。两节回答的是不同的问题，这是故意的

## License

MIT
