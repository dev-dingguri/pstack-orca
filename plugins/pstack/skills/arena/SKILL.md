---
name: arena
description: "Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape."
---

# Arena

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On GitHub Copilot, read the [platform mapping](../poteto-mode/references/copilot-tools.md), including its per-skill notes, before following this skill.

On Muse, read the [platform mapping](../poteto-mode/references/muse-tools.md), including its per-skill notes, before following this skill.

Default to one candidate per panel entry, one provider each, using run-role's task difficulty and effort policy. More candidates need an explicit request or a longer override list.

Open a todolist with one entry per phase (Frame, Fan out, Cross-judge, Pick, Graft, Verify) before launching anything.

## Phase A: Frame

Every candidate gets the same prompt, so the prompt is the contract.

1. State the artifact each candidate is producing.
2. Derive the rubric, 3-6 concrete gradeable criteria for what success looks like on *this* task. It is the picker's tool in Phase D. Candidates only see the task.
3. Pick the runners. Use the `arena runners` line in `pstack-models.md` when present. Otherwise run one each on the defaults in [Models](#models). More candidates or repeated same-model candidates require an explicit request or override. Each entry is `model@provider`; **run-role** runs it natively or as an Orca worker. When the calling skill names another role for the runners (architect passes `architect runners`), resolve that role instead of `arena runners`, here and in Phase B, keeping that role's mode.
4. Give each candidate its own output location (a git worktree where possible, otherwise `/tmp/arena-<slug>/candidate-<n>/`), per the **separate-before-serializing-shared-state** principle skill.

## Phase B: Fan out

Spawn all N candidates in one message through the **run-role** skill with role `arena runners` (or the role the calling skill named), one dispatch per candidate on its own output path, each with the task, the path to the shared grounding, its own output path, and instructions to produce the artifact and a short rationale naming the alternatives it considered and what it rejected.

If a candidate produces no output, proceed with N-1 and note the dropout.

## Phase C: Cross-judge

After all Phase B candidates complete, choose one model from the `arena cross-judge pool` line in `pstack-models.md` when present. Otherwise choose from the runner defaults in [Models](#models). Prefer a different model family from the parent's, as run-role's family rule defines it. Spawn one readonly judge on that model through the **run-role** skill with role `arena cross-judge pool`, one dispatch on the chosen entry. It sees the rubric and the candidates by path label, scores each criterion, and recommends a base with rationale. It runs in parallel with your reading in Phase D, not with the candidates themselves. Don't spawn it while candidates are still writing.

## Phase D: Pick a base

Read every candidate end to end before picking. Score each against the rubric criterion by criterion, not on holistic feel, and compare with the cross-judge. Agreement on the base confirms the pick. Disagreement means one of you is biased or the rubric was ambiguous. Read both rationales before deciding.

Pick the base a future maintainer can extend most easily without breaking invariants. When two feel tied, prefer the cleaner boundary or smaller API, per the Laziness Protocol.

## Phase E: Graft

Walk each losing candidate once more for what is worth porting into the base, usually one or two things per candidate, not most of it. Fold each graft in by hand, per the **redesign-from-first-principles** principle skill, so the result stays coherent under one mental model. Don't paste mechanically.

If the candidates converge on one shape, that is strong agreement. Note it and ship the consensus shape. No graft is needed. If they wildly diverge, Phase A was under-specified. Reframe and re-run rather than averaging the divergence.

## Phase F: Verify

Verify the synthesized artifact like any other output, per the **prove-it-works** principle skill. If verification finds a problem the arena missed, either Phase A was wrong (re-frame and re-run) or a candidate caught it and you missed the graft (go back to Phase E). Don't paper over it.

## Outputs

One synthesized artifact, with a short synthesis note alongside naming the base and why, the cross-judge's verdict, each graft with its source candidate, what was rejected and why, any convergence or dropouts, and the verification result.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it and lists its path per runtime. Each entry is `model@provider`; the **run-role** skill runs an entry natively when its provider is the host and as an Orca worker otherwise, in the mode shown.

- arena runners: `opus@claude`, `gpt-6.1-sol@codex` (execute)
- arena cross-judge pool: `opus@claude`, `gpt-6.1-sol@codex` (consult)

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus@claude @xhigh`. Levels on Claude Code: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value with no effort suffix takes the sheet's `default effort` line, a level or `session`; with no such line, it takes the task tier's default effort from the **run-role** skill's Roles section. `session` sets no effort, so the dispatch is the usual one. Strip the effort suffix before reading the model, and leave the provider tag (`@claude`, `@codex`, written without a space) to run-role. `inherit-parent` or `auto` still omits `model` at every level. run-role passes the level as the dispatch's effort field and keeps the `subagent_type` the calling skill prescribes. That is `effort` on the Claude Code `Agent` call, `reasoning_effort` on Codex's `spawn_agent`, and `--effort` on an Orca worker. On Muse it is `effort` on a Workflow child; a `subagent_spawn` dispatch keeps the session's effort.
