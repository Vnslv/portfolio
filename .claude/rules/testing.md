---
paths:
  - "src/**/*.{ts,tsx}"
  - "tests/**"
  - "e2e/**"
  - "**/*.{test,spec}.{ts,tsx,js,mjs}"
  - "vitest.config.*"
  - "playwright.config.*"
---

# Testing Rules

How to prove a change works. What it must do comes only from the cited PRD IDs.

| Rule | Enforced by |
| --- | --- |
| Every behavior change starts with a failing test where a seam exists. Watch it fail for the expected reason. | reviewer (evidence row shows red then green) |
| Each test traces to an acceptance criterion of a PRD ID named in the ticket. | reviewer |
| Expected values come from the PRD or the ticket, never from running the code and copying its output. | reviewer |
| No committed `.only` or `.skip`. | lint |
| Never weaken an assertion, delete a test, or lower a threshold to get green. | reviewer |
| Tests use fixtures. Production code has one path and never mocks data. | reviewer |
| Each UI ticket has one E2E flow covering happy, empty, and error states. | E2E step + reviewer |
| A limit from an `NFR-` ID has a test that reaches the limit. | reviewer |
| Evidence states the command run and the result observed. A skipped check says "skipped". | CI + reviewer |

**Mocked data in a production path**
```ts
// Bad
const plans = process.env.NODE_ENV === 'production' ? await db.plans() : FAKE_PLANS;
// Good: tests use fixtures; production code has one path.
const plans = await db.plans();
```

**Stop and ask** when a criterion cannot be tested as written, or no PRD ID says what the right result is.
