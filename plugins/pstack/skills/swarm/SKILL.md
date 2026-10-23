---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
---

# Swarm

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On GitHub Copilot, read the [platform mapping](../poteto-mode/references/copilot-tools.md), including its per-skill notes, before following this skill.

On Muse, read the [platform mapping](../poteto-mode/references/muse-tools.md), including its per-skill notes, before following this skill.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
4. Resolve the worker entries through the **run-role** skill with role `swarm workers` (default in [Models](#models)) and the task difficulty. For a model race, name each arm's entry up front.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Spawn all N workers in one message through the **run-role** skill with role `swarm workers`, one dispatch per worker on its configured entry and assigned worktree; native dispatches get `subagent_type: "general-purpose"` and `run_in_background: true`. Claude Code subagents all run on this machine, so isolation comes from the worktree or output directory assigned in Phase A, not from a remote environment.

When a worker must start from a non-default branch, check that branch out in the worker's own worktree and name the worktree path in its brief.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it and lists its path per runtime. Each entry is `model@provider`; the **run-role** skill runs an entry natively when its provider is the host and as an Orca worker otherwise, in the mode shown.

- swarm workers: `opus@claude` (execute)

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus@claude @xhigh`. Levels on Claude Code: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value without ` @` takes the sheet's `default effort` line, a level or `session`; with no such line, it takes the task tier's default effort from the **run-role** skill's Roles section. `session` sets no effort, so the dispatch is the usual one. Strip the effort suffix before reading the model, and leave the provider tag (`@claude`, `@codex`, written without a space) to run-role. `inherit-parent` or `auto` still omits `model` at every level. run-role passes the level as the dispatch's effort field and keeps the `subagent_type` the calling skill prescribes. That is `effort` on the Claude Code `Agent` call, `reasoning_effort` on Codex's `spawn_agent`, and `--effort` on an Orca worker. On Muse it is `effort` on a Workflow child; a `subagent_spawn` dispatch keeps the session's effort.
