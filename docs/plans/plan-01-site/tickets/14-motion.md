# Ticket 14: Motion

**PRD IDs:** MOTION-01, MOTION-02, MOTION-03, NFR-08, NFR-01, NFR-04
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/motion.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/standards/design-brief.md` (Motion section and tokens)
- `docs/design/motion-board.html` (the approved effects; the brief lists what changed since)
- `src/app/*`, `src/components/*`, `e2e/flows/*.spec.ts`, `lighthouserc.json`
- `docs/PRD.md`: only the IDs above, and any ID they name

## Files Allowed

- `src/app/tokens.css`, `src/app/page.module.css`, `src/app/page.tsx`, `src/app/layout.tsx` (no font change)
- `src/components/*.tsx` and `src/components/*.module.css`, and one new client component for motion
- Test-only files

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- MOTION-01 to MOTION-03 and NFR-08 acceptance, as the design brief's Motion section and the motion board show, with the brief's changes: no pause control; the sky drifts (clouds by day, stars by night) and keeps moving; an original retro pixel arrow cursor for fine pointers only, no sparkles.
- The opening: the startup box and the windows' sequence once per visit (session), never covering or delaying the intro's text or controls, finished within 2 seconds.
- Scroll reveals, project and filter movement, hover feedback, award confetti once per visit, and the filter's typed terminal line, each at most 0.5 s except the sky, idle bobbing, typing and the cursor blink.
- With reduced motion set, nothing moves, and nothing is hidden waiting for an animation. Without JavaScript, everything shows and works.
- Motion is mostly CSS. Any script is one small client component, loaded so it never delays the first paint; report its compressed size. Pause sky and loops while the tab is hidden.
- NFR-01 holds in CI (`lighthouse`) and NFR-04 holds (axe, keyboard, contrast, focus), apart from the PRD's 2.2.2 exception for background and Tools motion.

## Tests First

1. Reduced motion: no animation runs and all content is visible at once.
2. Without JavaScript: all content and controls are there and work.
3. The opening runs once per session and never blocks reading or controls; it ends within 2 s.
4. Durations: no movement longer than 0.5 s except the listed ones.
5. Filter: results at once, one plain announcement, the typed line is decorative (hidden from assistive technology).
6. Cursor only for fine pointers; nothing depends on hover.
7. Speed and accessibility checks pass with motion on.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` and `PORT=3100 pnpm test:e2e` pass; Lighthouse passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, a needed file outside "Files Allowed", or an effect that cannot meet NFR-01.
