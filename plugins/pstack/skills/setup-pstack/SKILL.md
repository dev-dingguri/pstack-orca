---
name: setup-pstack
description: Configure which models pstack uses per role. Detects available models and writes the current runtime's override sheet. Use for /setup-pstack, "configure pstack models", changing pstack's model choices, or turning the SessionStart hook on or off.
---

# Setup pstack

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On another runtime, read [Other runtimes](#other-runtimes) below for where the sheet lives and how it loads; the steps are the same.

Write the current runtime's per-role model override sheet, using the path in [Other runtimes](#other-runtimes). Each pstack skill names a default model inline; the override sheet adapts those defaults to the models you actually have access to.

Claude Code has no auto-applied "rules" mechanism like Cursor's `.mdc`. The Claude Code config directory is `$CLAUDE_CONFIG_DIR` when that variable is set and `~/.claude` otherwise. This skill calls it `<config>`. Inclusion is explicit: the user adds a line to `<config>/CLAUDE.md` (or their project `CLAUDE.md`) such as:

```text
@<config>/pstack-models.md
```

with `<config>` written as the resolved path, so the file is loaded as context for every session.

The Codex home directory is `$CODEX_HOME` when that variable is set and `~/.codex` otherwise. This skill calls it `<codex-home>`.

## Steps

### 1. Detect available models

Enumerate the model names the `Agent` tool's `model` parameter accepts in this session. That is the dependable source for the host provider. On Claude Code they are the family names listed in [Models](#models) below, each running that family's current model, and a full model ID is rejected. The available models per provider and the default panel are listed there too. The panel mixes providers for cross-family diversity, and each provider names its own single-role and strongest-role defaults so single-model roles stay on the host and the caller is never blocked on a worker. The sheet block below shows the `claude` host's defaults. On Codex, write the single-model roles with the Codex defaults from the run-role skill's Providers table. Ask the user to confirm or paste any additional slugs they want available, each with its provider. Never write a real slug you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even though they are not detected slugs. Both mean the role runs on the parent session's model, which the `Agent` call expresses by omitting `model`.

An entry whose provider is not the host runs as an Orca worker through the `run-role` skill. Ask the user whether Orca is installed and which providers it can launch. Record the answer, but do not start a worker to check, because only a real start decides availability.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in the Write the override sheet step below. If the current runtime's sheet already exists, read it and treat its values as the current choices. Otherwise start from those defaults. A line whose role is not in that shape, such as `how critics`, is from a retired role. Drop it. An older sheet may name full model IDs that start with `claude-`, which the `Agent` tool rejects. Replace each with its family name, the word after `claude-`, and keep its `@claude` tag.

### 3. Map and confirm

Show every role with its current entries, marking any real slug not in the detected or confirmed set as needing a choice. Also list each line step 2 dropped or rewrote. Ask whether to accept as-is or change specific roles, offering the confirmed models of every provider plus `inherit-parent` and `auto` as the options. Write every real entry as `model@provider`. Prefer `AskUserQuestion` over free text. For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. Keep one entry per provider unless the user wants more. `arena cross-judge pool` and `trail reviewer pool` are also lists, but their skills select one value from each, the one whose provider differs from the model that produced the work (run-role's family rule). The list length does not set a count. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

Then explain the effort defaults listed in [Models](#models): ordinary work runs at the single-tier level and difficult work at the strongest-tier level. Ask whether to replace them with one `default effort` line, which is `session` (keep the parent session's effort) or one of the levels, and whether any role should run at another level. A role entry may carry one after a space, as in `opus@claude @xhigh`; panel entries take their own, as in `opus@claude @xhigh, <codex-model>@codex @high`. Each level is passed as the dispatch's effort, so the choice holds without changing the session. Leave the suffix and the `default effort` line off to keep the defaults.

### 4. Choose whether the session hook routes tasks

On Claude Code and Codex, the plugin's `SessionStart` hook injects the poteto-mode mandate on startup, resume, clear, and compact. Codex asks the user to trust plugin hooks through `/hooks` before running them. Ask whether to keep the hook. The default is on. The answer is the `session hook` line in the current runtime's sheet: `on` or `off`. With no sheet or no line, the hook injects. The line is inert on other runtimes.

### 5. Validate

Every real slug written must be in the detected or confirmed set and carry its provider. `inherit-parent` and `auto` always pass. Validate the slug without its effort suffix (`@<level>` after a space), and the level against the effort levels in [Models](#models). A `default effort` value is one of those levels or `session`. On Codex, the levels are the `reasoning_effort` values your Codex models accept instead. If a chosen real slug or level is not available, stop and ask again.

### 6. Write the override sheet

Write the current runtime's sheet with the shape below. Overwrite the whole file so re-runs stay idempotent.

```markdown
# pstack model configuration

Per-role model overrides for pstack skills. Each pstack SKILL.md names its defaults in a Models section; the values here override those defaults. Delete a line to fall back to the skill default. Write each entry as `model@provider`; an entry whose provider is not the host runs as an Orca worker through the run-role skill, and a bare model must be one the setup skill lists. A value of `inherit-parent` or `auto` runs that role on the parent session's model (the `Agent` call omits `model`); an alias entry in a panel list still counts toward that panel's fan-out. A pool line (`arena cross-judge pool`, `trail reviewer pool`) is a candidate list from which its skill selects one entry; its length sets no count. An entry may carry a reasoning effort after a space, as in `opus@claude @xhigh` (levels: low, medium, high, xhigh, max); the role's subagent then runs at that level, each entry of a panel list on its own. A `default effort` line sets the level for a value without one, and `session` keeps the parent session's effort; without that line, ordinary work runs at `high` and difficult work at `xhigh`. `session hook: off` stops the Claude Code or Codex SessionStart hook from injecting the poteto-mode mandate; any other value, or no line, leaves it on.

feature, refactoring: opus@claude
bug-fix: opus@claude
perf-issue: opus@claude
hillclimb: opus@claude
judgment and prose: opus@claude
strongest judgment: fable@claude
how explorer: opus@claude
how explainer: opus@claude
why investigators: opus@claude
why synthesizer: opus@claude
reflect tooling: opus@claude
reflect judgment, divergent, synthesizer: opus@claude
arena runners: opus@claude, gpt-6.1-sol@codex
arena cross-judge pool: opus@claude, gpt-6.1-sol@codex
swarm workers: opus@claude
architect runners: opus@claude, gpt-6.1-sol@codex
interrogate reviewers: opus@claude, gpt-6.1-sol@codex
trail reviewer pool: opus@claude, gpt-6.1-sol@codex

session hook: on
```

### 7. Wire it in

On Claude Code, if `<config>/CLAUDE.md` does not already include `<config>/pstack-models.md`, append an `@` line naming the sheet's resolved path, such as `@~/.claude/pstack-models.md`, so the model rows load on every session. If the user prefers project scope, add the include to the project's `CLAUDE.md` instead.

On Codex, paste the model rows and any `default effort` line into `<codex-home>/AGENTS.md`; Codex has no `@` include. Do not paste the `session hook` line there: the plugin hook reads it directly from `<codex-home>/pstack-models.md`.

### 8. Confirm

Tell the user where the override was written, how its model rows load, and whether the plugin hook is on. Re-running this skill updates the override sheet.

### 9. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a project `verify` or `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke [`/create-verification-skill`](../create-verification-skill/SKILL.md). On no, move on without pushing.

### 10. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke [`/create-formal-verification-skill`](../create-formal-verification-skill/SKILL.md). On no, move on without pushing.

## Other runtimes

The role lines are the same everywhere. What differs is the sheet path, how the runtime loads it, and how you list models. Detect models with the runtime's own tool and never write a slug you have not seen listed. A runtime whose subagent call has no model parameter still gets the sheet, as the record of the user's choice, and applies it where it can. The `session hook` line applies to the Claude Code and Codex plugins.

| Runtime | Sheet | Load | List models | Status |
| --- | --- | --- | --- | --- |
| Claude Code | `<config>/pstack-models.md` | `@<config>/pstack-models.md` in `<config>/CLAUDE.md` | the `Agent` tool's model parameter | verified live |
| Codex | `<codex-home>/pstack-models.md` | model rows: paste into `<codex-home>/AGENTS.md`; hook setting: read by the plugin | your configured Codex models, see [codex-tools.md](../poteto-mode/references/codex-tools.md#model-names) | hook contract tested; discovery verified |
| opencode | `~/.config/opencode/pstack-models.md` | add the path to the `instructions` array in `opencode.json` | the `models` slash command in the session | from published docs, no live session |
| Gemini CLI | `~/.gemini/pstack-models.md` | `@~/.gemini/pstack-models.md` in `~/.gemini/GEMINI.md` | the `model` slash command in the session | from published docs, no live session |
| Prime Agent | no documented sheet path; Prime's configuration chooses models | | | no live session |

## Models

Stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`).

- Available Claude models (provider `claude`, native on Claude Code): `opus`, `fable`, `sonnet`, `haiku`
- Available Codex models (provider `codex`, native on Codex): `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-sol`, `gpt-6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`
- Default panel: `opus@claude`, `gpt-6.1-sol@codex`
- Reasoning effort levels: `low`, `medium`, `high`, `xhigh`, `max`
- Default reasoning effort: `high` for ordinary work, `xhigh` for difficult work
- Single-role default: `opus@claude`
