# Ticket 13: About text in the intro, sky theme, tab icon

**PRD IDs:** SITE-01, SITE-02, THEME-01, NFR-01, NFR-04
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/site-shell.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `src/components/*.tsx`, `src/app/*`, `src/lib/site.ts`, `src/content/profile.ts`, `src/content/types.ts`
- `e2e/flows/*.spec.ts`
- `docs/standards/design-brief.md`, `docs/design/board-b.html`, `docs/design/first-look.md`
- `docs/PRD.md`: only the IDs above and SITE-03 (Removed), and any ID they name

## Files Allowed

- `src/components/Intro.tsx`, `src/components/Intro.module.css`
- `src/components/About.tsx` (delete), `src/components/Icon.tsx` (only an icon nothing uses any more)
- `src/components/Links.tsx`, `src/components/Taskbar.tsx`, `src/components/Taskbar.module.css`
- `src/app/page.tsx`, `src/app/page.module.css`, `src/app/tokens.css`
- `src/app/icon.svg` (supplied)
- Component CSS modules, only where a color no longer reads well
- `src/lib/site.ts`, `src/content/types.ts`
- Test-only files

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria (owner, 2026-11-26)

- SITE-01 and SITE-02 acceptance. The sections are Welcome, Awards, Projects, Links, in the page, the bottom bar and the Menu.
- Welcome shows, in order: the photo, the name, the role line, the whole About text, then the buttons. The text is the content's, unchanged. Missing text is a labeled placeholder.
- The status strip under Welcome is removed, with whatever only served it.
- The About section, its bar and Menu entry and its code are removed. Links takes the full width.
- An old `#about` address shows the page normally at the top. Nothing on the site links to it.
- The design brief's new tokens and background in both themes, exactly. The sky or night covers the whole page at any height and width with no seam or band while scrolling; it is drawn in CSS with no image request and at most 3 KB more compressed CSS. Theme switching, the stored choice and the first visit work as before (THEME-01). Every text and control color meets NFR-04 on its background, focus outlines included.
- The browser tab shows `src/app/icon.svg`, the dev sprite, unedited, on home and not-found, and no favicon request fails (owner, 2026-11-26).
- The bar fits on one row inside the screen at every width from 320 px, with room to spare for wider fallback fonts (CI on Linux put the theme button 9 px outside at 640 px in T12), and will again when a fifth section, Tools, is added. T12 and T13 share one PR (lead).
- The text is readable at 320 px with no sideways scroll, and the photo still is not the largest paint on phones. NFR-01 and NFR-04 hold.

## Tests First

1. The four sections, in order, in the page, bar and Menu; no About window, entry or strip.
2. Welcome's order and exact About text at 390 and 1280 px, and the placeholder (fixture).
3. Links full width at 1280 px; `#about` shows the page at the top; the current mark works for all four; the not-found page matches.

4. Every token in both themes, the background, no image request for it, and axe in both themes on home and not-found at 390 and 1280 px, with a failed photo too.

5. The tab icon is linked and loads on both pages, and no request fails.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` and `PORT=3100 pnpm test:e2e` pass; Lighthouse passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
