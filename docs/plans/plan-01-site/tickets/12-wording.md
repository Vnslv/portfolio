# Ticket 12: Full-stack, Projects and role labels

**PRD IDs:** SITE-01, SITE-02, SITE-03, WORK-01, WORK-02, WORK-05, CONT-01
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/site-shell.spec.ts`, `e2e/flows/work-projects.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `src/content/*.ts`, `src/lib/site.ts`, `src/lib/projects.ts` and their tests
- `src/components/Intro.tsx`, `Work.tsx`, `RoleFilter.tsx`, `ProjectCard.tsx`, `Taskbar.tsx` and the component tests
- `e2e/flows/*.spec.ts`
- `docs/PRD.md`: only the IDs above, and any ID they name

## Files Allowed

- `src/content/profile.ts`, `src/content/projects.ts`, `src/content/types.ts`
- `src/lib/site.ts`, `src/lib/projects.ts`
- `src/components/Intro.tsx`, `src/components/Work.tsx`, `src/components/ProjectCard.tsx`
- Test-only files

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria (owner, 2026-11-25)

- The intro line is "Full-stack developer and project manager" and the strip "Full-stack developer, project manager".
- The section shown as "Work" reads "Projects" in its window title, the bottom bar and the Menu. Its address stays `#work`, and every shared link keeps working. The intro button reads "See my projects".
- Role labels: Idiya "Full-stack development and project management"; UMak Kalinga "Frontend development and project management"; the other three "Project management". The label comes from content, not from a project name in code (CONT-01).
- The filter keeps "Software development", which shows Idiya and UMak Kalinga, and "Project management" (WORK-02 does not change).
- The About text reads "I build full-stack web apps and lead teams from idea to shipped product as project manager." in place of "I build clean, usable frontends and lead teams from idea to shipped product as project manager." Nothing else in it changes.
- Idiya's line "Full-stack developer and project manager" inside its card stays (WORK-05).

## Tests First

1. The exact texts above, in content and on the page at 390 and 1280 px.
2. The labels by project, and both filters' results.
3. `#work`, project links, the current mark and the not-found links still work under the new name.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` and `PORT=3100 pnpm test:e2e` pass; Lighthouse passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
