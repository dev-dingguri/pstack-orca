---
name: setup-pstack
description: Configure which models pstack uses per role. Detects available models and writes the current runtime's override sheet. Use for /setup-pstack, "configure pstack models", changing pstack's model choices, or turning the SessionStart hook on or off.
---

# Setup pstack

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

Write the current runtime's per-role model override sheet. Each pstack skill names a default model inline; the override sheet adapts those defaults to the models you actually have access to.

On any runtime other than Claude Code, read [Other runtimes](references/runtimes.md) first. Its table gives the sheet path, how the sheet loads, and how to list models, and your runtime's section says which steps change. The rest of this file describes Claude Code.

On Claude Code the config directory is `$CLAUDE_CONFIG_DIR` when that variable is set and `~/.claude` otherwise. This skill calls it `<config>`, and the user sheet is `<config>/pstack-models.md`. A project sheet, `.claude/pstack-models.md` at the repository root (`git rev-parse --show-toplevel`; outside a repository, the directory Claude Code starts in), is committed with the repository and replaces the user sheet in that project. The session hook reads it whenever it exists. The model rows defer to it through the line step 6 writes under its heading, so a hand-written project sheet needs that line too. Claude Code has no auto-applied "rules" mechanism like Cursor's `.mdc`, so inclusion is explicit: the user adds a line to `<config>/CLAUDE.md` such as:

```text
@<config>/pstack-models.md
```

with `<config>` written as the resolved path, so the file is loaded as context for every session. A project sheet loads from `@.claude/pstack-models.md` in the `CLAUDE.md` at the repository root.

## Steps

### 1. Detect available models

Enumerate the model names the `Agent` tool's `model` parameter accepts in this session. That is the dependable source for the host provider. On Claude Code they are the family names listed in [Models](#models) below, each running that family's current model, and a full model ID is rejected. The available models per provider and the default panel are listed there too. The panel takes one entry per provider for cross-family diversity. The sheet block below shows the `claude` host's defaults. On Codex, write the single-model roles with the Codex models from the run-role skill's Providers table. Ask the user to confirm or paste any additional slugs they want available, each with its provider. Never write a real slug you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even though they are not detected slugs. Both mean the role runs on the parent session's model, which the `Agent` call expresses by omitting `model`.

An entry whose provider is not the host runs as an Orca worker through the `run-role` skill. Ask the user whether Orca is installed and which providers it can launch. Record the answer, but do not start a worker to check, because only a real start decides availability.

### 2. Load current state

On Claude Code, first ask whether to configure the user sheet, for every project, or the project sheet, for this repository on any machine. The rest of the steps use the chosen sheet.

The default role-to-model mapping is the rule shape shown in the Write the override sheet step below. If the current runtime's sheet already exists, read it and treat its values as the current choices. Otherwise start from those defaults. A line whose role is not in that shape, such as `how critics`, `how explorer`, `how explainer`, `architect runners`, `reflect tooling`, `reflect judgment, divergent, synthesizer`, `why investigators`, or `why synthesizer`, is from a retired role. Drop it. An older sheet may name full model IDs that start with `claude-`, which the `Agent` tool rejects. Replace each with its family name, the word after `claude-`, and keep its `@claude` tag.

### 3. Map and confirm

Show every role with its current entries, marking any real slug not in the detected or confirmed set as needing a choice. Also list each line step 2 dropped or rewrote. Ask whether to accept as-is or change specific roles, offering the confirmed models of every provider plus `inherit-parent` and `auto` as the options. Write every real entry as `model@provider`. Prefer `AskUserQuestion` over free text. For panel roles (arena runners, interrogate reviewers) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. Keep one entry per provider unless the user wants more. `arena cross-judge pool` is also a list, but Arena runs one judge. It tries only values from a family other than the parent's, in list order, so order it by preference. `trail reviewer pool` is a list the same way: show-me-your-work runs one reviewer from a family other than the one that did the work. Families are providers, as run-role's family rule defines them. An `inherit-parent` or `auto` value never judges. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

Then ask for the default reasoning effort, the `default effort` line. It is `session`, which keeps the parent session's effort, or one of the levels in [Models](#models). Start from the default listed there. Every role value without a suffix runs at it. Then ask whether any role should run at another level. A role entry may carry one after a space, as in `opus@claude @xhigh`; panel entries take their own, as in `opus@claude @xhigh, <codex-model>@codex @high`. Each level is passed as the dispatch's effort, so the choice holds without changing the session. Leave the suffix off for the default effort.

### 4. Choose whether the session hook routes tasks

On Claude Code, the plugin's `SessionStart` hook injects the poteto-mode mandate on startup, resume, clear, and compact. Ask whether to keep the hook. The default is on. The answer is the `session hook` line in the current runtime's sheet: `on` or `off`. With no sheet or no line, the hook injects. The line is inert on other runtimes without a pstack routing hook.

### 5. Validate

Every real slug written must be in the detected or confirmed set and carry its provider. `inherit-parent` and `auto` always pass. Validate the slug without its effort suffix (`@<level>` after a space), and the level against the effort levels in [Models](#models). The `default effort` value is one of those levels or `session`. If a chosen real slug or level is not available, stop and ask again.

### 6. Write the override sheet

Write the current runtime's sheet with the shape below. Overwrite the whole file so re-runs stay idempotent. A project sheet also gets this line under its heading, so a session that loads both sheets knows which one counts: `This project's sheet. In this repository it replaces the user's pstack-models.md; ignore that sheet's lines.`

```markdown
# pstack model configuration

Per-role model overrides for pstack skills. Each pstack SKILL.md names its defaults in a Models section; the values here override those defaults. Delete a line to fall back to the skill default. Write each entry as `model@provider`; an entry whose provider is not the host runs as an Orca worker through the run-role skill, and a bare model must be one the setup skill lists. A value of `inherit-parent` or `auto` runs that role on the parent session's model (the `Agent` call omits `model`); an alias entry in a panel list still counts toward that panel's fan-out. A pool line (`arena cross-judge pool`, `trail reviewer pool`) is a candidate list from which its skill selects one entry; its length sets no count. An entry may carry a reasoning effort after a space, as in `opus@claude @xhigh` (levels: low, medium, high, xhigh, max); the role's subagent then runs at that level, each entry of a panel list on its own. `default effort` sets the level for a value without one; `session` uses the runtime's platform mapping to start from the parent session's effort. On Codex this requires active-turn metadata or an explicit effort choice. `session hook: off` stops the Claude Code or Codex SessionStart hook from injecting the poteto-mode mandate; any other value, or no line, leaves it on.

feature, refactoring: opus@claude
bug-fix: opus@claude
perf-issue: opus@claude
hillclimb: opus@claude
judgment and prose: opus@claude
strongest judgment: fable@claude
arena runners: opus@claude, gpt-6.2-astra@codex
arena cross-judge pool: opus@claude, gpt-6.2-astra@codex
swarm workers: opus@claude
interrogate reviewers: opus@claude, gpt-6.2-astra@codex
thermos reviewers: opus@claude
no-comments reviewer: opus@claude
trail reviewer pool: opus@claude, gpt-6.2-astra@codex

default effort: session
session hook: on
```

### 7. Wire it in

On Claude Code, if `<config>/CLAUDE.md` does not already include `<config>/pstack-models.md`, append an `@` line naming the sheet's resolved path, such as `@~/.claude/pstack-models.md`, so the model rows load on every session. For a project sheet, append `@.claude/pstack-models.md` to the `CLAUDE.md` at the repository root instead, if it is not there, and tell the user to commit both files.

### 8. Confirm

Tell the user where the override was written, how its model rows load, and whether the plugin hook is on. Re-running this skill updates the override sheet.

### 9. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a project `verify` or `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke [`/create-verification-skill`](../create-verification-skill/SKILL.md). On no, move on without pushing.

### 10. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke [`/create-formal-verification-skill`](../create-formal-verification-skill/SKILL.md). On no, move on without pushing.

## Models

Stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`).

- Available Claude models (provider `claude`, native on Claude Code): `opus`, `fable`, `sonnet`, `haiku`
- Available Codex models (provider `codex`, native on Codex): `gpt-6.2-astra`, `gpt-6.2-sol`, `gpt-6.1-terra`, `gpt-6-luna`
- Default panel: `opus@claude`, `gpt-6.2-astra@codex`
- Reasoning effort levels: `low`, `medium`, `high`, `xhigh`, `max`
- Default reasoning effort: `session`
- Single-role default: `opus@claude`
