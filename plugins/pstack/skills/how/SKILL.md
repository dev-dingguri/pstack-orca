---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
---

# How

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On GitHub Copilot, read the [platform mapping](../poteto-mode/references/copilot-tools.md), including its per-skill notes, before following this skill.

On Muse, read the [platform mapping](../poteto-mode/references/muse-tools.md), including its per-skill notes, before following this skill.

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Every spawn goes through the **run-role** skill: explorers with role `how explorer` and every explainer with role `how explainer` (defaults in [Models](#models)). A native entry is an `Agent` subagent with `subagent_type: "general-purpose"`; run-role sets its model and effort, and the brief states that it changes no files.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): no explorers. Spawn one explainer that explores and explains in one pass, built from `references/explainer-prompt.md` without the explorer-findings section. Go to step 4.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): go to step 2.

When in doubt, take the simple path.

## 2. Explore (complex only)

Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem. Spawn all explorers in a single message through the **run-role** skill with role `how explorer`, each with `references/explorer-prompt.md` and its angle filled in.

## 3. Synthesize (complex only)

Once all explorers have returned, spawn one explainer through the **run-role** skill with role `how explainer`, with `references/explainer-prompt.md` and every explorer's findings filled in.

## 4. Present

Present the explainer's output. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

## Output format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it and lists its path per runtime. Each entry is `model@provider`; the **run-role** skill runs an entry natively when its provider is the host and as an Orca worker otherwise, in the mode shown.

- how explorer: `opus@claude` (consult)
- how explainer: `opus@claude` (consult)

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus@claude @xhigh`. Levels on Claude Code: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value without ` @` takes the sheet's `default effort` line, a level or `session`; with no such line, it takes the task tier's default effort from the **run-role** skill's Roles section. `session` sets no effort, so the dispatch is the usual one. Strip the effort suffix before reading the model, and leave the provider tag (`@claude`, `@codex`, written without a space) to run-role. `inherit-parent` or `auto` still omits `model` at every level. run-role passes the level as the dispatch's effort field and keeps the `subagent_type` the calling skill prescribes. That is `effort` on the Claude Code `Agent` call, `reasoning_effort` on Codex's `spawn_agent`, and `--effort` on an Orca worker. On Muse it is `effort` on a Workflow child; a `subagent_spawn` dispatch keeps the session's effort.
