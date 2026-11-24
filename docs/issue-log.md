# Issue Log

Log every setup or tooling surprise once, so no session hits it twice. Newest first.

| Date | Problem | Cause | Fix |
| --- | --- | --- | --- |
| 2026-11-25 | `pnpm check` failed: `prettier --check .` warned on 13 files nobody had edited. | Git on this Windows machine has `core.autocrlf=true`, so switching branches wrote them with CRLF; Prettier expects LF. After rewriting the working copies with LF, the check passed with no change in Git. | Until a `.gitattributes` keeps LF: run `pnpm exec prettier --write .`, then confirm `git diff` shows no content change. |
| 2026-11-24 | `pnpm test:e2e` failed: "http://localhost:3000 is already used". With server reuse on, a first run passed through to another app (title "Taskvane"). | The owner's own Taskvane dev server listens on port 3000 on this machine. | Leave it running. `playwright.config.ts` reads `PORT` (default 3000) and sets `reuseExistingServer: false` so another app is never tested. Run `PORT=3100 pnpm test:e2e` and `PORT=3100 pnpm exec lhci collect --url=http://localhost:3100/`. |
| 2026-11-24 | `eslint .` crashed: "typescript-eslint does not support TS 7.0". | `pnpm add -D typescript` resolved 7.0.2; `typescript-eslint` 8.73.0 supports TypeScript 6 only. | Pinned the range `typescript@^6` (6.0.3). Revisit when typescript-eslint supports TS 7. |
| 2026-11-24 | `pnpm create next-app@latest . ...` refused to run in the repo. | The folder is not empty (`.github/`, `e2e/`, `AGENTS.md`, `README.md` and others would conflict). | Scaffolded in a temporary folder outside the repo. Used its `tsconfig.json` as the base. Wrote the other files by hand, because its `next.config.ts` turns on Tailwind and other options outside ADR 0001. |
