# Ticket 02: Scaffold the app

**PRD IDs:** NFR-01
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** none (no screen yet)

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/standards/stack.md`
- `docs/adr/0001-no-database.md`
- `.github/workflows/ci.yml`
- `.github/workflows/compliance.yml` (lighthouse job)
- `e2e/flows/README.md`
- `e2e/flows/_example-flow.spec.ts`
- `docs/PRD.md`: only NFR-01, and any ID they name

## Files Allowed

- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (only if pnpm needs it)
- `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`
- `vitest.config.ts`, `playwright.config.ts`, `lighthouserc.json`
- `src/app/layout.tsx`, `src/app/page.tsx`
- `src/lib/site.ts`, `src/lib/site.test.ts`
- `e2e/flows/_example-flow.spec.ts` (only to exclude it from runs)
- `.gitignore`, `docs/issue-log.md`

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- Every script in `stack.md` "Required Package Scripts" exists and passes.
- Node 22 is pinned for the project (`devEngines` or `engines`), and `packageManager` names pnpm.
- Dependencies are only: next, react, react-dom; dev: typescript, @types/node, @types/react, @types/react-dom, eslint, eslint-config-next, typescript-eslint, prettier, eslint-plugin-playwright, @vitest/eslint-plugin, eslint-plugin-import, vitest, @vitest/coverage-v8, @playwright/test, @axe-core/playwright, @lhci/cli. Confirm each exists before adding it.
- ESLint has the rules in `stack.md`. Prettier ignores kit files (`.claude`, `.github`, `docs`, `scripts`, `templates`).
- `lighthouserc.json` enforces NFR-01 on the phone preset.
- No Sentry or analytics: those are plan 02.
- The scaffolder may refuse a non-empty folder. If so, scaffold in a temporary folder, copy only the files above, and log it in `docs/issue-log.md`.

## Tests First

1. `site.test.ts`: the site title constant is "portfolio" until the owner supplies a name.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
