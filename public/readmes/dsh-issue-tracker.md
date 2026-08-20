# dsh-issue-tracker

Jira Cloud issue-tracker service and model-facing tools for
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

The package is one installable DSH bundle with three internal roles:

- a provider-neutral Cordis `issueTracker` service;
- a Jira Cloud REST API v3 provider;
- eight tools registered through the public DSH `ToolRuntime` service.

The plugin is read-only by default. Create, update, comment, and transition
operations require an explicit `writeEnabled: true`; every write tool also
supports a side-effect-free `dryRun`.

## Requirements

- Node.js `^22.19.0 || >=24.0.0`
- DeepSeek Harness `0.1.0-rc.6`
- Jira Cloud REST API v3

## Install

```powershell
dsh plugin --profile web add dsh-issue-tracker
```

The bundle row stays disabled until these variables are available:

```powershell
$env:JIRA_BASE_URL = 'https://your-domain.atlassian.net'
$env:JIRA_EMAIL = 'you@example.com'
$env:JIRA_API_TOKEN = 'your-api-token'
```

Writes remain disabled. Enable them only when intended:

```powershell
$env:DSH_ISSUE_TRACKER_WRITE_ENABLED = 'true'
```

Restart DSH, then inspect the composed row:

```powershell
dsh --profile web --dump-config
```

For OAuth bearer authentication or non-environment configuration, replace the
`issue-tracker` row in the profile's `cordis.patch.yml`; a patch replaces the
whole row, so restate every field:

```yaml
- id: issue-tracker
  name: dsh-issue-tracker
  config:
    baseUrl: https://your-domain.atlassian.net
    auth:
      type: bearer
      accessToken: !!js process.env.JIRA_ACCESS_TOKEN
    writeEnabled: false
```

## Tools

| Tool | Purpose | Writes |
| --- | --- | --- |
| `issue_get` | Read one issue | No |
| `issue_search` | Search with filters or raw JQL | No |
| `issue_transitions` | List available transitions | No |
| `issue_projects` | List visible projects | No |
| `issue_create` | Create an issue | Yes |
| `issue_update` | Update issue fields | Yes |
| `issue_comment` | Add a comment | Yes |
| `issue_transition` | Apply a transition | Yes |

All HTTP calls honor the DSH tool cancellation signal and a configured request
deadline. Structured filters are JQL-escaped; `providerQuery` is intentionally
raw JQL and should be governed like any other privileged query input.

## Security

- HTTPS is required unless `allowInsecureHttp: true` is explicitly set.
- Credentials in `baseUrl` are rejected.
- Secrets are marked with Schemastery's secret role.
- The plugin does not log credentials, prompts, issue bodies, or comments.
- No telemetry is collected or sent by this package.

See [docs/security.md](docs/security.md) for the complete boundary.

## Uninstall

```powershell
dsh plugin --profile web remove dsh-issue-tracker
```

Cordis owns both the service registration and tool registrations, so unloading
the bundle removes all eight tools and the `issueTracker` service.

## Verification status

The release is typechecked and tested on Windows with real Cordis and DSH
`0.1.0-rc.6` packages. HTTP behavior is tested with mocked Jira responses; no
live Jira tenant or production credential was used. See
[docs/verification-report.md](docs/verification-report.md).

## 中文说明

这是一个面向 DeepSeek Harness 的 Jira Cloud 工单插件。安装一个 npm 包即可
获得通用 `issueTracker` 服务和 8 个模型工具。插件默认只读；所有写操作必须显式
开启 `writeEnabled`，并且可以先用 `dryRun` 验证参数而不产生副作用。

许可证：MIT。
