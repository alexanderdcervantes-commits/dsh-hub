# dsh-context-proxy

Thin on-demand context-retrieval layer for the DeepSeek Harness.

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

Automatic truncation, spill-to-disk, compaction, and token metering are already
owned by `output-retention`, `spill-policy`, `compaction-basic`, and
`session-query`. This package adds only the missing piece: three model-facing
tools that read already-persisted history back on demand.

## Install

```sh
dsh plugin --profile <name> add github:EvilIrving/dsh-context-proxy
```

Or, from a checkout:

```sh
dsh plugin --profile <name> add ./dsh-context-proxy
```

The bundle patch inserts one plugin row (`dsh-context-proxy`). `sessionQuery`
and `subprocess` are optional backends (`ctx.get`): without a `sessionQuery`
backend each tool degrades to an `isError` result instead of waiting forever.

## Tools

| Tool | Backing seam | Returns |
|---|---|---|
| `context_query` | `sessionQuery.filterEvents` | lightweight `{ seq, type, text }` matches by seq/type/surface/text |
| `context_slice` | `sessionQuery.readEvent` | one event plus a bounded `before`/`after` window |
| `context_grep` | `subprocess` (packaged `rg`) or `sessionQuery.filterEvents` | matches with `{ text, citation }` |

Citations are replay-safe: `context_query`/`context_slice` cite `session:<seq>`
(rebuildable from the canonical log), and `context_grep` cites either a spill
path (`path:line`, fast local path) or `session:<seq>` (semantic-text fallback
when no spill path is supplied or available).

## Config

```ts
export interface Config {
  readWindowDefault: number  // default before/after for context_slice (default 0)
  grepMaxBytes: number       // rg stdout in-memory cap (default 1 MiB)
  rgGraceMs: number          // rg termination grace (default 5000)
}
```

## Dependencies

- `sessionQuery` and `subprocess` are **optional** services read via
  `ctx.get(...)`. A missing `sessionQuery` backend degrades each tool to an
  `isError` result (`session query backend unavailable`) instead of leaving the
  plugin waiting forever; the same applies to `subprocess` for `context_grep`
  with an explicit path.
- `tools` is a hard dependency (`inject`).
- The packaged ripgrep binary comes from `@vscode/ripgrep` — the same mechanism
  `dsh-tool-fs-search` uses — so no system `rg` install is required and no
  shell layer exists between the argv vector and ripgrep.

## Model Experience

### Request context and condition

#### What the model sees

Three tool schemas (`context_query`, `context_slice`, `context_grep`) are
registered into the agent's tool set. Each result is a compact JSON object of
matches/items plus citations; no prose is returned for the model to parse ids
out of.

#### Token effect

Zero-direct effect until a tool is invoked; each invocation's cost is bounded
by the query/slice window and the `grepMaxBytes` cap.

#### KV Cache effect

Append-only: tool results append to the surface; they never rewrite earlier
request tokens.

## Known Limitations and Deferred Work

- **`context_grep` line parse is `path:line:text`** — a spill path containing a
  newline (not expressible in the durable locator) would confuse the parser;
  absolute spill paths never contain one.
- **Fallback text scan is literal, not regex** — when no spill path is
  supplied, `context_grep` falls back to `sessionQuery`'s literal,
  case-insensitive, whitespace-flexible scan, not a regex search.
- **Bundle writing is not sandboxed** — nothing here writes files; retrieval
  only reads through the seams.
