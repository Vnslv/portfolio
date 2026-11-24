# Ticket NN: <Title>

**PRD IDs:** <AUTH-01>
**Route:** <builder | mechanic> (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/<area>-<flow>.spec.ts` (UI tickets)

## Read List

- `AGENTS.md`
- <exact files and sections; nothing else>

## Files Allowed

- <exact paths>

## Rules

- <each `.claude/rules/` file whose paths match "Files Allowed"; no others>

## Acceptance Criteria

- <by reference: "AUTH-01 acceptance 1-2", plus any ticket-only details>

## Tests First

1. <test name: what it asserts>

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
