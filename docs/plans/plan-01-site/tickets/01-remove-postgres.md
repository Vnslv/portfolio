# Ticket 01: Remove Postgres from the stack

**PRD IDs:** none (ADR 0001)
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** none (no UI)

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/adr/0001-no-database.md`
- `docs/standards/stack.md`
- `.github/workflows/ci.yml` (e2e job)
- `.mcp.json`
- `scripts/check-workflows.mjs`
- `.claude/rules/system-design.md` (Database section, for reference only)

## Files Allowed

- `.github/workflows/ci.yml`
- `docs/standards/stack.md`
- `.mcp.json`

## Rules

- `.claude/rules/security.md`

## Acceptance Criteria

- ADR 0001 decision 1.
- The e2e job has no Postgres service, `DATABASE_URL`, or `db:migrate` step. No other job changes.
- `stack.md` names no database, client, migration script, `uv`, or `DATABASE_URL_READONLY`; `.mcp.json` keeps only Playwright.

## Tests First

1. No new test: configuration only. `node --test` self-tests, `check-workflows.mjs`, and `check-docs.mjs` pass before and after.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` does not exist yet: record it as skipped. The kit self-tests and check scripts pass.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
