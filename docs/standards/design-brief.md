# Design Brief

**Status:** Locked 2026-11-24 by the owner: direction B, File explorer. Changed by the owner 2026-11-25: see [first-look.md](../design/first-look.md).

This file holds *how* the product looks: tokens and visual rules. It never adds requirements; the PRD does.

## Tokens

| Token | Use | Light | Dark |
| --- | --- | --- | --- |
| `--desk` | desktop background, top of the sky | `#8fb8ee` | `#0c1030` |
| `--desk2` | desktop background, bottom of the sky | `#c9dcf7` | `#1b1440` |
| `--face` | window and button face | `#d6dfec` | `#222a47` |
| `--field` | sunken lists and fields | `#fafcff` | `#161c33` |
| `--text` | main text | `#141c2b` | `#eef2ff` |
| `--muted` | secondary text | `#3d4a61` | `#b9c3de` |
| `--hi` | bevel highlight | `#ffffff` | `#4a5680` |
| `--lo` | bevel shadow, rules | `#7f8ea8` | `#6c7aa8` |
| `--edge` | outer edge | `#1c2a44` | `#060917` |
| `--title` | title bar start, current section | `#1c4587` | `#26337d` |
| `--title2` | title bar end | `#2b69b0` | `#3b4ba3` |
| `--titleText` | title bar text | `#ffffff` | `#ffffff` |
| `--link` | links | `#1c4587` | `#b9c9ff` |
| `--badge` | award badge | `#b7f0d0` | `#7fe0b0` |
| `--badgeText` | award badge text | `#08351f` | `#08351f` |

- **Background:** light, a sky gradient with a few pixel clouds (`#ffffff`, `#f4f8ff`); dark, a night gradient with pixel stars (`#ffffff`, `#cdb4ff`, `#7f8cc9`). Drawn in CSS, no image file (owner, 2026-11-26).
- **Type:** the owner's name and window titles Pixelify Sans (500, 700) with IBM Plex Sans as fallback; award and project names IBM Plex Sans 700, because the pixel "C" reads as "O" (owner, 2026-11-25); text IBM Plex Sans (400, 700). Sizes: 14 status and tags, 15 card details, 16 text, 18 lead and title bars, 19 item headings, 30 to 52 name (fluid).
- **Radius:** 0 everywhere.
- **Bevel:** 2 px, `--hi` top and left, `--edge` bottom and right, with a 1 px `--lo` inner shadow. Pressed and sunken elements reverse it.
- **Spacing:** 16 px page edge and gaps on phone; 28 px page edge and 20 px column gap on desktop. 16 px inside windows.
- **Controls:** at least 44 px high.

## Motion (owner, locked 2026-11-26)

Approved in [motion-board.html](../design/motion-board.html) and [tools-board.html](../design/tools-board.html), with these changes from the boards:
- No "Pause motion" control anywhere (owner; PRD NFR-04 exception).
- The sky: drifting clouds by day, drifting stars by night (owner).
- The cursor is an original retro pixel arrow with no sparkles; hover effects are short; the filter types a terminal line.
- Movement is noticeable and quick: at most 0.5 s, except the sky, idle bobbing, typing and the cursor blink. Pixel-style steps, no smooth easing.
- Tools: a winding pixel path from Start to Finish; each tool a pixel redraw of its logo with its name as text, colored by group; pieces bob and hop on hover, tap and focus; arrow keys move between pieces.
- Nothing moves with reduced motion set. Motion never delays reading or the first paint.

## Rules

- Design values come only from these tokens. No ad-hoc colors, radii, or shadows.
- One scrolling page of fixed windows. No dragging, and no minimize, maximize, or close buttons.
- From 900 px wide: one centered column of at most 1040 px with no folder tree, projects are rows, and the taskbar shows every section with its icon, the current one in the title colors, and the theme toggle. Below that the taskbar has a Menu button; the section buttons also show from 640 px (owner, 2026-11-25).
- The theme toggle sits at the right of the taskbar and names the theme it switches to.
- Below 640 px, award photos are 120 px wide beside their text and the profile photo is 108 by 120 px, to keep NFR-01 (owner, 2026-11-25). An award photo opens its full image.
- Headings keep real capitalization (eHanda, HeronPay, UMak Kalinga).
- Icons are original 8 by 8 pixel drawings. No operating system logos, icons, or artwork.
- Content is readable without JavaScript. Image space is reserved before images load.
- Respect `prefers-reduced-motion` and keyboard access in every interactive component. Focus is always visible.
- Text contrast meets WCAG AA in both themes. In the dark theme the bevel alone is faint, so controls must also have a text label.
- Text on translucent surfaces keeps WCAG AA contrast in both themes.

## Reference

- Build from: [board-b.html](../design/board-b.html). All directions: [board.html](../design/board.html). Board: <https://claude.ai/artifact/31F9qe9cVb1ksfscPveb6v> (private).
- Flow, wireframes, and states: [first-look.md](../design/first-look.md).
- The board is plain CSS with container queries. The build may use other tooling but must match it.
