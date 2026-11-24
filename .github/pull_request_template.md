<!-- Title: Conventional Commit, e.g. "feat(auth): AUTH-01 sign in (plan-01)" -->

**PRD:** <!-- IDs this PR serves, e.g. AUTH-01, NFR-02. Use "PRD: none" only for chore/ci/docs/build. -->
**Ticket:** <!-- docs/plans/plan-NN-name/tickets/NN-slug.md -->
**Evidence:** <!-- link to the row added in the plan's evidence.md -->

## What changed

<!-- One or two lines. -->

## Definition of done: judgment items

CI covers the mechanical rules. The reviewer ticks these, each with a note on how it was checked ([definition of done](../docs/standards/definition-of-done.md)):

- [ ] Every screen that loads data has loading, empty, and error states, and the E2E flow covers them.
- [ ] New query filters and sort columns have indexes (or a written reason why not).
- [ ] No swallowed errors; failures are handled and logged with context.
- [ ] No invented content; missing facts are labeled placeholders.
- [ ] Rate limits, spam protection, and caching applied where the PRD's NFR- IDs ask for them.
- [ ] No new dependency unless the ticket lists it.

**Reviewer sign-off:** <!-- fresh session, date, and number of fixes needed -->
