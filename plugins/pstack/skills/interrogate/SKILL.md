---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". One reviewer per provider challenges changes from independent angles."
---

# Interrogate

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

Spawn one reviewer per configured panel entry to adversarially review code changes, one provider each. Resolve models and reasoning effort through run-role from the task difficulty. Each reviewer gets the same prompt and rubric. The adversarial signal comes from model diversity, not assigned personas. The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that.
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset.
- If the user's message references recent work, gather the relevant files.

Package the diff or file contents with any surrounding context files the reviewers need to understand the code.

## Step 2, Intent

Before spawning reviewers, state the intent in one clear paragraph from the user's message, commit messages, the PR description if one exists, and the code. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Launch all reviewers in a single message through the **run-role** skill with role `interrogate reviewers`, passing the task difficulty. Use the `interrogate reviewers` list from the runtime's override sheet when present, one reviewer per entry, extending or shrinking the Reviewer A/B labels below to the configured entry count; otherwise use the table defaults. A `strongest` review swaps each entry for its provider's strongest-role default. An entry whose provider is the host runs natively; any other entry runs as an Orca worker that writes to the result location run-role names.

| Subagent | Default model |
|----------|---------------|
| Reviewer A | `opus@claude` |
| Reviewer B | `gpt-6.1-sol@codex` |

For each reviewer:
- `subagent_type`: `general-purpose`
- `model`: the model of the entry resolved by run-role (the part before `@`), including any difficulty-based promotion
- `readonly`: `true`

If a native or Orca launch rejects the selected model, report the attempted launch and error and ask the user to retry, select a replacement, or drop the dispatch. Do not substitute automatically. Other dispatches may settle, but do not synthesize a verdict dependent on the failed dispatch until the user chooses. If the configured value is `inherit-parent` or `auto`, omit `model` instead; these aliases are not model slugs.

Read `references/reviewer-prompt.md` and fill in the same template for every reviewer with the stated intent, the diff or file contents, the rubric from `references/rubric.md`, and the code-quality lens from `references/code-quality-review.md`.

## Step 4, Synthesize

As results come back, build a unified picture. Parse every reviewer's findings. Merge findings that describe the same issue differently, and note which models raised each one. Findings two or more models raised independently are the highest signal. Read a lone model's finding, but weight it accordingly. Note disagreements. If one model flags something and another explicitly says the opposite, that is context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator. Read `references/lead-judgment.md` for the full framework. Put every finding in one of four buckets, with the model(s) that raised it and a one-line rationale.

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. They would block a real PR.
- **Consider**. Legitimate, but you're not sure they outweigh the cost of addressing them now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact at this stage.
- **Dismissed**. Wrong, nitpicky, or missing context, with a brief reason.

## Output Format

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [model name], [N findings] (one bullet per reviewer)

### Act On
[Each: description, which models raised it, why it matters.]

### Consider
[Each: description, which models raised it, the tradeoff.]

### Noted
[Brief list.]

### Dismissed
[Each with a brief rationale.]

### Agreement Map
[Where models agreed and diverged, and what that pattern tells us.]

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus@claude @xhigh`. Levels on Claude Code: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value with no effort suffix takes the sheet's `default effort` line, a level or `session`; with no such line, it takes the task tier's default effort from the **run-role** skill's Roles section. `session` sets no effort, so the dispatch is the usual one. Strip the effort suffix before reading the model, and leave the provider tag (`@claude`, `@codex`, written without a space) to run-role. `inherit-parent` or `auto` still omits `model` at every level. run-role passes the level as the dispatch's effort field and keeps the `subagent_type` the calling skill prescribes. That is `effort` on the Claude Code `Agent` call, `reasoning_effort` on Codex's `spawn_agent`, and `--effort` on an Orca worker.
