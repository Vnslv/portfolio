---
name: grill-with-design
description: Show the owner the product before any plan or code - app flow, ASCII wireframes, and a clickable look board (2-3 directions, light and dark) published as a private Artifact, then lock the chosen design. Use for a new app, new screens, or a redesign, after grill-spec, or when the owner says "first look", "wireframe", "app flow", or "look board".
---

# Grill With Design

The owner sees the product before any plan is approved or code is written. This skill writes no production code. Its outputs are a flow, wireframes, a board, and recorded decisions. Requirements still come only from `docs/PRD.md`; if design questions reveal a missing requirement, stop and run `grill-spec`.

Load the `grilling` skill and follow it in every round.

## Steps

1. **Round 1: design frontier.** Read the PRD first and never ask what it answers. Settle:
   - the 3 to 7 core screens and the one job of each;
   - platform and size priority (phone-first or desktop-first; web or app);
   - tone and any reference sites or images;
   - **options, asked here rather than assumed:** a trust layer (legal footer, cookie bar, consent on forms) for public sites; wide-screen frames (1920 and 2560) when big monitors matter; pixel parity checking between board and build.

   Do not ask about colors, type, or layout style in words. The board shows them.

2. **References.** Fetch 2 to 4 real products of the same screen type. Write `docs/design/references.md`: the page type, each reference's structure and what it does well.

3. **App flow.** A Mermaid `flowchart`: screens are nodes, user actions are edge labels, entry and goal marked.

4. **Wireframes.** ASCII wireframes for each core screen, desktop (about 100 columns) and phone (about 40 columns), each with a short component list and its loading, empty, and error states. Save the flow and wireframes in the active plan's "Design Spec", or `docs/design/first-look.md` if no plan exists.

5. **Structure check.** One round: screens, order, and what is on each. Fix structure before any styling.

6. **Board.** Load the `artifact-design` skill, then build one HTML page:
   - a **Flow** view whose boxes open each screen's mock;
   - **2 to 3 directions** that differ in layout and character, not only color, each rendering the same core screens;
   - real content from the PRD; missing facts are labeled placeholders, never invented;
   - toggles for light/dark and desktop/phone (390 px);
   - click-through along the primary flow (no backend);
   - each direction lists its tokens (colors for both themes, type, radius, shadow, spacing);
   - loading, empty, and error states shown for the main screens;
   - frames at exact CSS widths (390, 768, 1280, plus 1920 and 2560 if chosen in round 1), scaled only with `transform` so layout never reflows;
   - Tailwind (pinned CDN) with tokens as CSS variables, class names matching production;
   - the trust layer, if chosen in round 1;
   - no animated text; motion off under `prefers-reduced-motion`.

   Save the source at `docs/design/board.html`. Publish it as a private Artifact and give the link.

7. **Pick rounds.** One numbered question per decision (direction, mixes like "B's layout with A's colors", per-screen changes), each with a recommendation. Republish the same board URL each round. Record each round as "Round N (YYYY-MM-DD)" in the plan's Decisions.

8. **Lock.** When the owner picks a direction and confirms the structure:
   - write the chosen tokens and rules into `docs/standards/design-brief.md`;
   - export the chosen direction as `docs/design/board-<direction>.html` so builders port real markup;
   - write an ADR in `docs/adr/` if the direction is hard to reverse;
   - if parity was chosen, add to the plan's gate: Playwright screenshots of board and build at the same widths, structure matching within 8 px;
   - copy `e2e/viewports.html` usage into the plan if wide frames were chosen;
   - hand off to the `plan` skill.

## Rules

- Never lock the design until the owner confirms the shared understanding.
- Structure first, look second. Show, don't describe.
- Never invent a fact. Placeholders are labeled.
- Text on glass or translucent surfaces keeps WCAG AA contrast in both themes: deepen the tint, never go opaque.
- No " · " separators in copy; use commas, colons, or brackets.
- The board is a throwaway reference. The build follows it 1:1; deviations are proposals.
