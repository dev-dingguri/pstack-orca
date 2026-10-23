---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
---

# Reflect

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On GitHub Copilot, read the [platform mapping](../poteto-mode/references/copilot-tools.md), including its per-skill notes, before following this skill.

On Muse, read the [platform mapping](../poteto-mode/references/muse-tools.md), including its per-skill notes, before following this skill.

Mine the current conversation for durable learnings, then route them into skill edits.

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## 1. Locate the active transcript

Before fanning out, find this conversation's transcript in Claude Code's per-project transcripts directory at `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/<encoded-cwd>/`. Do not glob across `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/`. That crosses workspace boundaries and reads private chats from unrelated projects.

Run the finder at `skills/reflect/scripts/find-transcript.mjs` under the installed plugin with the projects directory and a fragment of the conversation's opening user prompt. `claude-project-dir.mjs` beside it prints this session's projects directory, wherever the shell has moved since:

```bash
dir=$(node <plugin>/skills/reflect/scripts/claude-project-dir.mjs) && node <plugin>/skills/reflect/scripts/find-transcript.mjs "$dir" "<opening prompt fragment>"
```

It covers the three layouts (flat `<id>.jsonl`, nested `<id>/<id>.jsonl`, subagent `<parent>/subagents/<child>.jsonl`), newest first, and prints the first path whose opening typed prompt carries the fragment. Do not reimplement the scan by hand: the first line of a transcript is session metadata, not a message, a session that starts with `/clear` or a `!` shell command records that command's wrapper and output as `user` records before the prompt, and files run to several megabytes, so the finder streams each candidate and stops at its first typed `user` record. If the line exits 1, write a tight digest of the session and pass that instead. It lists, one line each in turn order, the user's prompts and corrections, the tool calls and their results, and the files touched. It states no diagnosis, verdict, or cause. The reviewers judge the session, not your conclusions about it.

## 2. Spawn three reviewers in parallel

One message, three dispatches through the **run-role** skill (roles `reflect judgment, divergent, synthesizer` and `reflect tooling`); a native dispatch is an `Agent` call whose `subagent_type` and `model` run-role sets, and a cross-provider dispatch is an Orca worker whose contract permits the result file. Reviewers need MCP access to look up the tickets, chat threads, and observability traces the transcript references, so pick a subagent_type that retains MCP access. The prompt forbids file writes. The parent applies edits.

Each reviewer and the synthesizer name a role line in `pstack-models.md` and a default in [Models](#models). run-role resolves each line to its entries, model, and effort.

| Lens | Role line | Prompt template |
|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where marked. Add nothing beside a transcript path, not even a focus note for a long transcript. Reviewers return findings in the `Agent` response body.

## 3. Synthesize

One dispatch through the **run-role** skill with role `reflect judgment, divergent, synthesizer` (default in [Models](#models)); a native entry is an `Agent` call whose `subagent_type` and `model` run-role sets. It spot-verifies citations through MCP, so pick a subagent_type that retains MCP access. Pass `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. It returns an Accepted / Rejected / Backlog list.

## 4. Structural enforcement check

Move any Accepted item that a lint rule, script, metadata flag, or runtime check would enforce more reliably to Backlog. See the **encode-lessons-in-structure** principle skill.

## 5. Apply

Present the synthesizer's full Accepted / Rejected / Backlog output and wait for explicit approval before applying any Accepted edit. The user picks the subset and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

File each Backlog item to your team's devex or backlog tracker without waiting. Only the Accepted list waits for approval.

Follow each approved row's Routing exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): the parent does it directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to the **plugin-dev:skill-development** skill and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `plugin-dev:skill-development` and run its description-optimization loop.
- `new skill via plugin-dev:skill-development: <kebab-name>`: hand creation to `plugin-dev:skill-development`. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done.

## 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it and lists its path per runtime. Each entry is `model@provider`; the **run-role** skill runs an entry natively when its provider is the host and as an Orca worker otherwise, in the mode shown.

- reflect tooling: `opus@claude` (consult)
- reflect judgment, divergent, synthesizer: `opus@claude` (consult)

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus@claude @xhigh`. Levels on Claude Code: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value with no effort suffix takes the sheet's `default effort` line, a level or `session`; with no such line, it takes the task tier's default effort from the **run-role** skill's Roles section. `session` sets no effort, so the dispatch is the usual one. Strip the effort suffix before reading the model, and leave the provider tag (`@claude`, `@codex`, written without a space) to run-role. `inherit-parent` or `auto` still omits `model` at every level. run-role passes the level as the dispatch's effort field and keeps the `subagent_type` the calling skill prescribes. That is `effort` on the Claude Code `Agent` call, `reasoning_effort` on Codex's `spawn_agent`, and `--effort` on an Orca worker. On Muse it is `effort` on a Workflow child; a `subagent_spawn` dispatch keeps the session's effort.
