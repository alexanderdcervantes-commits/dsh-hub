# dsh-tool-approval

English | [中文](README.zh.md)

Add pre-approval to any Tool Calling, aka "Manual Mode"/"Ask Mode".

![](https://raw.githubusercontent.com/ilharp/dsh-tool-approval/c01801a7e39c36515d8445747abff6a6388c1278/assets/img1.png)

## Install

```sh
dsh plugin --profile web add dsh-tool-approval
```

## Config

### Default config

```yml
- id: tool-approval
  name: dsh-tool-approval
```

With the default config, every Tool Calling goes through pre-approval.

### Custom config

```yml
- id: tool-approval
  name: dsh-tool-approval
  config:
    include: [fs_*, web_*]
    exclude: [task_output]
    reason: tool execution requires your approval
```

Only tools specified in `include` get pre-approval; tools in `exclude` pass through. Wildcards are supported.

## LICENSE

[BSD 3-Clause](LICENSE)
