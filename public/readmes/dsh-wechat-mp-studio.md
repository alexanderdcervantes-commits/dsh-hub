# dsh-wechat-mp-studio

> WeChat Official Account content studio for DeepSeek Harness

[中文](./README.zh.md) | English

The first open-source plugin to package the **anti-“low creativity” playbook** for WeChat Official Account (公众号) content production — distilled from a real account that got flagged by the platform, went through remediation, and recovered. Not theory.

## The problem

Recurring-content accounts (morning greetings, goodnight wishes, solar-term cards, homilies, blessing cards…) rarely fail because they “write badly”. They fail because the platform flags them as **low creativity** and turns off public recommendation. The platform scores a combination of signals — category × format × frequency × fixed phrases:

- The same greeting text on every image, the same title prefix, the same hashtags, day after day;
- Multiple near-duplicate posts per day cannibalizing each other;
- Templated structure: five posts with the same skeleton = low-creativity signal.

This plugin provides an executable **anti-homogenization production pipeline**: structure-signature rotation, the “daily delta” test, a visual baseline for blessing images, OCR acceptance for on-image text, interaction rules, and draft-box sync — including measured parameters for the xiaolvshu (newspic) internal web API.

## What's inside

| Capability | Details |
|---|---|
| Rotation writing method | Six-variable structure signatures, anti-recency selection, six anti-homogenization self-checks, anti-AI-slop language rules |
| Daily delta test | Delete test / replace test, seven rotating “conversation starter” sources |
| Low-creativity remediation | Root-cause analysis, remediation direction, recovery cadence, filter rules for common advice (de-identified) |
| Visual baseline | Quantified “festive at a glance, clear on second look, credible on third” standard + 8 acceptance checks |
| Image pipeline | Native 2.35:1 cover prompt template, anti-typo rules for on-image Chinese text, OCR acceptance SOP, troubleshooting |
| Interaction guide | One primary call-to-action (+ at most one secondary), fixed comment prompts, red lines, closing three-part formula |
| Publishing | Measured xiaolvshu (newspic) draft web API: upload `scene=5`, full `operate_appmsg type=77` form + format switches |
| Scripts | `generate_images.py` (templated image generation), `ocr_verify.py` (macOS Vision / MiniMax M3 dual backends) |
| Log templates | Structure log and image log templates (the rotation ledger) |

## Install

```sh
# From GitHub (recommended: source is auditable)
dsh plugin --profile web add github:FuncWei/dsh-wechat-mp-studio

# Or from npm once published
dsh plugin --profile web add dsh-wechat-mp-studio
```

After install, the model loads the `wechat-mp-studio` skill on demand (when writing MP content, generating images, syncing drafts, or debugging low-creativity flags). You can also invoke it explicitly: “use wechat-mp-studio to draft today's post”.

## Usage

1. **Write**: tell the model your account positioning (audience / persona / monetization) and let the pipeline produce copy + a structure signature.
2. **Generate images**: `python3 skills/wechat-mp-studio/scripts/generate_images.py cover --text "<today's blessing>" --anchor "<subject>"` (set `IMAGE_API_KEY` to a gpt-image-compatible endpoint).
3. **Verify**: `python3 skills/wechat-mp-studio/scripts/ocr_verify.py --image cover.png --expected "<today's blessing>"`.
4. **Sync draft**: follow `references/xiaolvshu-web-api.md` to push to the draft box (drafts only — publishing stays human-confirmed).
5. **Log**: append one row each to the structure log and image log; the next post reads them for anti-recency selection.

## Layout

```
skills/wechat-mp-studio/
├── SKILL.md                              # Entry: eight-step pipeline + red-line checklist
├── references/
│   ├── anti-homogenization.md            # Rotation writing method
│   ├── low-creativity-recovery.md        # Low-creativity remediation playbook
│   ├── visual-baseline.md                # Blessing-image visual baseline
│   ├── gpt-image-2-prompts.md            # Image prompts, anti-typo rules, OCR SOP
│   ├── xiaolvshu-web-api.md              # Measured xiaolvshu draft web API
│   └── interaction-and-hooks.md          # Interaction guide & share hooks
├── scripts/
│   ├── generate_images.py                # Cover/post image generation (templates built in)
│   └── ocr_verify.py                     # On-image text OCR acceptance (dual backends)
└── templates/
    ├── structure-log.md                  # Structure log template
    └── image-log.md                      # Image log template
```

## Disclaimer

- The WeChat MP web APIs (`operate_appmsg`, etc.) are internal, undocumented, and subject to change at any time. The parameters here are a point-in-time measurement; re-verify per §4 of `references/xiaolvshu-web-api.md` before use.
- This plugin ships methodology and tooling, not guaranteed traffic. Follow platform rules and local regulations.
- Third-party services (gpt-image, MiniMax, OpenCode Go) used by the scripts require your own keys/quota.

## License

[MIT](./LICENSE)
