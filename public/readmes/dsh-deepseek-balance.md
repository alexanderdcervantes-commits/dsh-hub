# dsh-deepseek-balance

右下角悬浮的 **DeepSeek API 余额监视器** —— 为 DeepSeek Harness (DSH) 实时显示账户余额与用量费用。

![badge](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)

## 功能

- 🟢 **右下角常驻悬浮徽章**：状态色圆点 + 实时余额，任何页面/会话下都可见
- 📊 **用量费用图表**：7 天 / 30 天柱状图，悬停查看每日金额
- 🔄 **每 60 秒自动刷新**，也可手动刷新
- 🎨 **自动适配深浅色主题**（使用 DSH 主题变量）
- 🔑 **自动读取已配置的 `DEEPSEEK_API_KEY` 凭证**，无需手动填写
- 🔒 **Key 安全**：通过环境变量传给 curl，命令行/日志不出现明文

余额数据来自官方接口 `GET https://api.deepseek.com/user/balance`；
用量数据来自本机 DSH 会话日志的真实 token 统计（按官方价格换算费用），
更早的历史因本地无账单记录以灰色示意柱展示。

## 安装

```sh
dsh plugin --profile web add "github:<你的用户名>/dsh-deepseek-balance#main"
```

然后重启 `dsh --profile web`，右下角即可看到余额徽章。

### 凭证配置

在 `~/.dsh/.credentials.yaml` 中配置：

```yaml
DEEPSEEK_API_KEY: sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

## 开发

```sh
pnpm install
pnpm build    # tsc 编译 Host + tsdown 打包 Client
```

产物结构：

- `lib/index.js` — Host 半（RPC handler：余额/用量查询）
- `lib/client.js` — Client 半（悬浮徽章 UI，`__ModuleLoader__` bundle）

## 工作原理

```
┌──────────────┐   connection.rpc.call   ┌──────────────────────────┐
│  Browser UI  │ ──────────────────────▶ │  Host (Node)             │
│  shell.overlay│  /deepseek-balance      │  ├─ credentials.resolve  │
│  悬浮徽章+图表 │ ◀────────────────────── │  ├─ shell curl 余额 API  │
└──────────────┘   RpcResult             │  └─ sessionQuery 用量统计 │
                                         └──────────────────────────┘
```

## License

MIT
