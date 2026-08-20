# OMDSH Hub

OMDSH Hub is a community extension catalog and Profile generation manager for DeepSeek Harness. It reuses the Harness Profile, Bundle, Repository Plugin, Agent Preset, layered Skill registry, Cordis lifecycle, and configuration contracts while adding transactional installation, recovery, catalog browsing, and a settings UI.

This release candidate is checked against the newest packages currently published on the npm
`next` channel (queried 2026-08-13): Cordis `4.0.1-rc.4` and the DSH client and Host contracts
`0.0.1-rc.5`:

- Bundle metadata under `package.json#dsh.bundle`;
- Client metadata under `package.json#dsh.client`;
- the `settings.section` client slot;
- the `webServer` host service;
- Loader readiness after every enabled Cordis fiber becomes active.

The package intentionally remains marked `private: true` to prevent npm publication. Making the GitHub repository public does not require removing that guard.

## Local validation

Use Node.js 22 or later:

```bash
npm ci --ignore-scripts
npm run validate
npm run pack:check
```

The `@deepseek-ai` packages require registry read access. Supply a short-lived `NPM_TOKEN` through
the process environment and the local npm configuration described by the package owner; never put
a concrete token in this repository. `validate` checks the exact npm package versions and contract
declarations, JavaScript syntax, the vendored Registry, and the complete Node test suite.
`pack:check` inspects the package manifest without publishing it and rejects local npm configuration.

## Harness integration

The host entry is `dist/index.mjs`. It provides the extension manager, Workshop bridge, and agent ecosystem services, registers the loopback-only management API, and installs the `official-v2` runtime-ready adapter. `official-v2` is OMDSH's adapter API version; it is not a snapshot name.

The prebuilt client entry is `dist/client.js`. It contributes the Extensions settings section through the standard client manifest and supports Installed, Discover, collections, recipes, updates, and history views.

The npm registry did not provide `@deepseek-ai/dsh-repository-plugin` when this candidate was
checked. Git-source catalog entries therefore remain visible as guided integrations and OMDSH does
not claim that they can be installed through an npm-provided Repository Plugin. This repository
does not copy a private or Git-snapshot implementation to fill that gap.

The management endpoint is `/omdsh/extensions/v1`. Mutation requests are restricted to a loopback Host, reject cross-site Fetch Metadata, and require a matching HTTP Origin when an Origin header is present.

## Safety model

- Install and update operations are staged in a new physical Profile generation.
- Package-manager lifecycle scripts are disabled by default.
- Registry documents are strictly parsed and remote replacements require a configured Ed25519 signature.
- A candidate generation becomes current only after configuration validation and runtime readiness confirmation.
- Failed candidates are discarded and the previous generation remains recoverable.

## Documentation

- [Architecture](docs/architecture.md)
- [Adapters](docs/adapters.md)
- [Chinese README](README.zh.md)

## License

MIT
