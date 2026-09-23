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
- Whether the caller is following poteto-mode for this task. Reading the skill to discuss or edit it does not activate it.
- The actual author's model and provider for a review, when known, plus the task difficulty (`single` for ordinary work, `strongest` for difficult design, complex root-cause analysis, or consequential review). Record the author from the producing dispatch, not from the coordinator's provider. If authorship is unknown or spans providers, use the current working model's provider and disclose that fallback.

Use English by default for briefs, questions, replies, status updates, and results exchanged between agents, for both native and Orca dispatches. State this language rule in each brief. Use another language when explicitly requested or needed for the task, and preserve quoted source text. Keep user-facing deliverables in the user's requested language; a Korean user conversation alone does not change the language of internal coordination.

## Steps

### Carry poteto-mode into the brief

State `Parent poteto-mode: active` or `Parent poteto-mode: inactive` in every native brief and Orca contract. Resolve this from the caller's instructions, not from the provider, model, or presence of an installed skill. Do not rely on conversation inheritance or a session-start hook.

When active, include instructions appropriate to the assigned work:

- Implementation and modification workers: read the [poteto-mode skill](../poteto-mode/SKILL.md) in full before working and follow it within the assigned scope.
- Reviewers, investigators, explorers, judges, and designers: follow the assigned role's skill and prompt. The parent's active mode does not require the full poteto-mode playbook or additional delegation for this role.

Use the assigned work to choose these instructions, not `consult` or `execute` alone. Include a skill path the worker can read, resolving its installed copy or transferring required skill files through orca-delegate's file-delivery procedure. Preserve the assigned authority, output requirements, and delegation limits. Workers that follow poteto-mode carry this policy into their own dispatches.

When inactive, do not add a poteto-mode activation instruction. This records the parent's state without disabling instructions that independently apply to the worker.

### 1. Resolve the entries

Read the role line from the runtime's override sheet (`~/.claude/pstack-models.md` on Claude Code, `~/.codex/pstack-models.md` on Codex). Without a line, use the default entries in the [Roles](#roles) table. For a `single` or `strongest` role, substitute the host provider's default only when that provider has a row in the Providers table. If no native provider is known or no row exists, keep the Roles table entries and route them through Orca as step 2 prescribes.

An explicit model or reviewer-count request for this invocation takes precedence over the sheet. Resolve any requested candidate comparison before preparing dispatches; the ordinary provider pair supplies two candidates when no specific models were requested. Keep the role's mode unchanged. A reviewer pool or candidate pair is not permission to fan out without the calling skill's request.

For a `cross-review` role with no override, resolve exactly one entry from the other provider relative to the actual author: `claude` for a `codex` author, `codex` for a `claude` author. Use that provider's single-role or strongest-role default for the task difficulty. The table lists eligible defaults, not simultaneous dispatches. If neither author nor current working provider can be established, ask which provider should review rather than inventing one. Explicit role overrides still take precedence, including a requested multi-model review.

For other roles with no override, the caller may promote an ordinary task to `strongest` when the work warrants it; select the strongest-role default for each already-selected provider without adding agents. Use the effort from the table below for the task's tier, unless the user explicitly specifies an effort. A role override changes the model entries, not the default effort. Aliases inherit the actual parent model; do not claim its provider differs from the author without checking.

Each entry is one of:

- `slug@provider`, a model and the provider that runs it natively.
- A bare slug. Look its provider up in the setup skill's Models section. A bare slug listed nowhere has no provider; stop and ask the user which provider runs it (`AskUserQuestion` on Claude Code, a plain question on Codex), then continue.
- `inherit-parent` or `auto`. The entry runs natively on the parent session's model; omit `model` on the call.

### 2. Decide the path per dispatch

The host provider is `claude` on Claude Code and `codex` on Codex. On another runtime no native provider is known: aliases run natively, and every real entry goes through Orca.

Choose the agent path separately from worktree management, before loading Orca execution guides. A request to create an Orca worktree and use subagents selects Orca for the checkout only. It does not request a terminal agent, a supervised Orca worker, or a full ownership handoff.

For a same-provider dispatch, use the native path below even inside an Orca-managed worktree. Reuse an existing requested checkout. When a new checkout is requested, use the installed orca-cli skill to create it without agent-launch flags. Put the checkout's absolute path in the native brief. Tell the worker to perform file operations and shell commands in that checkout; do not assume its initial working directory changed. Do not launch a TUI or load orchestration merely because orca-cli was used. Apply the Orca guide's handoff and agent-first launch instructions only after selecting that execution path here. If native execution cannot access the checkout, report that limitation instead of silently changing the agent path.

An explicit request for a terminal agent, supervised Orca worker, or full ownership handoff overrides the same-provider default. Follow orca-delegate for supervised workers and orca-cli for full handoffs. Mere mention of Orca, another worktree, or subagents is not that override.

- Provider equals the host: native. On Claude Code, one `Agent` call with `model` set to the entry's slug (the part before `@`), `run_in_background: true`, and the `subagent_type` and `readonly` the calling skill prescribes. On Codex, one `spawn_agent` with the same model.
- Provider differs from the host: an Orca worker. Read the bundled [orca-delegate skill](../orca-delegate/SKILL.md) and its [file delivery reference](../orca-delegate/references/file-delivery.md), then follow them with the provider from the entry, the slug as the user-selected model, the mode from the [Roles](#roles) table, and the work location and result location from step 3. The contract carries the brief.

Pass the resolved effort through the native tool's supported effort parameter (on Codex, `reasoning_effort`) or Orca's `--effort` together with `--model`. On Codex, use a fresh task with `fork_turns: "none"` when selecting model or effort explicitly, and provide the brief and required file paths. Do not invent native tool parameters or treat prompt wording as an effort setting. If the native tool cannot set effort, disclose that it inherits the runtime setting; do not switch transports solely to force it. For Orca, verify requested model and effort against the launch receipt. Report unsupported or unconfirmed settings without claiming they took effect; a rejected launch follows step 5.

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

Stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the override sheet replaces the default entries; the mode is fixed per role. The default entries of a `single` or `strongest` role are the `claude` host's. Without a sheet line, substitute the host provider's single-role or strongest-role default only when that provider has a row in the Providers table. If no native provider is known or no row exists, keep the Roles table entries and route them through Orca. A `panel` role keeps its mixed default on every host. A `cross-review` role selects one eligible provider opposite the actual author.

| Task tier | Default effort |
| --- | --- |
| single | `high` |
| strongest | `xhigh` |

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
| arena runners | arena | execute | panel | `claude-opus-5-5@claude`, `gpt-6-sol@codex` |
| arena cross-judge pool | arena | consult | panel | `claude-opus-5-5@claude`, `gpt-6-sol@codex` |
| swarm workers | swarm | execute | single | `claude-opus-5-5@claude` |
| architect runners | architect | consult | single | `claude-opus-5-5@claude` |
| interrogate reviewers | interrogate | consult | cross-review | `claude-opus-5-5@claude`, `gpt-6-sol@codex` |

### Providers

| Provider | Native host | Single-role default | Strongest-role default |
| --- | --- | --- | --- |
| `claude` | Claude Code | `claude-opus-5-5@claude` | `claude-fable-5-1@claude` |
| `codex` | Codex | `gpt-6-sol@codex` | `gpt-6-astra@codex` |
