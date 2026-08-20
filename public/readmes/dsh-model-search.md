# dsh-model-search

Searchable model filtering for the DeepSeek Harness model selector.

Open the model selector and search by provider name, model name, or model ID. Search terms are case-insensitive; spaces act as wildcards, so `GPT 6` matches `GPT-5.6` and `GPT-6`.

## Install

From the plugin market or npm:

```sh
dsh plugin --profile web add dsh-model-search
```

Directly from GitHub:

```sh
dsh plugin --profile web add github:a1073097082/dsh-model-search
```

Refresh the Harness page after installation. The plugin is a client-only overlay and does not change model routing or credentials.

## License

MIT
