---
name: setup-pstack
description: Configure which models pstack uses per role. Detects available models and writes the current runtime's override sheet. Use for /setup-pstack, "configure pstack models", changing pstack's model choices, or turning the SessionStart hook on or off.
---

# Setup pstack

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On another runtime, read [Other runtimes](#other-runtimes) below for where the sheet lives and how it loads; the steps are the same.

Write the current runtime's per-role model override sheet, using the path in [Other runtimes](#other-runtimes). Each pstack skill names a default model inline; the override sheet adapts those defaults to the models you actually have access to.

Claude Code has no auto-applied "rules" mechanism like Cursor's `.mdc`. Inclusion is explicit: the user adds a line to `~/.claude/CLAUDE.md` (or their project `CLAUDE.md`) such as:

```text
@~/.claude/pstack-models.md
```

so the file is loaded as context for every session.

## Steps

### 1. Detect available models

Enumerate the model slugs you can pass to an `Agent` subagent in this session; that is the dependable source for the host provider. The available models per provider and the default panel are listed in [Models](#models) below; the panel mixes providers for cross-family diversity, and each provider names its own single-role and strongest-role defaults so single-model roles stay on the host and the caller is never blocked on a worker. The sheet block below shows the `claude` host's defaults; on Codex, write the single-model roles with the Codex defaults from the run-role skill's Providers table. Ask the user to confirm or paste any additional slugs they want available, each with its provider. Never write a real slug you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even though they are not detected slugs; both mean the role runs on the parent session's model, which the `Agent` call expresses by omitting `model`.

An entry whose provider is not the host runs as an Orca worker through the `run-role` skill. Ask the user whether Orca is installed and which providers it can launch; record the answer, but do not start a worker to check, because only a real start decides availability.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in the Write the override sheet step below. If the current runtime's sheet already exists, read it and treat its values as the current choices. Otherwise start from those defaults.

### 3. Map and confirm

Show every role with its current entries or dynamic selection rule, marking any real slug not in the detected or confirmed set as needing a choice. Ask whether to accept as-is or change specific roles, offering confirmed models of every provider plus `inherit-parent` and `auto`. Write real entries as `slug@provider`. Prefer `AskUserQuestion` over free text. Architect defaults to one designer; interrogate defaults to one opposite-provider reviewer. Leave `interrogate reviewers` absent to preserve that dynamic selection, rather than writing its eligible model pool as a fixed list. An explicit multi-entry override opts into multiple designers or reviewers. Arena defaults to one candidate per provider; its cross-judge pool supplies one judge. `swarm workers` is the default for each assigned worker. Explain run-role's ordinary and difficult effort defaults; explicit user effort choices take precedence.

### 4. Choose whether the session hook routes tasks

On Claude Code and Codex, the plugin's `SessionStart` hook injects the poteto-mode mandate on startup, resume, clear, and compact. Codex asks the user to trust plugin hooks through `/hooks` before running them. Ask whether to keep the hook. The default is on. The answer is the `session hook` line in the current runtime's sheet: `on` or `off`. With no sheet or no line, the hook injects. The line is inert on other runtimes.

### 5. Validate

Every real slug written must be in the detected or confirmed set and carry its provider; `inherit-parent` and `auto` always pass. If a chosen real slug is not available, stop and ask again.

### 6. Write the override sheet

Write the current runtime's sheet with the shape below. Overwrite the whole file so re-runs stay idempotent.

```markdown
# pstack model configuration

Per-role model overrides for pstack skills. Each pstack SKILL.md names its defaults in a Models section; the values here override those defaults. Delete a line to fall back to the skill default. Write each entry as `slug@provider`; an entry whose provider is not the host runs as an Orca worker through the run-role skill, and a bare slug must be one the setup skill lists. A value of `inherit-parent` or `auto` runs that role on the parent session's model (the `Agent` call omits `model`); an alias entry in a panel list still counts toward that panel's fan-out. `session hook: off` stops the Claude Code or Codex SessionStart hook from injecting the poteto-mode mandate; any other value, or no line, leaves it on.

feature, refactoring: claude-opus-5-5@claude
bug-fix: claude-fable-5-1@claude
perf-issue: claude-fable-5-1@claude
hillclimb: claude-fable-5-1@claude
judgment and prose: claude-opus-5-5@claude
strongest judgment: claude-fable-5-1@claude
how explorer: claude-opus-5-5@claude
how explainer: claude-opus-5-5@claude
why investigators: claude-opus-5-5@claude
why synthesizer: claude-opus-5-5@claude
reflect tooling: claude-opus-5-5@claude
reflect judgment, divergent, synthesizer: claude-opus-5-5@claude
arena runners: claude-opus-5-5@claude, gpt-6-sol@codex
arena cross-judge pool: claude-opus-5-5@claude, gpt-6-sol@codex
swarm workers: claude-opus-5-5@claude
architect runners: claude-opus-5-5@claude
<!-- interrogate reviewers: omit this role to select one provider opposite the author. -->

session hook: on
```

### 7. Wire it in

On Claude Code, if `~/.claude/CLAUDE.md` does not already include `~/.claude/pstack-models.md`, append the `@~/.claude/pstack-models.md` line so the model rows load on every session. If the user prefers project scope, add the include to the project's `CLAUDE.md` instead.

On Codex, paste the model rows into `~/.codex/AGENTS.md`; Codex has no `@` include. Do not paste the `session hook` line there: the plugin hook reads it directly from `~/.codex/pstack-models.md`.

### 8. Confirm

Tell the user where the override was written, how its model rows load, and whether the plugin hook is on. Re-running this skill updates the override sheet.

## Other runtimes

The role lines are the same everywhere. What differs is the sheet path, how the runtime loads it, and how you list models. Detect models with the runtime's own tool and never write a slug you have not seen listed. A runtime whose subagent call has no model parameter still gets the sheet, as the record of the user's choice, and applies it where it can. The `session hook` line applies to the Claude Code and Codex plugins.

| Runtime | Sheet | Load | List models | Status |
| --- | --- | --- | --- | --- |
| Claude Code | `~/.claude/pstack-models.md` | `@~/.claude/pstack-models.md` in `~/.claude/CLAUDE.md` | the `Agent` tool's model parameter | verified live |
| Codex | `~/.codex/pstack-models.md` | model rows: paste into `~/.codex/AGENTS.md`; hook setting: read by the plugin | your configured Codex models, see [codex-tools.md](../poteto-mode/references/codex-tools.md#model-names) | hook contract tested; discovery verified |
| opencode | `~/.config/opencode/pstack-models.md` | add the path to the `instructions` array in `opencode.json` | the `models` slash command in the session | from published docs, no live session |
| Gemini CLI | `~/.gemini/pstack-models.md` | `@~/.gemini/pstack-models.md` in `~/.gemini/GEMINI.md` | the `model` slash command in the session | from published docs, no live session |
| Prime Agent | no documented sheet path; Prime's configuration chooses models | | | no live session |

## Models

Stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`).

- Available Claude models (provider `claude`, native on Claude Code): Opus 5.5 (`claude-opus-5-5`), Opus 5 (`claude-opus-5`), Opus 4.8 (`claude-opus-4-8`), Opus 4.6 (`claude-opus-4-6`), Fable 5.1 (`claude-fable-5-1`), Sonnet 5 (`claude-sonnet-5`), Sonnet 4.6 (`claude-sonnet-4-6`), Haiku 4.5 (`claude-haiku-4-5`)
- Available Codex models (provider `codex`, native on Codex): GPT-6 Astra (`gpt-6-astra`), GPT-6 Sol (`gpt-6-sol`), GPT-5.6 Sol (`gpt-5.6-sol`), GPT-5.6 Terra (`gpt-5.6-terra`), GPT-5.6 Luna (`gpt-5.6-luna`)
- Default panel: `claude-opus-5-5@claude`, `gpt-6-sol@codex`
- Single-role default: `claude-opus-5-5@claude`
