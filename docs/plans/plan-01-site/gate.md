# Plan 01 Gate

**Status:** In progress

## Checklist

- [ ] Every PRD ID in scope has a passing evidence row and an E2E flow (`e2e/flows/`).
- [ ] `ci-pass` is green on the final commit.
- [ ] Lighthouse CI meets NFR-01 in GitHub Actions.
- [ ] NFR-04: automated checks pass, and a manual keyboard pass reaches and operates every control.
- [ ] Parity: build and `docs/design/board-b.html` match within 8 px at 390, 768, and 1280 px, both themes.
- [ ] Production gate items: none apply until launch (plan 02); see the [production checklist](../../standards/production-checklist.md#gate-items).
- [ ] Independent review in a fresh session: T01 reviewed 2026-11-24 at 496b0af, no blockers, 1 required fix (PR #4 body lacked the template's checklist), applied after the review and not re-reviewed. T02 reviewed 2026-11-24 at b60e169, no blockers, 1 required fix (`.prettierignore` patterns also skip folders under `src/`), fixed in 51be602; re-reviewed 2026-11-25 at 51be602, no blockers, 0 required fixes. T03 reviewed 2026-11-25 at 6114dda, no blockers, 1 required fix (CRLF formatting failure missing from `docs/issue-log.md`), logged after the review (documentation only, not re-reviewed). T04 reviewed 2026-11-25 at f6d0b53: not passed, 2 blockers (CI `e2e` and `ci-pass` fail; browser flows could not be run in review), 2 required fixes (make CI `e2e` pass; not-found page must match the board, or the owner accepts the difference); re-review owed. T05 to T09: owed.
- [ ] Verified SHA: <sha>
- [ ] Owner accepts the page: <date>

## Owed

Everything the owner will supply later. Each item names the file or setting that takes it.

- [x] Name as shown, one-line intro, about text, LinkedIn URL: supplied, T03
- [ ] Photo: `src/content/profile.ts`
- [ ] Drive CV link (LINK-02 acceptance 1): `src/content/profile.ts`
- [ ] Each project's team size (Taskvane supplied), problem, what I did, outcome, links, images: `src/content/projects.ts`
- [x] Each award's hackathon, organizer, placement, project, role, team size: supplied, T03
- [ ] Each award's date and image, with consent and hidden details checked (AWARD-03 acceptance 2-3): `src/content/awards.ts`
