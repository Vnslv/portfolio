# ADR 0001: No database, CSS modules, typed content files

**Date:** 2026-11-24
**Status:** Accepted (owner, plan round 1)
**PRD IDs:** CONT-01

## Context

The kit's default stack includes Postgres, a migration step, and a Postgres service in CI (`docs/standards/stack.md`, `.github/workflows/ci.yml`). The PRD puts a database out of scope and has the owner update content by editing files. The locked board is plain CSS with container queries.

## Decision

1. No database. Remove Postgres, `db:migrate`, and the Postgres MCP from this project.
2. Style with CSS modules and the tokens in `docs/standards/design-brief.md`.
3. Content lives in typed TypeScript files under `src/content/`.

## Alternatives

- Keep Postgres unused: CI runs a database for nothing and needs a fake migration script.
- Tailwind: every board style must be rewritten, and it adds a dependency.
- JSON content: mistakes are caught only with added validation.
- Markdown content: needs a parser and validation.

## Consequences

Less to run, secure, and pay for. Wrong or missing content fields fail the build. Editing content means editing quoted text in code files. A feature that stores data needs a new ADR.
