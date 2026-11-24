# Ticket 03: Typed content and its logic

**PRD IDs:** CONT-01, WORK-01, WORK-02, WORK-04, WORK-05, WORK-06, AWARD-01
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** none (logic only)

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/adr/0001-no-database.md`
- `docs/PRD.md`: only CONT-01, WORK-01, WORK-02, WORK-04, WORK-05, WORK-06, AWARD-01, and any ID they name

## Files Allowed

- `src/content/types.ts`, `src/content/profile.ts`, `src/content/projects.ts`, `src/content/awards.ts`
- `src/lib/projects.ts`, `src/lib/projects.test.ts`
- `src/lib/awards.ts`, `src/lib/awards.test.ts`

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- CONT-01, WORK-01 acceptance 1-2, WORK-02 acceptance 1, WORK-05 acceptance 1, WORK-06 acceptance 2, AWARD-01 acceptance 3.
- Facts not supplied by the owner are labeled placeholders. Every project except those with owner-checked text is marked not ready. The awards list starts empty.
- Pure functions only: filter projects by role, keep a linked project visible (WORK-04 acceptance 1), read a project id from a hash (unknown gives none), choose awards to show.

## Tests First

1. Every project appears once with the role labels in WORK-01.
2. Each filter returns the projects WORK-02 requires; Taskvane is in both.
3. A linked project stays visible under a filter that would hide it.
4. An unknown or malformed hash gives no project.
5. An award without hackathon or placement is not shown; an empty list gives none.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
