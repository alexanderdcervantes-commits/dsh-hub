# `@deepseek-ai/fullstack-expert`

[![CI](https://github.com/adithya-hmt/fullstack-expert/actions/workflows/ci.yml/badge.svg)](https://github.com/adithya-hmt/fullstack-expert/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/adithya-hmt/fullstack-expert?display_name=tag)](https://github.com/adithya-hmt/fullstack-expert/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Make coding agents show their work.** Fullstack Expert is a Cordis-native workflow and safety layer for DeepSeek Harness coding agents. It makes repository inspection, vertical-slice planning, sensitive-operation boundaries, and fresh verification evidence explicit—without introducing a second agent framework, shell, filesystem, browser, database, or model provider.

> This is not a smarter model. It is a more disciplined engineering loop around the Harness capabilities you already use.

- **Install:** [`QUICKSTART.md`](QUICKSTART.md)
- **See it in action:** [`docs/demo.md`](docs/demo.md)
- **Latest release:** [GitHub Releases](https://github.com/adithya-hmt/fullstack-expert/releases)
- **Questions and bugs:** [GitHub Issues](https://github.com/adithya-hmt/fullstack-expert/issues)

## What V0.1 provides

- A scoped methodology prompt: understand → inspect → design → plan → implement → test → review → verify.
- Two deep model-facing operations:
  - `fullstack_plan`: bounded repository inspection plus a vertical-slice plan.
  - `fullstack_check`: read-only project checks and explicit evidence recording.
- A deterministic `FullstackExpertRuntime` state seam for phase, tasks, evidence, and compact event facts.
- Embedded narrow skills registered through native `ctx.skills`.
- Complexity-governor decisions based on requirement, reuse, native platform, dependencies, and safety controls.
- Permission classification and an approval-aware pre-execute gate that delegates sensitive operations to native Harness approval and fails closed when approval is unavailable.
- Optional, read-only Supabase project evidence detection.
- Session/tool outcome observation using native `session/event` and `tools/result`; the Harness session log remains the durable source of truth.
- Provider-neutral operation: the plugin never selects or hard-codes an LLM adapter. GPT-5.6 Max is configured in the Harness model route.

## Honest scope

V0.1 does **not** provide a browser driver, shell executor, filesystem backend, dev-server registry, Supabase SDK, database client, deployment adapter, or model provider. It reuses those capabilities when the selected Harness composition exposes them. Browser verification is therefore guidance plus evidence recording until a stable browser tool is composed. Supabase operations are detection/advice only; migrations, linking, login, pushes, resets, pulls, function deploys, and external writes remain explicit sensitive actions.

## Install as a profile bundle

### Fastest path

With the DeepSeek Harness CLI installed, add the tagged release directly from GitHub:

```sh
dsh plugin --profile web add git+https://github.com/adithya-hmt/fullstack-expert.git#v0.1.1
dsh --profile web --dump-config
dsh --profile web
```

Replace `web` with your profile name. The first command installs the package and activates its declared patch layer. The second confirms the composed row before booting. Once npm publication is enabled, the shorter `@deepseek-ai/fullstack-expert` package spec will work too. For a complete setup, troubleshooting, and a local-checkout path, see [`QUICKSTART.md`](QUICKSTART.md).

### Manual profile overlay

Build/publish this package into a profile's dependency closure, then add the supplied `cordis.patch.yml` overlay after the profile's base bundle:

```yaml
- insert:
    - id: fullstack-expert
      name: '@deepseek-ai/fullstack-expert'
      config:
        registerSkills: true
```

The overlay is intentionally small. The profile must already compose native Harness rows such as `dsh-fs`, `dsh-fs-local`, `dsh-shell`, a shell executor, `dsh-tools`, `dsh-skill`, and the relevant model adapter.

For a user-owned preset, copy the shipped `standard` preset rather than editing the install, then add the row to the copied `agent.cordis.yml`. Give the copied preset a `preset.yml` with a human-readable `name` and `description`, or it may appear only as its directory id in pickers. A plugin row that contributes a Service must be placed in the host composition or in an entry-local isolated realm when its consumers are session-owned.

## GPT-5.6 Max / OpenAI-compatible CLI proxy

Keep provider configuration outside this package. Configure the existing OpenAI-compatible CLI proxy using the Harness provider/model settings surface, selecting:

```text
provider: <your proxy adapter>
model: GPT-5.6 Max
```

The exact provider id, endpoint, credential binding, and CLI command are deployment-specific. Do not put credentials in this repository or prompt context. The plugin consumes the provider-neutral agent/session interfaces only.

## Usage

1. Start with a composition containing the plugin and native Harness filesystem/tool/skill rows.
2. Ask for a feature, bug fix, review, refactor, or application build.
3. The agent should call `fullstack_plan` for substantial work, inspect actual files, state assumptions/unknowns, and implement a vertical slice with native tools.
4. Use `fullstack_check` for bounded structure/command/Supabase checks and to record non-verification review facts. Verification evidence must come from a native Harness check; V0.1 rejects self-attested verification records.
5. Completion is only justified after a native `verification` evidence record passes and relevant failures are absent.

The native shell tool reports its `[exit code: N]` marker; investigate every non-zero result. For browser work, use the composed browser capability and record actual console/network/UI evidence rather than treating a build as proof.

## Development

Requirements: Node.js `>=22` and the Harness peer composition installed by `npm ci`.

```sh
npm ci
npm run verify
npm run test:consumer
npm run test:profile
```

`test:consumer` installs the packed tarball into a temporary consumer and mounts `fullstack_plan` and `fullstack_check` against the real peer packages. `test:profile` installs that tarball into a disposable Harness profile and checks the composed patch layer; it requires `dsh` and `pnpm` (or uses the documented pnpm fallback).

The repository is intentionally dependency-light. Source is plain ESM JavaScript and the package publishes the source entrypoints plus the Cordis patch, matching the plugin's plain-runtime contract.

## Documentation

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/methodology.md`](docs/methodology.md)
- [`docs/skills.md`](docs/skills.md)
- [`docs/workflows.md`](docs/workflows.md)
- [`docs/complexity-policy.md`](docs/complexity-policy.md)
- [`docs/verification.md`](docs/verification.md)
- [`docs/permissions.md`](docs/permissions.md)
- [`docs/supabase.md`](docs/supabase.md)
- [`docs/model-provider.md`](docs/model-provider.md)
- [`docs/extending.md`](docs/extending.md)
- [`docs/demo.md`](docs/demo.md)
- [`docs/releasing.md`](docs/releasing.md)
- [`docs/reference-methodologies.md`](docs/reference-methodologies.md)
- [`docs/harness-seams.md`](docs/harness-seams.md)

## Community and promotion

If Fullstack Expert helps with a real project, share the task and verification evidence (without secrets) in an issue or discussion. Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to help DeepSeek Harness users discover it. A short demo is more useful than a claim: start with [`docs/demo.md`](docs/demo.md).

## License and provenance

The plugin implementation is MIT-licensed. The methodology report in `docs/reference-methodologies.md` records the pinned MIT sources consulted for Superpowers, mattpocock/skills, and Ponytail, with citations and a clear separation between inspiration and copied code. No reference implementation text is bundled.
