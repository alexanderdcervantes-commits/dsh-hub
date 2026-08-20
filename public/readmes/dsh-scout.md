# dsh-tool-scout

**English** | [中文](README.zh.md)

A model-facing environment probe tool for **DeepSeek Harness**: on demand, the agent can learn the runtime environment (platform, shell, user, timezone…), which commands resolve on PATH, which software is installed and at what version, and how much CPU/memory/disk is available — without guessing or burning tool calls on slow discovery commands.

## Install

This package is a dsh **bundle**: it ships its own patch layer (`cordis.patch.yml`) and joins a profile's layer stack automatically once installed.

```sh
# from the public Harness source checkout:
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add /path/to/dsh-scout
```

Then restart your `dsh` process. The profile's `dsh.profile.bundles` gains `@deepseek-ai/dsh-tool-scout` and the `environment_probe` tool appears in the catalog.

## The tool

### `environment_probe`

| Arg | Type | Notes |
|---|---|---|
| `scope` | string enum, enum array, or `all` | One category, an ordered array of categories, or `all`. Categories: `environment`, `commands`, `software`, `resources`, `apps`, `serial`, `usb`, `network`, `gpu`, `ports`, `services`, `workspace`, and `printers`; the default is `environment`. |
| `names` | string[] | Restrict the probe to these command/software/app/printer names (replaces the configured default lists; for `apps`/`printers` it is a case-insensitive exact match on display name or bundle id). Ignored by `environment`, `resources`, `serial`, `usb`, `network`, `gpu`, `ports`, `services`, and `workspace`. |

`apps` (macOS only; reported as unavailable elsewhere) lists application bundles from the configured app directories: display name, version, and bundle id come from each bundle's `Contents/Info.plist`, parsed in pure Node (binary bplist00 and XML) — no shell, no Spotlight dependency.

`battery` and `device` ride inside `resources`. Battery: `pmset -g batt` on macOS, sysfs (`/sys/class/power_supply`) on Linux, and a CIM query through PowerShell on Windows; percent, status (charging/discharging/charged/ac/unknown), and an estimated remaining time when the platform reports one. Device: `sysctl hw.model` on macOS, DMI sysfs plus `/proc/cpuinfo` on Linux, and a CIM query on Windows; model, manufacturer, and CPU brand — deliberately no serial number. Machines without a battery (desktops, VMs) report `battery.available: false` as a fact, never an error.

The hardware categories are aimed at embedded/robot work: `serial` lists ports (macOS `cu.*`/`tty.*`, Linux `ttyUSB`/`ttyACM`/`ttyAMA`/`ttyTHS`/`ttyS`, Windows COM), `usb` lists devices (macOS `system_profiler SPUSBDataType` with an `ioreg` fallback for hosts whose profiler reports an empty tree, Linux `lsusb`, Windows PnP), `network` is pure `os.networkInterfaces()` (no subprocess), and `gpu` covers `system_profiler`/`nvidia-smi`+`lspci`/CIM. The slow backends (`system_profiler`, `lsusb`, CIM) cache their results for `softwareCacheTtlMs`. A robot-debugging call is one array: `{ scope: ['serial', 'usb', 'network'] }`.

The ops/developer/office categories complete the picture: `ports` lists TCP listening sockets (address, port, and the owning process when visible — `lsof` on macOS with a `netstat` fallback, `ss` → `netstat` → `/proc/net/tcp` on Linux, PowerShell on Windows), `services` reports system service states (launchctl user domain / systemd units / Windows services; a missing systemd reports `available: false`, never a process-list guess), `workspace` reads the current working directory for project toolchain signals (package manager inferred from `packageManager` plus lockfiles, Node and language version pins, build markers, `.env` presence — pure file reads, zero subprocesses, so a hostile repository cannot execute anything), and `printers` lists printers and the default destination (`lpstat -p`/`-d` on macOS/Linux — a non-zero exit with "no destinations" is a fact, not an error — and a CIM query on Windows).

Every scope is read-only: no shell is ever invoked with model input, only a curated environment allowlist is read (never the full `process.env`), and version probes run `execFile(name, ['--version'])` with a per-probe timeout, a concurrency cap, and an in-process TTL cache.

The canonical result is a JSON object discriminated by `scope` (raw numbers, not formatted strings), so Code Mode consumers can use the fields programmatically; the rendered text stays human-readable:

```
[environment]
platform: darwin (Darwin 24.5.0)
arch: arm64
hostname: dev-machine.local
user: developer
home: /Users/developer
cwd: /Users/developer/Projects/dsh-scout
node: v24.19.0
shell: /bin/zsh
timezone: Asia/Shanghai
locale: zh-CN
endianness: LE
pid: 1234
dsh home: /Users/developer/.dsh
```

## Configuration

| Field | Default | Notes |
|---|---|---|
| `commandCandidates` | `ls cat grep sed awk find xargs tar unzip curl wget git ssh rsync make gcc python3 node docker` | Names checked by a `commands` probe without `names`. |
| `softwareList` | `git node npm pnpm yarn bun python3 pip3 go rustc cargo java gcc clang make cmake docker kubectl curl wget jq rg fd gh sqlite3 ros2 arduino-cli platformio esptool.py openocd avrdude` | Names probed by a `software` probe without `names` (embedded/robot toolchains included). |
| `softwareProbeTimeoutMs` | `3000` | Per-`--version` subprocess timeout. |
| `softwareCacheTtlMs` | `60000` | Software facts stay fresh this long; `0` disables caching. |
| `maxNames` | `50` | Per-call cap on `names` (a confused or hostile model cannot fan out unbounded probes). |
| `appDirs` | `/Applications`, `~/Applications` | Directories scanned by an `apps` probe (`~` expands to the home). |
| `maxApps` | `300` | Maximum app bundles one `apps` probe enumerates; `0` disables item-count truncation. |
| `maxPorts` | `128` | Maximum listening sockets one `ports` probe reports; `0` disables item-count truncation. |
| `maxServices` | `200` | Maximum services one `services` probe reports; `0` disables item-count truncation. |
| `workspaceMarkers` | see `docs/design.md` §3 | Marker filenames matched by a `workspace` probe. |
| `workspaceVersionFiles` | `.nvmrc .node-version .tool-versions .python-version .ruby-version .go-version .terraform-version` | Version-pin files a `workspace` probe reads. |

Example patch row (in the profile's `cordis.patch.yml`, overriding the bundle row by id):

```yaml
- id: tool-scout
  name: '@deepseek-ai/dsh-tool-scout'
  config:
    softwareProbeTimeoutMs: 2000
    softwareCacheTtlMs: 0
    maxNames: 30
```

### Why there is no settings-page card

The web GUI's "plugin configuration" section renders only plugins that ship a
browser-side card (`settings.plugin.item` slot; today only the in-box
`bash`/`agent-loop`/`web-search` cards). This package is deliberately a
Host-side-only out-of-tree plugin: it does not appear in that section, and
its configuration lives in the profile patch layer above — no harness-repo
change is required to install, configure, or update it.

## Prompt section

The plugin contributes the `tool:scout` prompt section (order 107):

> Probe the runtime environment with `environment_probe` before assuming a platform, shell, command availability, software versions, resource limits, listening ports, service state, project toolchain, or printers; request only the `scope` you need.

## Design notes

- **No execution seam dependency.** The tool reads Node APIs and runs no-shell `execFile` probes directly; it does not require a bash executor or a filesystem provider, so it works in minimal compositions.
- **Pure-Node plist parsing.** App metadata comes from a self-contained bplist00 parser (plus an XML-plist fallback) with no native or third-party dependencies. The marker table follows CoreFoundation's actual encoding (0x5 ASCII / 0x6 UTF-16 / 0x4 data) — the widely circulated "0x6/0x7" table does not match real `Info.plist` files.
- **Secrets stay out.** `environment` reads only a curated allowlist of environment variables; the full `process.env` is never exposed.
- **Controlled work.** Names may contain display-name spaces and punctuation, but blank/traversal/path-separated/NUL/leading-option/oversized values are rejected; names are deduplicated and capped. Subprocess probes honor cancellation, have fixed timeouts, and use TTL caches that never retain cancellations. App, port, and service item caps can be set to `0` for a complete visible snapshot.
- **Bounded repository reads.** `workspace` reads only configured basenames, rejects traversal paths, refuses final symlinks in the production reader, and reads `package.json`/version pins through byte-limited file handles before parsing.
- **Failures are facts.** A missing executable is `found: false`; a probe timeout or silent tool is `found: true` without a version; a statfs failure is `disk.ok: false` with the error message. Only infrastructure failures (validation, cancellation) produce tool errors.
- **Invariant companion is opt-in.** The package exports `@deepseek-ai/dsh-tool-scout/invariant` for diagnostic profiles, but the general bundle does not activate it because standard profiles do not provide the optional `invariants` service.

## Scope designs

The implemented designs for `ports` (listening TCP sockets), `services` (service state), `workspace` (project toolchain signals), and `printers` live in [docs/design.md](docs/design.md): data sources and platform fallback chains, canonical schemas, rendered examples, security boundaries, failure modes, token costs, test strategy, and a decision record.

## Skill

`skills/env-probe/` ships the `env-probe` skill: pick the `environment_probe` scopes a task needs (decision table), fetch them in one array call, and read the results correctly (`available: false` semantics; per-scope fields and platform quirks in `references/reading-results.md`). Written after the Anthropic skill-creator methodology: triggers live in the frontmatter, the body uses the imperative mood, examples use real calls and outputs, and details live in a reference file loaded on demand. `.agents/skills/env-probe` is a symlink to `skills/env-probe/`, so development-time discovery and the bundle share one source of truth.

**Distributed with the bundle**: this package's `cordis.patch.yml` also inserts a `skill-filesystem-scout` row — a host-layer filesystem provider that mounts only this package's `skills/` directory (`includeDefaultRoots: false`; `providerName: 'scout'` to coexist with preset instances). `bundledSkillDir` is derived at boot by a `!!js` expression from `baseUrl` (the profile directory the Loader anchors) plus the profile's `node_modules` link. So **any profile with scout installed gets `env-probe` in every agent session's skill catalog automatically** — proven end to end by `tests/loader-skills.spec.ts` (real Loader composition + the real patch file + a real bundle link). Restart the dsh process to pick it up.

## Development

```sh
pnpm install                    # install standalone build dependencies
pnpm run link:harness           # optional manual refresh; test scripts run this automatically
pnpm run build                  # declarations + bundled ESM runtime
pnpm run test                # vitest: unit + registry pipeline + Loader REAL-composition
pnpm run test:coverage       # the same suite with per-file coverage enforcement
pnpm run typecheck           # source + tests against the current DSH APIs
pnpm run verify:self-contained  # manifest and package-boundary checks
node scripts/verify-profile.mjs  # production-shape check: web profile bundle layers,
                                 # booted from the profile directory (needs the installed dsh)
```

The public DeepSeek Harness checkout defaults to `../deepseek-harness`; set `DSH_REPO_ROOT` if it lives elsewhere. Test scripts refresh the Harness links automatically. After changing `src/`, run `pnpm run build` — the profile install uses `link:` semantics, so the running dsh picks the new `lib/` up on its next boot.

## Model Experience

### System prompt

#### What the model sees

Every request in this plugin's registration scope contains the `tool:scout` guidance quoted above, verbatim.

#### Token effect

Small fixed input cost per request while the plugin is active, unchanged by scope choice.

#### KV Cache effect

Prefix-stable while the registration scope and prompt text are unchanged. Plugin activation or disposal may invalidate reuse from this prompt section.

### Tool schema

#### What the model sees

The generated `environment_probe` schema: the `scope` enum, the optional `names` array, and the discriminated output union. Tool registrations in this package are always visible while the plugin is loaded.

#### Token effect

Fixed schema cost on every request where the tool is visible.

#### KV Cache effect

Prefix-stable while the tool definition is unchanged; a config change that alters advertised parameters may invalidate reuse.

### Tool output

#### What the model sees

The renderer emits one section per requested scope. App, port, and service summaries report both the returned count and the visible total; capped results explicitly say `truncated`, so a partial snapshot cannot look complete. Services remain in problems-first order (failed → activating → running → stopped). Canonical JSON exposes the same `total` and `truncated` fields.

#### Token effect

Zero result tokens before a call. Output is data-dependent; version lines and `names` stay bounded, while `maxApps: 0`, `maxPorts: 0`, or `maxServices: 0` deliberately permits a complete visible snapshot and therefore potentially large output.

#### KV Cache effect

Append-only; newly visible content follows the reusable request prefix and does not invalidate existing KV-cache entries.

### Tool errors

#### What the model sees

Validation and policy failures are normalized as `Error: <message>`. This package's stable messages are `invalid probe name: <name>`, `too many probe names: expected at most <N>, got <M>`, and `tool call aborted`.

#### Token effect

Only the failing call adds these retained tokens.

#### KV Cache effect

Append-only; newly visible content follows the reusable request prefix and does not invalidate existing KV-cache entries.

## Known Limitations and Deferred Work

- **Battery/device probing is per-platform and injectable** — each platform's parser is pure and unit-tested, but the subprocess backends (pmset/sysctl on macOS, PowerShell CIM on Windows) run outside any mounted sandbox executor, with the same read-only, short-timeout discipline as the `--version` probes; Linux reads sysfs only. Windows reporting depends on PowerShell being installed and CIM being available.
- **Hardware probes are per-platform with real-host quirks** — macOS `system_profiler SPUSBDataType` can report an empty tree on some hosts/builds; the probe falls back to `ioreg`, which reports names only (no vendor/product ids). `lsusb`/`nvidia-smi`/`lspci`/CIM availability bounds the Linux and Windows surfaces; a missing backend is a fact (`available: false`), never an error.
- **App enumeration is macOS-only** — the `apps` scope reports `available: false` with a reason on other platforms; there is no Windows registry or Linux desktop enumeration. Apple's `/System/Applications` is not scanned by default (system apps are configuration noise); add it to `appDirs` to include it.
- **The plist parser covers the bplist00 subset apps need** — dates, UIDs, 128-bit integers, and float-width reals parse as `null` (never a failure), which is harmless for the three keys the probe reads; a bundle whose plist is unparseable counts toward `skipped`.
- **Version probes bypass the sandbox** — `--version` probes run as no-shell `execFile` subprocesses with the harness process's own authority, outside any mounted sandbox executor. They are read-only, short-timeout, and name-whitelisted, but a deployment that must confine even `--version` executions needs a policy seam over this tool (e.g. a `tools/pre-execute` rule), not a change inside the package.
- **Shell builtins and aliases are invisible** — the `commands` scope only reports PATH-resolvable executables; shell builtins, functions, and aliases are never detected.
- **`--version` assumes a conventional CLI** — tools that need a different flag, take seconds to start, or print nothing to stdout/stderr report `found` without a version; the per-probe timeout caps the damage.
- **PATHEXT handling is Windows-only by design** — on POSIX, command resolution checks bare names only; the suffix machinery is exercised only on win32 deployments.
- **Software facts are cached with a TTL** — a `software` probe within `softwareCacheTtlMs` may report a version that is already stale; set `softwareCacheTtlMs: 0` when freshness beats speed.
- **Process visibility is permission-bounded (`ports`/`services`, by design)** — without elevation, lsof/ss/launchctl report only processes and services the current user can see; addresses and ports are kernel-visible (including the Linux `/proc/net/tcp` fallback), while process names and pids appear only for the user's own processes.
- **macOS `launchctl list` can be unreachable** — outside a GUI bootstrap domain (e.g. the dsh agent shell) `launchctl list` exits 1 with no output, and `services` honestly reports `available: false (launchctl list failed with exit 1)`; `launchctl print gui/<uid>` is a deferred alternative.
- **`workspace` probes only whitelisted cwd signals** — no recursion and no subprocess ever runs (hostile-repository safety); `.env` presence only, contents never read. Unmatched markers are simply absent: `markers: (none)` is a fact.
- **`printers` treats lpstat's non-zero exit as a fact** — `lpstat` exits 1 with "no destinations" on some systems (including the localized Chinese message); the probe uses a tolerant runner that keeps the output, yielding `printers: (none found)` instead of an error. Windows reporting depends on PowerShell and CIM.
