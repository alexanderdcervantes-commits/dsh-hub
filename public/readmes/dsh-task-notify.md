# dsh-task-notify

[English](README.md) | [中文](README.zh.md)

> A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) plugin that shows a **native OS system notification** whenever a task completes — goal completion or agent turn end. **Windows / macOS / Linux**.

## Features

- **Native OS notifications** on every platform: Windows toast, macOS Notification Center, Linux libnotify — real system banners, not blocking dialogs.
- **Two "task done" triggers** (configurable):
  - goal completes (`phase = complete`)
  - an agent turn ends normally
- **Zero runtime dependencies** — Node built-ins + OS-native commands (PowerShell, osascript, notify-send).
- **CJK-safe** — Windows text travels via UTF-8 temp files so Chinese/Japanese/Korean content is never corrupted.
- **Anti-spam** rate-limit between notifications.

## Platform support

| OS      | Mechanism                          | Requires                        |
|---------|------------------------------------|----------------------------------|
| Windows | WinRT toast (Notification Center)  | nothing (AUMID registered at runtime) |
| macOS   | `osascript` `display notification` | macOS 10.8+                     |
| Linux   | `notify-send` (libnotify)         | libnotify (`notify-send`); falls back to zenity, then kdialog |

## How it works (Windows)

1. On first notify, the plugin registers an **AppUserModelID** (`dsh.tasknotify`) under `HKCU\Software\Classes\AppUserModelId` so `CreateToastNotifier` can deliver to the interactive desktop.
2. When a task completes, it writes the title/body to UTF-8 temp files and runs a small PowerShell script that shows a WinRT `ToastText02` notification via `ToastNotificationManager`.
3. Temp files are removed afterwards. Failures are logged (never thrown) so they never break an agent turn.

Each notification (and any failure) is recorded in an audit log at `<home>/task-notify.log`.

## Install

As a dsh bundle, installable via the profile plugin manager:

```sh
dsh plugin --profile web add dsh-task-notify
```

Or install the repo directly (npm alias spec):

```sh
dsh plugin --profile web add github:YuMo226/dsh-task-notify
```

### Manual install (no pnpm)

Copy this package into the profile's hoisted `node_modules` and add a loader entry:

```yaml
- insert:
    - id: notify
      name: dsh-task-notify
      config:
        onGoalComplete: true
        onTurnEnd: true
        title: 'DeepSeek Harness'
        minIntervalMs: 4000
```

> Restart `dsh web` after installing for the plugin to mount.

## Configuration

| Key            | Type      | Default             | Description                                        |
|----------------|-----------|---------------------|----------------------------------------------------|
| `onGoalComplete` | boolean | `true`             | Notify when a goal completes.                      |
| `onTurnEnd`      | boolean | `true`             | Notify when an agent turn ends normally.           |
| `title`          | string  | `DeepSeek Harness` | Leading line of the notification.                  |
| `minIntervalMs`  | number  | `4000`             | Minimum ms between two notifications (anti-spam).  |

## Troubleshooting

- **Windows**: make sure the notification center is on and Focus Assist is not set to "Alarms only" / "Priority only".
- **Linux**: install libnotify (provides `notify-send`); if missing, the plugin falls back to zenity, then kdialog.
- If no notification appears, check `<home>/task-notify.log` for an error line and [open an issue](https://github.com/YuMo226/dsh-task-notify/issues).

## License

[MIT](LICENSE)