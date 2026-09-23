# pstack-orca

Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack) is an opinionated Cursor skill stack that improves agent outcomes. Michael Denyer's [pstack-claude](https://github.com/michael-denyer/pstack-claude) ports it to Claude Code, Codex and other agent harnesses. This fork adds what the port had to drop: a role can run on a model from another provider.

Tell `poteto-mode` your goal and it will invoke the correct workflow for the task. It keeps your code concise, simple and verified. When a role's model belongs to another provider, the `run-role` skill launches it as a supervised [Orca](https://orca.dev) worker through the bundled `orca-delegate` skill; roles on the host provider stay native subagents.

## Install

### Claude Code

Run in Claude Code:

```text
/plugin marketplace add dev-dingguri/pstack-orca
/plugin install pstack@pstack-orca
```

### Codex

Run in your terminal:

```shell
codex plugin marketplace add dev-dingguri/pstack-orca
codex plugin add pstack@pstack-orca
```

The plugin keeps the `pstack` name, so it replaces pstack-claude rather than installing beside it.

Run `setup-pstack` to change model defaults or turn automatic routing off. Every model entry is `slug@provider`; the default panel mixes Claude and Codex models, and single-model roles stay on the host. Cross-provider entries need Orca installed; a start that fails is reported and waits for your decision. The plugin installs the routing hook on Claude Code and Codex; Codex asks you to trust it through `/hooks` before it runs. In Claude Code, use `/pstack:setup-pstack`.

For Prime Agent, OpenCode, Gemini CLI, or skills-only installs for any harness, see [shared installation](docs/reference.md#shared-skills-installation).

## Getting started

```text
Use poteto-mode to fix the search filter resetting when I change pages.
```

For a bug, it reproduces the failure, uses `how` and `why` to investigate, delegates the fix, then reruns the failing case. If the fix crosses a function boundary, it brings in `architect` before implementation. You receive the fix and the failing and passing evidence.

[Other playbooks](plugins/pstack/skills/poteto-mode/SKILL.md#playbooks) cover planning, features, refactoring, performance issues, investigations, prototypes, PR maintenance, shipping, and longer projects.

![A request enters poteto-mode. Playbook options include Plan, Bugs, Features, and Refactor. Planning can use architect, arena, or swarm; review and verification can use interrogate, tests, and measurements. Supporting skills include how, why, and unslop. The output is Finished work validated.](assets/pstack-overview.png)

## Details

- [Multi-provider roles](docs/reference.md#multi-provider-roles)
- [Skills and slash commands](docs/reference.md#slash-commands)
- [Runtime setup](docs/reference.md#runtime-support)
- [Models and dependencies](docs/reference.md#configuration-and-dependencies)
- [Maintenance and port scope](docs/reference.md#maintenance)

## Contributing

Thanks for helping make this fork better. Bug reports, documentation fixes, and runtime improvements are welcome. Workflow changes belong upstream in pstack-claude or pstack; provider routing belongs here. See [CONTRIBUTING.md](CONTRIBUTING.md) for the checks and where your change belongs. Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

This fork, including its modifications and additions, is also [MIT-licensed](LICENSE). Original pstack © 2026 Lauren Tan; pstack-claude port © 2026 Michael Denyer; imported cursor-team-kit skills © 2026 Cursor. See [LICENSE-cursor-team-kit](LICENSE-cursor-team-kit) and [NOTICE.md](NOTICE.md).
