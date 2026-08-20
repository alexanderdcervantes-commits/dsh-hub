# dsh-turn-meta

English | [中文](README.zh.md)

Opt-in per-step turn metadata for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Each entering agent step appends one compact, source-attributed header naming the session, the current turn and step, how many real user messages and tool results belong to the open turn, and how many turns preceded it.

```markdown
[turn-meta] session=<id> turn=<turn> step=<step> user_msgs=<a> tool_results=<b> prior_turns=<p>
```

The package doubles as a **minimal first-plugin template**: it exercises the same seams every Harness plugin uses with the smallest surface that still shows them — a named-export function plugin (`name` / `inject` / `Config` / `apply`), schemastery-validated config, one `ctx.on('agent/pre-step', …)` hook with `{ prepend: true }`, and a `./invariant` companion that owns the durable message shape.

## Install into a profile

The plugin is opt-in. Add it to a `cordis.patch.yml` overlay (or pass as `--patch`):

```yaml
- insert:
    - id: turn-meta
      name: '@deepseek-ai/dsh-turn-meta'
      config:
        enabled: true
        minStep: 1
```

Or, for a self-contained checkout, symlink the dependencies from your installed dsh profile and run the smoke:

```sh
node tests/smoke.mjs
```

`smoke.mjs` drives the real TypeScript source (Node ≥ 23 type stripping) against an installed dsh distribution; it needs `@deepseek-ai/{cordis,dsh-agent,dsh-llm,dsh-session,schemastery}` resolvable from the package's `node_modules`.

## Verification status

- Runtime smoke against an installed dsh distribution: **6/6 assertions pass** (injection, exact header text, disabled config, invalid-config load failure, disposal, proposed-message counting).
- Monorepo CI gates (vitest full suite, coverage, typecheck, doc-sync) require the deepseek-harness workspace install; they are expected to pass but have not been run here. The package also lives at `packages/context/turn-meta` in the [harness repo](https://github.com/deepseek-ai/deepseek-harness) for when external contributions open up.

## License

MIT
