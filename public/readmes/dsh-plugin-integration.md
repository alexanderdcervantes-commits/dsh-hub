# dsh-plugin-integration · 插件整合中心

> 一个用于 DeepSeek Harness (DSH) 的插件整合中心：**动态发现**已装插件、**打标分类**、**查重叠**、**查兼容**、**一键启停与切换**。新装插件自动出现，无需改代码。

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com) ![License](https://img.shields.io/badge/license-MIT-blue) ![DSH Plugin](https://img.shields.io/badge/DSH-plugin-brightgreen) ![Platform](https://img.shields.io/badge/platform-web-blueviolet)

## 快速安装

```bash
dsh plugin --profile web add github:MutaLucem/dsh-plugin-integration
# 重启 DSH 后，设置栏底部出现「插件整合」分页
```

---

## 1. 功能总览

插件在设置栏底部新增一个 **「插件整合」分页**，内含 5 个标签页：

| # | 标签页 | 功能 |
|---|--------|------|
| 1 | **插件清单** | 动态发现所有已装插件；**插件 logo + GitHub star 联网刷新（自动读 `gh` token）**、**同步更新状态（npm/GitHub 真实版本检测）**、**入库时间分类 + 双向排序**、**搜索栏**、**状态/待更新/tag 筛选**、**更新冲突预判**；可手动判定失效 |
| 2 | **重叠切换** | 识别功能重叠组；**清晰生效界定**（完全/部分生效/停用/失效）；一键切换、**单方停用**、**判定失效** |
| 3 | **兼容检测** | 自检/手动检测：区分**存在性冲突**与**共用性冲突**，每个冲突附多条**修复预案** |
| 4 | **启用 / 停用** | 对已装插件启停（**搜索栏**）；**核心条目受保护禁止停用**，避免误停导致 DSH 无法进入 |
| 5 | **失效插件** | 集中展示手动判定失效 + 可疑插件；**失效检测**给出具体原因、依据、修复方案与影响 |

顶部汇总卡片：已装插件数、已启用数、已生效数、兼容冲突数、未入知识库数。

### 全局功能

- **操作日志**：标题栏「操作日志」按钮展开日志面板，分「当前日志（本次启动）/ 历史日志」，按时间倒序，支持单条删除、清空当前/历史/全部，持久化到 `~/.dsh`。
- **设置窗口原生缩放**：用浏览器原生 `resize` 手柄（设置弹窗右下角）拖拽调整整个设置窗口大小，尺寸持久化到 `localStorage`；标题栏「重置窗口」一键恢复默认 800×800。

### 1.1 插件清单（动态发现 + 打标 + 分类）

**三层数据模型**（这是本插件能「对新插件自动生效」的关键）：

1. **动态发现（自动）**：运行时读 `package.json` 的 `dsh.profile.bundles`，再逐个解析每个 bundle 的 `cordis.patch.yml`（`- insert: - id: X, name: Y`）拿到 entryId 与模块名。**新装插件自动出现**，不再依赖硬编码清单。
2. **通用元数据回退（自动）**：未知插件从 `package.json` 派生名称（去 scope）、描述、关键词标签（视觉/音频/远程/插件管理等）。
3. **精选知识库覆盖层（精确）**：已录入的插件使用精确的标签、能力边界、重叠组、兼容规则。

- 每个插件展示：名称、loader 条目 id（`entryId`）、能力描述、**能力边界**、多 tag、所属 bundle、状态（已生效/已启用/已停用/加载失败）、「受保护」/「未知」标记。
- 相同 tag 自动聚成一类，可下拉筛选。

### 1.2 重叠切换（功能覆盖识别 + 切换）

内置**功能重叠组**（同一能力被多个插件覆盖）：

| 重叠组 | 成员 | 说明 |
|--------|------|------|
| 视觉 / 多模态 | `deepeye-vision` / `modlens` / `describe-image` | 多个看图/OCR 插件并存导致工具冗余 |
| 语音输入 | `voice` / `voice-input` | 两个麦克风按钮并存冲突 |
| 右侧面板 / 文件管理 | `better-sidebar` / `ui-dsh-aionui-panel` | 都占用右侧详情列 |
| 插件管理 / 市场 | `dsh-market` / `plugin-console` | 两个管理器互相覆盖组合补丁 |

每组显示「✓当前生效 / 已启用·未生效 / 未启用」，点「切换为此」即**停用组内其余、仅保留所选**。

### 1.3 兼容检测（存在性 vs 共用性 + 修复预案）

- **存在性冲突**（`existence`）：只要共存于同一目录就出问题。当前实现检测**插件双重挂载**（同一条目既走 bundle 通道、又在 profile 补丁手动 `insert`）。
- **共用性冲突**（`coexistence`）：同时启用才出问题。内置 4 条已知规则（见 1.2 表），全部带修复预案（「停用 A 保留 B / 停用 B 保留 A」），一键「采用」。
- **工具名冲突**（`tool-name`，暂靠人工识别）：两个插件注册了**同名工具**（如 `vision_describe`），工具名全局唯一，后加载者在启动时抛 `tool "X" is already registered`、宿主 `exit before readiness`。比「共用性冲突」更致命——不是「同时启用才出问题」，而是「装了就要崩」。**共存方案**：若冲突方提供「关闭工具注册」的 config（如 `dsh-vision-router` 的 `tool: false`，只保留视觉路由、工具改由另一方提供），即可共存；否则只能二选一停用。案例见 CHANGELOG「维护者手册 · 场景 6」。
- **运行时加载失败**：读取 `fiberPhase === 'failed'` 的插件（可用时），作为「真实加载 bug」单独展示。

### 1.4 启用 / 停用（+ 核心保护名单）

- 每个插件可启停；操作写入 profile 的 `cordis.patch.yml`（`disabled: true/false` 行），与官方 `dsh-skin` 同机制。
- **`protected` 保护名单**中的核心条目（默认 `ui-web-ui-compat`）**禁止停用**，UI 显示「受保护」，RPC 层同样拦截——从根上杜绝「误停核心条目导致 DSH 进不去」。

### 1.5 失效检测（判定失效 + 诊断原因 + 修复影响）

- **手动判定失效**：在清单/重叠/启停页，对「已启用但疑似未生效」的插件点「判定失效」，纳入失效插件页；判定持久化到 `~/.dsh/dsh-plugin-integration.state.json`。
- **失效检测** `detectFailures`：对每个标记失效/可疑（未生效/失效）插件，诊断具体原因并给出修复方案与影响：
  - host-only（无 `dsh.client`）→ 正常，非失效；
  - 声明 `dsh.client` 但缺 `./client` 产物 → 需 `pnpm run build`；
  - 被 `cordis.patch.yml` 停用 → 启用即可（重启生效）；
  - `fiberPhase=failed` → 查看宿主日志定位加载错误；
  - 客户端 bundle 存在但未进生效图 → 确认未 disabled 且已构建；
  - 已生效但疑似部分失效 → 查看重叠/兼容页是否被其它插件覆盖。
- 每个修复方案带**具体影响**说明，由使用者决定是否修复（「启用」可一键应用，其余为手动指引）。

### 1.6 生效界定（重叠切换页）

对每个插件给出四态**清晰界定**：`完全生效`（客户端已进入生效图）、`部分生效`（已启用但客户端未生效，host 半可能仍在运行）、`已停用`、`失效`。

---

## 2. 架构说明

```
dsh-plugin-integration/
├── package.json          # 元数据 + dsh.bundle.patch + dsh.client 声明
├── cordis.patch.yml      # bundle 补丁层（insert 一行 loader 条目）
├── config.default.json   # 默认配置（知识库 + 重叠组 + 兼容规则 + 保护名单）
├── src/
│   ├── host.js           # Host 半（动态形态）：动态发现 + 配置加载 + 检测 + 启停写入 + RPC + 工具
│   ├── client.js         # Client 半（动态形态）：settings.section「插件整合」React UI
│   ├── host.standalone.js    # Host 半（独立 bundle 形态，已实测）：webServer HTTP 路由 + ctx.tools.register + loader.update
│   └── client.standalone.js  # Client 半（独立 bundle 形态，已实测）：window.__ModuleLoader__.load 注册 + fetch
├── README.md             # 本文档（功能总览）
└── CHANGELOG.md          # 更新 / 修复记录
```

### 2.1 Host 半（`src/host.js`）

- **服务依赖**（均 `ctx.get()` 可选）：`fs`、`clientModules`、`typertGateway`、`settings`。
- **动态发现**：`discoverBundles()` → 读 bundles → `resolveBundle()` 解析每个 bundle 的补丁 → entryId/moduleName。
- **配置加载**：内置 `DEFAULT_CONFIG`，并读 `~/.dsh/dsh-plugin-integration.json` 作为用户覆盖（`mergeConfig`：`plugins` 按 key 合并，`overlaps`/`compatRules`/`protected` 整体替换）。
- **通用回退**：`infoFor()` 对未知插件从 package.json 派生信息，`genericTags()` 从 keywords 派生标签。
- **启停写入**：自实现轻量 YAML patch 编辑器（保留注释、幂等）。
- **RPC**：`harness.handle` 暴露 `analyze` / `toggle` / `switch` / `applyFix`。
- **动态工具**：`plugin_integration`（供模型/脚本调用）。

### 2.2 Client 半（`src/client.js`）

- `slots.inject('settings.section')` 注册「插件整合」分页。
- React（`React.createElement`，无 JSX）+ `styles.insert` 局部样式 + `host.call` 调 RPC。
- 展示「受保护」「未知」标记与状态点（绿=已生效 / 黄=已启用 / 灰=已停用 / 红=加载失败）。

### 2.3 数据流

```
Client --host.call('analyze')--> Host --读 package.json / cordis.patch.yml / clientModules.graph()
                                       --读 ~/.dsh/dsh-plugin-integration.json（可选覆盖）
                                       --动态解析各 bundle 补丁
                                  Host --返回分析 JSON--> Client 渲染
Client --host.call('toggle'/'switch'/'applyFix')--> Host --写 cordis.patch.yml（受保护拦截）--> 结果
```

---

## 3. 外部配置文件

**默认配置**：`config.default.json`（已内置于 `src/host.js` 的 `DEFAULT_CONFIG`，两者需保持一致）。

**用户自定义**：把配置复制为 `~/.dsh/dsh-plugin-integration.json` 后编辑，无需重新编译即可增删插件元数据与规则。

```jsonc
{
  "protected": ["ui-web-ui-compat"],          // 禁止停用的核心条目
  "plugins": {                                 // 按 entryId 覆盖/新增（与默认合并）
    "my-plugin": { "label": "我的插件", "category": "某类", "tags": ["某tag"], "stars": 123, "capability": "…", "boundary": "…" }
  },
  "overlaps": [ /* 整体替换默认重叠组 */ ],
  "compatRules": [ /* 整体替换默认兼容规则 */ ]
}
```

合并规则：`plugins` 按 key 合并（用户条目覆盖/新增），`overlaps` / `compatRules` / `protected` 整体替换。

---

## 4. 数据源与判定依据

| 数据 | 来源 | 用途 |
|------|------|------|
| 已装插件 | `package.json` → `dsh.profile.bundles`（动态读） | 发现已装 bundle |
| 条目映射 | 各 bundle 的 `cordis.patch.yml`（`insert` 行） | 解析 entryId + 模块名 |
| 启停状态 | `cordis.patch.yml`（profile + home 两层）`disabled` 行 | 判定 enabled/disabled |
| 生效状态 | `clientModules.graph().entries[].id` | 判定客户端 bundle 是否生效 |
| 加载失败 | `pluginInventory/list` → `fiberPhase`（可用时） | 检测真实加载 bug |
| 双重挂载 | profile 补丁 `insert` 与 bundle 条目重复 | 存在性冲突检测 |
| 精确标签/规则 | `config.default.json` + `~/.dsh/dsh-plugin-integration.json` | 知识库覆盖层 |

---

## 5. 部署形态

本仓库同时提供**两种形态**的源码：

| 文件 | 形态 | 说明 |
|------|------|------|
| `src/host.js` + `src/client.js` | 动态插件（已验证） | 用 `harness.handle`/`host.call` 私有 RPC，在动态运行时运行 |
| `src/host.standalone.js` + `src/client.standalone.js` | **独立 bundle（推荐发布用，已实测）** | profile 补丁写入 + HMR 热重载启停、`webServer` HTTP 路由、原生 `fetch`（含 `gh` token 自动读取） |

### 5.1 形态 A：动态插件（已验证）

`cordis_define` 传入 `src/host.js` / `src/client.js` 的函数体，再 `cordis_run`。

### 5.2 形态 B：独立 bundle 安装（推荐发布用）

`package.json` 已指向 `src/host.standalone.js` / `src/client.standalone.js`，可直接安装：

```bash
dsh plugin --profile web add github:MutaLucem/dsh-plugin-integration
# 重启 DSH 后，设置栏底部出现「插件整合」分页
```

**形态 B 的核心优势**：启停/切换写 profile 的 `cordis.patch.yml`（`disabled: true/false` 行），由 profile 自带的 HMR 监听器（`watchUserPatches` → chokidar）**热重载即时生效并持久化**，与官方 `dsh-plugin-console` 同机制、不经过文件沙箱，设置页按钮直接生效（无需重启、不受 `workspace-write` 限制）。

**注意**：`src/host.standalone.js` / `src/client.standalone.js` 已在本机完成「安装 + 重启」实测。其核心发现/检测逻辑与动态形态完全一致，仅能力接线层不同（`harness`→HTTP 路由、`defineTool`→`ctx.tools.register`、写盘→profile 补丁写入）。实测修复了 4 处适配问题（详见 CHANGELOG [1.3.1]）：

1. `defineTool` 的 `parameters` 须用**平铺映射**（`参数名 → 值 schema`），而非标准 JSON Schema 的 `{ type:'object', properties, required }` 包装。
2. 客户端 bundle 须用 `window.__ModuleLoader__.load({ id, factory })` 注册（经典 `<script>` 加载），而非 ESM `export`。
3. 跨上下文服务（`loader`/`fs`/`clientModules`/`settings`）须在 `export const inject = [...]` 声明，`ctx.get()` 才拿得到。
4. 皮肤条目（`ui-skin-*`）非 profile bundle，须从 `~/.dsh/cordis.patch.yml` 单独发现。

---

## 6. 已知限制

1. **启停/切换需重启 DSH 生效**：改的是组合补丁文件，启动时读取。
2. **写盘依赖会话上下文**：动态插件默认运行在 `workspace-write` 沙箱（只能写工作区）；本插件写入 `~/.dsh` 前会通过 `sandboxPolicy.resolve({ session })` 解析真实模式（本会话为 `danger-full-access`）。经动态工具 `plugin_integration`（模型调用）时具备会话上下文、写盘正常；浏览器设置页直接调用 `host.call` 若未携带会话上下文，写盘可能被 `workspace-write` 拦截——这是动态插件沙箱的固有边界。
3. **皮肤由皮肤中心管理**：`ui-skin-*` 标记「皮肤中心管理」，不提供本插件启停。
4. **`fiberPhase` 运行时阶段**：`pluginInventory` 为 Remote-only，动态插件经 `typertGateway` 直连可能失败时回退为「配置态」判定；「已生效/已启用/已停用」仍准确。
5. **语义信息仍需人维护**：能力边界/重叠/兼容规则是「语义」，机器无法从文件自动确证；未知插件只能给启发式标签，精确信息需录入 `~/.dsh/dsh-plugin-integration.json`。
6. **更新检测的网络依赖**：「同步更新」对 npm 包查 npm registry 最新版、对 `github:` 包查 GitHub HEAD 提交；`file:`/`link:` 本地包不参与检测。GitHub 未认证限流（403/429）时 github 包可能检测不到（npm 包不受影响）；也可在配置里手动填 `latestVersion` 兜底。

---

## 7. License

MIT
