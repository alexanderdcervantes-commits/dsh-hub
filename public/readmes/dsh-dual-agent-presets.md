# dsh-dual-agent-presets

Two selectable Agent Presets for DeepSeek Harness:

- **General Agent** (`general-agent`): research, file handling, planning, and personal productivity without exposing a raw shell tool by default.
- **Coding Pro** (`coding-pro`): repository-first coding with filesystem, shell, planning, delegation, workflow, and verification tools.

## Install

```powershell
dsh plugin --profile web add github:QlzqQlzq/dsh-dual-agent-presets
```

Restart the Web profile, then select the preset when creating a session.

The plugin installs its managed preset directories under `$DSH_HOME/.agent-presets` (normally `~/.dsh/.agent-presets`). It never overwrites a same-named directory unless that directory carries this package's ownership marker.

## Remove

```powershell
dsh plugin --profile web remove dsh-dual-agent-presets
```

Harness currently has no package-owned preset-root extension point, so removing the bundle does not delete the two deployed preset directories. Remove `general-agent` and `coding-pro` from Agent Presets settings if you no longer need them.

## License

MIT. The preset compositions are derived from DeepSeek Harness's MIT-licensed standard preset; see the repository history and license notice.
