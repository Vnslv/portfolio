# E2E Flows

One user flow per file. Small files keep context cheap and tests from going stale.

- **Name:** `<prd-area>-<flow>.spec.ts`, e.g. `auth-sign-in.spec.ts`.
- **Title:** the `test.describe` title starts with the PRD IDs it proves, e.g. `'AUTH-01 sign in'`.
- **Steps:** each step is a `test.step`, so a failure names the step.
- **States:** each file covers its flow's happy path, empty state, and error state, plus an axe accessibility check on its main page.
- **Size:** under 150 lines. CI warns above that (`scripts/check-e2e-size.mjs`); split the flow.
- **Independence:** flows never import each other. Shared setup lives only in `e2e/support/`.
- **No `.only` or `.skip`** in committed tests (lint blocks them).

Delete `_example-flow.spec.ts` once the first real flow exists.
