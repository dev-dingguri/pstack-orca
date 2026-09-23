# Contract and result files

Read this reference for Orca delegation. Native subagents in the same environment exchange complete instructions and results through messages and need no contract directory or report file.

## Prepare the contract

For a Git worktree, store contracts at `<git-common-dir>/task-contracts/<call-id>/contract.md`. Resolve the common directory with `git rev-parse --path-format=absolute --git-common-dir`; a linked worktree's `.git` entry is not the common directory. Include the Run ID in a unique call ID, such as `<run-id>-<work-key>`, because linked worktrees and nested Runs share this namespace.

Use [prepare_contract.py](../scripts/prepare_contract.py):

```text
python -B <skill-directory>/scripts/prepare_contract.py --worktree <absolute-worktree> --call-id <run-id>-<work-key>
```

The helper reserves an empty contract file and rejects existing call directories and redirected contract directories. Its JSON receipt records the contract file, call directory, and Git common directory. If Python 3.10+ is unavailable, use filesystem and Git tools with the same checks without installing a runtime. For a non-Git folder workspace, use a caller-designated accessible temporary or evidence directory with a unique call directory; do not require Git or invoke this Git-specific helper there.

Write the full contract directly with the host's file-editing tool and read it back before launch. Do not embed detailed contract text in a shell argument, here-string, heredoc, inline Python, or generated command. The short Task spec summarizes target, objective, constraints, ownership, and acceptance evidence and tells the worker to read the absolute contract path before work. No Task or Dispatch ID is needed in the contract; the injected preamble supplies lifecycle authority.

Include source paths, inaccessible context, mode and authority, result location or channel, and required retention. Do not transmit secrets or unnecessary conversation history. For `consult`, identify allowed output locations and prohibit source and external-state changes. Do not create a separate evidence archive without a user, caller, or recovery requirement.

## Access and delivery

Check the selected provider's access restrictions for the contract and referenced files. A Git common directory may lie outside the worktree's permitted paths. Arrange authorized access or file transfer; do not silently broaden permissions or relocate Git contracts to `.orca`. If access cannot be established, report the blocker. Confirm the worker read the contract through worker evidence after launch; a local read or launch receipt alone does not prove delivery. Handle access or startup failures through the built-in recovery guide.

For Codex-to-Claude Code and Claude Code-to-Codex calls, deliver the full contract and result through accessible files because long messages can be truncated. Keep launch and completion messages short and point to those files. Read the full report, not just its completion summary. Cross-provider delivery alone needs only a temporary result file, not an evidence archive.

Orca contracts remain file-backed even for same-provider workers so execution can recover them. For same-provider results, use the complete `worker_done` body unless the caller requires a file for retention or the result needs a file to fit the built-in completion-message contract. Native delegation nested inside an Orca worker still uses messages.

## Retention and cleanup

Retain files while recovery is pending or the user or caller requires them. Otherwise they are call-owned temporary files. If preparation is abandoned before any launch or dispatch request was issued for the contract, delete its call directory subject to the path checks below; no terminal release receipt is needed. A failed request or missing receipt does not qualify for this exception.

Once a launch or dispatch request has been issued, apply the built-in guide's settlement and terminal disposition rules before cleanup. Delete the contract directory only after a successful terminal transfer or a release receipt confirming `released` or `already_released`. A zero exit code, a completion message, or a readable archive alone is insufficient. Preserve files for retained terminals and pending or uncertain release, and report the absolute path and retention reason when relevant.

Before deleting, verify the resolved target remains within the recorded contract root and has not been redirected. Delete only this call's recorded directory and disposable outputs. Never delete the common Git directory or the `task-contracts` root. Retained evidence may need to outlive terminal release.

Git metadata needs no ignore rule. Do not change `.gitignore` or `info/exclude` for new contracts. Preserve legacy `.orca/task-contracts` files and ignore entries at their recorded paths without automatic migration. Never delete `.orca/` as a whole, and do not run `git clean -x` while a legacy worktree-local contract is live. Git common-directory contracts survive worktree removal and still need an explicit cleanup decision.
