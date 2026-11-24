# Ticket 08: Profile links and CV

**PRD IDs:** LINK-01, LINK-02
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/links-cv.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/standards/design-brief.md`
- `docs/design/board-b.html`
- `docs/design/first-look.md`
- `src/content/profile.ts`
- `src/content/types.ts`
- `src/components/Window.tsx`
- `src/components/Intro.tsx`
- `src/app/page.tsx`
- `docs/PRD.md`: only LINK-01, LINK-02, and any ID they name

## Files Allowed

- `src/app/page.tsx`
- `src/components/Links.tsx`, `src/components/Links.module.css`, `src/components/Intro.tsx`
- `src/content/profile.ts`, `src/content/types.ts`
- `e2e/flows/links-cv.spec.ts`

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- LINK-01 acceptance, LINK-02 acceptance 2-3. LINK-02 acceptance 1 is checked when the owner supplies the link.
- A link the owner has not supplied is a labeled placeholder, never a dead or invented address.

## Tests First

1. GitHub opens the owner profile address in content.
2. A supplied CV link appears in the intro and in Links.
3. Empty: a missing LinkedIn or CV link shows a labeled placeholder that is not a link.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
