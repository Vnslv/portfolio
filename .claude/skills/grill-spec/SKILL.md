---
name: grill-spec
description: Grill the owner on the full product spec and draft PRD changes for their approval. Use at the start of a new project or feature, whenever a requirement is missing or unclear, and for every change to docs/PRD.md.
---

# Grill Spec

The owner controls the product. This skill turns their answers into PRD requirements; it never decides for them and never edits `docs/PRD.md` directly (a hook blocks that).

## Rules

- **Method.** Load the `grilling` skill and `.claude/rules/prd.md`, and follow both.
- **Look before asking.** Read `docs/PRD.md`, the active plan, and the code first. Never ask what the repo already answers or reopen a recorded decision.
- **No invented facts.** Unknowns become explicit questions or labeled placeholders.
- **Every limit gets a number.** Rate limits, API limits, spending caps, page speed, and concurrent users become `NFR-` IDs with values, not adjectives.

## Coverage

Work through these until each is answered or explicitly out of scope. Question sets: [question-bank.md](question-bank.md) (load the section you need).

1. Users and roles: who, what each may do, what they came to do.
2. Core flows: entry to goal for each primary flow, plus the empty and error cases that matter.
3. Data: what is stored, who owns it, retention and deletion.
4. Auth and permissions.
5. Integrations: outside services, what each costs, what happens when it is down.
6. Money: who pays, pricing model, what costs money to run.
7. Production limits: every "Asked in grill" item in `docs/standards/production-checklist.md`.
8. Failure and edge cases.
9. Out of scope for this version.

## Each Round

1. Ask the frontier round and wait for the answers.
2. Write the resulting requirements as a PRD diff in chat: new or changed `### ID: title` blocks with statement, acceptance criteria, and status `Proposed`, plus a changelog row.
3. Ask the owner to apply it themselves. You never edit the PRD, even when asked; nothing is `Approved` until the owner writes it there.
4. Record the round's decisions in the active plan's "Decisions" section with today's date, if a plan exists.

## IDs

- Area prefix of 2 to 6 capital letters plus a 2 or 3 digit number: `AUTH-01`, `PAY-03`, `NFR-02`.
- Never reuse a removed ID; mark it `Removed`.

## Done

Every coverage area is answered or out of scope, the owner confirmed the shared understanding, and the owner applied the PRD diff. Next: `grill-with-design` for UI work, otherwise the `plan` skill.
