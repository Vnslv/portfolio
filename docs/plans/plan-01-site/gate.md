# Plan 01 Gate

**Status:** In progress

## Checklist

- [ ] Every PRD ID in scope has a passing evidence row and an E2E flow (`e2e/flows/`).
- [ ] `ci-pass` is green on the final commit.
- [ ] Lighthouse CI meets NFR-01 in GitHub Actions.
- [ ] NFR-04: automated checks pass, and a manual keyboard pass reaches and operates every control.
- [ ] Parity: build and `docs/design/board-b.html` match within 8 px at 390, 768, and 1280 px, both themes.
- [ ] Production gate items: none apply until launch (plan 02); see the [production checklist](../../standards/production-checklist.md#gate-items).
- [ ] Independent review in a fresh session: T01 reviewed 2026-11-24 at 496b0af, no blockers, 1 required fix (PR #4 body lacked the template's checklist), applied after the review and not re-reviewed. T02 reviewed 2026-11-24 at b60e169, no blockers, 1 required fix (`.prettierignore` patterns also skip folders under `src/`), fixed in 51be602; re-reviewed 2026-11-25 at 51be602, no blockers, 0 required fixes. T03 reviewed 2026-11-25 at 6114dda, no blockers, 1 required fix (CRLF formatting failure missing from `docs/issue-log.md`), logged after the review (documentation only, not re-reviewed). T04 reviewed 2026-11-25 at f6d0b53: not passed, 2 blockers (CI `e2e` and `ci-pass` fail; browser flows could not be run in review), 2 required fixes (make CI `e2e` pass; not-found page must match the board, or the owner accepts the difference); re-reviewed 2026-11-25 at f4d16c2: no blockers (CI `e2e` and `ci-pass` pass; browser flows 8 passed, and 40 passed with `--repeat-each=5`), 2 required fixes (PR #9 body out of date: updated after the review; not-found taskbar label: difference accepted by the owner 2026-11-25), no code change, not re-reviewed; no screenshots taken in this review. T10 reviewed 2026-11-25 at 9154329, no blockers, 0 required fixes; project display is T06. T05 reviewed 2026-11-25 at d902363: not passed, 1 blocker (CI `e2e` and `ci-pass` fail, cause not read), 3 required fixes (toggle label and first click wrong after the device setting changes on an open page; empty catch in the head script and unlogged failures, or the owner accepts them; remove unused `readStoredTheme`); re-reviewed 2026-11-25 at 4f01092: no blockers, 0 required fixes; CI `e2e` and `ci-pass` pass on 4f01092, the PR #12 head (first recorded as a blocker because the GitHub command was denied; cleared the same day by running `gh pr view 12` and `gh pr checks 12`); the 3 earlier fixes are confirmed by diff and test (browser flows 17 passed, and 85 passed with `--repeat-each=5`; `pnpm check` passed). PR #12 checklist ticks and sign-off not yet copied into the PR body; no screenshots taken. T06 reviewed 2026-11-25 at e65cb50: no blockers, 4 required fixes (the same project link does not reopen a closed project; a linked project stays listed under later filter choices, unlike the board; a failed image's description is transparent without JavaScript; image failures are not logged), 1 and 2 may instead be accepted by the owner; CI `e2e` and `ci-pass` pass on e65cb50; browser flows 25 passed, and 125 passed with `--repeat-each=5`; browser probes denied, no screenshots taken; re-reviewed 2026-11-25 at 52a2fff: no blockers, the 4 earlier fixes confirmed, 2 required fixes (opening a project or choosing a filter also removes section hashes such as `#work`, or the owner accepts it; two figures in the PR #14 body have no evidence row); CI `e2e` and `ci-pass` pass on 52a2fff, the PR #14 head; browser flows 31 passed, and 155 passed with `--repeat-each=5`; `pnpm check` passed; no screenshots taken; re-reviewed 2026-11-25 at a03926e: no blockers, 0 required fixes; the 2 earlier fixes confirmed by diff, test, and probe; CI `e2e` and `ci-pass` pass on a03926e, the PR #14 head; browser flows 32 passed, and 160 passed with `--repeat-each=5`; `pnpm check` passed; PR #14 checklist ticks and sign-off not yet copied into the PR body; no screenshots taken. T07 reviewed 2026-11-25 at 19f5c1d: no blockers, 2 required fixes (a failed photo's description is clipped on phones without JavaScript; the badge on an open project sits below the panel, unlike the board), either may instead be accepted by the owner; CI `e2e`, `lighthouse` and `ci-pass` pass on 19f5c1d, the PR #15 head; browser flows 47 passed, and 235 passed with `--repeat-each=5`; `pnpm check` passed; NFR-01 passes with a thin CI margin (best of 3 runs; `lighthouse` failed once on the same page code); browser probe denied, no screenshots taken. T08 and T09: owed.
- [ ] Verified SHA: <sha>
- [ ] Owner accepts the page: <date>

## Owed

Everything the owner will supply later. Each item names the file or setting that takes it.

- [x] Name as shown, one-line intro, about text, LinkedIn URL: supplied, T03
- [x] Photo and Drive CV link: supplied, shown in T08
- [x] Each project's team size, problem, what I did, stack, links: supplied, T10
- [x] Project images: two logos supplied, shown in T06
- [x] Each award's hackathon, organizer, placement, project, role, team size: supplied, T03
- [x] Award dates, and images with consent and hidden details checked (AWARD-03 acceptance 2-3): supplied, shown in T07; eGovPH has no image
