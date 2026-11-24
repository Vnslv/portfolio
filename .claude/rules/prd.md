---
paths:
  - "docs/PRD.md"
  - "docs/plans/**/plan.md"
  - "docs/plans/**/gate.md"
  - "docs/plans/**/tickets/**"
  - "docs/traceability.md"
  - "docs/standards/production-checklist.md"
---

# PRD Rules

| Rule | Enforced by |
| --- | --- |
| `docs/PRD.md` is the only source of truth for *what*. Only the owner changes it, by any tool. | hook + CODEOWNERS |
| Agents propose a diff in chat through `grill-spec`. The owner applies it. | hook |
| Plan and build only `Approved` IDs. An agent never changes a status. | reviewer |
| Cite IDs; never restate, extend, or reinterpret them. | reviewer |
| Every cited ID exists in the PRD. Never reuse a removed ID. | CI (`check-prd-ids`) + reviewer |
| Limits are numbers the owner chose, never adjectives or agent defaults. | reviewer |
| Never invent facts, names, numbers, or quotes. Missing content is a labeled placeholder. | reviewer |

## Facts And Decisions

- **Facts are yours to find.** Look in the repository or official docs before asking, and cite the source.
- **Decisions are the owner's.** Ask with a recommendation, then wait. Silence, or a recommended answer nobody confirmed, is not approval.
- Say "unknown" when you cannot find it. Never fill the gap.

**Stop and ask** when an ID is missing, `Proposed`, ambiguous, or disagrees with another file. Builders, mechanics, and reviewers report it; the planner runs `grill-spec`.
