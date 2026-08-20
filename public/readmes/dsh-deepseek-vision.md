# dsh-deepseek-vision

A DSH plugin that gives text-only DeepSeek models image recognition.

It registers the `deepseek_vision` tool, which calls the local
[`deepseek-vision-cli`](https://github.com/menghuanshiguang/deepseek-vision-cli)
(browser automation driving chat.deepseek.com's vision mode) and returns the
image description as text to the model.

## Tool

- `deepseek_vision(image, prompt?)`
  - `image`: absolute path to a local image (PNG/JPG/WebP/GIF; HEIC is not supported)
  - `prompt`: optional question or analysis request for the image

## Installation

```bash
dsh plugin --profile web add D:/Dsh/tools/dsh-deepseek-vision
```

Or use the release tarball:

```bash
dsh plugin --profile web add dsh-deepseek-vision-0.0.1.tgz
```

## First login

DeepSeek web vision requires a web login session. The current web UI uses
password / third-party login, so the recommended way is the manual login helper:

```powershell
py -3.13 D:\Dsh\tools\deepseek-vision-cli\dsv_manual_login.py
```

It opens an Edge window to the DeepSeek login page. After you log in manually,
the helper saves the token to `D:\Dsh\.cache\dsv_token`.

### Token login (alternative)

If you already have a DeepSeek web session in your normal browser, you can copy
the token directly:

1. Open `https://chat.deepseek.com` and log in.
2. Press `F12` → `Application` → `Local Storage` → `https://chat.deepseek.com`.
3. Find `userToken`, copy its `value` field.
4. Save it to `D:\Dsh\.cache\dsv_token` (no quotes, no newline):

```powershell
[IO.File]::WriteAllText(
  'D:\Dsh\.cache\dsv_token',
  'PASTE_TOKEN_HERE',
  (New-Object Text.UTF8Encoding($false))
)
```

The token is only stored locally in `D:\Dsh\.cache\dsv_token`; it is never
committed to this repository.

## Configuration

Default configuration for this machine:

- `pythonCommand`: `py`
- `pythonVersion`: `-3.13`
- `dsvScript`: `D:/Dsh/tools/deepseek-vision-cli/dsv.py`
- `timeoutMs`: `180000`
- `maxOutputChars`: `20000`

These can be overridden in a profile patch.

## Security notes

- The tool only accepts local file paths and invokes the external CLI through
  the DSH `subprocess` service with an argv array, never through a shell.
- Images are sent to DeepSeek's web endpoint; this is not local recognition.
- This relies on non-official web interfaces and may be subject to risk control.
  Use a secondary account and keep usage low-frequency.
- Static security audit reports `critical` for spawning a subprocess; this is
  inherent to wrapping an external CLI. The code has been manually reviewed:
  it only runs the fixed `dsv.py`, with no command concatenation or extra
  exfiltration.

## License

MIT
