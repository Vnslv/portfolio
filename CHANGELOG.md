# Changelog

Newest first. Bump `KIT_VERSION` with every entry.

## 2.1.2 (2026-11-24)

From the code review of 2.1.0 and 2.1.1.

- **Shell reader:** `.claude/hooks/lib/shell.mjs` follows quotes, heredocs, comments, and nested commands. Guards refuse what it cannot read, and a guard that crashes blocks.
- **PRD guard:** a shell statement that names `PRD.md` runs only if it is a known read or basic git. Copying the PRD elsewhere is refused too. Mentions in quoted text are allowed.
- **Secrets guard (PowerShell):** closes environment and `.env` bypasses; allows `Copy-Item .env.example .env`.
- **Known guard limits:** guards stop everyday commands, not deliberate evasion (bundled options, variables holding commands, unusual spellings of `.env`, commands that never name the file such as `rm -rf docs`). The Bash secrets patterns are narrower, and the Grep tool is not covered. Code Owner review is the real protection for the PRD.
- **Rules:** `security.md` covers all of `src/`; input validation, failure logging, and limits apply to all product code again. Evidence rows match no rule, so builders do not stop on them.
- **Context check:** no crash on an `@` word that names a folder.

## 2.1.1 (2026-11-24)

- **Grilling:** each option is one single choice, so accepting a recommendation never leaves a decision unclear.

## 2.1.0 (2026-11-24)

- **Path-scoped rules:** `.claude/rules/` holds testing, API design, system design, security, and PRD rules. They moved out of `docs/standards/definition-of-done.md`, so each has one home. Tickets and handoffs list the ones that apply.
- **Context budget:** `scripts/check-context.mjs` fails CI when `CLAUDE.md` plus imports passes 200 lines, or a rule is not path-scoped.
- **Human in the loop:** new `grilling` skill, adapted from Matt Pocock's (MIT), used by `grill-spec`, `grill-with-design`, and `plan`. Claims need a source; unknowns stop work.
- **PRD guard:** only the owner applies PRD changes. The guard now works on Windows paths, where it never blocked, and catches common shell writes.
- **Windows:** the secrets and git guards also cover PowerShell. The lint and done-check hooks run there; they used to start `pnpm` in a way Windows cannot.
- **Evidence check:** skipped until the repository has a `package.json`, so the kit can take PRs.
- **Fix:** the kit workflow test passes on CRLF checkouts.

## 2.0.0 (2026-11-20)

First release of PM2Spicy-kit. Where each design decision lives:

| Decision | Implemented in |
| --- | --- |
| D1 Stronger, industry-standard base | whole kit |
| D2 No Superpowers | `AGENTS.md` (own skills only), `.claude/skills/` |
| D3 Full-spec grill, owner in control | `.claude/skills/grill-spec/` |
| D4 Requirement IDs, evidence and gate per plan | `docs/plans/plan-00-template/`, `docs/traceability.md` |
| D5 PRD is the only source of truth (product requirements only) | `docs/PRD.md`, `.claude/hooks/guard-prd.mjs`, `scripts/check-prd-ids.mjs`, `.github/CODEOWNERS` |
| D6 Plain files | the kit itself, `README.md` |
| D7 Default stack, swappable | `docs/standards/stack.md` |
| D8 Claude-only builders | `.claude/agents/`, `docs/model-routing.md` |
| D9 Model decision tree and handoff | `docs/model-routing.md`, `templates/handoff.md` |
| D10 CI on every PR | `.github/workflows/ci.yml`, `.github/workflows/compliance.yml` |
| D11 Production checklist | `docs/standards/production-checklist.md`, `.claude/skills/grill-spec/question-bank.md` |
| D12 AGENTS.md, skills, hooks, MCP | `AGENTS.md`, `.claude/skills/`, `.claude/settings.json`, `.mcp.json` |
| D13 Standards check | `.claude/hooks/lint-file.mjs`, `.claude/hooks/done-check.mjs`, `docs/standards/definition-of-done.md`, `.github/pull_request_template.md` |
| D14 Context discipline | `AGENTS.md` (Context Discipline), `.claude/hooks/session-brief.mjs`, `docs/model-routing.md` (Checkpoints) |
| D15 Tickets committed in the plan | `docs/plans/plan-00-template/tickets/` |
| D16 No AI review, no-slop CI | `scripts/check-workflows.mjs`, `.github/workflows/` |
