# Load Tests

One k6 script per critical flow, run against a preview deploy before promotion (see the gate items in `docs/standards/production-checklist.md`). The virtual-user target comes from the PRD's concurrent-user `NFR-` ID.

```bash
k6 run --vus <target> --duration 2m e2e/load/<flow>.js
```

Record p95 latency and error rate in the plan's `evidence.md`.
