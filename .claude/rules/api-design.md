---
paths:
  - "src/app/api/**"
  - "src/**/route.{ts,js}"
  - "src/server/**"
  - "src/**/actions.{ts,js}"
---

# API Design Rules

How to build an endpoint or server action. Which ones exist, who may call them, and their limits come only from PRD IDs.

| Rule | Enforced by |
| --- | --- |
| Handle every failure. Return a plain message; never leak internals to the caller. | reviewer |
| Reuse the response and error shape existing endpoints use. If there is none, the planner proposes one and the owner approves it. | reviewer |

**Swallowed error**
```ts
// Bad
try { await save(order); } catch {}
// Good
try { await save(order); } catch (error) { logger.error({ error, orderId: order.id }, 'save failed'); throw error; }
```

**`any` at a boundary**
```ts
// Bad
export async function POST(req: Request) { const body: any = await req.json(); }
// Good
const body = OrderInput.parse(await req.json());
```

**Stop and ask** when an endpoint, field, status, permission, or limit is not in a cited PRD ID or the ticket. Never guess an outside API's shape: read its docs or code and cite them.
