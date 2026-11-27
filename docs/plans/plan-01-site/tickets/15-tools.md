# Ticket 15: Tools board

**PRD IDs:** TOOL-01, SITE-01, CONT-01, NFR-01, NFR-04, NFR-08
**Route:** builder (see `docs/model-routing.md`)
**E2E flow:** `e2e/flows/tools-board.spec.ts`

## Read List

- `AGENTS.md`
- `docs/standards/definition-of-done.md`
- `docs/standards/design-brief.md` (Motion section and tokens)
- `docs/design/tools-board.html` (the approved board and its sprites)
- `src/app/page.tsx`, `src/lib/site.ts`, `src/components/Taskbar.tsx`, `src/components/Window.tsx`, `src/content/types.ts`
- `docs/PRD.md`: only the IDs above, and any ID they name

## Files Allowed

- `src/content/tools.ts` (new), `src/content/types.ts`
- `src/components/Tools.tsx`, `src/components/Tools.module.css` (new)
- `src/lib/site.ts`, `src/app/page.tsx`, `src/components/Icon.tsx` (a tools icon only)
- `src/components/Motion.tsx`, `src/app/tokens.css`, `src/app/page.module.css`, `docs/standards/design-brief.md` (only what the board needs)
- `public/images/tools.svg` (supplied by the lead)
- Test-only files

## Rules

- `.claude/rules/testing.md`
- `.claude/rules/system-design.md`
- `.claude/rules/security.md`

## Acceptance Criteria

- TOOL-01 and SITE-01 acceptance: the Tools section sits between Projects and Links, in the page, the bottom bar and the Menu, with the address `#tools`.
- The tools and groups (owner, 2026-11-26), in this order:
  - Languages: JavaScript, TypeScript, Python, HTML, CSS
  - Frontend and mobile: React, Vue.js, Next.js, React Native, Expo, Vite, Tailwind CSS, Bootstrap
  - Backend and data: Node.js, Express.js, MySQL, Postgres, SQLite, Firebase, Supabase, Prisma
  - Project management: Figma, GitHub Projects, Jira, Google Workspace
- Board as in `tools-board.html`: a winding path from Start to Finish, tiles colored by group in both themes, each piece a pixel sprite of the tool's logo with its name as text. The sprites are 20 by 20 bitmaps kept in content; Sprites are decorative (hidden from assistive technology); the name is the accessible name.
- Before using any logo, check that brand's published guidelines; where a brand does not allow a redrawn or simplified mark, use a plain pixel letter tile instead, and list each brand and the outcome in the evidence row.
- Pieces bob, and hop on hover, tap and keyboard focus; a status box names the tool and its group. One tab stop; arrow keys, Home and End move between pieces. With reduced motion set, nothing moves. Without JavaScript, every tool shows with its name and group.
- Owner decision (2026-11-26, option C2, after the lead read each brand's own rules): eight pieces show their real, unaltered logo in black from `public/images/tools.svg` (symbols javascript, html, vue, bootstrap, nextjs, typescript, github, figma; GitHub Projects uses github), referenced with `<use>` so the file loads once and never delays the first paint. The other seventeen are black two-letter tiles in the same style; CSS is a tile because the file's shield mark is not the CSS logo whose license the lead read (lead, 2026-11-27). A credit line under the board reads: "Logos are trademarks of their owners and only name each tool. HTML5 logo by W3C, CC BY 3.0. Vue logo by Evan You, CC BY-NC-SA 4.0. JS logo by Christopher Williams, MIT. Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc. or its affiliates in the US and other countries." Each name stays as text.
- Lead decisions at go (2026-11-26): a brand whose rules forbid a redrawn mark, need permission, or cannot be confirmed from its own published page gets a two-letter pixel tile; the board uses the approved mock's colors and sizes, recorded in the design brief; groups are shown in text as well as color (number ranges in the key, the group in each piece's accessible description, and under each name without JavaScript); the page CSS cap may rise to 7699 bytes gzipped; the empty state is not applicable (static list).
- No image file and no new dependency; report the compressed size the board adds. The bar keeps its room at 640 px with five sections.

## Tests First

1. Content: the exact tools, groups and order.
2. Page: the section's place, name and address in the page, bar and Menu.
3. Each tool's name and group visible; status box; keyboard; reduced motion; no JavaScript.
4. axe in both themes at 390 and 1280 px; no sideways scroll at 320 px.

## Done When

- Tests above red then green, recorded in the evidence row.
- `pnpm check` and `PORT=3100 pnpm test:e2e` pass; Lighthouse passes.
- Evidence row appended.

## Stop Conditions

- Conflict with the PRD, a missing fact, a needed file outside "Files Allowed", or a board that cannot meet NFR-01.
