# Ticket 06: Work list, filter, and details

**PRD IDs:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/work-projects.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/standards/design-brief.md`
- `docs/design/board-b.html`
- `docs/design/first-look.md`
- `src/content/types.ts`
- `src/content/projects.ts`
- `src/lib/projects.ts`
- `src/components/Window.tsx`
- `src/components/Icon.tsx`
- `src/app/page.tsx`
- `docs/PRD.md`: only WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, and any ID they name

## Files Allowed

- `src/app/page.tsx`
- `src/components/Work.tsx`, `src/components/ProjectCard.tsx`, `src/components/RoleFilter.tsx`, and one `.module.css` for each
- `src/lib/projects.ts`, `src/lib/projects.test.ts` (only for gaps the tests show, and the project images)
- `src/content/projects.ts` (project images only)
- `e2e/flows/work-projects.spec.ts`

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- WORK-01 to WORK-06 acceptance.
- An opened project shows Problem, What I did (a line and its points), Stack where supplied, and links. There is no outcome.
- All five projects are now ready. "Coming soon" stays supported; test it with a fixture that never reaches a production build.
- Images (owner, 2026-11-25): HeronPay `/images/heronpay-logo.png`, "HeronPay logo: a heron with signal waves"; Alunsina `/images/alunsina-logo.png`, "Alunsina logo: a cat, a dog and a rabbit around a cross". No other project has an image.
- Matches `board-b.html`: rows from 900 px, cards below; radios from 640 px, a select below.
- Project text is readable without JavaScript. Copy link reports success, and failure with the address shown.

## Tests First

1. Happy: filter, return to all, open, close by keyboard.
2. Shared link opens its project even when a filter hides it.
3. Empty (fixture): a project that is not ready shows "Coming soon" and cannot be opened.
4. Error: an unknown link shows the page normally; a failed image shows its description.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
