# @deepseek-ai/dsh-knowledge

[中文](README.zh.md) | English

Bridge the agent into the user's **global knowledge base** at `D:\knowledge` — the same Markdown + YAML frontmatter library the Codex `kb.cmd` CLI writes. Knowledge accumulated by either tool is visible to both: one library, two agents.

## Tools

| Tool | Behavior |
|---|---|
| `kb_add` | Write one typed note (lesson/pattern/preference/project/reference/concept/moc/decision/note), byte-compatible with the Python CLI: slugified unique filename, typed directory, YAML frontmatter (`title/type/tags/aliases/status/created/updated` + project/domain). |
| `kb_search` | Keyword scan over notes (title > tags > content), returns path/title/type + snippet. |
| `kb_show` | Locate a note by title/path/tag and return its full text. |
| `kb_timeline` | Append a timestamped line to `notes/99_时间线.md` — mandatory after every writeback ("失联等于白写"). |

The heavy read side (ask/reflect/map/ingest) stays on the Python CLI; this package owns the deterministic write + quick-read surface so no shell encoding ever touches your Chinese content.

## Config

| Field | Default | Meaning |
|---|---|---|
| `kbRoot` | `D:\knowledge` | Knowledge base root. |
| `maxSearchResults` | `8` | Search result cap. |

Companion discipline: the `knowledge-writeback` skill (writeback three questions + retrieval protocol + causal-paradigm worldview).

## Notes on compatibility

- `slugify` replicates `kb/ingest.py`: NFKC normalize, collapse chars outside `[\w\u4e00-\u9fff]`, 60-char cap, `untitled` fallback.
- `unique_path` replicates `stem.md` → `stem-2.md` dedup.
- Frontmatter is emitted as quoted-YAML scalars and flow arrays, readable by python-frontmatter. If `kb/frontmatter.py` changes, update this package to match.

## Install

Not on npm yet - install from this repository:

```sh
npm install github:ICCuse/dsh-knowledge
# or: pnpm add github:ICCuse/dsh-knowledge
```

Then mount the bundle (declared in package.json 'dsh.bundle') and point it at your knowledge base:

```yaml
- id: knowledge
  name: 'dsh-knowledge'
  config:
    kbRoot: 'D:\knowledge'
```

Companion discipline: the 'knowledge-writeback' skill (writeback three questions + retrieval protocol).
