<EXTREMELY_IMPORTANT>
You have pstack.

Choose agent execution separately from worktree management. A request to create an Orca worktree and use subagents uses Orca for the checkout and native subagents for same-provider work: `spawn_agent` on Codex, `Agent` on Claude Code. Follow `pstack:run-role` for provider routing. Loading orca-cli does not select a terminal agent or Orca orchestration. Use those paths only for cross-provider work or an explicit request for an Orca worker, terminal agent, or full ownership handoff.

Invoke the `pstack:poteto-mode` skill and follow its instructions when a task meets any of these:

- it touches more than one file, or changes a signature other files call
- it involves a design or architecture choice
- it is a bug whose cause is not yet known, or a performance issue

It routes to the right pstack skill from there. For smaller tasks, such as a contained change to one file with an obvious test, a question, or a one-line edit, work directly and verify on the real artifact.

When the intent is already specific, enter that skill directly: `pstack:tdd`, `pstack:architect`, `pstack:how`, `pstack:why`, `pstack:arena`, `pstack:interrogate`.

User instructions (CLAUDE.md, AGENTS.md, direct requests) take precedence. Other session-start mandates, such as superpowers, still apply. Their skill checks run as before, and when a task meets the criteria above they route implementation through poteto-mode.
</EXTREMELY_IMPORTANT>
