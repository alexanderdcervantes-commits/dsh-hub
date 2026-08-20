# dsh-prompt-enhancer

DeepSeek Harness（DSH）Web UI 插件：在输入框模型选择区域右侧增加一个「✨ 增强提示词」按钮，把未发送的草稿改写成更适合交给 AI Agent 执行的提示词。

## 功能说明

- 纯图标按钮，悬停显示操作提示；
- 输入框为空时按钮自动禁用，有内容后恢复；
- 点击后显示缓冲动画，避免误以为无响应；
- 增强完成后弹出对比弹窗：上方「增强前」、下方「增强后」；
- 可选择「采用」或「拒绝」；
- 支持 `Esc` 拒绝、`Enter` 采用；
- 复用 DSH 当前模型与凭据，不额外保存 API Key；
- 默认关闭深度思考（`reasoningEffort: off`），速度快、省 token；
- 系统提示词按用户意图分类改写，输出可直接交给 Agent 执行的提示词。

## 安装方式

### 方式一：本地目录安装

1. 将本项目复制到 DSH profile 的插件目录：

   ```text
   ~/.dsh/profiles/web/node_modules/dsh-prompt-enhancer
   ```

   Windows 示例：

   ```text
   C:\Users\<用户名>\.dsh\profiles\web\node_modules\dsh-prompt-enhancer
   ```

2. 编辑 `~/.dsh/profiles/web/cordis.patch.yml`，追加：

   ```yaml
   - insert:
       - id: dsh-prompt-enhancer
         name: 'dsh-prompt-enhancer'
   ```

3. 完全退出 DSH（含托盘）后重新打开，刷新页面。

### 方式二：使用 DSH 插件安装命令（推荐）

如果系统已安装 pnpm：

```bash
dsh plugin add github:LCQ-1024/dsh-prompt-enhancer
```

或指定 profile：

```bash
dsh plugin --profile web add github:LCQ-1024/dsh-prompt-enhancer
```

仓库根目录已包含 `cordis.patch.yml`，`package.json` 也已声明 `dsh.bundle`。安装时 DSH 会自动读取补丁并注册插件，无需手动编辑 `cordis.patch.yml`。安装后重启 DSH Web 服务。

## 使用方法

1. 在 DSH 输入框输入想优化的问题或需求；
2. 点击模型选择区域右侧的 ✨ 按钮；
3. 等待缓冲弹窗结束；
4. 在对比弹窗中查看「增强前 / 增强后」；
5. 点击「采用」或「拒绝」。

## 配置项

在 `cordis.patch.yml` 的插件行中可加 `config`：

```yaml
- insert:
    - id: dsh-prompt-enhancer
      name: 'dsh-prompt-enhancer'
      config:
        provider: deepseek-official
        model: deepseek-v4-pro
        reasoningEffort: off
        maxTokens: 4096
        timeoutMs: 120000
        maxInputChars: 200000
```

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `provider` | 空 | 留空自动读取 `settings.yaml` 的 `agent-default-model.provider` |
| `model` | 空 | 留空自动读取 `settings.yaml` 的 `agent-default-model.model` |
| `reasoningEffort` | `off` | `off` 快速省钱；DeepSeek 还支持 `high` / `max` |
| `maxTokens` | `4096` | 增强输出最大 token 数 |
| `timeoutMs` | `120000` | 请求超时时间（毫秒） |
| `maxInputChars` | `200000` | 允许的最大草稿字符数 |
| `systemPrompt` | 内置 | 一般不需要修改 |

## 技术入口

- 服务端入口：`index-v5.js`
- 客户端入口：`client-v3.js`

## 注意事项

- 不要在本插件配置中写入任何 API Key；插件直接复用 DSH 已配置的模型凭据。
- 若 DSH 升级后按钮位置变化，可在插件加载前设置：

  ```js
  window.__dshPromptEnhancer = {
    composerSelector: '[data-slot="conversation.composer.bar"]',
    inputSelector: 'textarea',
    sendButtonSelector: '',
  };
  ```

- 卸载：删除 `cordis.patch.yml` 中对应 `- insert:` 块，删除插件目录，重启 DSH。

## 安全说明

本插件不收集、不存储、不上传任何 API Key、账号、密码或用户数据。增强请求仅通过 DSH 本机服务转发给当前已配置的模型。
