# dsh-data-insight

Data analysis toolkit for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Drop a CSV and get instant profiling, anomaly detection, and queryable insights — all without leaving your agent session.

## Features

- **`profile_data`** — Column types, missing values, statistics, distributions
- **`detect_anomalies`** — IQR and z-score outlier detection on numeric columns
- **`summarize_data`** — Structured overview with quality issues and next-step suggestions
- **`query_data`** — Filter, group, and aggregate without writing code

## Install

```bash
dsh plugin add github:ClaireXi99/dsh-data-insight
```

## Usage

Once installed, the tools are available to the agent automatically.

```
> Profile the sales data in ./data/q3_sales.csv

> Detect anomalies in the "revenue" column of report.csv

> Summarize the dataset at ./logs/user_events.json

> Query users.csv where age > 30, group by city, show mean salary
```

## Supported Formats

- CSV (comma-separated)
- TSV (tab-separated)
- JSON (array of objects, or `{data: [...]}` / `{results: [...]}`)

## Development

```bash
git clone https://github.com/ClaireXi99/dsh-data-insight.git
cd dsh-data-insight
npm install
npm run build
npm test
```

### Local dev with DSH

```bash
dsh web --patch ./dev/cordis.yml
```

## License

MIT
