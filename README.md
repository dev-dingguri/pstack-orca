# pstack-orca

Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack) is an opinionated Cursor skill stack that improves agent outcomes. Michael Denyer's [pstack-claude](https://github.com/michael-denyer/pstack-claude) ports it to Claude Code, Codex, and other agent harnesses. This fork adds what the port had to drop: a role can run on a model from another provider. It ships Claude Code and Codex only and drops pstack-claude's other runtime builds.

Tell `poteto-mode` your goal and it will invoke the correct workflow for the task. It keeps your code concise, simple and verified. When a role's model belongs to another provider, the `run-role` skill launches it as a supervised [Orca](https://www.onorca.dev/) worker through the bundled `orca-delegate` skill; roles on the host provider stay native subagents.

For concurrency bugs and invariants that tests cannot reach, `/create-formal-verification-skill` picks the riskiest property in your code, verifies it with a tool that fits, and leaves a project skill the next agent reruns. The separate [agent-formal-verify](https://github.com/michael-denyer/agent-formal-verify) plugin goes deeper on the method, with guided TLA+ model checking, Lean proofs, and Kani for Rust.

## Built for Claude Code

This port translates upstream's Cursor skills for Claude Code before installation. [Upstream's Claude Code install](https://github.com/cursor/plugins/tree/2f87c85/harness/pstack/claude-code) asks agents to translate Cursor names at runtime, using extra tokens and relying on them to apply the mapping correctly. This port also adds a SessionStart hook that routes tasks to `poteto-mode`.

## Install

<details>
<summary><strong>Claude Code</strong></summary>

Run in Claude Code 2.1.292 or later:

```text
/plugin marketplace add dev-dingguri/pstack-orca
/plugin install pstack@pstack-orca
```

Claude Code leaves auto-update off for third-party marketplaces, so pstack stays on the version you installed. To turn it on, run `/plugin`, open the **Marketplaces** tab, select `pstack-claude`, and choose **Enable auto-update**. To update once by hand, run `claude plugin update pstack@pstack-claude`.

</details>

<a id="codex"></a>
<details>
<summary><strong>Codex</strong></summary>

Run in your terminal:

```shell
codex plugin marketplace add dev-dingguri/pstack-orca
codex plugin add pstack@pstack-orca
```

Invoke a skill by typing `$` and its name, such as `$poteto-mode` or `$babysit`, then choosing its entry, which inserts `$pstack:<name>`. `/skills` lists every skill.

</details>

<a id="other-harnesses"></a>
<details>
<summary><strong>Other harnesses</strong></summary>

Gemini CLI, Prime Agent, and skills-only Codex installs read skills from `~/.agents/skills/`. Run in your terminal:

```shell
git clone https://github.com/dev-dingguri/pstack-orca
cd pstack-orca
mkdir -p ~/.agents/skills
for s in plugins/pstack/skills/*/; do
  target=~/.agents/skills/"$(basename "$s")"
  test -e "$target" || test -L "$target" || ln -s "$(pwd)/$s" "$target"
done
```

To update, run `git pull` in the clone, then run the `for` loop again to link skills added since the last run. These installs have no routing hook, so ask for `poteto-mode` by name or add a standing instruction to the harness's instruction file. See [shared installation](docs/reference.md#shared-skills-installation) for per-harness notes and uninstalling.

</details>

### Configure

pstack routes tasks to `poteto-mode` automatically. At session start, a hook injects an instruction that points the agent at it: the plugin's hook on Claude Code and Codex. Codex runs the hook only after you trust it through `/hooks`. Other harnesses have no hook.

Run `setup-pstack` to turn automatic routing on or off, change model defaults, or set a reasoning effort per role (`arena runners: opus@claude @xhigh, gpt-6.2-astra@codex @high`). Every model entry is `model@provider`; the default panel mixes Claude and Codex models, and single-model roles stay on the host. Cross-provider entries need Orca installed; a start that fails is reported and waits for your decision. In Claude Code, use `/pstack:setup-pstack`.

The plugin keeps the `pstack` name and the `/pstack:*` skill names. Uninstall `pstack@pstack-claude` first; two installs would both register the same skills and hook.

## Getting started

```text
Use poteto-mode to fix the search filter resetting when I change pages.
```

For a bug, it reproduces the failure, uses `how` and `why` to investigate, delegates the fix, then reruns the failing case. If the fix crosses a function boundary, it brings in `architect` before implementation. You receive the fix and the failing and passing evidence.

A localized bug with a demonstrated cause can use the [focused-fix exception](plugins/pstack/skills/poteto-mode/playbooks/bug-fix.md#focused-fix-exception). One delegate investigates and implements the correction when it preserves existing interfaces and state semantics and has a focused regression check. Reproduction, verification, and required independent review still apply; a small patch alone does not qualify.

[Other playbooks](plugins/pstack/skills/poteto-mode/SKILL.md#playbooks) cover planning, features, refactoring, performance issues, investigations, prototypes, PR maintenance, shipping, and longer projects.

![poteto-mode on Claude Code and Codex turns a request into verified work. Choose a playbook, plan and delegate with architect, arena, or swarm, then review and verify with interrogate, tests, and measurements. Project playbooks customize the workflow, and setup-pstack configures the model and reasoning effort per role. Supporting skills include how, why, and unslop.](assets/pstack-overview.png)

## Details

- [Multi-provider roles](docs/reference.md#multi-provider-roles)
- [Skills and slash commands](docs/reference.md#slash-commands)
- [Runtime setup](docs/reference.md#runtime-support)
- [Models and dependencies](docs/reference.md#configuration-and-dependencies)
- [Maintenance and port scope](docs/reference.md#maintenance)

## Data handling

pstack has no server or telemetry. Anything its skills ask your agent to read, including session transcripts, goes to your model provider. Scripts run locally, and PR tools use your GitHub CLI login.

This port has no automatic agent-diary reporting or diary opt-in setting. For a local decision trail, ask for [`show-me-your-work`](plugins/pstack/skills/show-me-your-work/SKILL.md). Longer or unattended workflows also invoke it. The trail stays uncommitted by default. If the trail is committed and pushed to a shared PR, anyone with access to the PR can read it.

To share feedback, submit a short, manually reviewed report through [GitHub issues](https://github.com/michael-denyer/pstack-claude/issues). Include the pstack version, runtime, relevant workflow, and observed result. Remove credentials, customer data, private repository links, and sensitive log or configuration values before posting; share a summary instead of raw transcripts.

## Contributing

Thanks for helping make this fork better. Bug reports, documentation fixes, and runtime improvements are welcome. Workflow changes belong upstream in pstack-claude or pstack; provider routing belongs here. See [CONTRIBUTING.md](CONTRIBUTING.md) for the checks and where your change belongs. Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

This fork, including its modifications and additions, is also [MIT-licensed](LICENSE). Original pstack © 2026 Lauren Tan; pstack-claude port © 2026 Michael Denyer; imported cursor-team-kit and thermos skills © 2026 Cursor. See [LICENSE-cursor-team-kit](LICENSE-cursor-team-kit), [LICENSE-thermos](LICENSE-thermos), and [NOTICE.md](NOTICE.md).
