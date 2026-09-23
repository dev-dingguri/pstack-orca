---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". An independent reviewer challenges changes; explicit overrides can request multiple reviewers."
---

# Interrogate

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

By default, use one reviewer from the provider opposite the actual author. Resolve its model and reasoning effort through run-role from the task difficulty. A multi-model review is opt-in through an explicit request or role override; each reviewer then gets the same prompt and rubric.

The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Determine Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset
- If the user's message references recent work, gather the relevant files

Package the diff (or file contents) plus any surrounding context files the reviewers need to understand the code.

## Step 2, State the Intent

Before spawning reviewers, state the intent explicitly. Derive this from:

- The user's message
- Commit messages
- PR description if one exists
- The code itself

Write one clear paragraph. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Identify the actual author's model and provider from the producing dispatch or supplied context. If unknown or mixed, pass the current working provider as the fallback and disclose it. Launch through the **run-role** skill with role `interrogate reviewers`, passing that authorship and the task difficulty. With no override, select exactly one opposite-provider reviewer from the eligible defaults below. With an explicit request or role override for multiple reviewers, dispatch one per selected entry. Label reviewers A, B, and so on. An entry whose provider is the host runs natively; any other entry runs as an Orca worker that writes to the result location run-role names.

| Provider | Eligible default |
|----------|---------------|
| `claude` | `claude-opus-5-5@claude` |
| `codex` | `gpt-6-sol@codex` |

For each reviewer:
- `subagent_type`: `general-purpose`
- `model`: the slug of the entry resolved by run-role, including any difficulty-based promotion
- `readonly`: `true`

If a native or Orca launch rejects the selected model, report the attempted launch and error and ask the user to retry, select a replacement, or drop the dispatch. Do not substitute automatically. Other dispatches may settle, but do not synthesize a verdict dependent on the failed dispatch until the user chooses. If the configured value is `inherit-parent` or `auto`, omit `model` instead; these aliases are not model slugs.

Read `references/reviewer-prompt.md` and fill in the template with:
1. The stated intent
2. The diff or file contents
3. The review rubric from `references/rubric.md`
4. The code-quality lens from `references/code-quality-review.md`

The same filled template goes to all reviewers, so every model applies the code-quality lens.

Do not add a same-model reviewer by default. If a material question remains after checking the first review's evidence, an additional fresh reviewer may examine only that question. Give it the requirements and source evidence before any prior verdict, and disclose why the extra review was needed.

## Step 4, Synthesize

As results come back, build a unified picture:

For one reviewer, the Agreement Map states that independent reviewer consensus was not measured. Compare findings with the source and the lead's verification instead of inventing votes. Reuse a completed review when its scope, source state, constraints, and questions are unchanged.

1. **Parse all findings** from the reviewers
2. **Identify consensus**. Findings raised by 2+ models independently are highest signal.
3. **Identify lone-model findings**. Still worth reading, but weight accordingly.
4. **Deduplicate**. Different models may describe the same issue differently. Merge these and note which models raised it.
5. **Note disagreements**. If one model flags something and another explicitly says the opposite, that's useful context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator.

Read `references/lead-judgment.md` for the full framework.

Categorize every finding using these buckets:

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. These would block a real PR.
- **Consider**. Legitimate points, but you're not sure they outweigh the cost of addressing them right now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact given the current stage.
- **Dismissed**. Wrong, nitpicky, or missing context. Brief explanation why.

For each finding, include:
- Which model(s) raised it
- The category (act on / consider / noted / dismissed)
- A one-line rationale for the categorization

## Output Format

Present the verdict in this structure:

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [model name], [N findings] (one bullet per reviewer)

### Act On
[Findings that should be addressed. For each: description, which models raised it, why it matters.]

### Consider
[Findings worth thinking about. For each: description, which models raised it, tradeoff involved.]

### Noted
[Valid but low-priority. Brief list.]

### Dismissed
[Rejected findings with brief rationale.]

### Agreement Map
[Where did models agree, where did they diverge, and what does the pattern of agreement/disagreement tell us?]
