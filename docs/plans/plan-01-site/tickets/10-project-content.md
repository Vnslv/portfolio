# Ticket 10: Project content and Idiya rename

**PRD IDs:** CONT-01, WORK-01, WORK-03, WORK-05
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** none of its own; keep `e2e/flows/site-shell.spec.ts` passing

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/adr/0001-no-database.md`
- `src/content/types.ts`, `src/content/projects.ts`, `src/lib/projects.ts`, `src/lib/projects.test.ts`
- `src/lib/site.ts`, `src/lib/site.test.ts`, `e2e/flows/site-shell.spec.ts`
- `docs/PRD.md`: only CONT-01, WORK-01, WORK-03, WORK-05, WORK-06, and any ID they name

## Files Allowed

- `src/content/types.ts`, `src/content/projects.ts`
- `src/lib/projects.test.ts`
- `src/lib/site.ts`, `src/lib/site.test.ts` (intro strip only)
- `e2e/flows/site-shell.spec.ts` (intro strip text only)

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- WORK-01 acceptance 1-2, WORK-03 acceptance 2, WORK-05 acceptance 1-2, CONT-01.
- The type has no outcome. "What I did" is an optional line plus points; stack is optional.
- Taskvane becomes Idiya with id `idiya`. The other ids do not change.
- All five projects are ready, with exactly the text below. No image, and no link other than those below.
- The intro strip is "Frontend developer, project manager" (owner).

### Owner-supplied content (2026-11-25)

From the owner's project file, as written; one word corrected ("Student" to "Students").

**Alunsina** (id `alunsina`, team of 4)
- Problem: Pet owners often can't quickly tell whether a food is toxic, whether symptoms need a vet, or where the nearest clinic is.
- What I did: Lead the capstone team building a smart pet companion mobile app:
  - NLP toxic-food detection and a symptom checker
  - Vet finder using Haversine distance, plus appointment booking
  - An @alunsina assistant that uses tool calling and suggests care schedules the owner approves
  - Manage the thesis chapters, requirements and test cases
- Link: Landing page, https://alunsina-landing.vercel.app/

**HeronPay** (id `heronpay`, team of 3)
- Problem: UMak campus payments are cash-heavy and slow, even though every student already carries an NFC-enabled UMak ID.
- What I did: Led the team building an offline-first NFC campus wallet:
  - Students pay by tapping their UMak ID (Web NFC)
  - Payments settle through a smart contract on BNB Smart Chain, with gasless relayer transactions
  - The wallet uses the tPHP ("Tagak PHP") stablecoin
  - Isolation Forest anomaly detection flags suspicious payments

**eHanda** (id `ehanda`, team of 5)
- Problem: After a fire or other local disaster, barangay officials have no fast way to know which households were affected and what help they need.
- What I did (no line):
  - Wrote the PRD and the formal System Analysis and Design document for HANDA (Household Assessment and Needs Determination Application)
  - Defined the flow: officials launch a check-in campaign, residents report their status and needs
  - After a mentor review, added the fixes (household matching, offline workflow, role-based access, duplicate reports) and kept the scope to the barangay level
- Stack: React, Vite, Supabase
- Link: Live, https://e-handa.vercel.app/

**Idiya** (id `idiya`, solo, full-stack developer and project manager)
- Problem: Students and small teams juggle tasks, deadlines and files across different apps. Free tools rarely combine task dependencies, sprints and SDLC-style planning in one place.
- What I did: Designed and built a free, multi-team task platform on my own:
  - Board and Gantt timeline views, with drag-to-reschedule
  - Enforced task dependencies; dependent tasks reschedule automatically when a blocker slips
  - Sprints, plus templates for Kanban, Scrum, Waterfall, V-Model, Spiral and DevOps
  - Google Drive attachments, and creating Google Docs or Sheets from a task
  - IdiyaBot, an optional AI assistant (Groq/Gemini) that previews every change before applying it
  - Google and GitHub sign-in, team invites, and a platform admin view that never sees team content
- Stack: Next.js 15, TypeScript, Tailwind, Prisma, Neon Postgres, Auth.js
- Link: Live, https://idiya.vercel.app/

**UMak Kalinga** (id `umak-kalinga`, team of 4)
- Problem: UMak's CCED ran in-kind donation drives with no central place to post campaigns, track donations or keep donors informed.
- What I did: Co-led a two-platform system: a web admin module and mobile modules.
  - Built the React frontend: login, sign-up, three-step password reset, campaign feed, posting a campaign, explore, notifications and profile
  - Owned the documentation: requirements, DFDs, test plan, traceability matrix (RTM), project charter and user manual
- Stack: React, Vite, React Router

## Tests First

1. The five projects appear once, with the WORK-01 names and roles, and the ids above.
2. Idiya is solo: full-stack developer and project manager. Team sizes match the list above.
3. Every project is ready with a problem and at least one point, and none has an outcome.
4. Links are exactly the three above; stack appears only where listed.
5. The strip text.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` passes, and `PORT=3100 pnpm test:e2e` passes after a build.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, or a needed file outside "Files Allowed".
