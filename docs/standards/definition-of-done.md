# Definition Of Done

The builder works to this list; the reviewer checks it. A ticket is done only when every item holds. "Enforced by" says what catches a miss: **hook**, **lint**, **CI**, or **reviewer** (judgment, ticked in the PR template).

## Checklist

- [ ] Every cited PRD ID's acceptance criteria pass, with observed evidence.
- [ ] Every rule matching the changed files holds: [testing](../../.claude/rules/testing.md), [API design](../../.claude/rules/api-design.md), [system design](../../.claude/rules/system-design.md), [security](../../.claude/rules/security.md), [PRD](../../.claude/rules/prd.md). Open only those that match.
- [ ] The state rules below hold for UI work.
- [ ] No invented content and no decision the owner did not make.
- [ ] `pnpm check` passes and the evidence row is appended.

## States (every screen that loads data)

| Rule | Enforced by |
| --- | --- |
| Loading state: visible within 100 ms of the request starting, never a blank screen. | E2E step + reviewer |
| Empty state: says what is missing and offers the next action. | E2E step + reviewer |
| Error state: plain-language message and a retry; the error is logged. | E2E step + reviewer |

**Missing empty state**
```tsx
// Bad
return <ul>{tasks.map(renderTask)}</ul>;
// Good
if (tasks.length === 0) return <EmptyState title="No tasks yet" action={<NewTaskButton />} />;
```
