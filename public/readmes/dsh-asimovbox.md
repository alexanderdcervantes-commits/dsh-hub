# AsimovBox for DeepSeek Harness

Create and manage long-form AsimovBox videos with native DeepSeek Harness tools. The plugin calls AsimovBox’s hosted MCP endpoint, so Studio, REST, MCP, A2A, OpenAI, and DeepSeek Harness all use the same authorization, billing, queues, and rendering pipeline.

## Install

```sh
dsh plugin --profile default add github:cerebrixos-org/dsh-asimovbox
```

Generate a personal key in **AsimovBox → Account → API access**, then set it before starting Harness:

```sh
export ASIMOVBOX_API_KEY=asb_xxxxxxxx
dsh --profile default
```

You can instead set `apiKey`, `baseUrl`, or `timeoutMs` by overriding the `asimovbox-video` row in the profile’s `cordis.patch.yml`. Do not commit personal keys.

## Tools

The bundle registers discovery tools plus `create_video`, `get_video`, `update_video`, `generate_storyline`, `render_video`, and `finalize_video`. Storyline generation, rendering, and finishing are asynchronous; poll with `get_video`.

`create_video` only creates a free draft. The later stages can consume account credits and should be run only when the user explicitly requests them.
