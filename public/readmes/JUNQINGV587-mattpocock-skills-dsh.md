# mattpocock-skills-dsh

**Standalone fork / DSH port** of Matt Pocock's agent skills
([`mattpocock/skills`](https://github.com/mattpocock/skills)).

This repository is intentionally kept as a separate fork rather than merged
upstream. It packages the 25 promoted `engineering` + `productivity` skills as
a DeepSeek Harness (DSH) profile bundle.

- Source: `mattpocock/skills`
- Layout: flat `skills/` tree (matches upstream's `flatten-skills-tree`
  direction), so DSH's one-level skill discovery works directly.
- Adaptations: two `SKILL.md` files are adjusted for DSH-facing wording
  (`setup-matt-pocock-skills`, `writing-for-agents`).
- License: MIT, copyright (c) 2026 Matt Pocock — see `LICENSE`.

## Install

```bash
dsh plugin --profile web add github:JUNQINGV587/mattpocock-skills-dsh
```

Or with a full URL:

```bash
dsh plugin --profile web add https://github.com/JUNQINGV587/mattpocock-skills-dsh.git
```

After install, restart the DSH profile for the bundle to load.

## Upstream tracking

The `upstream` remote points at `mattpocock/skills`. This fork does **not**
merge wholesale into upstream; pull upstream changes manually when needed.
