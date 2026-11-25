# Design Brief

**Status:** Locked 2026-11-24 by the owner: direction B, File explorer. Changed by the owner 2026-11-25: see [first-look.md](../design/first-look.md).

This file holds *how* the product looks: tokens and visual rules. It never adds requirements; the PRD does.

## Tokens

| Token | Use | Light | Dark |
| --- | --- | --- | --- |
| `--desk` | desktop background | `#5a4a78` | `#1d1630` |
| `--desk2` | desktop pattern | `#514170` | `#251c3c` |
| `--face` | window and button face | `#d8d4e0` | `#322b42` |
| `--field` | sunken lists and fields | `#fbfaff` | `#221c30` |
| `--text` | main text | `#1d1826` | `#f3effa` |
| `--muted` | secondary text | `#4a4358` | `#c5bcd6` |
| `--hi` | bevel highlight | `#ffffff` | `#5f5578` |
| `--lo` | bevel shadow, rules | `#8a8299` | `#7d7199` |
| `--edge` | outer edge | `#2a2338` | `#0a0712` |
| `--title` | title bar start, selected tree item | `#4b2a7b` | `#5a3596` |
| `--title2` | title bar end | `#7a2f74` | `#86387f` |
| `--titleText` | title bar text | `#ffffff` | `#ffffff` |
| `--link` | links | `#4b2a7b` | `#cdb4ff` |
| `--badge` | award badge | `#b7f0d0` | `#7fe0b0` |
| `--badgeText` | award badge text | `#08351f` | `#08351f` |

- **Type:** the owner's name and window titles Pixelify Sans (500, 700) with IBM Plex Sans as fallback; award and project names IBM Plex Sans 700, because the pixel "C" reads as "O" (owner, 2026-11-25); text IBM Plex Sans (400, 700). Sizes: 14 status and tags, 15 card details, 16 text, 18 lead and title bars, 19 item headings, 30 to 52 name (fluid).
- **Radius:** 0 everywhere.
- **Bevel:** 2 px, `--hi` top and left, `--edge` bottom and right, with a 1 px `--lo` inner shadow. Pressed and sunken elements reverse it.
- **Spacing:** 16 px page edge and gaps on phone; 28 px page edge and 20 px column gap on desktop. 16 px inside windows.
- **Controls:** at least 44 px high.

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
