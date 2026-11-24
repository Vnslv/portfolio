# portfolio Agent Guide

## Hard Rules (enforced by hooks and CI; never work around them)

1. `docs/PRD.md` is the only source of truth and holds product requirements only. Only the owner changes it.
2. When a plan, ticket, doc, or code disagrees with the PRD, or a fact is missing: **stop and report**. Never pick a side or invent content.
3. One ticket per session. Read only what the ticket's read list names, plus the rules below that match its files.
4. Never push, force, reset, or delete branches. Never read `.env` files.
5. Evidence is what you ran and observed, never what you expect. A skipped check says "skipped".
6. You are not done until `pnpm check` passes and the plan's `evidence.md` has your row.

## Rules (`.claude/rules/`)

Path-scoped: Claude Code loads one when you read a matching file. **Before planning, changing, or reviewing files, read every rule that matches, even for a new file.** Load no others, and follow them as written.

| Rule | When you touch |
| --- | --- |
| `testing.md` | Product code, tests, E2E flows, test config |
| `api-design.md` | API routes, server modules, server actions |
| `system-design.md` | Product code, migrations, dependencies, ADRs, plans |
| `security.md` | Product code, migrations, env config, workflows |
| `prd.md` | The PRD, plans, gates, tickets, traceability |

Each rule's `paths:` list is exact. Rules say *how*; they never add a requirement. Precedence: PRD, ADRs, then rules and standards, then plans and tickets. On a conflict, stop and report.

## Human In The Loop

- Facts are yours to find; decisions are the owner's. Ask with a recommendation, wait, and act only after they confirm (`grilling` skill).
- Back each claim about requirements, code, or results with a PRD ID, `file:line`, a doc link, or command output. Otherwise say "unknown" and ask.
- Builders, mechanics, and reviewers never decide: they stop and report.

## Map

| Need | Where |
| --- | --- |
| What to build | `docs/PRD.md` (IDs like `AUTH-01`, `NFR-02`) |
| What to do now | The session brief at start, then the active plan: `docs/plans/plan-NN-*/plan.md`, `evidence.md`, `gate.md`, `tickets/` |
| Which model does what, and handoffs | `docs/model-routing.md` |
| What "done" means | `docs/standards/definition-of-done.md` |
| Production rules (limits, caps, states, speed) | `docs/standards/production-checklist.md` |
| Stack, commands, setup | `docs/standards/stack.md` |
| Look and tokens | `docs/standards/design-brief.md` |
| Hard-to-reverse decisions | `docs/adr/` |
| The build loop | `docs/playbook.md` |
| Known setup problems | `docs/issue-log.md` |

## Skills

- `grilling`: the shared interview method the next three skills follow; also "grill me".
- `grill-spec`: new project, new feature, or any PRD change. Grills the owner and drafts PRD changes.
- `grill-with-design`: new screens or a redesign, after `grill-spec`.
- `plan`: turns owner-picked PRD IDs into a plan, tickets, and handoffs.
- `review`: fresh-session review of a finished ticket or PR.

## Hooks (`.claude/settings.json`)

Session brief at start. Blocks PRD edits (tools, and shell commands that name it unless they only read), `.env` reads, push and destructive git. Lints each edited file. Runs `pnpm check` and the evidence check before you finish.

## Working Style

- Smallest correct diff. No speculative abstractions. No new dependency unless the ticket lists it.
- Docs change in the same PR as the behavior they describe.
- Conventional Commits naming the PRD ID and plan, e.g. `feat(auth): AUTH-01 sign in (plan-01)`.
- Log every setup surprise once in `docs/issue-log.md`.

## Context Discipline

- Only this file is always loaded (with `CLAUDE.md`, 200 lines at most; CI checks). Put detail in a path-scoped rule. Open other files when the task needs them.
- Search broadly with a subagent and keep only its short answer.
- Prefer small files. Split anything you cannot read in one pass.
- When the session gets long, write progress to `evidence.md` and the ticket's handoff, then start fresh. Never push on in a degraded session.
- Rules that matter most are at the top of each file. Hooks back them up.
