# Codex tool mapping for pstack

pstack skills are written in Claude Code tool language (the `Skill` tool, the `Agent` tool, `AskUserQuestion`, Claude model names). On Codex the skills are the same files; only the tool names resolve differently. Read this when a pstack skill names a Claude tool, a driver or bundled skill, or a Claude model. This file is Codex-specific. Gemini CLI, opencode, Prime Agent, and other runtimes must use their own concrete tools, model names, and configuration paths.

## Tool actions

| pstack / Claude action | Codex equivalent |
|------------------------|------------------|
| Read a file | `shell` (`cat`, `head`, `tail`) |
| Create / edit / delete a file | `apply_patch` |
| Run a shell command | `shell` |
| Search file contents / find files | `shell` (`rg`, `grep`, `find`, `ls`) |
| Fetch a URL | `shell` with `curl` / `wget` |
| Search the web | `web_search` |
| Invoke a skill (the `Skill` tool, `/command`) | Skills load natively. Follow the instructions presented. |
| Dispatch a subagent (the `Agent`/`Task` tool) | `spawn_agent` |
| Dispatch N parallel subagents in one turn | N `spawn_agent` calls in one response |
| Wait for a subagent result | `wait_agent` |
| Free a finished subagent slot | `close_agent`, when the session exposes it. Some Codex hosts don't. |
| Track tasks (the todolist; `TaskCreate` / `TaskUpdate`, or `TodoWrite` on Claude Code) | `update_plan` |
| Ask the human a fixed-choice question (`AskUserQuestion`) | Ask in plain text and let the user answer. Codex has no structured-choice tool. |

Subagent dispatch needs `multi_agent` enabled. Add to `~/.codex/config.toml`:

```toml
[features]
multi_agent = true
```

Without it, `spawn_agent` is unavailable and the fan-out skills (`interrogate`, `why`, `how`, `arena`, `reflect`) degrade to a single sequential pass. A required independent review does not degrade. It stays blocked, as poteto-mode's [Subagents](../SKILL.md#subagents) section says.

Enabling `multi_agent` does not lift the host's thread limit. A thread-limit error from `spawn_agent` is a capacity error, not a rejected model slug, so the skills' fallback to another model does not apply. After the first capacity rejection, stop spawning. Close a finished agent with `close_agent` before you try again, and where the session has no `close_agent`, do not assume a finished agent's slot is free.

## Subagent policy

poteto-mode's Subagents section sets Claude-specific defaults (`subagent_type: "pstack:poteto-agent"`, `run_in_background: true`). On Codex:

- There is no `poteto-agent` subagent type. Route an ad-hoc subagent through poteto-mode's style by dispatching a `spawn_agent` whose instructions tell it to read the `poteto-mode` skill in full first.
- `spawn_agent` calls already run concurrently with your turn, so `run_in_background: true` has no separate flag. Issue the dispatch and continue.
- When a role value carries `@<level>`, or the `default effort` line names a level, pass that level as `spawn_agent`'s `reasoning_effort` and keep the dispatch otherwise unchanged. `session` passes no `reasoning_effort`.
- There is no `comment-sicko` subagent type either. The **no-comments** skill spawns it on Claude Code; on Codex dispatch a `spawn_agent` whose instructions tell it to read `poteto-mode/references/agents/comment-sicko.md` in full first.
- There are no `thermo-nuclear-review-subagent` or `thermo-nuclear-code-quality-review-subagent` types. The **thermos** skill spawns both on Claude Code; on Codex dispatch two `spawn_agent` calls whose instructions tell each to read the `thermo-nuclear-review` or `thermo-nuclear-code-quality-review` skill in full first and review only the diff and file contents in its prompt.
- Claude Code runs every subagent on this machine, so the **swarm** skill's workers and the fan-out playbooks (`orchestrate`, `autopilot-full`, `autopilot-stack`) isolate writers with worktrees. The same holds on Codex.
- Keep the rest of the policy unchanged. Pass file pointers not inlined context, give each worker its own worktree or branch when they write, review every subagent's diff yourself.

## Model names

Skills name defaults as `model@provider` entries (a single-role default for code/prose/judgment plus a mixed-provider panel; each model-consuming skill lists its own in a Models section). On Codex the host provider is `codex`: a `codex` entry runs natively through `spawn_agent`, and a `claude` entry runs as an Orca worker running Claude Code, dispatched by the `run-role` skill through the bundled `orca-delegate` skill. Single-model roles stay on the host so the caller is not blocked on a worker; run-role applies these defaults to any single-model role with no sheet line:

- Single-model roles: the Codex single-role default `gpt-6.1-sol@codex`.
- Roles that default to the strongest Claude model (`bug-fix`, `perf-issue`, `hillclimb`, `strongest judgment`): the Codex strongest-role default `gpt-6-astra@codex`.
- Mixed-provider panels (`arena`, `architect`, `interrogate`): the adversarial signal comes from model diversity, so keep entries from both providers. The default panel is `opus@claude`, `gpt-6.1-sol@codex`, one agent per entry: arena candidates, architect design candidates, and interrogate reviewers. A pool (`arena cross-judge pool`, `trail reviewer pool`) shares the panel defaults but is a candidate list: its skill selects one entry whose provider differs from the target it names, and the list length sets no count. Ordinary work uses `high` effort; difficult work uses `xhigh` and each provider's strongest-role default. If Orca is not installed, the Claude entries cannot start; run-role reports each failed start and asks how to replace that entry.

`/setup-pstack` writes the configured model list. On Codex, write single-model roles as Codex entries.

## Session routing hook

The native pstack plugin bundles the same `SessionStart` routing instruction as the Claude Code plugin, through `session-start.sh` on macOS and Linux and `session-start.ps1` on Windows. Codex runs the hook on startup, resume, clear, and compact after the user trusts the hook through `/hooks`. The hook reads `session hook` from the Codex sheet, at the path in [setup-pstack's runtime table](../../setup-pstack/SKILL.md#other-runtimes); `session hook: off` disables injection.

A skills-only installation does not include plugin hooks. Request `poteto-mode` explicitly or add a standing instruction to `AGENTS.md` in that case.

## Driver and bundled skills pstack references

The [driver policy](../SKILL.md#non-negotiables) selects the app driver. For skills and drivers named by these workflows, use these Codex equivalents:

| Skill or driver named in pstack | On Codex |
|---------------------------------|----------|
| `run` (drive a CLI/TUI to see a change work) | Run the app yourself via `shell` and observe the real output. |
| Project UI driver | Drive the UI with whatever automation you have, or hand the user a concrete manual check. Do not claim done without observing the artifact. |
| `plugin-dev:skill-development` (Claude's SKILL.md authoring guidance) | Follow your platform's skill-authoring guidance; the `writing-skills` skill if present. Keep `name` + `description` frontmatter and progressive disclosure. |
| `loop` (recurring/self-paced re-invocation, used by `babysit`) | Codex has no `loop` skill. Re-run the step yourself on a cadence, or use a Codex scheduled task if available. |

## Per-skill notes

Affected skill entry points and the optional Codex slash stubs point here. Most skills need only the tables above. These need one more mapping:

| Skill | On Codex |
|-------|----------|
| `interrogate` | Reviewers dispatch through `run-role`, one per panel entry: a `codex` entry maps the `subagent_type`/`model`/`readonly` fields to `spawn_agent`; a `claude` entry runs as an Orca worker. Keep the panel mixed. |
| `setup-pstack` | The skill's Other runtimes table names the Codex sheet path and how it loads. Write single-model roles as Codex entries (see Model names above) and keep the panel roles mixed. The role rows are identical. |
| `run-role` | The host provider is `codex`. Native dispatches use `spawn_agent` with supported `reasoning_effort`; `claude` entries use Orca workers with model and effort. Follow run-role's disclosure rule if the selected effort cannot be confirmed. |
| `no-comments` | There is no `comment-sicko` subagent type; see Subagent policy above. |
| `thermos` | There are no thermo-nuclear subagent types; see Subagent policy above. |
| `teach` | Running `how` and `why` in parallel maps to `spawn_agent` fan-out; image generation uses the configured Codex equivalent. |
| `create-verification-skill` | The generated skill lands under `.claude/skills/verify/` on Claude Code; write it to Codex's project-skill location instead. The app-driving harness is platform-neutral. |
| `maintain-verification-skill` | The parallel per-feature source readers map to `spawn_agent` fan-out; the project-local skill lives under Codex's skills location, not `.claude/skills/`. |
| `create-formal-verification-skill` | Write the generated skill to Codex's project-skill location, named for the area it verifies. The verifier and its run command are platform-neutral. |
| `maintain-formal-verification-skill` | Project skills, the formal verification skill among them, live under Codex's project-skill location. |
| `babysit` | `loop` and `AskUserQuestion` resolve through the tables above. |
| `automate-me` | `plugin-dev:skill-development` resolves through the skills table above. |
| `architect` | The runner panel goes through the **arena** skill, so its `spawn_agent` fan-out and model substitution apply here too. |
| `arena` | The parallel candidates and the cross-judge map to `spawn_agent`; substitute your configured Codex models for the runners and the cross-judge pool (see Model names above). |
| `how` | The parallel explorers and the explainer map to `spawn_agent` fan-out; substitute your configured Codex models. |
| `reflect` | The three reviewers and the synthesizer map to `spawn_agent`; substitute your configured Codex models. The transcript finder reads Claude Code's layout under `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/`, so pass the session digest step 1 allows instead. |
| `swarm` | Each worker is a `spawn_agent` call on your configured Codex model, and those calls already run concurrently; give each writing worker its own worktree or output directory (see Subagent policy above). |
| `why` | The parallel investigators and the synthesizer map to `spawn_agent`; substitute your configured Codex models. List MCP servers from the tools Codex exposes to the session, not from `.mcp.json` or `claude mcp list`. |

## Vendored scripts

`skills/poteto-mode/scripts/` ships the `watch-pr` PR watcher, the `orch` store CLI, and `worktree-audit.mjs`. The `watch-pr/ship-pr` command owns pending-merge inspection and cancellation; `resume.mjs` owns the shared checkpoint locator described in [Resume storage](resume-storage.md). These scripts use bun and Node.js and run the same on Codex; invoke them through `shell`. They need `bun` and `gh`, or `origin` when the forge is Origin. Run `worktree-audit.mjs` with `node`, as its shebang does. The audit follows each link in a worktree's ancestor directories with `stat` and matches it by the directory it lands on, under bun and node alike. A worktree whose own path bun cannot resolve loses its last chat and lands in `review`. A dangling or looping link is ignored. Any other link that `stat` cannot follow puts every worktree under the link's directory in `review`, with a warning that names the link. `worktree-audit.mjs` scans Codex sessions under `$CODEX_HOME/sessions` and `$CODEX_HOME/archived_sessions` (default `~/.codex`), along with any Claude Code or Pi transcript directory that exists. It imports the transcript walker from `skills/reflect/scripts/find-transcript.mjs`, so keep the `reflect` skill installed beside `poteto-mode`.

## Instructions file

Where a pstack skill says "your instructions file", on Codex that is `AGENTS.md` (project root, plus `~/.codex/AGENTS.md` global). On Claude Code it is `CLAUDE.md`.
