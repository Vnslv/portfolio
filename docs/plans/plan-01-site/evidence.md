# Plan 01 Evidence

Observed results only, never expected. A skipped check says "skipped" and why.

| Date | Task | Command | Observed result | PRD IDs |
| --- | --- | --- | --- | --- |
| 2026-11-24 | T01 Remove Postgres (build) | `node --test` kit tests; `check-workflows`; `check-docs`; `check-context`; `check-prd-ids`; database-word search in the three files; job-by-job compare of `ci.yml`; YAML parse of `ci.yml` | Before: 80 passed, 0 failed, `check-workflows` and `check-docs` ok. After: 80 passed, 0 failed, all four checks ok; no database references; only the `e2e` job changed; valid YAML. Red then green: not applicable, configuration only. `pnpm check`: skipped, no app yet. Not built by the builder agent; done in a session without the project hooks. | none (ADR 0001) |
