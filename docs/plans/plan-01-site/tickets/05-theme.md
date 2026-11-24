# Ticket 05: Light and dark

**PRD IDs:** THEME-01
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/theme-toggle.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/standards/design-brief.md`
- `docs/design/board-b.html`
- `docs/design/first-look.md`
- `src/app/layout.tsx`
- `src/app/tokens.css`
- `src/components/Taskbar.tsx`
- `docs/PRD.md`: only THEME-01, and any ID they name

## Files Allowed

- `src/app/layout.tsx`, `src/app/tokens.css`
- `src/components/ThemeToggle.tsx`, `src/components/ThemeToggle.module.css`, `src/components/Taskbar.tsx`
- `src/lib/theme.ts`, `src/lib/theme.test.ts`
- `e2e/flows/theme-toggle.spec.ts`

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- THEME-01 acceptance 1-4.
- No flash of the wrong theme on load. If device storage is blocked, the site still follows the device setting.

## Tests First

1. Theme choice logic: stored choice wins, else device setting, else light.
2. First visit matches each device setting.
3. The toggle works by keyboard and names the theme it switches to.
4. The choice survives a reload, and no request carries it.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
