---
name: architect
description: "Sketch types, signatures, and module structure before code, then stay in the loop while implementation fills in. Use for /architect, 'architect this', 'design this', or non-trivial work where jumping to code would lock in the wrong shape."
---

# Architect

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

Design before implementing. Sketch types, function signatures, class shapes, and module boundaries with `not implemented` bodies and pseudocode. Use one designer and one independent reviewer from the other provider, then fill in code against the reviewed sketch. If implementation proves the sketch wrong, throw it out and redesign.

## Start

Open a todolist with one entry per phase before starting.

1. Ground
2. Sketch
3. Agree
4. Implement
5. Scrap

## Phase A: Ground the problem

Build a real mental model of every system the new code touches. Run the **how** skill over the relevant subsystems.

Naming a file isn't grounding. Produce the traced model `how` prescribes. If the design redefines ownership or layering, also run the **why** skill on the existing shape so the rationale becomes a constraint, not a guess.

Skip Phase A only when the work is genuinely greenfield with no surrounding system to integrate.

## Phase B: Sketch

Run one designer through **run-role** with role `architect runners`, the design-sketch task, Phase A grounding artifacts, and the task difficulty. Pass `references/runner-prompt.md` as its prompt and assign an output location for the design package shaped per `references/rationale-template.md`. Preserve the producing model and provider with the package for reviewer selection.

Use the configured designer (defaults in [Models](#models)). A difficult design uses the provider's strongest-role default and corresponding effort through run-role. The designer writes only the design package. Multiple designers require an explicit request or role override; use **arena** with role `architect runners` only for that requested comparison.

Have the designer consider structurally distinct alternatives and record why it chose its shape; this does not require another candidate worker.

Screen every candidate against [`references/design-red-flags.md`](references/design-red-flags.md) before synthesis. Reject or revise shallow modules, information leakage, temporal decomposition, and pass-through methods.

Compare viable candidates on interface depth. Prefer the design that hides more complexity behind a smaller, simpler public surface. A rich interface can keep call chains short by concentrating capability instead of scattering it across layers.

After the designer settles, run **interrogate** on the package, passing the actual designer's model and provider and the design's difficulty. The default is one opposite-provider reviewer. Apply interrogate's existing lead judgment to the findings, then revise the package as warranted. Record accepted and rejected findings in the rationale's "Synthesis decision" section. Reuse this review for an unchanged design instead of launching another review in Phase C.

## Phase C: Agree (opt-in)

Default: proceed directly to implementation with the synthesized design. No human checkpoint.

Opt in to a checkpoint when the invoker explicitly asks: "/architect with checkpoint," "stop and show me before implementing," or similar. Then surface the synthesized design and pause for sign-off.

The synthesis can ship as its own commit either way, as the "scaffold first" mode of the **foundational-thinking** principle skill. Planned and scoped breakage during fill-in is fine, per the **outcome-oriented-execution** principle skill. Phase B's review supplies adversarial pressure before implementation.

If the human pushes back on the shape (in a checkpoint or after the fact), treat that as Phase A evidence. Re-ground and re-run Phase B before writing more code.

## Phase D: Implement against the sketch

Replace `not implemented` bodies with code, pseudocode with logic. The synthesized sketch is the contract.

Deviations from the sketch are signal worth surfacing, not friction to absorb silently. If a function needs a parameter the sketch didn't anticipate, ask whether the sketch was wrong, the requirement was missed, or the implementation is overreaching.

Before closing each implementation unit or handing its contract to the next worker, compare accepted deviations with the saved behavior contracts, interfaces, and responsibility assignments. Once the appropriate owner or review process accepts a change, update the affected parts of the existing sketch and rationale. Record the acceptance source there. A change from raising an error to returning a refusal must update the outcome contract before the next unit begins.

For a local deviation that leaves the shared contract intact, record the decision and why the design still holds; a local variable rename need not rewrite the architecture. Keep unaccepted changes and unresolved disagreements visible. Do not call the unit reconciled while the next worker would receive contradictory instructions, or edit the specification merely to justify what was implemented. Use the existing design artifact rather than a parallel record per unit. Repeated structural deviations still trigger Phase E.

## Phase E: Scrap when the architecture is wrong

If implementation keeps producing friction the sketch can't absorb, throw the sketch out. Don't bolt fixes onto a wrong design, per the **redesign-from-first-principles** and **fix-root-causes** principle skills.

The signal is a *pattern*, not single instances. Tells:

- The same shape of workaround appearing repeatedly across unrelated code.
- Multiple unrelated edge cases that all need special-case branches.
- Types that need escape hatches (`any`, casts, optional fields always set in practice) to compile.
- The "we need a lock" reflex when the sketch said the state wasn't shared.
- Callers having to know the abstraction's internal rules to use it.
- Two or more independent Phase D deviations of the same shape across the implementation.

Use judgment. A few edge cases don't condemn an architecture. Some problems are legitimately complex; complexity in the data is not complexity in the design.

When you scrap:

1. Re-run the **how** skill over what's been built.
2. Redesign as if the new constraints had been day-one assumptions, per redesign-from-first-principles.
3. Subtract before adding, per the **subtract-before-you-add** principle skill. The new sketch should be smaller than the old one before it grows.
4. Return to Phase B and produce a new design with independent review.

## Outputs

The caller's usage is written first and the type sketch derived from it. One file with new types and signatures for small changes; module map plus type definitions for larger work. The rationale ships alongside, shaped per `references/rationale-template.md`, including the usage sketch and the synthesis decision.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in `~/.claude/pstack-models.md` overrides each at runtime; see `/setup-pstack`. Each entry is `slug@provider`; the **run-role** skill runs an entry natively when its provider is the host and as an Orca worker otherwise, in the mode shown.

- architect runners: `claude-opus-5-5@claude` (consult)
