# Ticket 02: Scaffold the app

**PRD IDs:** NFR-01
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/site-smoke.spec.ts`

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
- `e2e/flows/site-smoke.spec.ts`
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

### Owner answers (2026-11-24)

- Versions: normal ranges; the lockfile fixes exact versions.
- `site-smoke.spec.ts` checks that the home page opens, so `pnpm test:e2e` has a test.
- Coverage: the 80% threshold applies to `src/lib/`; pages are covered by browser tests.
- Lighthouse: `/`, phone preset, 3 runs, performance at least 0.9, LCP at most 2500 ms, served by `pnpm start` on port 3000.
- Prettier and ESLint may skip kit-owned files, including root Markdown, `.mcp.json`, `KIT_VERSION`, the lockfile, and the example spec. Never `src/` or new tests.
- pnpm build scripts: approve only what is needed and report each one.

## Tests First

1. `site.test.ts`: the site title constant is "portfolio" until the owner supplies a name.
2. `site-smoke.spec.ts`: the home page opens and its document title is the site title.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
