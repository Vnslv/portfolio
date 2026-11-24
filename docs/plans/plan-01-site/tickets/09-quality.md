# Ticket 09: Accessibility, speed, and parity

**PRD IDs:** NFR-01, NFR-04
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/quality-gate.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/standards/design-brief.md`
- `docs/design/board-b.html`
- `docs/design/first-look.md`
- `lighthouserc.json`
- `playwright.config.ts`
- `docs/PRD.md`: only NFR-01, NFR-04

## Files Allowed

- `e2e/flows/quality-gate.spec.ts`, `e2e/support/parity.ts`
- `src/app/tokens.css` and `.module.css` files under `src/components/` (only for failures these tests show)

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- NFR-01 acceptance, NFR-04 acceptance 1. NFR-04 acceptance 2 is a manual pass by the reviewer.
- Parity with `board-b.html` at 390, 768, and 1280 px in both themes: section and window positions and sizes within 8 px, using the same placeholder content.
- If parity cannot hold because content differs, stop and report. Never loosen the 8 px.

## Tests First

1. Axe reports no violations in both themes at 390 and 1280 px, with a project open and closed.
2. Tab order reaches every control.
3. No sideways scroll at 320, 390, 768, and 1280 px.
4. Structure parity within 8 px.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` and Lighthouse CI pass.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
