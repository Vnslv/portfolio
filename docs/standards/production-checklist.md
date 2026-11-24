# Production Checklist

Each item once, with where its number comes from and what enforces it. `grill-spec` asks every "Asked in grill" item and records the answer as an `NFR-` ID in the PRD.

| Item | Asked in grill | Enforced by |
| --- | --- | --- |
| Spam protection | Which public forms | DoD rule + E2E step on each public form |
| DB indexes | — | DoD rule + reviewer check |
| Cache repeat requests | Which reads, how fresh | DoD rule + reviewer check |
| Error logging | Which service | DoD rule + stack.md setup |
| Concurrent users | Target number (`NFR-`) | Load test (k6) before promotion, result in gate |
| Secrets off the frontend | — | CI `check-client-secrets` + gitleaks |
| Rate limiting | Limits per route (`NFR-`) | DoD rule + test that hits the limit |
| API limits | Per provider (`NFR-`) | Manual gate item: owner confirms in dashboards |
| Spending caps | Per provider (`NFR-`) | Manual gate item: owner confirms in dashboards |
| Error handling | — | DoD rule + E2E error-state step |
| Loading states | — | DoD rule + E2E step |
| Empty states | — | DoD rule + E2E step |
| Page speed | Budget (`NFR-`) | Lighthouse CI |

## Gate Items

These cannot be automated. Each plan's `gate.md` lists them before promotion, with the owner's confirmation and date.

- [ ] **API limits** set at every provider, matching the PRD's `NFR-` IDs.
- [ ] **Spending caps** and billing alerts set at every paid provider (hosting, database, AI, email).
- [ ] **Load test** run against a preview deploy at the PRD's concurrent-user target: `k6 run e2e/load/<flow>.js`. Record p95 latency and error rate in `evidence.md`.
- [ ] **Error logging** receives a test error from the preview deploy.
