---
name: orca-delegate
description: "Apply delegation policy and file delivery rules to supervised Orca workers. Use for explicit $orca-delegate calls, requests to use another coding agent as an Orca subagent, the run-role skill's cross-provider entries, or coordinator-managed execution. Not for ordinary native subagents or full ownership handoffs."
---

# Orca Delegate

This skill defines delegation policy and file delivery. Read and follow the installed `orca-cli` skill to select the executable and the installed `orchestration` skill for execution, observation, completion accounting, and recovery. Locate them through the host's skill catalog; do not assume they are bundled with pstack. Follow those skills' guide-loading instructions, including any version-matched guides and conditional references they require. References to the built-in guide below mean the guide loaded through those skills. Do not maintain a separate command reference or lifecycle here. Use `orca-cli` for full ownership handoffs.

A bare request to review, implement, or diagnose does not invoke this skill. A request for an Orca subagent whose result the caller will collect is supervised delegation. The pstack `run-role` skill is such a caller: it supplies the provider, model, mode, and work location for every entry whose provider is not the host. Reading this skill to edit or discuss it does not start a worker.

## Caller and worker

For a standalone delegation, identify the target from the request and available state, use its current HEAD as the fixed point when applicable, and supervise one fresh worker. Honor the requested work location. If no provider is specified, a Claude Code caller uses Codex and a Codex caller uses Claude Code.

For coordinator-managed work, the caller supplies the work location, provider, fixed point, concurrency limit, access restrictions, and retention requirements. The caller owns scheduling, questions, and result acceptance. These choices override standalone defaults. Use user-selected model and reasoning effort first, then explicit calling-contract settings; leave unspecified values unset. Check requested settings against the launch receipt and disclose unsupported settings or provider substitutions under the caller's fallback policy.

When the caller supplies both model and effort, pass them as `--model` and `--effort` using the installed orchestration skill's launch procedure. Keep them in the contract as well; prompt text alone does not configure reasoning effort. If the receipt cannot confirm a setting, report it as unconfirmed rather than applied.

Give the worker the objective, authority boundaries, acceptance evidence, and context it cannot access. Let it choose discovery, implementation, and validation methods within that scope. Do not copy parent execution identifiers or lifecycle commands into the contract; the worker follows Orca's injected preamble. Delegation does not expand authority or concurrency limits. Do not concurrently edit source or mutate shared check resources while another worker or review uses them. This binds the caller too: while a worker runs in a worktree, including a `consult` worker, leave that worktree's source and shared check resources unchanged. Make needed edits after the worker settles or in a separate worktree.

## Communication language

Use English by default for agent-to-agent task specs, contracts, questions, replies, status updates, completion summaries, and internal result files. Include this rule in the worker contract so it applies in both directions. Use another language when explicitly requested or needed for the task, and preserve quoted source text. User-facing deliverables follow the user's requested language; a Korean user conversation alone does not change the language of internal coordination.

## Availability

Only a real worker start attempt decides whether a provider and its Orca launch path are available. Judge from that attempt and its launch receipt, not from indirect signals. `orca account list` reports the accounts registered with `orca account add`; that registration is not required to start a Codex or Claude Code worker, so an empty list is not evidence that the provider is unavailable. A version command, a missing configuration entry, or an absent account likewise establishes nothing.

Do not start a probe worker. Dispatch the real work and treat its start failure as the availability result.

Report the start outcome to the user in one line as soon as it is known, whether it succeeded or failed. On success, name the provider, launch path, and worker or task identifier from the receipt. On failure, give the attempted command and the error, then name the fallback or substitution and the resulting limits. Do not skip the line because the start succeeded, and do not report a provider as unavailable without this evidence.

## Submission check

A launch receipt that stops at `input_accepted` proves input acceptance, not submission. Right after launch, read that exact worker once with `worker-read` and confirm an agent turn started. `unverifiable` liveness looks the same for a slow worker and for one that never started; the read tells them apart.

For a confirmed local terminal worker only, send one bare Enter to that exact terminal using the selected executable's `terminal send --terminal <handle> --text "" --enter` only when both hold: the read positively shows the injected prompt still unsubmitted in the composer, such as a pasted-content placeholder with no agent turn after it, and official state shows the Dispatch still active with its capability not revoked. Confirm the turn started with another read. Never resend the prompt text or send a second Enter on silence. If the Dispatch already failed or was revoked, do not send Enter, because a worker submitted that way cannot deliver lifecycle messages; recover through the built-in guide instead. For remote workers, route inspection and recovery by Dispatch ID through the built-in guide; never substitute a remote terminal handle or local terminal input. Workers without a confirmed local terminal also follow the built-in recovery guide.

## Modes and authority

- `consult`: No source or external-state changes. Allow designated result files, local scratch files, check outputs, caches, and required evidence outside the reviewed change, subject to the contract's access and storage restrictions.
- `execute`: Use when the original request or calling contract authorizes implementation, modification, or execution. Stay within that authorization, including for commits, pushes, PRs, deployment, and external messages. Honor existing approvals without asking again; the skill itself grants no additional authority.

Follow user-specified budgets, deadlines, and stopping conditions. This skill adds no warning interval or supervision time cap. Apart from the submission check above, waiting and recovery follow the current built-in guide; a user limit does not itself authorize stopping or releasing a worker.

## Delivery and results

Read [file-delivery.md](references/file-delivery.md) before preparing a contract. It defines storage, access checks, result transport, retention, and cleanup. For a standalone task, finalize the contract before `worker-start`; use the built-in guide's separate Task creation path only when the work requires it, such as dependency planning. Keep a concise, self-contained Task spec with target, objective, constraints, ownership, acceptance evidence, and the absolute contract path. Put detailed requirements only in the contract file.

Use the built-in guide to match the completion message to the expected Task and Dispatch. Read the complete result and verify it against the original request: compare consultation claims with sources, or inspect execution changes and validation evidence. The caller accepts or rejects the work and handles questions within existing authority. Follow the built-in guide for terminal disposition and message acknowledgment, and the file-delivery reference for file cleanup.

Judge completeness from the matched completion message, required result content, and evidence, without a report terminator. Follow the caller's response format and use the user's requested language for the final user-facing report. Disclose uncertainty, failed validation, or retained resources when they affect the outcome or subsequent work.
