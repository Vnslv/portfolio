# Ticket 11: Owner changes (eGovPH, taskbar, Idiya logo, Copy link)

**PRD IDs:** AWARD-01, AWARD-02, AWARD-03, SITE-01, WORK-03, WORK-04, NFR-01, NFR-04
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/awards-list.spec.ts`, `e2e/flows/site-shell.spec.ts`, `e2e/flows/work-projects.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `src/content/awards.ts`, `src/content/types.ts`, `src/lib/awards.test.ts`
- `src/components/Awards.tsx`, `src/components/Awards.module.css`, `src/components/Awards.test.tsx`
- `e2e/flows/*.spec.ts`
- `src/components/SectionNav.tsx`, `src/components/Taskbar.tsx`, `src/components/ProjectCard.tsx` and their CSS modules
- `src/app/page.tsx`, `src/app/page.module.css`, `src/app/not-found.tsx`, `src/lib/site.ts`
- `src/content/projects.ts`, `src/lib/projects.test.ts`, `src/components/Work.test.tsx`
- `docs/standards/design-brief.md`, `docs/design/board-b.html`, `docs/design/first-look.md`
- `docs/PRD.md`: only the IDs above, and any ID they name

## Files Allowed

- `src/content/awards.ts`, `src/lib/awards.test.ts`
- `src/components/SectionNav.tsx`, `src/components/SectionNav.module.css`, `src/components/Taskbar.tsx`, `src/components/Taskbar.module.css`
- `src/components/ProjectCard.tsx`, `src/components/ProjectCard.module.css`
- `src/app/page.tsx`, `src/app/page.module.css`, `src/app/not-found.tsx`
- `src/content/projects.ts`
- Test-only files
- `public/images/idiya-logo.png` (supplied)
- `public/images/egovph.jpg`, `public/images/egovph-small.webp` (supplied)

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- AWARD-01 to AWARD-03 acceptance, and NFR-01.
- The eGovPH award reads "Top 30", in the awards section and on eHanda's badge (owner, 2026-11-25; replaces "Top 10"). The date stays July 2026.
- Its photo is `/images/egovph.jpg`, small copy `/images/egovph-small.webp`, described as "Five teammates and three others on stage holding a check for the Top 30 eGovHackathon 2026 finalist teams". The owner supplied it unedited, confirmed everyone pictured agreed, and wants it unedited; its badge shows no readable name or number.
- From 900 px there is no sidebar. The bottom bar shows every section with its icon, the current one in the title colors, then the theme toggle at the right; the windows are one centered column of at most 1040 px. Phone and tablet do not change (owner, 2026-11-25). Every section link works and is keyboard reachable, with and without JavaScript, and the not-found page matches.
- An opened project has no Copy link button and no copy message; nothing that only served it is left. Project links (WORK-04) and Close work as before (owner, 2026-11-25).
- Idiya shows `/images/idiya-logo.png`, "Idiya logo: three lines and an arrow", unedited, as the other project logos are shown (owner supplied the file, 2026-11-25).
- No award is left without an image, so the no-image layout and text tests move to fixtures or to another honest check. Do not drop the behavior.

## Tests First

1. Content: the placement, image, small path and description, exactly.
2. Browser: the award, its badge, and the photo's link and small file.
3. The no-image case stays covered.
4. At 900 and 1280 px: no sidebar; the bottom bar has its links, current mark, order, keyboard reach and axe in both themes. At 390 and 768 px nothing changed.
5. No Copy link on any opened project; the link, Back, Forward and Close tests keep their other steps.
6. Idiya's logo in content and on its card, with the failed-image path.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` and `PORT=3100 pnpm test:e2e` pass; Lighthouse passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
