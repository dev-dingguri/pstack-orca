---
name: run-role
description: "Dispatch one pstack role to its configured model entries: natively when an entry's provider is the host, as a supervised Orca worker otherwise. Use for /run-role, or whenever a pstack skill says to run a role."
---

# Run role

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

Every pstack skill that fans work out names a role (`arena runners`, `why investigators`, `swarm workers`). This skill turns a role into running agents. It is the one place that decides native subagent versus Orca worker. The calling skill owns the prompt, the output paths, the review of results, and the authority the workers act under; this skill adds none.

## Inputs

- The role label, exactly as it appears in the [Roles](#roles) table.
- The brief for each entry: the task, file pointers rather than inlined context, the output path, and what to report. The calling skill writes it.
- Any per-entry overrides the calling skill makes explicit, such as the arms of a swarm model race.

## Steps

### 1. Resolve the entries

Read the role line from the runtime's override sheet (`~/.claude/pstack-models.md` on Claude Code, `~/.codex/pstack-models.md` on Codex). Without a line, use the default entries in the [Roles](#roles) table.

Each entry is one of:

- `slug@provider`, a model and the provider that runs it natively.
- A bare slug. Look its provider up in the setup skill's Models section. A bare slug listed nowhere has no provider; stop and ask the user which provider runs it (`AskUserQuestion` on Claude Code, a plain question on Codex), then continue.
- `inherit-parent` or `auto`. The entry runs natively on the parent session's model; omit `model` on the call.

### 2. Decide the path per entry

The host provider is `claude` on Claude Code and `codex` on Codex. On another runtime no native provider is known: aliases run natively, and every real entry goes through Orca.

- Provider equals the host: native. On Claude Code, one `Agent` call with `model` set to the slug, `run_in_background: true`, and the `subagent_type` and `readonly` the calling skill prescribes. On Codex, one `spawn_agent` with the same model.
- Provider differs from the host: an Orca worker. Read the bundled [orca-delegate skill](../orca-delegate/SKILL.md) and its [file delivery reference](../orca-delegate/references/file-delivery.md), then follow them with the provider from the entry, the slug as the user-selected model, the mode from the [Roles](#roles) table, and the work location from step 3. The contract carries the brief.

Never substitute a native model for a cross-provider entry on your own, and never start a probe worker. Only a real start decides availability.

### 3. Mode and work location

- `consult`: the worker changes no source and no external state. It writes its result to the path the contract names and nothing else. Reviewers, investigators, explorers, judges, and design sketches run this way.
- `execute`: the worker may change source within the authorization the calling skill already holds. When the calling skill assigns a worktree per worker (arena candidates, swarm workers), the worker gets that worktree. Otherwise it works in the current worktree, and the caller leaves that worktree's source and shared check resources untouched until the worker settles.

### 4. Launch and confirm

Launch every entry of a panel in one message, native calls and Orca starts side by side. For each Orca entry, run orca-delegate's submission check and report one line as soon as the start outcome is known: the provider, launch path, and worker or task identifier on success; the attempted command and the error on failure.

### 5. An Orca start that fails

Do not retry silently and do not fall back. Report the attempted command and the error, then ask the user to choose one of:

- Retry the start.
- Run this entry natively on the host's single-role default, noting in the result that diversity was reduced.
- Drop the entry and continue with the rest, noting the dropout.

Wait for the answer before launching anything else for that role.

### 6. Collect

Native results arrive in the call's response. For an Orca worker, match the completion message to the task, read the complete result file it names, and verify it against the brief as orca-delegate prescribes; a completion summary alone is not a result. Hand the calling skill every result labelled by its entry so verdicts and synthesis notes can name the model and provider.

## Roles

Stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the override sheet replaces the default entries; the mode is fixed per role.

| Role | Skill | Mode | Default entries |
| --- | --- | --- | --- |
| feature, refactoring | poteto-mode | execute | `claude-opus-5-5@claude` |
| bug-fix | poteto-mode | execute | `claude-fable-5-1@claude` |
| perf-issue | poteto-mode | execute | `claude-fable-5-1@claude` |
| hillclimb | poteto-mode | execute | `claude-fable-5-1@claude` |
| judgment and prose | poteto-mode | consult | `claude-opus-5-5@claude` |
| strongest judgment | poteto-mode | execute | `claude-fable-5-1@claude` |
| how explorer | how | consult | `claude-opus-5-5@claude` |
| how explainer | how | consult | `claude-opus-5-5@claude` |
| why investigators | why | consult | `claude-opus-5-5@claude` |
| why synthesizer | why | consult | `claude-opus-5-5@claude` |
| reflect tooling | reflect | consult | `claude-opus-5-5@claude` |
| reflect judgment, divergent, synthesizer | reflect | consult | `claude-opus-5-5@claude` |
| arena runners | arena | execute | `claude-opus-5-5@claude`, `gpt-5.6-sol@codex`, `claude-fable-5-1@claude` |
| arena cross-judge pool | arena | consult | `claude-opus-5-5@claude`, `gpt-5.6-sol@codex`, `claude-fable-5-1@claude` |
| swarm workers | swarm | execute | `claude-opus-5-5@claude` |
| architect runners | architect | consult | `claude-opus-5-5@claude`, `gpt-5.6-sol@codex`, `claude-fable-5-1@claude` |
| interrogate reviewers | interrogate | consult | `claude-opus-5-5@claude`, `gpt-5.6-sol@codex`, `claude-fable-5-1@claude` |
