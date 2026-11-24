---
paths:
  - "src/**"
  - "**/migrations/**"
  - "**/*.sql"
  - "docs/adr/**"
  - "docs/plans/**/plan.md"
  - "package.json"
---

# System Design Rules

How the parts fit. Architecture choices belong to the owner and are recorded in `docs/adr/`.

| Rule | Enforced by |
| --- | --- |
| Smallest correct diff; no speculative abstractions; no drive-by rewrites. | reviewer |
| No new dependency unless the ticket lists it. Confirm the package exists before using it. | reviewer |
| Types at every boundary (API input/output, DB rows, props). No `any`. | lint |
| No floating promises; every async call is awaited or handled. | lint |
| No `console.log` in shipped code; use the logger. | lint |
| Handle every failure; never swallow an error. Log it with context (route, user ID, request ID). | lint (empty catch) + reviewer |
| Rate limits, spam protection, and caching follow the PRD's `NFR-` IDs. | E2E/integration test + reviewer |
| Server modules are never imported by client code. | lint |
| Follow `docs/standards/stack.md` and accepted ADRs. A different choice needs a new ADR the owner approved. | reviewer |
| Hard-to-reverse decisions (data model, provider, protocol) are grilled with the owner first, then recorded. | reviewer |
| Content lives in data files or the database, not hard-coded in components. | reviewer |
| Never invent facts, names, numbers, or quotes. Missing content is a labeled placeholder. | reviewer |
| No `TODO` in shipped code. Report the gap so the planner can ticket it, and ship the handled path. | reviewer |

## Database

| Rule | Enforced by |
| --- | --- |
| Every new filter, join, or sort column has an index, or the PR states why not. | reviewer (Postgres MCP `EXPLAIN`) |
| Schema changes are migrations, never manual edits. | reviewer |
| No N+1 queries in list views. | reviewer |

**Unindexed filter**
```sql
-- Bad: WHERE tasks.owner_id = $1 on a large table with no index
-- Good
CREATE INDEX tasks_owner_id_idx ON tasks (owner_id);
```

**Stop and ask** when the change needs an undecided architecture choice, or code and an ADR disagree.
