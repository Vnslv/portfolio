# Ticket 04: Page shell and sections

**PRD IDs:** SITE-01, SITE-02, SITE-03
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/site-shell.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/standards/design-brief.md`
- `docs/design/board-b.html`
- `docs/design/first-look.md`
- `src/content/types.ts`
- `src/content/profile.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `docs/PRD.md`: only SITE-01, SITE-02, SITE-03, and any ID they name

## Files Allowed

- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/not-found.tsx`, `src/app/tokens.css`, `src/app/page.module.css`
- `src/components/Window.tsx`, `src/components/Icon.tsx`, `src/components/SectionNav.tsx`, `src/components/Taskbar.tsx`, `src/components/Footer.tsx`, and one `.module.css` for each
- `src/components/Intro.tsx`, `src/components/About.tsx`, and one `.module.css` for each
- `e2e/flows/site-shell.spec.ts`

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- SITE-01, SITE-02, SITE-03 acceptance.
- Matches `board-b.html` at 390, 768, and 1280 px. Awards, Work, and Links are empty windows until their tickets; the awards window is absent until AWARD-01 has content.
- All sections and links work without JavaScript. Fonts are self-hosted through `next/font`.
- The footer has the copyright line. The privacy note is plan 02.
- A wrong address shows the not-found window with a link home.

## Tests First

1. Sections appear in SITE-01 order on phone and desktop.
2. Each section opens from its own link.
3. The intro is the first content.
4. Keyboard: Menu opens, Escape closes it and returns focus.
5. A wrong address shows the not-found window.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
