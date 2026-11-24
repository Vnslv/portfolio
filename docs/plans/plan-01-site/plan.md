# Plan 01: Site

## Scope

**PRD IDs:** SITE-01, SITE-02, SITE-03, THEME-01, WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, AWARD-01, AWARD-02, AWARD-03, LINK-01, LINK-02, CONT-01, NFR-01, NFR-04

**Outcome:** the complete page in the locked design, with labeled placeholders where the owner has not supplied content. Nothing is launched.

## Decisions

### Round 1 (2026-11-24)

- Plan 01 builds the whole page; plan 02 covers privacy note, Sentry, analytics, load test, and launch (owner).
- Remove Postgres (owner, ADR 0001).
- CSS modules (owner, ADR 0001).
- Typed TypeScript content files (owner, ADR 0001).
- Static pages on Next.js as in `docs/standards/stack.md`; state logic lives in pure functions so it can be unit tested (planner).

### Approval (2026-11-24)

- Plan and routes approved (owner).
- T01 built without the builder agent or the project hooks: accepted for T01 only. From T02, the builder agent in a guarded session (owner).

## Design Spec

Locked: [design brief](../../standards/design-brief.md), [board](../../design/board-b.html), [flow, wireframes, states](../../design/first-look.md).

## Tasks

Tickets run in order; several change the same files. One ticket per session and per PR.

- [x] T01 Remove Postgres (ADR 0001) -> tickets/01-remove-postgres.md
- [x] T02 Scaffold the app and checks (NFR-01) -> tickets/02-scaffold.md
- [ ] T03 Typed content and its logic (CONT-01, WORK-01, WORK-02, WORK-04, WORK-05, WORK-06, AWARD-01) -> tickets/03-content.md
- [ ] T04 Page shell, sections, navigation (SITE-01, SITE-02, SITE-03) -> tickets/04-shell.md
- [ ] T05 Light and dark themes with a toggle (THEME-01) -> tickets/05-theme.md
- [ ] T06 Work list, filter, details, links (WORK-01 to WORK-06) -> tickets/06-work.md
- [ ] T07 Awards section and badges (AWARD-01, AWARD-02, AWARD-03) -> tickets/07-awards.md
- [ ] T08 Profile links and CV (LINK-01, LINK-02) -> tickets/08-links.md
- [ ] T09 Accessibility, speed, parity checks (NFR-01, NFR-04) -> tickets/09-quality.md

## Out Of Scope

- PRIV-01, NFR-02, NFR-03, NFR-05, NFR-06, NFR-07, and launch: plan 02.
- Owner content (text, photos, awards, links): added as it arrives.
