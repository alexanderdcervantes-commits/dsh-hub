# dsh-shield

DSH 脱手模式安全网：删除目录先进回收站、删除链接绝不跟随。**零审批、零弹窗**，agent 体验不变。

## 能力

- **目录删除先进回收站**：bash 的 `rm -r/-rf`、cmd 的 `rmdir/rd/del /s`、fs 工具的目录删除，执行前把目标 rename 进回收站（同卷瞬时），命令照常执行
- **glob 抢救**：`rm -rf dir/*`、`dir/*.log` 逐个抢救子项；父目录是链接时顺链接解析，抢救真实目标内容
- **链接绝不跟随**：`rm -rf link/` 自动改写为删链接本身
- **回收站管理**：设置页「回收站」分区 —— 查看 / 恢复 / 删除 / 清空；超 14 天或 5GB 自动清理
- **可选系统回收站**：配置 `trashMode: system` 走系统回收站（失败自动回落）

## 配置（profile 补丁层，均可省略）

```yaml
- id: dsh-shield
  config:
    trashRoot: D:\\path\\to\\trash      # 默认 $DSH_HOME/trash
    retentionDays: 14
    maxTrashBytes: 5368709120
    trashMode: dir                            # dir | system
```

## 安全边界

- 只抢救不拦截：命令仍会执行，agent 无感
- 单目标 + 常见 glob 场景已覆盖；极端 shell 花样以回收站兜底
- 管理 API 仅本机回环可用

## 测试

```bash
node test.mjs   # 27 项
```

## License

MIT
