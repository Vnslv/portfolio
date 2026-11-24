# References

Page type: single-page personal portfolio in a 90s desktop style. Sources read or searched 2026-11-24. Nothing is copied: the look is original, with no operating system logos, icons, or artwork.

| Reference | Structure | What it does well |
| --- | --- | --- |
| [98.css](https://jdan.github.io/98.css/) (read) | Component showcase: windows, title bars, buttons, tabs, trees, status bars. MIT. | Retro controls on semantic HTML, labeled inputs, named icon buttons. Says accessibility is a primary goal. |
| PostHog: [why the site looks like an OS](https://posthog.com/blog/why-os) (read), [engineering handbook](https://posthog.com/handbook/engineering/posthog-com/technical-architecture) (search summary) | Desktop-style windows with snapping. | The handbook describes a traditional navigation mode, used on mobile. The metaphor gives way on small screens. |
| [Many0nne/portfolio](https://github.com/Many0nne/portfolio) (search summary only) | Portfolio as a retro desktop: boot screen, taskbar, resizable windows. | Shows how far the metaphor can go. A boot screen delays content, so this design has none (NFR-01). |

Not used: henryheffernan.com and dustinbrett.com showed only a title without JavaScript, so their structure could not be read.

## Lessons For This Site

- Content must be readable without JavaScript and without dragging anything.
- The retro look is a skin on a normal page with headings, links, and buttons.
- On phones, windows become full-width panels.
