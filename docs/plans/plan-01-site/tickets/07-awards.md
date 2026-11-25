# Ticket 07: Awards and badges

**PRD IDs:** AWARD-01, AWARD-02, AWARD-03
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/awards-list.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/standards/design-brief.md`
- `docs/design/board-b.html`
- `docs/design/first-look.md`
- `src/content/types.ts`
- `src/content/awards.ts`
- `src/lib/awards.ts`
- `src/components/Window.tsx`
- `src/components/ProjectCard.tsx`
- `src/components/SectionNav.tsx`
- `src/components/Taskbar.tsx`
- `src/app/page.tsx`
- `docs/PRD.md`: only AWARD-01, AWARD-02, AWARD-03, and any ID they name

## Files Allowed

- `src/app/page.tsx`
- `src/components/Awards.tsx`, `src/components/Awards.module.css`, `src/components/AwardBadge.tsx`, `src/components/AwardBadge.module.css`
- `src/components/ProjectCard.tsx`, `src/components/SectionNav.tsx`, `src/components/Taskbar.tsx`
- `src/content/awards.ts` (dates and images only)
- `src/content/types.ts`, `src/lib/awards.ts`, `src/lib/awards.test.ts`
- `e2e/flows/awards-list.spec.ts`, `e2e/support/award-fixtures.ts`
- `public/images/bcc-small.webp`, `public/images/infotech-small.webp` (supplied; owner, 2026-11-25)
- `src/components/Awards.test.tsx` (empty and fixture cases; owner, 2026-11-25)

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- AWARD-01, AWARD-02, AWARD-03 acceptance, except AWARD-03 acceptance 2-3, which the owner confirms per image.
- Dates (owner, 2026-11-25): Blockchain Campus Conference 2026, November 2026; UMak CCIS Infotechnolympics Hackathon, October 2026; eGovPH Hackathon 2026, July 2026.
- Images (owner approved, consent confirmed, private details hidden): Blockchain Campus Conference `/images/bcc.jpg`, "Six people on stage under a screen that reads Your hackathon champion, HeronPay"; Infotechnolympics `/images/infotech.jpg`, "Three teammates wearing champion medals, one holding an Infotechnolympics 2026 envelope". eGovPH has no image.
- Award names use the bold text font, not the pixel font (owner, 2026-11-25; design brief).
- Below 640 px an award photo is 120 px wide beside the text; from 640 px it stays 260 px (owner, 2026-11-25, NFR-01).
- An award shows a small copy of its photo, `/images/bcc-small.webp` or `/images/infotech-small.webp`, resized from the approved photos (owner, 2026-11-25, NFR-01).
- An award photo links to its full image in a new tab, with a name that says so (owner, 2026-11-25).
- Navigation leaves out Awards while the section is hidden.
- Production content is the owner-supplied awards in `src/content/awards.ts`. Fixtures are used only in tests and never reach a production build.

## Tests First

1. Happy: an award shows its facts and image; its badge leads to it.
2. Missing facts are left out; an award without an image still appears.
3. Empty (fixture): no section, no badge, no navigation entry.
4. Error: a failed image shows its description.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
