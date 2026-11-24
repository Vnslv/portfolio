# Stack

The default stack. Swap it only with an ADR in `docs/adr/` and updates to this file and the package scripts. CI calls package scripts, so workflows rarely change.

## Default

TypeScript, Next.js (App Router), Postgres, Playwright, Vitest, GitHub Actions, pnpm, Node 22 (`.nvmrc`). Error logging: Sentry (swappable). Load tests: k6.

## Scaffold (run once per project)

```bash
pnpm create next-app@latest . --ts --eslint --app --src-dir --use-pnpm
```

```bash
pnpm add -D vitest @vitest/coverage-v8 @playwright/test @axe-core/playwright prettier eslint-plugin-playwright @vitest/eslint-plugin eslint-plugin-import @lhci/cli
```

Then:

1. Set `"packageManager": "pnpm@<version>"` in `package.json` (CI's pnpm setup reads it).
2. Add a database client and migration tool, then a `db:migrate` script.
3. Add Sentry with its wizard, keeping the DSN in `.env` and listing every variable name in `.env.example`.
4. Create `lighthouserc.json` with budgets from the PRD's page-speed `NFR-` IDs.
5. Install `uv` (for the read-only Postgres MCP) and set `DATABASE_URL_READONLY` to a read-only database role in your shell.

## Required Package Scripts

| Script | Runs |
| --- | --- |
| `format:check` | `prettier --check .` |
| `lint` | `eslint .` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run --coverage` with an 80% line threshold in `vitest.config.ts` |
| `build` | `next build` |
| `test:e2e` | `playwright test` |
| `db:migrate` | the migration tool's apply command |
| `check` | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` |

The coverage threshold changes only through the PRD or an ADR, never to make CI pass.

## ESLint Rules That Encode The Definition Of Done

```js
rules: {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  'no-empty': ['error', { allowEmptyCatch: false }],
  'no-console': ['error', { allow: ['warn', 'error'] }],
  'playwright/no-focused-test': 'error',
  'playwright/no-skipped-test': 'error',
  'vitest/no-focused-tests': 'error',
  'vitest/no-disabled-tests': 'error',
  'import/no-restricted-paths': ['error', { zones: [{ target: './src/components', from: './src/server' }] }],
}
```

Add `import 'server-only'` at the top of every module in `src/server/`.

## One-Time GitHub Settings

These cannot be committed. Set them when the repository is created.

1. Settings, Rules, Rulesets, New branch ruleset for `main`:
   - Require a pull request with 1 approval and review from Code Owners.
   - Require status checks: `ci-pass`.
   - Block force pushes. Require linear history. Restrict deletions.
2. Settings, Code security: turn on secret scanning and push protection (free on public repos).

Equivalent command (run by the owner):

```bash
gh api repos/Vnslv/portfolio/rulesets --method POST --input .github/ruleset-main.json
```

Write `.github/ruleset-main.json` from the settings above when you first run it, or set them in the UI.

## Swapping The Stack

1. Write an ADR naming the new stack and why.
2. Update this file and the package scripts so every row in "Required Package Scripts" still exists.
3. Update `check-client-secrets` if the public env prefix changes (for example `VITE_`).
