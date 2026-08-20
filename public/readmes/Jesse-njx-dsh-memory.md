# dsh-memory

**Cited memory over DSH's lossless session log.** Distilled facts that can always escalate back to the exact original context.

`dsh-memory` is a DeepSeek Harness bundle. When a session ends, a background distillation pass extracts durable facts — user preferences, project decisions, environment quirks, corrections — into small markdown files under `~/.dsh/memory/`. Every memory carries a **citation** `(sessionId, [start..end])` pointing at the exact log events it came from. The next session gets a compact index of those memories, plus two tools: `memory_read` (the full memory) and `memory_expand` (the cited original log excerpt).

The key idea: **summaries are an index into ground truth, never the truth.** Retrieval surfaces the one-line distilled fact (cheap); when the agent needs more, `memory_expand` returns the exact original log events (exact, not reconstructed). DSH can do this cheaply because it already sits on a complete, append-only transcript store — no memory *store* is built, only a memory *index*.

## Why this shape

Mainstream memory systems (Mem0, Letta/MemGPT, Zep) share one weakness: extraction is lossy and unaccountable. Once a summarizer mangles a fact, the original is gone or unfindable, and the agent confidently recalls the mangled version. DSH's differentiator is the append-only session log: everything the model ever saw is already durably stored. So dsh-memory distills into **files** (human-auditable, git-diffable, deletable with `rm`) and keeps a **citation** back to the log on every fact.

## How it works

1. **Distill (post-session, async via `ctx.jobs`)** — when a session leaves the store, a background job feeds the session's live events (bounded transcript, token-capped) to one cheap-model pass and asks for durable facts as JSON. Facts become memory files; existing memories are updated in place (citation appended, `rev` bumped) or **contradicted** (the named memory is rewritten, keeping its name). Every pass is recorded in `<project>/_distill.log` (JSONL).
2. **Recall (every prompt assembly)** — a system-prompt section renders a compact, token-capped index of `name — description` lines for the current project (plus shared user memories). Bodies stay one `memory_read` call away; the cited source one `memory_expand` call away.
3. **Maintain** — the distill pass updates and contradicts existing memories; the `dsh-memory` CLI lists, shows, edits (in `$EDITOR`), and deletes; the `/memory` slash command lists them inside a session.

No vector database, no knowledge graph, no auto-injection of full memory bodies in v0.1.

## Install

```sh
dsh plugin --profile web add @dsh-memory/bundle
```

The distillation pass routes through `ctx.llm` — it reuses the session's own provider/model by default, so a polyglot-style provider chain or your normal model serves it too. Override with `distill.provider` / `distill.model`.

## Config

All fields optional (profile patch or `cordis.patch.yml`):

```yaml
plugins:
  dsh-memory:
    enabled: true
    home: ~/.dsh/memory            # memory root override (default: $DSH_HOME/memory or ~/.dsh/memory)
    maxIndexTokens: 800            # hard token cap for the injected recall index
    maxExpandBytes: 8192           # output byte cap for one memory_expand excerpt
    recall:
      enabled: true
      cacheMs: 5000                # index cache TTL
    distill:
      enabled: true
      provider: deepseek-official  # default: the session's own route
      model: deepseek-v4-flash
      maxTokens: 2048
      temperature: 0.1
      maxTranscriptTokens: 16000   # transcript cap; oldest events are dropped under it
```

## Memory files

One small markdown file per memory, valid markdown with a JSON header comment:

```md
<!-- dsh-memory: {"name":"prefers-ts","description":"Prefers TypeScript over JS","type":"user","citations":[{"sessionId":"session-12","start":4,"end":18}],"createdAt":1700000000000,"updatedAt":1700000000000,"rev":1} -->

The user prefers TypeScript for new projects and tests.
```

- `~/.dsh/memory/<project>/*.md` — project + feedback memories, keyed by the session cwd's basename.
- `~/.dsh/memory/_user/*.md` — `user`-type (cross-project) memories.
- `type`: `user` (cross-project preference), `project` (facts about this project), `feedback` (corrections the user made).

A project memory with the same name shadows a user memory.

## Tools

- **`memory_read(name)`** — the full memory file: name, type, description, body, citations.
- **`memory_expand(name, [citation_index])`** — the exact original session-log excerpt the memory was distilled from (lossless escalation). Uses `ctx.sessionPersistence`; the citation range is exact.

## CLI

Standalone `dsh-memory` binary, pure Node (no harness packages):

```sh
dsh-memory list [--project P] [--json]   # list memories (user + project)
dsh-memory show <name> [--project P]     # show one memory with citations
dsh-memory edit <name> [--project P]     # open the memory file in $EDITOR
dsh-memory delete <name> [--project P]   # delete one memory file
dsh-memory distill-log [--project P]     # recent distill audit entries
```

`--home` overrides the memory root. Inside a session, `/memory` (or `/memory <name>`) does the same.

## Explicit non-goals (v0.1)

Vector databases, knowledge graphs, cross-project global memory beyond the `user` type, memory sharing/sync, auto-injection of full memory bodies. Each one multiplies the failure surface of the exact thing this plugin is skeptical about. If the index outgrows what a model can scan, *then* consider embedding search (v0.3, only with evidence).

## Honest experiment framing

This is an experiment with a defined kill criterion, not a committed product. After the plugin is dogfooded on plugin-development sessions for two weeks: success = concrete instances where a recalled memory saved a re-explanation or prevented a repeated mistake, and zero instances of a stale memory misleading a session that wasn't caught via citation. If it fails that bar, the repo gets archived with a postmortem README — a documented negative result about agent memory is respectable open-source output; a zombie memory plugin is not.

## Development

```sh
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm test        # node --test (54 tests: store round-trips, index caps,
                 # transcript bounds, distill parsing/application, CLI)
pnpm build       # tsc → lib/
pnpm pack        # publishable tarball
```

The test suite covers the spec's testing goals: golden distillation fixtures (recorded session logs → expected memory files, via `parseDistillOutput` + `applyFacts`), a citation round-trip (distill consumes a session, `memory_expand` returns exactly those events), and index-cap truncation behavior.

## License

MIT
