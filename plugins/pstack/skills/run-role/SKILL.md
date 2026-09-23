---
name: run-role
description: "Dispatch one pstack role to its configured model entries: natively when an entry's provider is the host, as a supervised Orca worker otherwise. Use for /run-role, or whenever a pstack skill says to run a role."
---

# Run role

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

Every pstack skill that fans work out names a role (`arena runners`, `why investigators`, `swarm workers`). This skill turns a role into running agents. It is the one place that decides native subagent versus Orca worker. The calling skill owns the prompts, the review of results, and the authority the workers act under; this skill adds none.

## Inputs

The calling skill hands over a list of dispatches. Each dispatch is one agent to run and names:

- The role label, exactly as it appears in the [Roles](#roles) table.
- The entry to run it on, chosen by the caller from the role's resolved entries (step 1). A caller may repeat one entry (`how` runs two to four explorers on the one `how explorer` entry; `swarm` runs N workers), map entries one to one (a reviewer per `interrogate reviewers` entry), or pick a single entry (arena's cross-judge).
- The brief: the task, file pointers rather than inlined context, and what to report. The calling skill writes it. Where the caller assigns an output location per agent (arena candidates, swarm workers, architect design packages), the brief names it.

## Steps

### 1. Resolve the entries

Read the role line from the runtime's override sheet (`~/.claude/pstack-models.md` on Claude Code, `~/.codex/pstack-models.md` on Codex). Without a line, use the default entries in the [Roles](#roles) table; on a host other than `claude`, a `single` or `strongest` role without a line uses the host provider's default from the Providers table instead.

Each entry is one of:

- `slug@provider`, a model and the provider that runs it natively.
- A bare slug. Look its provider up in the setup skill's Models section. A bare slug listed nowhere has no provider; stop and ask the user which provider runs it (`AskUserQuestion` on Claude Code, a plain question on Codex), then continue.
- `inherit-parent` or `auto`. The entry runs natively on the parent session's model; omit `model` on the call.

### 2. Decide the path per dispatch

The host provider is `claude` on Claude Code and `codex` on Codex. On another runtime no native provider is known: aliases run natively, and every real entry goes through Orca.

- Provider equals the host: native. On Claude Code, one `Agent` call with `model` set to the entry's slug (the part before `@`), `run_in_background: true`, and the `subagent_type` and `readonly` the calling skill prescribes. On Codex, one `spawn_agent` with the same model.
- Provider differs from the host: an Orca worker. Read the bundled [orca-delegate skill](../orca-delegate/SKILL.md) and its [file delivery reference](../orca-delegate/references/file-delivery.md), then follow them with the provider from the entry, the slug as the user-selected model, the mode from the [Roles](#roles) table, and the work location and result location from step 3. The contract carries the brief.

Never substitute a native model for a cross-provider entry on your own, and never start a probe worker. Only a real start decides availability.

### 3. Mode, work location, and result location

- `consult`: the worker changes no source and no external state. It writes only to its result location. Reviewers, investigators, explorers, judges, and design sketches run this way.
- `execute`: the worker may change source within the authorization the calling skill already holds, in the worktree the brief assigns. When the caller assigns no worktree, the worker uses the current one.

The result location is the output location the brief names when the caller assigns one. Otherwise this skill names it: `result.md` inside the call directory that orca-delegate's contract helper creates for the dispatch. Write that path into the contract, and state in the contract that its result-file permission overrides any "do not write files" line in a prompt template the brief carries verbatim.

While any Orca worker, `consult` included, runs in the current worktree, leave that worktree's source and shared check resources unchanged until it settles; make edits afterwards or in another worktree.

### 4. Prepare and launch

Prepare every Orca dispatch first: reserve its call directory, write its contract, and read the contract back. Then launch the whole role in one message: every native call and every Orca `worker-start` side by side. For each Orca dispatch, run orca-delegate's submission check and report one line as soon as the start outcome is known: the provider, launch path, and worker or task identifier on success; the attempted command and the error on failure.

### 5. An Orca start that fails

The other dispatches keep running; do not stop them. For the failed one, do not retry silently and do not fall back. Report the attempted command and the error, then ask the user to choose one of:

- Retry the start.
- Run this dispatch natively on the host provider's single-role default from the Providers table, noting in the result that diversity was reduced.
- Drop the dispatch and continue with the rest, noting the dropout.

Wait for the answer before the calling skill synthesizes, judges, or ships anything that depends on that dispatch.

### 6. Collect

Native results arrive in the call's response. For an Orca worker, match the completion message to the task, read the complete result at its result location, and verify it against the brief as orca-delegate prescribes; a completion summary alone is not a result. Hand the calling skill every result labelled by its entry so verdicts and synthesis notes can name the model and provider.

## Roles

Stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the override sheet replaces the default entries; the mode is fixed per role. The default entries of a `single` or `strongest` role are the `claude` host's; on another host, a role with no sheet line uses that host provider's single-role or strongest-role default from the Providers table. A `panel` role keeps its mixed default on every host.

| Role | Skill | Mode | Tier | Default entries |
| --- | --- | --- | --- | --- |
| feature, refactoring | poteto-mode | execute | single | `claude-opus-5-5@claude` |
| bug-fix | poteto-mode | execute | strongest | `claude-fable-5-1@claude` |
| perf-issue | poteto-mode | execute | strongest | `claude-fable-5-1@claude` |
| hillclimb | poteto-mode | execute | strongest | `claude-fable-5-1@claude` |
| judgment and prose | poteto-mode | consult | single | `claude-opus-5-5@claude` |
| strongest judgment | poteto-mode | execute | strongest | `claude-fable-5-1@claude` |
| how explorer | how | consult | single | `claude-opus-5-5@claude` |
| how explainer | how | consult | single | `claude-opus-5-5@claude` |
| why investigators | why | consult | single | `claude-opus-5-5@claude` |
| why synthesizer | why | consult | single | `claude-opus-5-5@claude` |
| reflect tooling | reflect | consult | single | `claude-opus-5-5@claude` |
| reflect judgment, divergent, synthesizer | reflect | consult | single | `claude-opus-5-5@claude` |
| arena runners | arena | execute | panel | `claude-opus-5-5@claude`, `gpt-5.6-sol@codex`, `claude-fable-5-1@claude` |
| arena cross-judge pool | arena | consult | panel | `claude-opus-5-5@claude`, `gpt-5.6-sol@codex`, `claude-fable-5-1@claude` |
| swarm workers | swarm | execute | single | `claude-opus-5-5@claude` |
| architect runners | architect | consult | panel | `claude-opus-5-5@claude`, `gpt-5.6-sol@codex`, `claude-fable-5-1@claude` |
| interrogate reviewers | interrogate | consult | panel | `claude-opus-5-5@claude`, `gpt-5.6-sol@codex`, `claude-fable-5-1@claude` |

### Providers

| Provider | Native host | Single-role default | Strongest-role default |
| --- | --- | --- | --- |
| `claude` | Claude Code | `claude-opus-5-5@claude` | `claude-fable-5-1@claude` |
| `codex` | Codex | `gpt-5.6-sol@codex` | `gpt-6-astra@codex` |
