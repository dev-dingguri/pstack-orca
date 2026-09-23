# Cross-provider roles run as Orca workers

pstack assigns each role a model, and the original Cursor plugin could hand a role to any vendor because Cursor runs every model in one session. pstack-claude had to drop that: Claude Code's `Agent` tool and Codex's `spawn_agent` only run their own provider's models, so its panels became same-provider panels. This fork keeps the port's skills and adds one dispatch seam, the `run-role` skill: an entry whose provider matches the host stays a native subagent, and any other entry becomes a supervised Orca worker under the bundled `orca-delegate` policy. We put the seam in one skill rather than in each fan-out skill so an upstream merge conflicts on one dispatch sentence per skill, not on its workflow.

## Considered options

- Shell out to the other provider's CLI directly from the skill prose. Rejected: no contract files, no lifecycle, no result verification; every skill would reinvent them, and a hung worker would have no recovery path.
- Keep panels same-provider and vary reasoning effort, as the Codex mapping suggested. Rejected: the adversarial signal pstack wants comes from model diversity, which is the feature the fork exists to restore.
- Fall back to a native model automatically when Orca cannot start. Rejected: a silent substitute hides the fact that the panel lost diversity; the user decides between retry, substitute, and dropout.

## Consequences

Cross-provider entries need Orca installed, and `execute` workers hold the current worktree unless the calling skill assigns one per worker, so single implementation roles stay on the host by default and only the panel roles mix providers.
