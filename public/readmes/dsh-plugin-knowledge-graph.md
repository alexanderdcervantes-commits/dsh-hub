# dsh-plugin-knowledge-graph

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) plugin that exposes a `read_graph` tool backed by a codebase **knowledge graph**. The graph tracks every file, directory, exported symbol, and their relationships so an agent can answer structural and dependency questions faster than grepping or reading files.

> **Status: infancy.** This project is in its infancy stage. Execution behavior, the query surface, and compatibility may change while the project is iterated on and tested by the open source community.

> **Derived work.** This project is derived from the knowledge graph tool in [Luke-Yong/H](https://github.com/Luke-Yong/H), adapted to DeepSeek Harness's "everything is a plugin" model.

## What it does

Given a workspace root, the plugin builds an in-memory graph and answers queries such as:

- `structure` — print the full directory tree
- `exports <file>` — list every symbol exported by a file
- `imports_of <file>` — list symbols a file imports (with their source files; stdlib/third-party imports are tagged)
- `exporters_of <symbol>` — find which files export a symbol
- `dependents <file>` — find which files import from a file
- `unused_imports <file>` — list imports never referenced in the file

Symbols are parsed from TypeScript/JavaScript (via the TypeScript compiler API) and Python (module-level `def`, `class`, and `name = value` bindings).

## Graph model

The graph uses three node types and four edge types:

| Nodes | Meaning |
| --- | --- |
| `dir` | A directory |
| `file` | A source file |
| `symbol` | An exported symbol (function, class, const, type, interface, enum, default) |

| Edges | Meaning |
| --- | --- |
| `CONTAINS` | Structural parent → child (dir → dir/file, file → symbol) |
| `EXPORTS` | File → symbol it exports |
| `IMPORTS` | File-level dependency (file → file) |
| `IMPORTS_SYMBOL` | Precise symbol-level dependency (file → symbol) |

## Installation

Install with the DSH CLI into a profile:

```bash
dsh plugin --profile web add github:Luke-Yong/dsh-plugin-knowledge-graph
```

Pin to a specific commit for reproducibility:

```bash
dsh plugin --profile web add github:Luke-Yong/dsh-plugin-knowledge-graph#<commit-sha>
```

## Usage

The plugin registers a single tool, `read_graph`, on `ctx.tools`. Its parameters:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | string | yes | Query string in `<query_type> <target>` form |
| `root` | string | no | Absolute workspace root to graph. Defaults to `process.cwd()` |

> **Root hygiene:** the `root` default (`process.cwd()`) may be a parent directory containing several independent projects. Always pass an explicit `root` pointing at the single workspace you are working in, so `structure` doesn't descend into sibling trees.

Example queries:

```
exports src/index.ts
exporters_of buildKnowledgeGraph
imports_of src/query.ts
dependents src/knowledgeGraph.ts
unused_imports app.py
structure
```

## Project structure

```
src/
  index.ts         Plugin entry — registers the read_graph tool
  knowledgeGraph.ts  Graph builder (filesystem walk, import/export parsing, serialization)
  query.ts         Query engine (runGraphQuery)
```

## Building

```bash
npm run build   # tsc -p tsconfig.json
```

Output is emitted to `dist/` (`dist/index.js` is the package entry point).

## License

MIT
