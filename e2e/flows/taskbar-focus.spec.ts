import { test, expect, type Page } from '@playwright/test';

// NFR-04 (WCAG 2.2 AA, 2.4.11): the sticky bottom bar must not cover the control that has focus.
// Each test presses Tab or Shift+Tab through the whole page and measures every focused control at
// the moment the browser has moved to it. Nothing here scrolls the page.

const WIDTHS = [390, 640, 768, 899, 900, 1280];
const KEYS = ['Tab', 'Shift+Tab'] as const;
const BADGE = 'Champion, Blockchain Campus Conference 2026';

type Key = (typeof KEYS)[number];
type Stop = { name: string; inBar: boolean; top: number; bottom: number; barTop: number };

// Presses the key until focus leaves the page or comes round again.
async function tabThrough(page: Page, key: Key): Promise<Stop[]> {
  const stops: Stop[] = [];
  for (let i = 0; i < 100; i += 1) {
    await page.keyboard.press(key);
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el.hasAttribute('data-visited')) return null;
      el.setAttribute('data-visited', '');
      const bar = document.querySelector('nav[aria-label="Taskbar"]');
      if (!bar) throw new Error('no taskbar');
      // A radio is used through its label, so the label is what must stay clear.
      const box = (el.closest('label') ?? el).getBoundingClientRect();
      return {
        name: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim(),
        inBar: bar.contains(el),
        top: box.top,
        bottom: box.bottom,
        barTop: bar.getBoundingClientRect().top,
      };
    });
    if (!stop) return stops;
    stops.push(stop);
  }
  throw new Error('focus never left the page');
}

// A control that fits above the bar must be wholly above it. A taller one cannot be, so it must
// not be wholly behind it.
function covered(stops: Stop[]) {
  return stops.filter((s) => {
    if (s.inBar) return false;
    const fits = s.bottom - s.top <= s.barTop;
    return fits ? s.bottom > s.barTop + 0.5 : s.top >= s.barTop;
  });
}

// The visible controls outside the bar that the keyboard did not reach, so a pass cannot be empty.
function missed(page: Page) {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll(
        'main a[href], main summary, main button:not([disabled]), main select:not([disabled]), footer a[href]',
      ),
    ]
      .filter((el) => el.checkVisibility() && !el.hasAttribute('data-visited'))
      .map((el) => el.textContent),
  );
}

// Script enables the filter and mounts the theme button; without script neither happens.
async function open(page: Page, path: string, script: boolean) {
  await page.goto(path);
  await expect(page.getByRole('navigation', { name: 'Taskbar' }).locator('button')).toHaveCount(
    script ? 1 : 0,
  );
}

// Text at twice the size. The root and the body both grow, as when a browser enlarges text only.
async function doubleText(page: Page) {
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = 'html, body { font-size: 32px !important; }';
    document.head.append(style);
  });
}

const NOT_FOUND = [
  { text: 'normal', height: 200, enlarge: () => Promise.resolve() },
  { text: 'doubled', height: 240, enlarge: doubleText },
];

const barHeight = async (page: Page) =>
  (await page.getByRole('navigation', { name: 'Taskbar' }).boundingBox())?.height ?? 0;

async function tabHome(page: Page, key: Key) {
  const stops = await tabThrough(page, key);
  const outside = stops.filter((s) => !s.inBar);
  return {
    badge: outside.some((s) => s.name === BADGE),
    downloads: outside.filter((s) => s.name === 'Download CV').length,
    missed: await missed(page),
    covered: covered(stops),
  };
}

// Both named controls and every other one were reached, and the bar covered none of them.
const CLEAR = { badge: true, downloads: 2, missed: [], covered: [] };

for (const script of [true, false]) {
  test.describe(`NFR-04 focus stays clear of the bar, ${script ? 'with' : 'without'} JavaScript`, () => {
    test.use({ javaScriptEnabled: script });

    for (const key of KEYS) {
      for (const width of WIDTHS) {
        test(`${key} through the home page at ${width} by 800 px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 800 });
          await open(page, '/', script);
          expect(await tabHome(page, key)).toEqual(CLEAR);
        });

        test(`${key} through the home page at ${width} by 800 px, text doubled`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: 800 });
          await open(page, '/', script);
          const before = await barHeight(page);
          await doubleText(page);
          expect(await barHeight(page)).toBeGreaterThan(before);
          expect(await tabHome(page, key)).toEqual(CLEAR);
        });

        // An opened project adds its own link and Close.
        test(`${key} with a project open at ${width} by 800 px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 800 });
          await open(page, '/', script);
          await page.evaluate(() => {
            const details = document.querySelector<HTMLDetailsElement>('#idiya details');
            if (!details) throw new Error('no project');
            details.open = true;
          });
          expect(await tabHome(page, key)).toEqual(CLEAR);
          const live = page.locator('#idiya a[href="https://idiya.vercel.app/"]');
          await expect(live).toHaveAttribute('data-visited', '');
        });
      }

      // 900 by 800 and 1280 by 800 px at 200% browser zoom.
      for (const width of [450, 640]) {
        test(`${key} through the home page at ${width} by 400 px (200% zoom)`, async ({ page }) => {
          await page.setViewportSize({ width, height: 400 });
          await open(page, '/', script);
          expect(await tabHome(page, key)).toEqual(CLEAR);
        });
      }

      // The not-found page has one control. The window is made short enough that the bar starts
      // out over it, which the first check proves.
      for (const width of WIDTHS) {
        for (const { text, height, enlarge } of NOT_FOUND) {
          test(`${key} on the not-found page at ${width} by ${height} px, text ${text}`, async ({
            page,
          }) => {
            await page.setViewportSize({ width, height });
            await open(page, '/no-such-page', script);
            await enlarge(page);
            const home = await page
              .getByRole('link', { name: 'Go to the home page' })
              .boundingBox();
            const bar = await page.getByRole('navigation', { name: 'Taskbar' }).boundingBox();
            expect(home!.y + home!.height).toBeGreaterThan(bar!.y);
            const stops = await tabThrough(page, key);
            expect(stops.filter((s) => !s.inBar).map((s) => s.name)).toEqual([
              'Go to the home page',
            ]);
            expect(covered(stops)).toEqual([]);
          });
        }
      }
    }
  });
}

// The reserved space must change nothing about where links land or which section is marked.
for (const width of [390, 1280]) {
  test(`section links, project links and the current mark are unchanged at ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(page, '/', true);
    const top = async (selector: string) =>
      Math.round((await page.locator(selector).boundingBox())?.y ?? -1);
    const bar = page.getByRole('navigation', { name: 'Taskbar' });
    for (const [label, id] of [
      ['Awards', 'awards'],
      ['Work', 'work'],
    ] as const) {
      // Below 640 px the section links are in the Menu; open it (it does nothing from 900 px).
      await page.evaluate(() => {
        const menu = document.querySelector<HTMLDetailsElement>(
          'nav[aria-label="Taskbar"] details',
        );
        if (menu) menu.open = true;
      });
      await bar.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(`/#${id}`);
      // The 12 px above a section is its own scroll margin.
      await expect.poll(() => top(`#${id}`)).toBe(12);
    }
    // The section button carries the mark; below 640 px it is hidden and the bar names the section.
    await expect(bar.locator('a[href="#work"][aria-current="true"]')).toHaveCount(1);
    await page.goto('about:blank');
    await page.goto('/#idiya');
    await expect(page.locator('#idiya details')).toHaveJSProperty('open', true);
    await expect.poll(() => top('#idiya')).toBe(12);
  });
}
