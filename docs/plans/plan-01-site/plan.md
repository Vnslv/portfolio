# Plan 01: Site

## Scope

**PRD IDs:** SITE-01, SITE-02, SITE-03, THEME-01, WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, AWARD-01, AWARD-02, AWARD-03, LINK-01, LINK-02, CONT-01, MOTION-01, MOTION-02, MOTION-03, TOOL-01, NFR-01, NFR-04, NFR-08

**Outcome:** the complete page in the locked design, with labeled placeholders where the owner has not supplied content. Nothing is launched.

## Decisions

### Round 1 (2026-11-24)

- Plan 01 builds the whole page; plan 02 covers privacy note, Sentry, analytics, load test, and launch (owner).
- Remove Postgres (owner, ADR 0001).
- CSS modules (owner, ADR 0001).
- Typed TypeScript content files (owner, ADR 0001).
- Static pages on Next.js as in `docs/standards/stack.md`; state logic lives in pure functions so it can be unit tested (planner).

### Approval (2026-11-24)

- Plan and routes approved (owner).
- T01 built without the builder agent or the project hooks: accepted for T01 only. From T02, the builder agent in a guarded session (owner).

### T03 review (2026-11-25)

- `docs/issue-log.md` may be changed in T03's PR to log the CRLF problem (owner).
- A `.gitattributes` PR before T04; T04 sets the browser tab title to the owner's name; plan records updated for supplied content (owner).

### T04 review (2026-11-25)

- The not-found page's taskbar marks nothing current, unlike the board's "Welcome": accepted (owner).

### Project content (2026-11-25)

- Follow the owner's project file; no outcome; optional stack; private links left out; the five projects stay; Taskvane is Idiya (owner, PRD 0.5.0).
- T10 added and runs before T05. T08 also shows the owner's photo once supplied (owner).

### Images and links (2026-11-25)

- Five edited images in `public/images/`: the owner approved each, confirmed everyone pictured agreed, and chose copies in the repo over Drive embeds. Badges, an ID card, a phone, papers, bystanders, and a license plate were cropped out or blurred; no camera data.
- CV through the owner's Drive link (LINK-02). Award dates from the owner; the July 2026 eGovPH date is the awarding, not the September prize release.

### T06 and fonts (2026-11-25)

- T06 may add `src/components/Work.test.tsx`; native open and close sections; bold text font for award and project names (owner).
- Motion becomes its own ticket after T08 and before T09, once the owner approves the PRD and design update (owner).

### T06 review (2026-11-25)

- Idiya's closed row shows the WORK-01 role label; the owner role is inside (lead's reading of WORK-01, not an owner answer).
- Choosing a filter closes the open project and drops its link, as the locked board does (lead).
- `site-shell.spec.ts` may select the Menu inside the taskbar only (owner).

### T07 (2026-11-25)

- `Awards.test.tsx` allowed; from here on, test-only files may be added to a ticket without asking (owner).
- Up to three fix and re-review rounds per ticket for small fixes inside it (owner).
- The not-found taskbar keeps the Awards link; it matters only with no awards (lead).

### Phone photos (2026-11-25)

- Small photos on phones and full-size award photos in a new tab, because large ones break NFR-01 (owner).

### Small photo files (2026-11-25)

- Award photos show small WebP copies; the profile photo does too, in T08 (owner, after CI `lighthouse` measurements).

### T08 (2026-11-25)

- `Intro.module.css` and the small profile photo allowed; a failed photo shows its description (owner).
- The LinkedIn address in `profile.ts` is the owner's (grill, 2026-11-24).

### eGovPH (2026-11-25)

- Placement is Top 30, not Top 10; the unedited check photo is shown; everyone pictured agreed; July 2026 stays (owner).
- No sidebar from 900 px: its links are in the bottom bar. The Copy link button is removed and the Idiya logo added. All in T11 (owner).

### T12 (2026-11-25)

- Full-stack intro and About text; Work is shown as Projects (address `#work`); Idiya full-stack, UMak Kalinga frontend; the Software development filter stays (owner, PRD 0.5.1).

### T13 (2026-11-26)

- The About text moves into Welcome; the About section and the intro strip are removed (owner, PRD 0.5.2).
- Sky by day and starry night backgrounds, with blue headers and windows to match (owner, mock A2).
- The tab icon is a dev sprite (owner).
- Fonts are no longer preloaded, after CI `lighthouse` comparisons; a failed `lighthouse` job may be rerun once per commit, recorded (owner).

### PRD 0.6.0 (2026-11-26)

- Motion (MOTION-01 to MOTION-03, NFR-08) and the Tools board (TOOL-01) approved; no pause control, with an NFR-04 exception for background and Tools motion (owner, informed of the WCAG 2.2.2 trade-off). Built in T14.

## Design Spec

Locked: [design brief](../../standards/design-brief.md), [board](../../design/board-b.html), [flow, wireframes, states](../../design/first-look.md).

## Tasks

Tickets run in order; several change the same files. One ticket per session and per PR.

- [x] T01 Remove Postgres (ADR 0001) -> tickets/01-remove-postgres.md
- [x] T02 Scaffold the app and checks (NFR-01) -> tickets/02-scaffold.md
- [x] T03 Typed content and its logic (CONT-01, WORK-01, WORK-02, WORK-04, WORK-05, WORK-06, AWARD-01) -> tickets/03-content.md
- [x] T04 Page shell, sections, navigation (SITE-01, SITE-02, SITE-03) -> tickets/04-shell.md
- [x] T10 Project content and Idiya rename, before T05 (CONT-01, WORK-01, WORK-03, WORK-05) -> tickets/10-project-content.md
- [x] T05 Light and dark themes with a toggle (THEME-01) -> tickets/05-theme.md
- [x] T06 Work list, filter, details, links (WORK-01 to WORK-06) -> tickets/06-work.md
- [x] T07 Awards section and badges (AWARD-01, AWARD-02, AWARD-03) -> tickets/07-awards.md
- [x] T08 Profile links and CV (LINK-01, LINK-02) -> tickets/08-links.md
- [x] T11 Owner changes: eGovPH, taskbar, Idiya logo, Copy link (AWARD-01, AWARD-02, AWARD-03, SITE-01, WORK-03, WORK-04, NFR-01, NFR-04) -> tickets/11-egovph.md
- [x] T12 Full-stack, Projects and role labels (SITE-01, SITE-02, SITE-03, WORK-01, WORK-02, WORK-05, CONT-01) -> tickets/12-wording.md
- [x] T13 About text in the intro, sky theme, tab icon (SITE-01, SITE-02, THEME-01, NFR-01, NFR-04) -> tickets/13-about.md
- [x] T14 Motion (MOTION-01, MOTION-02, MOTION-03, NFR-08, NFR-01, NFR-04) -> tickets/14-motion.md
- [ ] T15 Tools board (TOOL-01, SITE-01, CONT-01, NFR-01, NFR-04, NFR-08) -> tickets/15-tools.md
- [ ] T09 Accessibility, speed, parity checks (NFR-01, NFR-04) -> tickets/09-quality.md

## Out Of Scope

- PRIV-01, NFR-02, NFR-03, NFR-05, NFR-06, NFR-07, and launch: plan 02.
- Owner content (text, photos, awards, links): added as it arrives.
