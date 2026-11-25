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
- `src/components/Intro.module.css`, `public/images/profile-small.webp` (supplied; owner, 2026-11-25)
- `src/components/Links.test.tsx` and other test-only files (owner, 2026-11-25)

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- When `profile.photo` is supplied, the intro shows it with its description in the reserved space; until then the labeled placeholder stays (owner, 2026-11-25).
- LINK-01 and LINK-02 acceptance. CV link (owner): https://drive.google.com/uc?export=download&id=1Ocqt2HoIjLeVMKR24qlCmPaDSc8vUUyj. Tests check the address; they do not download the file.
- Below 640 px the photo is 108 by 120 px, so it is not the largest element on phones; from 640 px it keeps the board's space (owner, 2026-11-25, NFR-01).
- Photo (owner): `/images/profile.jpg`, "Vonn Salve wearing glasses and a tan polo shirt, looking down".
- The intro shows the small copy `/images/profile-small.webp`, resized from the approved photo (owner, 2026-11-25, NFR-01).
- A failed photo shows its description in its space, as award photos do, with and without JavaScript (owner, 2026-11-25).
- A link the owner has not supplied is a labeled placeholder, never a dead or invented address.

## Tests First

1. GitHub opens the owner profile address in content.
2. A supplied CV link appears in the intro and in Links.
3. Empty (fixture): a missing LinkedIn or CV link shows a labeled placeholder that is not a link.
4. Photo: its description, its size at 390 and 1280 px, the small file requested, and a failed photo with and without JavaScript.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
