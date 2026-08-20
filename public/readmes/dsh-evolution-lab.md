# DSH Evolution Lab

[中文](README.zh.md)

Proof-carrying Skill self-evolution for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Evolution Lab turns repeated project experience into quarantined `SKILL.md` candidates, evaluates baseline and candidate in isolated DSH processes, runs held-out canaries, and atomically promotes or rolls back without a manual approval queue.

The autonomy boundary is deliberately narrow: V1 evolves one Markdown Skill at a time. It cannot generate Cordis plugins, scripts, tools, workflows, presets, sandbox rules, approval policy, DSH configuration, or DSH source changes.

## Compatibility

| Evolution Lab | DSH | Node.js | Profiles |
|---|---|---|---|
| 0.3.x | 0.1.0-rc.6 | Node.js 22 / 24 | web, headless |

DSH is in developer preview. Every supported DSH release must pass a real packed-profile smoke test before this matrix expands.

## Install

Install into every profile that should host the controller. The npm package is the default public path:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web add dsh-evolution-lab@0.3.1
```

The GitHub Release publishes the same build with a SHA-256 checksum, for installations that prefer pinning a verified remote archive. Both paths pass clean web/headless profile smoke tests before release:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web add https://github.com/JayDong9130/dsh-evolution-lab/releases/download/v0.3.1/dsh-evolution-lab-0.3.1.tgz
```

Install a pinned GitHub revision:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web add github:JayDong9130/dsh-evolution-lab#<commit-sha>
```

Git-hosted packages run their `prepare` script, so pnpm intentionally blocks the first source install unless the exact archive is trusted. Copy the complete key printed by `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` into `$DSH_HOME/profiles/web/pnpm-workspace.yaml`, then rerun the command. For a commit install it has this shape:

```yaml
allowBuilds:
  dsh-evolution-lab@https://codeload.github.com/JayDong9130/dsh-evolution-lab/tar.gz/<commit-sha>: true
```

Keep the full package-plus-URL key; do not replace it with a broad wildcard. Repeat the same profile-local step for `headless` when installing source there. npm and Release tarball installs use prebuilt `lib/` and do not need this Git-source exception.

Alternatively, install a previously downloaded and SHA-256-verified Release tarball:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web add ./dsh-evolution-lab-0.3.1.tgz
```

Verify that the composed profile contains the `dsh-evolution-lab` bundle layer and `id: evolution-lab`:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 --profile web --dump-config
```

The plugin is installed per profile. Repeat the command for `headless` only when that profile should observe sessions; evaluator subprocesses use a controller-disabled profile and never evolve themselves.

## Enable a project

After installing or upgrading, restart DSH Web and refresh the page. Open a conversation whose session belongs to the Git project you want to evolve. The compact **Enable auto evolution** control appears in the current conversation header through DSH's additive `conversation.session.header.actions` slot. Click it once; Evolution Lab atomically creates `.dsh/evolution/config.yaml` with safe defaults and enables that project. The same control then reports and changes the current project's state.

The browser sends only the current `sessionId`. The Host resolves the authoritative session working directory and Git root; it never accepts a browser-supplied path. The control is disabled outside a Git project. If an existing config is invalid, it reports **Invalid config** and refuses to overwrite it.

Without `.dsh/evolution/config.yaml`, Evolution Lab is observe-only and performs no model calls or project mutations. Headless users, or users who want to review every setting before enabling, can create the file manually:

```yaml
version: 1
enabled: true
engine:
  kind: native
  provider: deepseek
  model: deepseek-chat
collection:
  includeSubagents: false
  maxTrajectoryBytes: 131072
  minClusterSize: 3
  minEvidenceWeight: 20
evaluation:
  minTasks: 3
  maxParallel: 2
  timeoutMs: 600000
  requiredPassRateDelta: 0.05
  maxCostRatio: 1.20
  maxDurationRatio: 1.50
canary:
  minTasks: 2
  requiredPassRateDelta: 0
promotion:
  automatic: true
  monitorIntervalMs: 86400000
  rollbackAfterConsecutiveFailures: 2
```

## Author evaluation tasks

Nothing is ever promoted without frozen, deterministic tasks under `.dsh/evolution/evals/<task-id>/`. A project with too few tasks is not blocked with an error — it simply collects trajectories forever and never promotes. Run `/evolution eval init` to write a runnable starter pack plus a README describing the task contract, then check what is still missing:

```sh
/evolution status
```

The `evals` section reports the tasks found per split against the configured `evaluation.minTasks` and `canary.minTasks`, lists blockers such as `INSUFFICIENT_CANARY_TASKS`, and names any task directory that failed to load.

The starter pack is one validation and one canary task exercising a toy string helper. It proves the pipeline runs; it does not evaluate your project. Replace it with tasks drawn from real failures in this repository — a candidate that only beats the baseline on the examples has proven nothing. Keep canary tasks genuinely held out: the proposer never sees or edits them. See [the architecture](docs/architecture.md) for the full task contract.

Arena starts a clean `headless` DSH profile and passes only an explicit environment allowlist. If the evaluator model authenticates through an environment variable, configure the plugin row in the profile or home `cordis.patch.yml`; values are read from the launch environment and are not written into the patch:

```yaml
- id: evolution-lab
  config:
    evaluator:
      allowedEnv: [PATH, DEEPSEEK_API_KEY]
```

The default evaluator command reuses the current DSH `0.1.0-rc.6` CLI with `--profile headless`. Advanced installations may set `evaluator.command` and `evaluator.args`. The child sets `DSH_EVOLUTION_CONTROLLER_DISABLED=1`, so an evaluator profile fails closed against recursive evolution.

## Use

- `/evolution status` — configuration, active versions, queue, evaluation readiness, proof and monitor health.
- `/evolution run` — enqueue a cycle; it cannot skip evidence or safety gates.
- `/evolution eval init` — scaffold a runnable starter task pack under `.dsh/evolution/evals/`. It never overwrites an existing file.
- `/evolution history [skill]` — immutable candidate, promotion and rollback records.
- `/evolution rollback <skill>` — restore the newest proven predecessor.
- `/evolution enable` / `/evolution disable` — change the local enabled flag.

The model receives one read-only `evolution_status` tool. It cannot choose a winner, promote a candidate, weaken policy, or grant an exception.

## Lifecycle

```text
committed session events
  -> local two-pass redaction
  -> intent atoms and evidence-weighted clusters
  -> quarantined Skill candidate
  -> immutable safety scan
  -> isolated baseline/candidate validation
  -> held-out deterministic canary
  -> proof written before atomic activation
  -> scheduled probes
  -> automatic rollback on regression
```

No manual approval means there is no pending-approval queue. It does not mean unrestricted modification. Unsafe, under-evaluated, stale, privacy-failing, or regressing candidates are rejected automatically; there is no override flag.

## Data, privacy, network and cost

Raw DSH session logs remain DSH-owned. Evolution Lab stores bounded, redacted envelopes under `.dsh/evolution`, with HMAC pseudonyms for sensitive identifiers and a second leak scan before persistence or engine submission. The 256-bit HMAC key is stored with mode `0600` under `$DSH_HOME/evolution-lab`, never in the project. It never submits raw events, absolute home paths, credentials, canary fixtures or proof files to the native model or optional xskill bridge.

Default retention is 30 days for redacted trajectories, 90 days for run reports, and indefinite for the proofs/version lineage needed to validate or roll back an active Skill. To delete learned data, first run `/evolution disable`, keep or restore any desired `.dsh/skills` mirror, then delete the project's `.dsh/evolution` directory. Deleting version/proof data removes rollback history.

There is no telemetry. Network access is used only by the configured DSH model provider, an explicitly configured xskill bridge, package installation, or evaluation tasks whose execution policy permits it. Native proposal calls and baseline/candidate runs consume model tokens; Arena subprocesses also consume CPU and wall-clock time. Use the configured cost, duration and concurrency limits.

## Security

The immutable policy allows exactly one regular `SKILL.md` up to 16 KiB with fixed invocation policy. Evaluation uses separate workspaces, DSH homes, agent homes, sessions, bounded output and explicit environment allowlists. The plugin-owned SkillProvider invalidates immediately after promotion/rollback; `.dsh/skills` is a portable mirror, not the consistency mechanism.

Read [SECURITY.md](SECURITY.md) and the [security model](docs/security-model.md) before enabling automatic promotion in a sensitive repository.

## Limitations

- V1 evolves Skills only and requires project-authored deterministic evaluation tasks.
- It does not prove Markdown is harmless; it limits artifact shape and runtime authority.
- The native clusterer is deterministic lexical matching, not a semantic embedding service.
- Real-provider E2E requires the user's DSH model credentials; keyless CI uses a mock adapter.
- Current compatibility is intentionally pinned to DSH 0.1.0-rc.6.

## Uninstall

Disable evolution first and decide whether to keep promoted project Skills. Then remove the bundle:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web remove dsh-evolution-lab
```

Uninstalling does not delete `.dsh/evolution` or `.dsh/skills`; delete them explicitly only after reviewing the rollback implications.

## Development

```sh
npm install
npm run verify
```

The implementation is DSH-native TypeScript. It credits xskill's MIT-licensed atom/cluster/version/canary vocabulary as design inspiration but copies no xskill source and has no Python or xskill runtime dependency.

License: MIT.
