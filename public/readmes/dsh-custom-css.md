# dsh-custom-css

DSH WebUI 自定义 CSS 插件（官方 bundle 形态，client-half 插件）。

在设置面板新增「外观 / Custom CSS」页：粘贴任意 CSS 即时改变 WebUI 观感，样式持久化到宿主设置（`$DSH_HOME/settings.yaml`），**所有访问该 GUI 的浏览器共享**，多浏览器实时同步。

## 功能

- 粘贴/编辑 CSS 后 **500ms 防抖自动保存**到宿主，所有浏览器实时同步
- revision 乐观并发控制：远端修改与本地草稿冲突时暂停自动保存，用户可选择采用远端版本或显式覆盖
- 保存、同步、冲突和错误状态反馈；失败后可手动重试或放弃草稿
- 可导入 `.css` 文件，或上传 JPEG/PNG/WebP 背景图（压缩后以 data URI 存入 CSS，CSS 总量上限 1,048,576 个字符）
- 安全模式：URL 带 `?dsh-custom-css=off` 时本页不注入自定义样式，设置页仍可用于恢复
- 读、写均走 trusted-host 信任模型：本机与 `--trusted-host` 声明的远程地址都可修改共享样式
- 未保存草稿存于本浏览器 localStorage，刷新不丢失
- 中英文案
- 附带旗舰演示主题 `examples/dsh-aurora-nexus.css`，完整覆盖官方语义色、排版、动效、阴影、滚动条与 Shiki 接口

## 旗舰演示主题：Aurora Nexus

![Aurora Nexus 主题效果](https://raw.githubusercontent.com/AnacondaKC/dsh-custom-css/d1e2ee86b223775947eb5e26c62291a45df2fdcd/examples/dsh-aurora-nexus.png)

[`examples/dsh-aurora-nexus.css`](examples/dsh-aurora-nexus.css) 是本项目的完整能力演示：同时适配亮色/暗色，覆盖全部官方 `--dsw-alias-*`、`--dsw-specific-*`、静态色阶、排版、动效、阴影、滚动条和 Shiki token，并通过官方主题标记、ARIA role、`data-*` 与少量集中管理的 CSS Modules 选择器增强主框架、侧栏、会话、输入栏、设置、弹窗、菜单、Markdown、代码块和轨迹视图。

使用方式：打开「设置 → 自定义CSS」，复制该文件全文并粘贴。插件会将样式保存到宿主并同步给所有连接到当前 DSH GUI 的浏览器。主题不加载远程字体或图片，并完整处理 `prefers-reduced-motion`、高对比度和强制色模式。

## 架构

```
src/index.ts         host half：注册 settings namespace `dsh-custom-css` + 双 RPC 通道
src/rpc.ts           读通道 /dsh-custom-css-read（trusted-host）+ 写通道 /dsh-custom-css-write（trusted-host）
src/client/          browser half：设置页 + 样式注入（<style data-plugin>）+ 宿主同步
```

宿主设置经自定义 RPC 读写（Web 设置 API `api.settings.*` 只服务白名单 namespace，插件 namespace 不可达）。

## 构建与挂载

```sh
pnpm build                                        # tsc + tsdown + 产物校验
dsh plugin --profile web add /path/to/dsh-custom-css
dsh --profile web --dump-config | grep custom-css # 确认进入 bundles
# 重启 dsh web 后生效；浏览器 DevTools 检查：
#   window.__DSH_BOOT__.entries 含 dsh-custom-css
#   document.head 出现 <style data-plugin="dsh-custom-css">
```

开发态 `dsh web --dev` 下改 `src/client/**` 后重新构建，浏览器经内置 client-hmr 原地热替换（无需刷新）。

## 测试

```sh
pnpm test   # RPC 契约 + controller 状态机（冲突/草稿/权限）
```

## 恢复路径

- 样式异常：URL 加 `?dsh-custom-css=off` 打开本页；随后清空输入框或关闭开关并保存
- 配置损坏：删除 `$DSH_HOME/settings.yaml` 中 `dsh-custom-css` 段后重启
- **安全提示**：CSS 和背景图会同步给同一宿主的所有浏览器。仅应向受信任的 `--trusted-host` 访问者开放该 GUI，勿粘贴来源不明的 CSS。
