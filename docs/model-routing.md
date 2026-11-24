# Model Routing

Pick the model for each task with this tree. The first "yes" wins.

```text
Changes the PRD or decides scope/design?      -> owner + planner (opus), grill-spec
Plan, tickets, ADR, architecture, security?   -> planner (opus)
Review, gate, or audit?                        -> reviewer (opus), fresh session
Ready ticket with acceptance criteria?         -> builder (sonnet)
Mechanical edit (rename, copy, config value)?  -> mechanic (haiku)
None of the above / unclear?                   -> planner (opus) asks the owner
```

## Aliases

Agent files in `.claude/agents/` use aliases so they never go stale. This table is the only place model IDs appear.

| Alias | Current model ID | Agent |
| --- | --- | --- |
| `opus` | `claude-opus-5-5` | planner, reviewer |
| `sonnet` | `claude-sonnet-5-5` | builder |
| `haiku` | `claude-haiku-5-5` | mechanic |

When a new model generation ships, update this table only.

## Handoffs

Every task that crosses a session or model boundary gets a handoff written from `templates/handoff.md` and saved next to its ticket. Rules:

- The planner writes handoffs; builders and mechanics never write their own.
- A handoff names files and PRD IDs; it never restates the PRD.
- The builder replies with its file list and test list, then waits for "go".
- The reviewer always starts in a new session that has not seen the build conversation.

## Checkpoints

When a session runs long or starts repeating itself: append progress to the plan's `evidence.md`, update the ticket's handoff with what is done and what is next, and start a fresh session from the handoff.
