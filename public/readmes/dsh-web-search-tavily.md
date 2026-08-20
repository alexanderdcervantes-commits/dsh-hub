# @crayonlu/dsh-web-search-tavily

Tavily-backed `WebSearchProvider` for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web capability seam (`ctx.web`). Lets `dsh`'s `web_search` tool run entirely on [Tavily](https://tavily.com) — no DeepSeek API key required.

## Install

```sh
dsh plugin --profile web add github:crayonlu/dsh-web-search-tavily
```

Then add the provider to the profile patch layer at `$DSH_HOME/profiles/web/cordis.patch.yml` (hot-reloaded — no restart needed):

```yaml
- insert:
  - id: web-search-tavily
    name: '@crayonlu/dsh-web-search-tavily'
- id: web
  config:
    searchProvider: tavily
# Optional: drop the DeepSeek-backed search (and chat route) entirely.
- id: web-search-deepseek
  disabled: true
- id: llm-deepseek
  disabled: true
```

## Configuration

Every field is optional:

| Field | Default | Meaning |
|---|---|---|
| `apiKey` | — | Literal Tavily key (write it here instead of `apiKeyEnv` only if you must; it lands in a config file). |
| `apiKeyEnv` | `TAVILY_API_KEY` | Credential reference resolved per search through `ctx.credentials` (inherited env > `$DSH_HOME/.credentials.yaml` > project/user `.env`). |
| `baseURL` | `https://api.tavily.com` | Endpoint base; `/search` is appended. |
| `maxResults` | `5` | Default result count when a request carries no `maxResults`. |
| `includeAnswer` | `true` | Carry Tavily's generated answer as the search result `content`. |
| `searchDepth` | `basic` | `basic` or `advanced` (Tavily's `search_depth`). |

The key resolves once per search, so an empty `TAVILY_API_KEY` fails the request with `WEB_MISSING_CREDENTIAL` rather than falling through to an unrelated credential.

## Tests

```sh
npm install
npm test
```

Unit tests mock the HTTP layer; the smoke test runs a real Tavily search when `TAVILY_API_KEY` is set.

## License

MIT
