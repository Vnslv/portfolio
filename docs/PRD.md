# portfolio Product Requirements (PRD)

**Version:** 0.6.0
**Owner:** @Vnslv

## Rules (read first)

1. This file is the **only source of truth** and holds **product requirements only**. Stack, design tokens, and how-to rules live in supporting docs that may only explain how to meet an ID here.
2. **Only the owner changes this file.** Agents propose changes through the `grill-spec` skill; a hook blocks agent edits.
3. **Conflicts stop work.** If a plan, ticket, doc, or code disagrees with this file, the agent stops and reports. It never picks a side.
4. **Precedence:** this PRD, then ADRs and standards (for *how* only), then plans and tickets.
5. Every requirement has a stable ID. IDs are never reused after removal.

## Requirement Format

Each requirement is a level-3 heading `ID: title`, followed by a statement, acceptance criteria, and a status (`Proposed`, `Approved`, `Built`, `Removed`).

`NFR-` IDs hold limits the owner decides: rate limits, API limits, spending caps, page-speed budget, concurrent-user target.

## Users And Roles

- **Visitor** (recruiter, hiring manager, teacher, peer): reads the public site. There are no accounts.
- **Owner:** updates content by editing files in the repository.

## Core Flows

1. A visitor lands on the intro, learns who the owner is, sees the awards, and scrolls to the work.
2. A visitor filters projects by role, opens one, and reads its details.
3. A visitor opens a shared project link and sees that project open.
4. A visitor opens the owner's GitHub or LinkedIn profile, or downloads the CV.

## Functional Requirements

### SITE-01: Single page

**Statement:** The site is one English page, with these sections in order: intro, awards, work, tools, links.
**Acceptance:**
- The five sections appear in that order on phone and desktop.
- Every section can be reached by its own link.
**Status:** Approved

### SITE-02: Intro

**Statement:** The intro leads with who the owner is, combining software development and project management.
**Acceptance:**
- It is the first content a visitor sees.
- It shows the owner's name and a one-line intro supplied by the owner.
- It shows the about text supplied by the owner; missing text is a labeled placeholder until launch.
**Status:** Approved

### SITE-03: About

**Statement:** The about section shows text supplied by the owner.
**Acceptance:**
- Only owner-supplied text is shown; missing text is a labeled placeholder until launch.
**Status:** Removed

### THEME-01: Light and dark

**Statement:** The site follows the visitor's light or dark setting, and a toggle lets the visitor switch.
**Acceptance:**
- The first visit matches the visitor's device setting.
- The toggle works with a keyboard and says which theme it switches to.
- The choice is remembered on the visitor's device and sent nowhere.
- Both themes meet NFR-04.
**Status:** Approved

### WORK-01: Project list

**Statement:** The work section lists Alunsina, HeronPay, eHanda, Idiya, and UMak Kalinga in one list.
**Acceptance:**
- Each project appears once.
- Each shows its role label: project management for Alunsina, HeronPay, and eHanda; full-stack development and project management for Idiya; frontend development and project management for UMak Kalinga.
**Status:** Approved

### WORK-02: Role filter

**Statement:** A visitor can filter the list by software development or project management.
**Acceptance:**
- A project with both roles appears under both filters.
- The visitor can return to the full list.
**Status:** Approved

### WORK-03: Project details

**Statement:** Each project card expands in place to show the problem, what the owner did, the stack where supplied, and any links or images.
**Acceptance:**
- It can be opened and closed with a keyboard.
- Only owner-supplied or owner-checked facts are shown.
**Status:** Approved

### WORK-04: Project links

**Statement:** Each project has its own `#link` on the page.
**Acceptance:**
- Opening the link shows that project expanded, even when a filter would hide it.
- An unknown project link shows the page normally.
**Status:** Approved

### WORK-05: Credit

**Statement:** Each project shows the owner's role and the team size, and names no teammates.
**Acceptance:**
- Idiya is shown as a solo project: full-stack developer and project manager.
- No teammate's name appears in text or in images, except award images (AWARD-03).
**Status:** Approved

### WORK-06: Coming soon

**Statement:** A project whose content is not ready shows a visible "Coming soon" label.
**Acceptance:**
- Its name and role label are shown.
- It shows no invented content.
**Status:** Approved

### AWARD-01: Hackathon awards

**Statement:** An awards section before the work section lists the hackathon awards the owner's teams won or placed in.
**Acceptance:**
- Each award shows the hackathon, organizer, placement, date, project, the owner's role, and team size.
- Only owner-supplied facts are shown. Missing facts are left out, never invented.
- An award needs at least its hackathon name and placement to appear.
- With no award to show, the section is hidden.
**Status:** Approved

### AWARD-02: Award badge

**Statement:** A project on the site that won an award shows a short badge on its card, linking to that award.
**Acceptance:**
- The badge shows the hackathon and placement.
- The award's details are listed once, in the awards section.
**Status:** Approved

### AWARD-03: Award images

**Statement:** Awards are shown with images the owner supplies as proof. There are no outside proof links.
**Acceptance:**
- Every image has a text description.
- Names and people in an award image appear only where the owner confirms they agreed to be in the portfolio.
- Contact details or ID numbers in an image are hidden before publishing.
- An award without an image still appears.
**Status:** Approved

### LINK-01: Profiles

**Statement:** The links section links to the owner's GitHub and LinkedIn profiles.
**Acceptance:**
- Both links open the owner's profiles.
**Status:** Approved

### LINK-02: CV download

**Statement:** A visitor can download the owner's CV through a Google Drive link. The CV contains full contact details.
**Acceptance:**
- It can be downloaded without signing in.
- The CV file is never committed to the repository.
- The link can be changed by editing one content file.
**Status:** Approved

### MOTION-01: Opening

**Statement:** Once per visit, windows open in sequence and a small startup box appears while the site stays visible.
**Acceptance:**
- The intro can be read and used from the start (SITE-02), and nothing has to be skipped.
- The opening finishes within 2 seconds.
**Status:** Approved

### MOTION-02: Background and awards

**Statement:** A pixel sky drifts behind the windows, and pixel confetti appears once per visit when the awards are first seen.
**Acceptance:**
- The sky keeps moving; with reduced motion set, it is still.
**Status:** Approved

### MOTION-03: Interaction

**Statement:** Windows and rows slide in on scroll, projects and filters move, hovering gives feedback, mouse users see a retro cursor, and choosing a filter types a terminal line.
**Acceptance:**
- Each movement lasts at most half a second, except the sky, idle bobbing, typing and the cursor blink.
- Filter results appear at once; assistive technology gets one plain announcement.
- Nothing depends on hover or the cursor.
**Status:** Approved

### TOOL-01: Tools board

**Statement:** A tools section shows the owner's languages and tools as pieces on a playful pixel board.
**Acceptance:**
- Each tool shows its name as text and its group.
- A piece reacts to hover, tap and keyboard focus; nothing depends on hover.
- Only tools the owner supplied are shown, and the owner can change them in one content file.
- Pieces keep bobbing; with reduced motion set, they are still.
- It meets NFR-01, NFR-04 and NFR-08.
**Status:** Approved

### CONT-01: File-based content

**Statement:** The owner updates all text, projects, and links by editing files in the repository.
**Acceptance:**
- Adding or changing a project needs no change to page code.
**Status:** Approved

### PRIV-01: Privacy note

**Statement:** A short privacy note says what Vercel Web Analytics and Sentry collect.
**Acceptance:**
- It can be reached from the page.
- It matches what the live site sends.
- The site sets no analytics cookies.
**Status:** Approved

## Non-Functional Requirements

### NFR-01: Page speed

**Statement:** On phones, Largest Contentful Paint is at most 2.5 seconds and the Lighthouse performance score is at least 90.
**Acceptance:**
- Lighthouse CI enforces both.
**Status:** Approved

### NFR-02: Concurrent visitors

**Statement:** The site serves 50 concurrent visitors.
**Acceptance:**
- A load test at 50 concurrent visitors on a preview deploy finishes with no failed requests.
**Status:** Approved

### NFR-03: Spending cap

**Statement:** Running the site costs 0 per month. Any paid service needs the owner's approval first.
**Acceptance:**
- Vercel, Vercel Web Analytics, and Sentry are on free plans with no payment enabled.
**Status:** Approved

### NFR-04: Accessibility

**Statement:** The site meets WCAG 2.2 AA, except 2.2.2 (Pause, Stop, Hide) for background and Tools motion.
**Acceptance:**
- Automated checks report no violations.
- A manual keyboard pass reaches and operates every control.
**Status:** Approved

### NFR-05: Error logging

**Statement:** Errors are reported to Sentry.
**Acceptance:**
- A test error from the preview deploy appears in Sentry.
- Reports contain no secrets.
**Status:** Approved

### NFR-06: Visit counts

**Statement:** Visits are counted with Vercel Web Analytics.
**Acceptance:**
- A visit to the live site appears in the dashboard.
- The page works normally when analytics is paused or blocked.
**Status:** Approved

### NFR-07: Non-commercial hosting

**Statement:** The site is hosted on Vercel's free plan and stays within its non-commercial terms.
**Acceptance:**
- The site offers no services for sale.
**Status:** Approved

### NFR-08: Motion limits

**Statement:** Motion never gets in the way of reading, speed, or accessibility.
**Acceptance:**
- With reduced motion set on the device, nothing moves by default.
- All content is visible without JavaScript and before any animation.
- NFR-01 and NFR-04 still hold with motion on.
**Status:** Approved

## Out Of Scope

Version 1 does not include: freelance services, a contact form, a blog, a database, sign-in, an admin page, other languages, or a paid domain.

## Changelog

| Version | Date | Change | Approved by |
| --- | --- | --- | --- |
| 0.6.0 | 2026-11-26 | Added MOTION-01 to MOTION-03, TOOL-01 and NFR-08; SITE-01 adds tools; NFR-04 motion exception | @Vnslv |
| 0.5.2 | 2026-11-26 | About text moved to the intro: SITE-01, SITE-02; SITE-03 removed | @Vnslv |
| 0.5.1 | 2026-11-26 | WORK-01: role labels for Idiya and UMak Kalinga | @Vnslv |
| 0.5.0 | 2026-11-25 | Taskvane renamed Idiya; WORK-03: outcome removed, stack added | @Vnslv |
| 0.4.0 | 2026-11-24 | WORK-01: UMak Kalinga role; AWARD-01: placements | @Vnslv |
| 0.3.0 | 2026-11-24 | Added THEME-01 | @Vnslv |
| 0.2.0 | 2026-11-24 | Version 1 requirements from grill-spec | @Vnslv |
| 0.1.0 | 2026-11-24 | Template created | @Vnslv |

