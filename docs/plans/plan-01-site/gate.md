# Plan 01 Gate

**Status:** In progress

## Checklist

- [ ] Every PRD ID in scope has a passing evidence row and an E2E flow (`e2e/flows/`).
- [ ] `ci-pass` is green on the final commit.
- [ ] Lighthouse CI meets NFR-01 in GitHub Actions.
- [ ] NFR-04: automated checks pass, and a manual keyboard pass reaches and operates every control.
- [ ] Parity: build and `docs/design/board-b.html` match within 8 px at 390, 768, and 1280 px, both themes.
- [ ] Production gate items: none apply until launch (plan 02); see the [production checklist](../../standards/production-checklist.md#gate-items).
- [ ] Independent review in a fresh session: T01 reviewed 2026-11-24 at 496b0af, no blockers, 1 required fix (PR #4 body lacked the template's checklist), applied after the review and not re-reviewed. T02 reviewed 2026-11-24 at b60e169, no blockers, 1 required fix (`.prettierignore` patterns also skip folders under `src/`), open. T03 to T09: owed.
- [ ] Verified SHA: <sha>
- [ ] Owner accepts the page: <date>

## Owed

Everything the owner will supply later. Each item names the file or setting that takes it.

- [ ] Name as shown, one-line intro, about text, photo: `src/content/profile.ts`
- [ ] LinkedIn URL and Drive CV link (LINK-02 acceptance 1): `src/content/profile.ts`
- [ ] Each project's team size, problem, what I did, outcome, links, images: `src/content/projects.ts`
- [ ] Each award's facts and image, with consent and hidden details checked (AWARD-03 acceptance 2-3): `src/content/awards.ts`
