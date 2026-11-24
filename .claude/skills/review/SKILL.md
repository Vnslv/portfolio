---
name: review
description: Review a finished ticket or PR in a fresh session against its ticket, the definition of done, and the PRD, then update evidence and gate. Use before merge and at the plan gate.
---

# Review

Runs on the reviewer (opus) in a session that has not seen the build conversation.

## Steps

1. **Read.** The ticket and its handoff, `git diff main...HEAD`, `docs/standards/definition-of-done.md`, `.github/pull_request_template.md`, and every `.claude/rules/` file whose `paths:` match a changed file (check this yourself; do not trust the ticket's list). Read the PRD IDs the ticket cites, nothing else from the PRD.
2. **Rerun.** `pnpm check` and the ticket's E2E flow (`pnpm test:e2e e2e/flows/<file>`). Record the observed result lines.
3. **Check against the ticket.** Every acceptance item met, no file changed outside "Files Allowed", tests written first (the evidence row shows red then green).
4. **Check the definition of done and the rules.** A broken rule, an uncited claim, or an invented fact is a required fix. Tick each PR checklist item with how you checked it. For indexes, run `EXPLAIN` on new queries through the read-only Postgres MCP.
5. **Check the PRD.** Any behavior not traceable to a cited ID, or contradicting one, is a finding. Never resolve it yourself.
6. **Record.** Append one row to the plan's `evidence.md` (date, ticket, commands, observed, PRD IDs). Update `gate.md`: independent review result and blockers.
7. **Report** in this order: blockers, required fixes (file and line), the PR checklist with notes, and the number of fixes needed.

## Rules

- Edit only `evidence.md` and `gate.md`. A trivial fix (typo, import order) may be made if you list it in the report.
- "Should work" is not evidence. Every pass is observed in this session.
- When the plan's last ticket passes, check the whole gate in `gate.md` and tell the owner what remains before promotion.
