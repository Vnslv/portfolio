# Ticket 03: Typed content and its logic

**PRD IDs:** CONT-01, WORK-01, WORK-02, WORK-04, WORK-05, WORK-06, AWARD-01
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** none (logic only)

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/adr/0001-no-database.md`
- `docs/PRD.md`: only CONT-01, WORK-01, WORK-02, WORK-04, WORK-05, WORK-06, AWARD-01, and any ID they name

## Files Allowed

- `src/content/types.ts`, `src/content/profile.ts`, `src/content/projects.ts`, `src/content/awards.ts`
- `src/lib/projects.ts`, `src/lib/projects.test.ts`
- `src/lib/awards.ts`, `src/lib/awards.test.ts`

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- CONT-01, WORK-01 acceptance 1-2, WORK-02 acceptance 1, WORK-05 acceptance 1, WORK-06 acceptance 2, AWARD-01 acceptance 3.
- Facts not supplied by the owner are labeled placeholders. All five projects are marked not ready: the owner has not supplied their problem, work, and outcome. Awards hold the three below.
- Pure functions only: filter projects by role, keep a linked project visible (WORK-04 acceptance 1), read a project id from a hash (unknown gives none), choose awards to show.

### Owner-supplied content (2026-11-24)

From the owner's GitHub profile README and answers. Use it as written; leave out anything not listed. Team sizes below are the awards' only, not the projects'.

- **Name:** Vonn Salve
- **Intro:** Frontend developer and project manager
- **About:** BS Computer Science, University of Makati (UMak), College of Computing and Information Sciences. I build clean, usable frontends and lead teams from idea to shipped product as project manager. Member of the UMak SIC Research and Development Committee.
- **GitHub:** https://github.com/Vnslv
- **LinkedIn:** https://www.linkedin.com/in/vonn-salve-1b05b9403/
- **CV link, photo, award dates, award images:** not supplied.

| Placement | Hackathon | Organizer | Project | My role | Team |
| --- | --- | --- | --- | --- | --- |
| Champion | Blockchain Campus Conference 2026 | Binance Academy | HeronPay | Project manager | 3 |
| Champion | UMak CCIS Infotechnolympics Hackathon | University of Makati | HeronHub (not a project on the site) | Project manager | 3 |
| Top 10 | eGovPH Hackathon 2026 | eGovPH | eHanda | Project manager | 5 |

Project team sizes: Taskvane is solo; the rest are not supplied.

## Tests First

1. Every project appears once with the role labels in WORK-01.
2. Each filter returns the projects WORK-02 requires; Taskvane and UMak Kalinga are in both.
3. A linked project stays visible under a filter that would hide it.
4. An unknown or malformed hash gives no project.
5. An award without hackathon or placement is not shown; an empty list gives none.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
