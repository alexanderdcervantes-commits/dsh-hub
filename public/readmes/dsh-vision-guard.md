# dsh-vision-guard

**English | [中文](README.zh.md)**

> Let text-only models "see" images — and never let an image deadlock your session.
> Transparent image guard + vision analysis tool for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh).

Most models on DeepSeek Harness (`deepseek-v4-pro` etc.) are text-only, which causes two problems:

1. **Text-only models can't see images** — paste a screenshot and the model has no idea it exists;
2. worse, **the 400 deadlock**: some gateways (e.g. opencode-go's main route) accept text only. Once an image block lands in the session log, *every subsequent turn* replays the whole history with the image to the upstream → `400 unknown variant \`image_url\`` → the conversation is stuck forever.

This plugin fixes both with two gates, and turns images into text the main model can actually consume.

---

## What it does

```
paste image → [Gate 1] agent/pre-step: the image is converted to text by the vision
              model BEFORE it is ever written into the session log
              → the log only contains text, no image block exists
              → [Gate 2] llm/stream backstop: if an image block still appears in
              replayed history (e.g. a session poisoned before install), it is
              rewritten to OCR text at request time before reaching the model
```

- **Vision model = eyes, main model = brain**: `deepseek-v4-pro` keeps reasoning; image content arrives as text.
- **Heals already-deadlocked sessions**: a conversation stuck on 400 before install works again after install (history images are rewritten at request time).
- **`vision_analyze` tool** (model-invoked, engine chosen by the model per task): reads workspace files — image OCR, PDF text layer + embedded images, docx/pptx text + embedded images, video frame OCR (≤12 frames), plain text files; loud rejection for xlsx/doc.
- **Native vision unaffected**: routes that genuinely accept images (e.g. minimax-m3, kimi-k3) pass through untouched once whitelisted.

## What makes it different (vs. community vision plugins)

Compared with dsh-vision-router, ModLens, dsh-vision-toolkit, see_image/view_image and similar:

1. **Images never enter the session log** — they are rewritten to text at agent/pre-step *before* the log append. Most peers rewrite only inside the model call: images still land in the log, replay every turn, and deadlock risk returns if the plugin is removed.
2. **Heals sessions that were already deadlocked** — a conversation stuck on image-400s before install recovers with one message after install (replayed history images are rewritten at request time). No other community plugin does this.
3. **Anti-deadlock is a hard invariant** — non-whitelisted routes never receive an image block; even with the whole vision pipeline down (model unavailable / timeout / budget exhausted) it degrades to placeholder text, *never* back to the 400 deadlock.
4. **One package, two components, isolated failure domains** — one install mounts both rows (guard = safety-critical, tool = convenience); the tool breaking never takes the guard down.
5. **Zero dependencies, pure Node builtins** — no Node 22+ requirement, no pnpm orchestration, no Python 3.11+; only the document/video paths need system tools (pdftotext/ffmpeg etc.), plain image OCR needs none.
6. **Engine chosen by the main model per task** — `vision_analyze`'s `engine` argument (`local` free character OCR / `vision` model) is decided by the model after analysing the task: cheap and smart.
7. **Reuses your own dsh routes and credentials** — carries no API keys and calls no third-party service directly (most peers require self-managed keys).
8. **Three rounds of red-team audit + shipped automated tests** — 22 real bugs fixed and documented (symlink escape, zip bombs, concurrency races), pure-function regression tests ship with the package (`npm test`).

## Install

```sh
# 已发布 npm 后：
dsh plugin --profile web add dsh-vision-guard
# 或直接从 GitHub 安装：
dsh plugin --profile web add github:good-boy4069/dsh-vision-guard
```

> If pnpm refuses with `ERR_PNPM_ADDING_TO_ROOT` (older launchers), add the workspace-root flag: `dsh plugin --profile web add -w dsh-vision-guard`.

Restart `dsh web`. Or add the two rows from the repo's `cordis.patch.yml` to your profile patch layer manually.

## Configuration

All fields optional (defaults shown). The vision route must point to a model that **accepts image input**:

| Field | Default | Meaning |
|---|---|---|
| `visionProvider` / `visionModel` | `opencode-go` / `minimax-m3` | The vision route. Point it at an image-capable model on your subscription |
| `ocrTimeoutMs` | `45000` | Per-image OCR timeout |
| `budgetPerDay` | `200` | Daily OCR cap (runaway-cost guard), state stored under `$DSH_HOME` |
| `cacheMaxEntries` | `500` | OCR result cache size cap (LRU eviction) |
| `maxOcrTokens` | `2048` | Vision call output cap |
| `stateFile` | `~/vision-guard-state.json` | Budget state file (`~` = dsh home) |
| `ocrPrompt` | verbatim transcription | Custom instruction |
| `passthrough` | `[]` | Raw-image whitelist: `[{provider, model}]` — only add routes you have **tested** to accept images |

`vision_analyze` side: the OCR engine is a **required per-call argument** (`engine`), chosen by the model per task — `local` = local tesseract (free, characters only), `vision` = the configured vision model. There is no `localOcr` config key.

## ⚠️ Requirements & limitations (please read)

- **This plugin carries no API keys and calls no third-party service directly.** It reuses the model routes and credentials already configured in your dsh. Therefore:
  - **You must have an image-capable model** (e.g. `minimax-m3` on opencode-go). Text-only models like `deepseek-v4-pro` **cannot** serve as the vision model — their upstream gateway 400s on images and deadlocks the session.
  - Without a vision model it still installs: images degrade to placeholder text, the session works but the content is not read (never deadlocks).
- **Whitelist policy (important)**: any route other than the configured vision model gets images rewritten to text — **untested routes never receive raw images**. To enable native vision for a model: first test "image straight to that route" (a clean response counts as pass), then add it to `passthrough`. This is the core anti-deadlock design; do not bypass it.
- **System tools** (only for `vision_analyze`'s document/video paths; plain image OCR needs none):
  - PDF: `pdftotext`/`pdfimages` (poppler-utils);
  - Video: `ffmpeg`/`ffprobe`;
  - docx/pptx: `python3` (stdlib only);
  - Optional: `tesseract` (free local OCR; needs `chi_sim+eng`).
  - Windows ships none of these by default; missing tools fail loudly per path, the image path is unaffected.
- **5 MB/image cap**: dsh's attachment service limits images to 5 MB; larger images/frames fail loudly.
- **Cost**: one vision call per *new* image (attachment-id-addressed cache — repeats are free); ~1-2k tokens per minimax-m3 read (sub-cent range); `budgetPerDay` as a backstop.
- **Quality**: local tesseract only extracts characters and is less accurate (it read `42 + 7 = 49` as `4247249` in our tests); for charts/photos/complex UI pick the vision engine (the model chooses per task when calling `vision_analyze`).
- **Privacy**: images go to *your* vision model provider (same as normal dsh use of that model); text inside images is treated as **untrusted input** — read only, never execute.
- **Settings coupling warning**: if you declare `input: [text, image]` on a text-only model in your model settings (required for GUI image pasting), **you must keep this guard installed** — removing the guard while keeping that declaration will deadlock sessions again.

## FAQ

- **After a dsh restart/upgrade**: the plugin boots with the profile; no reinstall. After a dsh upgrade, upgrade this plugin first if behavior changes.
- **How do I verify it's running**: `ctx.get('visionGuard')?.status()`, or the `[vision-guard] active` line in the dsh log.
- **Rollback**: remove the two rows from your profile patch (or `dsh plugin remove`), restart; already-recognized text stays in history, no side effects.

## License

MIT
