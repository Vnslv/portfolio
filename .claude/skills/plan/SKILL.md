---
name: plan
description: Turn PRD IDs the owner picked into a plan folder with tasks, tickets, and handoffs routed to the right model. Use after grill-spec (and grill-with-design for UI) when work is ready to be planned.
---

# Plan

Runs on the planner (opus). Produces a plan; builds nothing. Load the `grilling` skill for every owner decision, plus `.claude/rules/prd.md` and `.claude/rules/system-design.md`.

## Input

The PRD IDs the owner picked for this plan. If the owner has not picked, ask with one AskUserQuestion round listing the `Approved` IDs not yet in a plan, recommended grouping first.

## Steps

1. **Check the IDs.** Every ID must exist in `docs/PRD.md` with status `Approved`. If one is missing, proposed, or contradictory: stop and send the owner to `grill-spec`.
2. **Create the folder.** Copy `docs/plans/plan-00-template/` to `docs/plans/plan-NN-<name>/` (next number). Set the real `**PRD IDs:**` line outside any code fence and `**Status:** In progress` in `gate.md`. Remove the template's example blocks.
3. **Slice into tickets.** One ticket per independently reviewable change, each small enough for one fresh session. Write each from `tickets/00-example.md` into `tickets/NN-<slug>.md`:
   - a read list naming exact files (no "explore the codebase");
   - files allowed to change;
   - the `.claude/rules/` files whose `paths:` match those files, and no others;
   - acceptance by reference to PRD IDs, never restated;
   - tests first, in order;
   - for UI tickets, one E2E flow file `e2e/flows/<area>-<flow>.spec.ts` covering happy, empty, and error states.
4. **Route.** Pick builder or mechanic for each ticket with `docs/model-routing.md`. Write a handoff next to each ticket from `templates/handoff.md`.
5. **Index.** Add one task line per ticket in `plan.md`: `- [ ] T01 <summary> (AUTH-01) -> tickets/01-<slug>.md`.
6. **Gate items.** Copy the production gate items that apply into `gate.md`.
7. **Verify.** Run `node scripts/check-prd-ids.mjs` and `node scripts/check-docs.mjs .`; both must pass.
8. **Report.** Show the owner the task list, routes, rules, and every open decision. Wait for an explicit "go" before any build starts.

## Rules

- Nothing in the plan may add or change a requirement. If slicing reveals a gap, stop and send it to `grill-spec`.
- Tickets that touch the same files run in sequence, never in parallel.
