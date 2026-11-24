# Playbook

How a project moves from idea to production. The PRD decides *what*; this file decides *how*. Each stage links to the file that owns its detail.

## The Loop

```text
grill-spec -> PRD v1 (owner approves)
  -> grill-with-design (UI) -> design lock -> design brief
  -> plan (opus): plan packet + tickets + handoffs
  -> build (sonnet/haiku), one ticket per session, test first
  -> PR: CI + compliance green
  -> review (opus, fresh session): evidence + gate
  -> owner feedback passes -> promote on owner's word -> Rules Learned
```

## Stages

1. **Grill.** The `grill-spec` skill, using the `grilling` method, grills the owner and drafts the PRD. Nothing proceeds until the owner confirms, and nothing is built from an unapproved requirement.
2. **Design (UI only).** The `grill-with-design` skill: flow, wireframes, a clickable board, then the lock into `docs/standards/design-brief.md`.
3. **Plan.** The `plan` skill turns owner-picked PRD IDs into a plan folder copied from `docs/plans/plan-00-template/`, with tickets and handoffs routed by `docs/model-routing.md`. Each ticket lists the `.claude/rules/` that match its files.
4. **Build.** One ticket per fresh session, test first, to the ticket's rules and `docs/standards/definition-of-done.md`. Hooks lint each edit and run `pnpm check` before "done".
5. **PR.** One PR per ticket on a short-lived branch. CI and compliance must be green.
6. **Review.** The `review` skill in a fresh session ticks the PR checklist and updates `evidence.md` and `gate.md`.
7. **Owner feedback pass.** The owner sends notes on the running build. Restate them as a numbered list, add one task line, build, verify, add one evidence row, and report back in the owner's order. A note that changes the PRD goes back to stage 1; one that changes architecture goes back to stage 3.
8. **Promote.** Only on the owner's explicit word: production gate items done, `ci-pass` green, owner merges to `main`, SHA recorded in `gate.md`.
9. **Retro.** Add 1 to 3 lines to "Improving The Kit": what slowed the build and the rule that would have prevented it. Bring good ones back to the kit repository.

## Rules Learned

- Wireframes before plans, a rendered board before code. Text-only proposals cost rounds.
- Show options rendered, in both themes, with real content.
- Follow the approved board 1:1; deviations are proposals, not defaults.
- Placeholders are explicit and labeled; facts are never invented.
- An unfinished feature ships with a visible "coming soon" state, never a fake answer.
- Log every setup surprise once in `docs/issue-log.md`.

## Improving The Kit

Newest first. What happened, and the rule now in the loop.

- <YYYY-MM-DD>: <what slowed the build> Rule: <the change>.
