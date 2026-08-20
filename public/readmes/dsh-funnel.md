# dsh-funnel

English | [中文](README.zh.md)

**Curate tool output before it enters the model's context — keep the lines that matter, spill the rest to disk with a pointer. Faster turns, smaller context, sharper attention, for every tool.**

## The problem

Every tool result is appended to the conversation and re-sent on **every subsequent model request**. A `npm test` run that prints 500 lines rides along for the rest of the session: you pay for it on each turn, it fills the context window, and it buries the one `AssertionError` the model actually needs.

The existing layers don't cover this:

| Layer | What exists | What it doesn't do |
| --- | --- | --- |
| Capture (executor) | 64 MB spill protects the process from OOM | nothing about what the model sees |
| Execution (bash only) | `maxOutputBytes` byte-cap, head truncation | shell tools only; blind cut, no error lines kept |
| Compaction time | official `tool-result-pruner` rewrites over-budget results on the surface | fires only when compacting; blind head/tail; model can't read the original back |
| Ingestion — every result, immediately | — | **← dsh-funnel** |

Compaction-time pruning cleans up after the budget is already blown; dsh-funnel keeps it from being blown. They compose.

## What you get

1. **Install and forget.** One command, zero configuration. The plugin covers every tool that returns text — bash, file reads, web fetch, search — and results under the threshold pass through byte-identical, so you never notice it until it saves you.
2. **A ~24× smaller model view, measured.** In a real headless session, a 2001-line (8,893-byte) bash result reached the model as **370 characters**: head, tail, and every error/warning line kept:

   ```diff
   - [2001 lines of raw output]
   + [dsh-funnel] output curated: 2001 lines → 40 kept (head 15, tail 25, 0 pattern-matched). Full output: .dsh-funnel/2026-08-15T09-21-56-548Z-bash-1.log
   + 1 … 15
   + [dsh-funnel] … 1959 similar lines omitted …
   + 1977 … 2000
   ```

   Every later turn in the session pays for 370 characters instead of 8,893 — the saving compounds each request.
3. **Nothing is lost, and the model recovers on its own.** The full text spills to `.dsh-funnel/` and the notice carries the path. In testing, the model missed a middle line in the curated view, searched the spill file itself, and answered correctly — curation is pagination, not deletion. The spool doubles as an audit trail of what the agent actually saw.
4. **Long tasks hold up better.** Smaller context means cheaper turns, later compaction, and less attention dilution — the agent stays sharp deeper into a session instead of degrading as junk accumulates.
5. **Tune it to your workflow.** Threshold, kept lines, keyword patterns (add your project's own failure markers), per-tool aggressiveness, spill on/off.

Boundaries: error results are never touched (they are short and load-bearing); this complements compaction rather than replacing it.

## How it works

dsh-funnel wraps the `tools/execute` extension point (the seam the official timeout guard uses) and curates the canonical `value` of successful results: the registry re-projects model-facing content from `value`, so the curated view is exactly what the model sees and what the session log records. Long string fields inside `value` — stdout, stderr, fetched pages, file contents — are replaced in place; error results are never touched.

## Install

```sh
dsh plugin add github:YuanyuanMa03/dsh-funnel
```

Works on every tool that returns text — bash, file reads, web fetch, search.

## Configuration

All fields optional; set them under the plugin entry in your profile:

```yaml
- id: dsh-funnel
  name: 'dsh-funnel'
  config:
    maxChars: 4000        # results at or below this length pass through untouched
    keepHead: 15          # lines kept verbatim from the head
    keepTail: 25          # lines kept verbatim from the tail (errors usually live here)
    keepPatterns: [error, warn, fail, fatal, exception, assert, denied, panic]
    maxLineChars: 1000    # single oversized lines (minified/JSON) are capped
    spill: true           # write the full text to disk and reference it
    tools:                # per-tool overrides
      web_fetch: { maxChars: 2000 }
```

## Safety properties

- **Error results are never touched** — they are short and load-bearing.
- **Lossless at the disk level** — spilling keeps the full text; the model re-reads on demand.
- **Model-visible ⟺ logged** — the curated view replaces the result at the tool seam, so the session log records exactly what the model saw.
- **Byte-identical passthrough** — results under `maxChars` return as the same object; zero allocation when idle.

## Status

v0.1.0 — verified end-to-end in a real headless session: a 2001-line bash result was curated to 40 lines in model view and log, and the model recovered the omitted middle by reading the spill file (its own words: "the tool curates long output for display … verified against the complete saved output"). Unit tests cover the curation logic and the plugin wrapper. Planned: session-level savings accounting ("this session: N tokens avoided").

## License

[MIT](LICENSE)
