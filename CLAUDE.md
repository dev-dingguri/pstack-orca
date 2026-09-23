# Repository instructions

These rules apply to every coding agent working in this repository. Read `CONTRIBUTING.md` for maintenance and release procedures.

## Fork scope

- Preserve upstream behavior and keep changes focused on Orca integration. Change model policy or workflow structure only when the user explicitly requests it.
- Preserve intentional fork changes during upstream merges. Use `CHANGES.md` to identify their purpose.
- Avoid unrelated refactoring and duplicated instructions. Refer to the owning skill instead of copying its procedures into this file.

## Sources of truth

- Edit model defaults in `plugins/pstack/models.json` and generation rules in `tools/generate.mjs`. Run `bun tools/generate.mjs` to update generated regions; do not edit those regions by hand.
- `plugins/pstack/skills/run-role/SKILL.md` owns role resolution and native versus Orca dispatch.
- `plugins/pstack/skills/orca-delegate/SKILL.md` and its references own Orca delegation policy and file delivery. Follow the installed `orca-cli` and `orchestration` skills for executable selection, guide loading, and worker lifecycle.
- Keep review judgment in the existing review skills. Do not introduce another approval or review process in repository instructions.

## Validation and releases

- Run checks appropriate to the change and the required release checks in `CONTRIBUTING.md`. Inspect failures before attributing them to Windows or another environment constraint. Distinguish confirmed regressions, environment limitations, and unresolved failures.
- Before publishing skill behavior changes, update `VERSION`, add the matching entry to `CHANGES.md`, and regenerate the plugin manifests. A push without a version bump does not update installed copies.
- Report version publication, tag publication, GitHub Release creation, and local plugin installation separately. Claim only the steps verified to have succeeded.
- Target `dev-dingguri/pstack-orca` for pushes, pull requests, and releases. Verify the remote before writing. Use an explicit repository with `gh` because its default may point to upstream. Do not write to upstream unless the user requests it.

## Writing

- Respond to the user in Korean. Write model-facing instructions in English. Follow the language of existing documentation and the repository's English conventional-commit style.
- Use English for agent-to-agent communication unless the task or user requires another language. Preserve quoted source text and use the requested language for user-facing deliverables.
- Do not add em dashes. Keep instructions concise and avoid unrelated wording changes.
