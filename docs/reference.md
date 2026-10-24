# pstack-orca reference

Start with the [README](../README.md) for installation and your first task.

## Multi-provider roles

Every role in [models.json](../plugins/pstack/models.json) resolves to entries of the form `model@provider`, where `model` is a Claude family name (`opus`) or a Codex model ID (`gpt-6.1-sol`). An entry may add a reasoning effort after a space, as in `opus@claude @xhigh`. The host provider is `claude` on Claude Code and `codex` on Codex. The [run-role skill](../plugins/pstack/skills/run-role/SKILL.md) dispatches each entry: a host-provider entry becomes a native subagent, and any other entry becomes a supervised Orca worker through the bundled [orca-delegate skill](../plugins/pstack/skills/orca-delegate/SKILL.md). Each role has a fixed mode: `consult` workers change no source and write only their result file (reviewers, investigators, explorers, judges, design sketches); `execute` workers may change source in the worktree the calling skill assigns (arena candidates, swarm workers, single implementation roles). While any Orca worker runs in the current worktree, the caller leaves it alone.

Availability is decided only by a real worker start. When a start fails, the other dispatches keep running and run-role reports the attempted command and the error, then asks whether to retry, run that dispatch natively on the host default, or drop it. Nothing falls back silently. By default only the panel roles mix providers; each provider names its own single-role and strongest-role defaults, so single-model roles stay on the host and the caller is not blocked.

## Slash commands

The package includes 67 skill directories: 43 public skills and 24 `principle-*` references. Claude Code uses `/pstack:<name>`. In Codex, request a skill by name or install the [optional shortcuts](#codex) for the `/name` form below.

Find each skill's instructions in the [skills tree](../plugins/pstack/skills/).

| command | use it when |
| --- | --- |
| `/poteto-mode` | default entry point for any non-trivial task |
| `/how` | walk through how a subsystem works |
| `/why` | investigate why something was built this way (parallel multi-MCP evidence) |
| `/architect` | settle types and module shape before writing code that crosses a function boundary |
| `/arena` | run N parallel attempts at the same task and pick the best parts |
| `/interrogate` | have one reviewer per provider try to break a diff |
| `/automate-me` | draft your own personal -mode skill from recent transcripts |
| `/reflect` | capture a long task's lessons as a skill edit |
| `/correct` | find the mistakes agents keep repeating in a repo and make each one impossible, enforced at the highest level that works |
| `/tdd` | fix a bug by writing the failing test first, then the fix |
| `/benchmark-checklist` | vet a measured speedup or regression (limiter, tuning, errors, repeat runs, end-to-end relevance) before you report or act on it |
| `/typescript-best-practices` | ground type-system discipline in TypeScript syntax |
| `/teach` | explain a subsystem plainly by composing how + why |
| `/swarm` | fan out N parallel workers across slices or races, then return one aggregated report |
| `/technical-writing` | write docs, RFCs, readmes, PR descriptions, and commit messages to one layered standard |
| `/bro` | restate the last message in plain human language, no jargon |
| `/in-your-own-words` | play back your goal and the problem before the agent starts |
| `/sharpen` | aim a task at what you are really after, the way a top expert would, without overspecifying it |
| `/figure-it-out` | design a rigorous, auditable playbook for a task no bundled playbook fits |
| `/show-me-your-work` | log decisions to a reviewable tsv decision trail |
| `/blast-radius` | find what a change could break beyond the diff and prove safety by running code |
| `/recall` | catch up on recent working context from chat history, live state, and the shared record |
| `/ketchup` | catch up on everything in this chat since your last message, with an executive summary for each action item |
| `/setup-pstack` | configure pstack per-role model choices |
| `/poteto-help` | answer a question about pstack with the prompt to send and the file the answer came from |
| `/run-role` | dispatch one role to its configured entries, native or Orca worker |
| `/orca-delegate` | delegate a task to another coding agent through Orca and verify the result |
| `/unslop` | clean up writing by removing AI tells |
| `/no-comments` | strip comments before review, fix the accepted findings, encode claimed constraints |
| `/create-verification-skill` | generate a project-local verification skill and feature map |
| `/maintain-verification-skill` | re-sync a drifted verification skill and its feature map |
| `/create-formal-verification-skill` | generate a project-local skill that formally verifies one high-risk property |
| `/maintain-formal-verification-skill` | re-sync a formal verification after the code it covers changed |
| `/deslop` | deslop a diff before commit |
| `/babysit` | monitor an open PR, fix CI/comments, keep it merge-ready |
| `/thermo-nuclear-review` | audit a branch's changes for bugs, breakage, security issues, devex regressions, and feature-gate leaks |
| `/thermo-nuclear-code-quality-review` | extremely strict maintainability audit |
| `/thermos` | run both thermo-nuclear reviews as parallel subagents and synthesize their findings |
| `/make-pr-easy-to-review` | clean noisy history and improve PR description before review |
| `/fix-ci` | find failing PR checks, inspect logs, apply focused fixes |
| `/fix-merge-conflicts` | non-interactively resolve merge conflicts, validate, finalize |
| `/get-pr-comments` | fetch and summarize review comments from the active PR |
| `/what-did-i-get-done` | summarize authored commits over a user-chosen period |

## Runtime support

All runtimes share [one skills tree](../plugins/pstack/skills/). A skills-only installation includes the skills, scripts, agent references, and license notices. The Claude Code and Codex plugins also install automatic routing hooks. Codex command shortcuts are separate.

| Runtime | Setup and recorded verification |
| --- | --- |
| Claude Code | Install the marketplace plugin (Claude Code 2.1.292 or later). Skills use Claude tool names and model defaults; the plugin installs automatic routing. `codex` entries need Orca. |
| Codex | Install the native plugin through the repository's marketplace and trust its hook through `/hooks`. The [Codex mapping](../plugins/pstack/skills/poteto-mode/references/codex-tools.md) translates Claude tools and model names. Shared skill symlinks were also detected in a live session. `claude` entries need Orca. |
| Prime Agent | Its documentation describes shared-directory discovery; it has not been tested in a live session. Choose tools and models through Prime's configuration. |
| opencode | Verified on version 2.0.30: discovery and skill loading in the CLI and the desktop app, and delegation through its `subagent` tool in the CLI. Configure agents, commands, and permissions in `opencode.json`. Its picker also lists principle skills. |
| Gemini CLI | Its documentation describes shared-directory discovery; it has not been tested in a live session. Use `/skills list` to check discovery and `/skills reload` after changes. |

These checks cover skill discovery. Delegation remains unverified on Prime Agent and Gemini CLI, and multi-model workflows on all three. On those runtimes, agents must adapt Claude-specific tools, models, and configuration. Each mapping applies only to its runtime.

### Automatic routing

The Claude Code and Codex plugins load the same short [routing instruction](../plugins/pstack/hooks/session-start-context.md) on startup, resume, clear, and compact. The [POSIX hook](../plugins/pstack/hooks/session-start.sh) runs on Claude Code and POSIX Codex. On Windows, Codex uses a [PowerShell adapter](../plugins/pstack/hooks/session-start.ps1) through its `commandWindows` override and does not require Bash. The adapter runs with `-ExecutionPolicy Bypass`, which a machine or user execution policy set by Group Policy overrides; on such machines the hook fails and no instruction loads. Codex requires the user to trust plugin hooks through `/hooks`. The instruction invokes `poteto-mode` when a task meets any of these conditions:

- It touches more than one file or changes a signature other files call.
- It involves a design or architecture choice.
- It concerns a bug with an unknown cause or a performance issue.

Smaller tasks proceed directly. The full skill loads when invoked, and explicit user instructions take precedence.

To disable routing, run `setup-pstack` and turn off the session hook. In Claude Code, use `/pstack:setup-pstack`. You can also write `session hook: off` in the runtime's sheet, at the path in [setup-pstack's runtime table](../plugins/pstack/skills/setup-pstack/SKILL.md#other-runtimes). The hook reads that setting before injecting its instruction. Without the setting, routing stays on.

Skills-only installs and other runtimes do not include the hook. Request `poteto-mode` explicitly, or add a standing instruction to the runtime's instruction file.

### Shared skills installation

Use this path for Prime Agent, opencode, Gemini CLI, or a skills-only Codex installation. Run the script under [Other harnesses](../README.md#other-harnesses) in the README, which clones the repository and links its skills into `~/.agents/skills/`.

Keep all skill directories, including the principle references. Leave the clone at this path while the links are installed.

### Manage linked skills

If a destination already exists, inspect it before replacing it. The installation skips existing files, directories, and links.

To update, run `git pull` in the clone that the links point to, then run the install loop again. A pull updates skills that are already linked but does not link new skill directories. To uninstall a linked skill, remove its link at `~/.agents/skills/<name>`. This removes it from every runtime using that directory.

### Install with the skills CLI

To install without keeping a local clone:

```shell
npx skills add https://github.com/dev-dingguri/pstack-orca/tree/main/plugins/pstack/skills --skill "*" --agent "*" --yes
```

The [CI installation check](../.github/workflows/ci.yml) uses the skills CLI to copy the checkout's skill tree and compare the installed files with their sources.

### Codex

The [native plugin manifest](../plugins/pstack/.codex-plugin/plugin.json) points to the shared skills directory and the Codex [SessionStart hook](../plugins/pstack/hooks/codex-hooks.json). The [marketplace catalog](../.agents/plugins/marketplace.json) lists `pstack` in the `pstack-orca` marketplace. Review and trust the hook through `/hooks`; Codex asks again when its definition changes.

The [README installation](../README.md#codex) registers that catalog with `codex plugin marketplace add`, then installs the plugin with `codex plugin add`. These commands match the help output from `codex-cli 0.154.0-alpha.6.2`. A fresh native installation was not tested for this documentation change.

OpenAI documents [marketplace registration and the plugin format](https://developers.openai.com/plugins/build/plugins#add-a-marketplace-from-the-cli). If your CLI lacks `plugin add`, use the plugin browser after registering the marketplace, or use the [skills-only installation](#shared-skills-installation).

Request `poteto-mode` by name or select its entry, such as `pstack:poteto-mode`. To enable parallel subagents:

```toml
[features]
multi_agent = true
```

Add this setting to `~/.codex/config.toml` if subagents are disabled. Skills such as `arena`, `interrogate`, and `architect` use parallel agents. The [mapping](../plugins/pstack/skills/poteto-mode/references/codex-tools.md) describes a sequential fallback and translates Claude tool names, model defaults, and verification instructions.

For optional slash-command shortcuts, run this from the clone's root:

```shell
mkdir -p ~/.codex/prompts
for c in plugins/pstack/.codex-plugin/prompts/*.md; do
  target=~/.codex/prompts/"$(basename "$c")"
  test -e "$target" || test -L "$target" || ln -s "$(pwd)/$c" "$target"
done
```

Each shortcut invokes its skill. The commands skip existing files and links. Remove a shortcut by deleting its link at `~/.codex/prompts/<name>.md`. Both native-plugin and skills-only installations work without these shortcuts.

## Configuration and dependencies

Invoke [setup-pstack](../plugins/pstack/skills/setup-pstack/SKILL.md) to choose models for each role. It detects available models, confirms the choices, and writes an override sheet. Its [runtime table](../plugins/pstack/skills/setup-pstack/SKILL.md#other-runtimes) names the sheet path and loading mechanism for each runtime. Defaults live in [models.json](../plugins/pstack/models.json).

For design comparisons and reviews, choose distinct models available to your runtime. The default panel mixes Claude and Codex models; see [Multi-provider roles](#multi-provider-roles).

Install dependencies for the workflows you use:

| Dependency | When you need it |
| --- | --- |
| GitHub CLI, `gh` | PR monitoring, shipping, and the `orch` stack frontier. Authenticate with `gh auth login`. The playbooks use Origin's CLI, `origin`, instead when it can resolve the repository. |
| Bun | The bundled `watch-pr` and `orch` scripts. Their bootstrap installs script dependencies on first run. |
| `plugin-dev` | Claude Code skill-authoring guidance used by `automate-me`, `reflect`, and `poteto-mode`. |
| Orca CLI, `orca` | Cross-provider role entries. `run-role` launches them as Orca workers; without Orca those entries fail to start and wait for your decision. |
| Python 3.10+ | `orca-delegate`'s contract helper, `prepare_contract.py`. |

Install the Claude Code skill-authoring companion with:

```text
/plugin marketplace add anthropics/claude-plugins-official
/plugin install plugin-dev@claude-plugins-official
```

Those authoring workflows need `plugin-dev` for their guidance; other workflows do not. Codex uses the equivalents named in [its mapping](../plugins/pstack/skills/poteto-mode/references/codex-tools.md#driver-and-bundled-skills-pstack-references).

Playbooks use the runtime's task-tracking tools or an uncommitted `todo.md` checklist. For Claude Code, the repository documents `CLAUDE_CODE_ENABLE_TODO_TOOLS=1`; see [platform adaptation](../plugins/pstack/skills/poteto-mode/SKILL.md#platform-adaptation).

Use [create-verification-skill](../plugins/pstack/skills/create-verification-skill/SKILL.md) to record how the agent should run and check your project, following the [driver policy](../plugins/pstack/skills/poteto-mode/SKILL.md#non-negotiables).

## Maintenance

### Repository layout

```text
.claude-plugin/marketplace.json    Claude Code marketplace
.agents/plugins/marketplace.json  Codex marketplace
package.json                      Development tooling for the generator and tests
plugins/pstack/
  .claude-plugin/plugin.json      Claude Code plugin manifest
  .codex-plugin/                  Codex manifest and generated prompt stubs
  skills/                        Shared skills, references, and scripts
    run-role/                    Role dispatch: native subagent or Orca worker
    orca-delegate/               Bundled Orca delegation policy and contract helper
  agents/                        Claude Code subagent definitions
  hooks/                         Startup routing for Claude Code and Codex
docs/adr/                        Decisions this fork made
tools/                           Generation, validation, and upstream sync
tests/                           Repository checks
```

Skills-only installs use `plugins/pstack/skills/`. Agent references and license files are included under `poteto-mode/references/`.

### Generated files and checks

The [generator](../tools/generate.mjs) updates versions, model defaults, the run-role Roles table, Codex prompts and preambles, and portable reference files. The [slash-command table](#slash-commands) supplies the Codex prompt descriptions and order. Edit that table when changing a menu description, then regenerate. Keep a row for every public skill, with `poteto-mode` first.

[Documentation fact tests](../tests/readme-facts.test.mjs) check the skill counts and upstream pin. The table parser requires the header `| command | use it when |`.

Run the generator and repository tests with Bun:

```shell
bun install --frozen-lockfile
bun tools/generate.mjs
bun test tests/
```

The install step reads the root `bun.lock` and fetches `typebox`, which the generator imports.

CI also checks shell scripts, workflows, Markdown, relative links, and the bundled Bun tools. See [local checks](../CONTRIBUTING.md#things-that-will-fail-ci) for commands and [release instructions](../CONTRIBUTING.md#releasing) for versioning and the live Claude Code command check.

### Fork scope and attribution

This repository forks pstack-claude and merges it through git; see [syncing](../CONTRIBUTING.md#syncing-from-pstack-claude). pstack-claude's skill tree is synced against upstream `7b353f7` (v0.15.27 and later), and its thermos skills and agents against `118e73b` (thermos 1.0.0).

The fork adds `run-role`, bundles `orca-delegate`, extends `models.json` with providers, modes, and task-tier efforts, and routes the fan-out skills through `run-role`. pstack-claude ports Lauren Tan's pstack from Cursor to Claude Code and shares the skills with other runtimes. It includes six cursor-team-kit skills, the three thermos skills with their two review subagents, and an independently authored `babysit` skill. The port supplies Claude Code plugin registration and routing, Codex manifests and shortcuts, and the Codex tool mapping. This fork ships Claude Code and Codex only and drops pstack-claude's Pi, GitHub Copilot, and Muse builds.

Cursor-specific automations, sticky-mode metadata, the Grok Bot UI workflow, and the Cursor UI tutorial are excluded. [tools/upstream.json](../tools/upstream.json) records the revisions and exclusions, [tools/substitutions.json](../tools/substitutions.json) holds the Cursor-to-Claude rewrite rules, and [CHANGES.md](../CHANGES.md) records each release. The bundled `thermo-nuclear-code-quality-review` provides a maintainability review when a workflow calls for one, `thermo-nuclear-review` a correctness and security audit, and `thermos` runs both as parallel subagents.

For skill changes, follow the [sync boundary](../CONTRIBUTING.md#the-sync-boundary). Runtime adaptations and workflow changes both land here, and a workflow change is declared as a fork.

See the [license summary](../README.md#license) for licenses and full-plugin attribution. [NOTICE-skills.md](../NOTICE-skills.md) is the notice for skills-only installations.
