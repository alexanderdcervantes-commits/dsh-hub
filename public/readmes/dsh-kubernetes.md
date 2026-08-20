# dsh-kubernetes

> `dsh-kubernetes` gives DeepSeek Harness a safe Kubernetes capability: inspect workloads, retrieve bounded logs and events, diagnose common failures, and perform approval-gated changes.

A community plugin for [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness). It is **not** a `kubectl` wrapper — it turns Kubernetes into a structured, Agent-friendly runtime capability with a read-first security model.

```text
DSH Agent
   ↓
Generic Kubernetes Tools (10)
   ↓
ctx.kubernetes capability service
   ↓
KubernetesService (policy · diagnosis · bounding)
   ↓
KubernetesClientProvider (@kubernetes/client-node)
   ↓
Kubernetes API
```

## Highlights

- **Read-first by default** — `readOnly: true` out of the box. Real writes require explicit opt-in **and** survive the DSH approval gate.
- **10 structured tools** — every tool returns JSON with a schema plus a compact text rendering; no fragile CLI output parsing.
- **`k8s_diagnose` evidence engine** — walks Deployment/StatefulSet → Pods → containers → events → bounded logs and classifies likely failure categories (CrashLoopBackOff, ImagePullBackOff, OOMKilled, probe failures, …). No inner LLM: the plugin collects evidence, the DSH Agent reasons.
- **Bounded, sanitized logs** — `tailLines` / `sinceSeconds` / `container` / `previous` / `maxChars` with hard caps. Logs are UNTRUSTED DATA: secret-shaped values are redacted, ANSI/control characters stripped.
- **Secrets never leak** — `k8s_describe secret` returns metadata, type and data **keys only**. Credential-shaped fields (`token`, `password`, `client-key-data`, service-account tokens, container `env` secrets, …) are redacted everywhere.
- **Controlled `k8s_apply`** — server-side dry-run by default; real applies are denied under read-only policy, or escalated to approval (`ask`) when writes are enabled, with cluster/namespace context and production-risk warnings in the reason.

## Installation

```bash
dsh plugin add dsh-kubernetes          # from npm (once published)
# or from a packed tarball:
npm pack
dsh plugin add ./dsh-kubernetes-0.1.0.tgz
```

Library use outside DSH also works — the package exports a host-agnostic API:

```ts
import { KubernetesClientProvider, DiagnosisEngine, KubernetesService } from 'dsh-kubernetes';
```

## Configuration

The plugin resolves kubeconfig with standard priority: explicit `kubeconfigPath` → `KUBECONFIG` env → `~/.kube/config` → in-cluster service account. Context is **never** switched silently.

| Option | Default | Description |
| --- | --- | --- |
| `readOnly` | `true` | Read-only mode. Disables real writes even if `allowWrite` is true. |
| `allowWrite` | `false` | Master switch for write operations. Real applies additionally require approval. |
| `context` | – | Explicit kubeconfig context override. |
| `namespace` | context namespace / `default` | Default namespace override. |
| `kubeconfigPath` | – | Explicit kubeconfig file path. |
| `maxLogChars` | `8000` | Hard cap of characters per log excerpt (500–20000). |
| `maxLogTailLines` | `200` | Hard cap of tail lines per log request (1–500). |
| `maxLogSinceSeconds` | `3600` | Hard cap of the log time window in seconds (10–21600). |

Profile example — the plugin's bundled `cordis.patch.yml` inserts itself with safe defaults automatically; override by `id` in your own profile layer if needed:

```yaml
- id: dsh-kubernetes
  config:
    readOnly: true
    allowWrite: false
```

## Tools

| Tool | Access | What it does |
| --- | --- | --- |
| `k8s_context` | read | Active context, cluster server, effective namespace, capabilities, all contexts (no credentials). |
| `k8s_namespaces` | read | Namespaces with phase. |
| `k8s_workloads` | read | Deployments/StatefulSets/DaemonSets with replicas + health, unhealthy-first. |
| `k8s_pods` | read | Pods with phase, health, restarts, container waiting reasons (cap 200). |
| `k8s_describe` | read | Sanitized resource describe. Secrets: metadata/type/data keys only. |
| `k8s_logs` | read | Bounded, sanitized, de-duplicated pod logs. |
| `k8s_events` | read | Events (optionally scoped to a resource), sanitized + bounded. |
| `k8s_diagnose` | read | Structured `DiagnosisEvidence` with likely failure categories. |
| `k8s_rollout` | read | Rollout status for a workload. |
| `k8s_apply` | **gated** | Server-side dry-run apply by default; real apply needs `allowWrite` **and** approval. |

## Security model

```text
readOnly=true (default)      readOnly=false + allowWrite=true
────────────────────────     ─────────────────────────────────
get/list/describe  ✓         get/list/describe          ✓
logs/events        ✓         logs/events                ✓
apply dryRun=true  ✓         apply dryRun=true          ✓
apply dryRun=false ✗ deny    apply dryRun=false         → approval (ask)
```

- Write operations bind explicitly to **context / cluster / namespace / resource** and show them before approval.
- Contexts named like `prod`/`production`/`prd` raise the risk level in the approval reason (string match is a hint, never proof of safety).
- No `delete`, `exec`, `port-forward`, `scale`, `restart` or `rollback` tools in v1 — by design.
- kubeconfig contents, tokens, client keys and certificates never enter tool results or the session.

## Diagnosis demo

```text
User: Why does production/order-service keep restarting?

Agent → k8s_diagnose(Deployment/order-service)

Evidence:
- deployment: 3 desired / 1 ready — progressing
- pods: 3 total; 2× CrashLoopBackOff (unhealthy)
- containers: last termination OOMKilled (exit 137), restarts 14
- memory limit: 512Mi on all containers
- relevant events: BackOff ×14 (Warning)
- bounded logs (tail 40, redacted): "OOMkilled while serving traffic"
- likelyCategories: ["crash-loop", "oom-killed"]
```

The plugin marks categories as *likely*, never as certain facts — final reasoning stays with the DSH Agent.

## Dry-run / approval demo

```text
Agent → k8s_apply(manifest, dryRun=true)
Result: applied (server-side dry-run): ConfigMap/order-service-config (namespace default)

User: looks good, apply it for real

Agent → k8s_apply(manifest, dryRun=false)
Approval request (ask):
  k8s_apply with dryRun=false targets context "kind-dsh-e2e" (namespace "default").
  Approve to perform the real change.
```

Under the default read-only policy the same call is denied outright:

```text
{ kind: "deny", reason: "real apply denied: plugin is read-only (readOnly=true, allowWrite=false). Set allowWrite=true and readOnly=false to enable approval-gated writes." }
```

## Compatibility

| Component | Tested with |
| --- | --- |
| DeepSeek Harness plugin API | `@deepseek-ai/dsh-tools` 0.1.0-rc.6 |
| Cordis runtime | `@deepseek-ai/cordis` 4.0.1 |
| Kubernetes client | `@kubernetes/client-node` 1.4.0 |
| Kubernetes cluster | kind v1.32.2 (E2E), standard API groups `core/v1`, `apps/v1` |
| Node.js | ≥ 18.18 (tested on 22.x) |

## Known limitations

- v1 targets standard Kubernetes only (OpenShift / EKS/GKE/AKS-specific auth flows untested; standard kubeconfig works).
- `k8s_apply` performs server-side apply for create/update; no delete, no exec, no port-forward, no scale/rollback tools.
- Rollout status is computed for Deployment/StatefulSet/DaemonSet; other kinds return `unknown`.
- Log redaction uses pattern heuristics — exhaustive secret detection is not guaranteed.
- CRDs are not listed by `k8s_workloads` (core workload kinds only); `k8s_describe` works for arbitrary kinds.

## Uninstall

```bash
dsh plugin remove dsh-kubernetes
```

All service/tool registrations are attached to the plugin fiber — removal rolls them back completely, with no residual listeners or processes.

## Development

```bash
npm install
npm run lint        # tsc --noEmit
npm test            # 105 unit + mock-API + contract + cordis tests
npm run build

# Real-cluster E2E (throwaway cluster only):
kind create cluster --name dsh-e2e
DSH_K8S_E2E=1 npm run test:e2e
```

## License

[MIT](./LICENSE)
