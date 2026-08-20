# dsh-plugin-qcc — 企查查数据源插件（DeepSeek Harness）


> 🌐 **[在线宣传页](https://samge0.github.io/dsh-plugin-qcc/)** — 可视化了解功能特性与安装流程


> **⚠️ 非官方插件声明：本项目与企查查（苏州企查查科技有限公司）、BizOwl / 企查查 Claw 平台无任何关联，未获其授权、背书或支持。** 仅供个人学习与技术研究用途。详见下方[免责声明](#免责声明)。

把 BizOwl 客户端的企查查数据源能力提取为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH，Cordis 插件体系）的运行时插件：在一个 DSH 会话里获得**企业信息查询工具链**和**设置页图形化账号管理**。v2.0 起支持**持久化安装**（装一次，重启后仍在），同时保留动态试用形态。

## 功能一览

### 模型工具（5 个）

| 工具 | 用途 |
|---|---|
| `qcc_auth` | 账号认证管理：状态 / 扫码登录 / 轮询结果 / 手动 Token / 校验 / 积分 / 邀请码 / 登出 / 诊断 |
| `qcc_search_companies` | 企业快搜：名称、keyNo、法人、经营状态、注册资本 |
| `qcc_knowledge_search` | 企业知识库向量搜索（查询第一步） |
| `qcc_tool_search` | 检索可用的 MCP 数据工具及参数 schema（查询第二步） |
| `qcc_execute_tool` | 执行 MCP 工具获取数据：工商、股东、司法、知识产权等 100+ 维度（查询第三步） |

典型查询链：`qcc_knowledge_search`（判断知识库能否直接回答）→ `qcc_tool_search`（找工具）→ `qcc_execute_tool`（取数）。

### GUI 界面（2 处）

- **设置页**：`设置 → 企查查数据源` —— 账号状态/积分展示、扫码登录、手动 Token 设置、邀请码绑定、Token 校验、登出
- **会话内卡片**：插件运行卡片内的紧凑管理面板

### 工作原理（v2.0 持久化形态）

- 以**标准 Cordis 插件包**形态常驻 DSH profile（`~/.dsh/profiles/web/`）：Host 半注册 5 个工具 + 一个同源 HTTP API（`/qcc/v1/api`，设置页用），Client 半经 `dsh.client` manifest 自动发现并注册设置页
- 运行于 DSH 主进程内，直接使用 `node:fs` 与全局 `fetch`——无沙箱绕行（v1 动态形态所需的 subprocess 方案已不再需要，但仍保留于 `plugin/` 目录供快速试用）
- 凭证存于 `~/.BizOwl/auth.json`，与本地 BizOwl 客户端**互通**；API 基址 `https://qclaw-api.qcc.com`
- **重启 DSH 后插件仍在**：安装一次，永久生效

## 环境要求

1. **DeepSeek Harness ≥ 0.1.0-rc.5**（含 `dsh plugin` 命令的版本）
2. **Node.js ≥ 22**
3. 一个**企查查账号**（自行注册；部分查询消耗积分）——没有积分？到 [Claw 平台（claw.qcc.com）](https://claw.qcc.com/) 申请获取

## 安装

两种形态任选：**持久化安装（v2 推荐）** 装一次永久生效、随 DSH 自动加载；**动态试用** 一条消息即装即用，但随进程重启消失。

### 方式一：持久化安装（推荐）

```powershell
# 从 GitHub 直接安装到 web profile（headless 用 --profile headless）
dsh plugin --profile web add github:Samge0/dsh-plugin-qcc

# 或从本地克隆安装（便于改代码调试）
git clone https://github.com/Samge0/dsh-plugin-qcc.git
dsh plugin --profile web add file:/F:/Space/PRO/dsh-plugin-qcc   # 路径按实际修改
```

> 💡 **找不到 `dsh` 命令？** 如果你的 Harness 是**源码方式运行**（`git clone` 后用 `pnpm` 启动），`dsh` 尚未全局安装，需在**源码仓库根目录**加 `pnpm` 前缀调用，例如：
> ```powershell
> pnpm dsh plugin --profile web add github:Samge0/dsh-plugin-qcc
> ```

然后**重启 DSH**（bundle 层变更需重启生效）。启动后：

- 新会话中 agent 自动获得 5 个 `qcc_*` 工具
- 设置页出现 `设置 → 企查查数据源`

**卸载**：`dsh plugin --profile web remove dsh-plugin-qcc`（源码运行则是 `pnpm dsh plugin --profile web remove dsh-plugin-qcc`），然后**立即重启 DSH**。

> ⚠️ 卸载后、重启前，运行中的 DSH 实例内存里仍保留已删除插件的加载项，此时刷新浏览器页面会提示 `Failed to load plugins — bundle script /plugins/dsh-plugin-qcc/client.js failed to load`——这是预期现象，不是卸载失败；重启 DSH 后提示即消失。

### 方式二：动态试用（免重启，会话级）

```powershell
git clone https://github.com/Samge0/dsh-plugin-qcc.git
cd dsh-plugin-qcc
./install.ps1          # 校验环境，并把"安装提示词"复制到剪贴板
```

打开 DSH Web GUI（`http://127.0.0.1:3080`），新建会话，把剪贴板内容粘贴发送即可。agent 会读取 `plugin/host.js` 与 `plugin/client.js`，经 `cordis_define`/`cordis_run` 激活；首次激活可能弹出**授权提示**，确认即可。注意：动态插件是会话级的，DSH 重启后需重新发送提示词。

## 使用

### 1. 登录

任选其一：

- **图形化（推荐）**：DSH 侧边栏 `设置 → 企查查数据源` → "生成二维码" → 页面直接显示二维码图片，用企查查 App 扫码授权 → 回到设置页点"查询扫码结果"（二维码过期或扫不了时点"刷新二维码"重新生成）
- **对话式**：直接对 agent 说 *"用 qcc_auth 生成扫码登录会话"*，然后 *"查询扫码结果"*
- **复用 BizOwl**：若本机 BizOwl 客户端已登录，凭证自动互通，无需重复登录

### 2. 获取积分（没有积分的用户）

部分查询会消耗企查查积分。没有积分的用户可前往 **[企查查 Claw 平台](https://claw.qcc.com/)** 申请获取积分：注册 / 登录账号后，按平台指引领取或购买积分套餐即可。

### 3. 查询示例

登录后直接用自然语言提问：

> 查一下华为技术有限公司的工商信息

agent 会自动走三步链并返回结构化结果（统一社会信用代码、法人、注册资本、经营范围、联系方式、100+ 维度数据计数等）。也可以问股东结构、司法风险、专利、年报、招投标等维度。

### 4. 停止 / 卸载

- **持久化形态**：`dsh plugin --profile web remove dsh-plugin-qcc` 后重启 DSH
- **动态形态**：对 agent 说 *"彻底卸载企查查插件"*（`cordis_undefine`），或直接结束会话

## 常见问题

| 现象 | 处理 |
|---|---|
| 持久化安装后设置页/工具没出现 | 确认重启过 DSH；`dsh --profile web --dump-config` 检查 `qcc-datasource` 行是否存在 |
| `dsh plugin add` 报 peer 冲突警告 | 通常不影响（peers 由 DSH 安装回退解析）；若工具未注册，检查 DSH 版本 ≥ 0.1.0-rc.5 |
| 提示找不到 `dsh` 命令 | 源码方式运行的 Harness 需在源码仓库根目录用 `pnpm dsh ...` 调用（如 `pnpm dsh plugin --profile web add github:Samge0/dsh-plugin-qcc`） |
| 卸载后刷新页面提示 `Failed to load plugins — bundle script /plugins/dsh-plugin-qcc/client.js failed to load` | 预期现象：运行中的实例仍持有已删插件的加载项；重启 DSH 后提示消失（见"安装 → 卸载"说明） |
| 动态模式 `subprocess 服务不可用` | 当前会话预设未提供 subprocess 能力，换用支持动态插件的预设，或改用持久化安装 |
| `QCC API HTTP 401 / token 过期` | 到设置页重新扫码登录，或 `qcc_auth action=verify` 确认 |
| 查询报积分不足 | 到企查查 App / [Claw 平台](https://claw.qcc.com/) 查看积分与套餐；没有积分可到 [claw.qcc.com](https://claw.qcc.com/) 申请获取 |
| 重启 DSH 后插件消失 | 仅动态形态如此（会话级）；持久化安装的插件重启后仍在 |

## 目录结构

```
dsh-plugin-qcc/
├── src/
│   ├── index.js          # Host 半（标准 Cordis 插件：5 工具 + /qcc/v1/api 设置页 API）
│   └── client.js         # Client 半（__ModuleLoader__ bundle：设置页 UI）
├── plugin/               # v1 动态形态源码（快速试用，配合 install-prompt.md）
├── tests/
│   ├── smoke.cjs         # 双半结构冒烟（纯 node 可跑）
│   └── integration.mjs   # Host 半真实 Cordis 上下文集成测试（需 harness checkout）
├── cordis.patch.yml      # bundle patch（dsh plugin 安装时自动挂载）
├── package.json          # 含 dsh.client manifest 与 dsh.bundle 声明
├── install.ps1           # 动态试用：环境校验 + 安装提示词
├── install-prompt.md     # 动态试用：粘贴给 DSH agent 的提示词
├── LICENSE               # MIT
├── .gitignore
└── README.md
```

## 免责声明

1. **非官方**：本项目为社区个人项目，与企查查（苏州企查查科技有限公司）及其关联产品（BizOwl、Claw、qcc.com、qclaw-api.qcc.com）**不存在任何官方关系**，未获得其任何形式的授权、赞助或认可。"企查查"等名称与商标归其权利人所有，仅作说明性引用。
2. **用途限制**：本项目**仅供个人学习、技术研究与自用**。禁止将本项目用于商业用途、批量爬取、数据转售或任何违反企查查服务条款及适用法律法规的用途。
3. **数据权利**：通过本插件获取的一切数据（工商、司法、知识产权等）的版权归原始权利人与企查查平台所有，使用者自行承担使用数据的法律责任。
4. **账号与计费**：使用本插件需自行注册企查查账号，API 调用产生的积分消耗由使用者自行承担。
5. **无担保**：本项目按"现状"提供，不提供任何明示或默示的担保；作者不对因使用本项目造成的任何损失负责。若企查查方提出异议，本项目将配合下架处理。
6. 使用本插件即表示你已阅读并同意以上条款及 [MIT 许可证](LICENSE)。

## 许可证

代码以 [MIT License](LICENSE) 开源。上述免责声明为许可证之外的附加使用条件，克隆或再分发本仓库时请一并保留。

## 相关截图

<img width="1844" height="1040" alt="image" src="https://github.com/user-attachments/assets/0b536233-fe81-40d1-b35e-92eb8df9845b" />
<img width="1855" height="1043" alt="image" src="https://github.com/user-attachments/assets/4204efa9-ccc4-4cc5-bf0d-93646cf487a5" />
<img width="1868" height="1043" alt="image" src="https://github.com/user-attachments/assets/edec1ce1-ee1a-4304-a019-e6e80ad26b8e" />
<img width="1869" height="1043" alt="image" src="https://github.com/user-attachments/assets/7ad18dee-1795-45a6-8d10-194c71314541" />
