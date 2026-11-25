import { test, expect, type Page } from '@playwright/test';

// NFR-01 and the T13 ticket: the two web fonts are self-hosted and used, but not preloaded.

const phone = { width: 412, height: 823 };
const desktop = { width: 1280, height: 800 };
const FONTS = '**/_next/static/media/**';
// Lighthouse's "good" limit for Cumulative Layout Shift.
const GOOD_SHIFT = 0.1;
// An element set in the display font and one set in the text font, on each page.
const PAGES = [
  { path: '/', display: '#welcome h1', text: '#welcome h1 + p' },
  { path: '/no-such-page', display: 'main h1', text: 'main p' },
];

const toggle = (page: Page) => page.getByRole('button', { name: /^(Dark|Light) theme$/ });

// The web font families that have arrived, without the local stand-ins.
const arrived = (page: Page) =>
  page.evaluate(() =>
    [
      ...new Set(
        [...document.fonts]
          .filter((f) => f.status === 'loaded' && !f.family.includes('Fallback'))
          .map((f) => f.family.replace(/["']/g, '')),
      ),
    ].sort(),
  );

// The fonts the browser really drew an element with.
async function drawnWith(page: Page, selector: string) {
  const session = await page.context().newCDPSession(page);
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root } = await session.send('DOM.getDocument');
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
  await session.detach();
  // One entry for each font used, such as "web IBM Plex Sans" or "local Arial".
  return fonts.map((f) => `${f.isCustomFont ? 'web' : 'local'} ${f.familyName}`).join(', ');
}

// True when the element's text is painted: hiding its color changes the picture of it. Text held
// invisible while a font loads would leave the picture the same. The browser is asked for the
// picture directly, because Playwright's own screenshot waits for the fonts.
async function painted(page: Page, selector: string) {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible();
  const box = await element.boundingBox();
  if (!box) throw new Error(`no box for ${selector}`);
  const session = await page.context().newCDPSession(page);
  const picture = async () =>
    (await session.send('Page.captureScreenshot', { clip: { ...box, scale: 1 } })).data;
  const shown = await picture();
  await element.evaluate((el: HTMLElement) => (el.style.color = 'transparent'));
  const hidden = await picture();
  await element.evaluate((el: HTMLElement) => el.style.removeProperty('color'));
  await session.detach();
  return shown !== hidden;
}

test.describe('NFR-01 the web fonts', () => {
  for (const { path, display, text } of PAGES) {
    test(`no font is preloaded, on ${path}`, async ({ page }) => {
      const response = await page.goto(path);
      if (!response) throw new Error('no response');
      await expect(toggle(page)).toBeVisible();
      // In the links the page ends with, in the HTML and its hints, and in the response header.
      await expect(page.locator('link[as="font"]')).toHaveCount(0);
      const html = await response.text();
      expect(html.match(/<link[^>]*as="font"[^>]*>/g)).toBeNull();
      expect(html.match(/:HL\[[^\]]*font[^\]]*\]/g)).toBeNull();
      expect(response.headers()['link'] ?? '').not.toMatch(/as="?font/);
    });

    test(`both fonts load from the site's own address and are used, on ${path}`, async ({
      page,
      baseURL,
    }) => {
      const requested: { url: string; type: string }[] = [];
      page.on('request', (r) => requested.push({ url: r.url(), type: r.resourceType() }));
      await page.goto(path);
      await expect(toggle(page)).toBeVisible();
      await expect.poll(() => arrived(page)).toEqual(['IBM Plex Sans', 'Pixelify Sans']);
      const fonts = requested.filter((r) => r.type === 'font').map((r) => r.url);
      expect(fonts.length).toBeGreaterThanOrEqual(2);
      expect(fonts.filter((u) => !u.startsWith(`${baseURL}/_next/static/media/`))).toEqual([]);
      expect(requested.filter((r) => !r.url.startsWith(`${baseURL}/`))).toEqual([]);
      // Each element is drawn with one font only: the web font.
      await expect.poll(() => drawnWith(page, display)).toMatch(/^web Pixelify[^,]*$/);
      await expect.poll(() => drawnWith(page, text)).toMatch(/^web IBM Plex[^,]*$/);
    });

    test(`error state: with the fonts blocked the text is still shown, on ${path}`, async ({
      page,
    }) => {
      await page.route(FONTS, (route) => route.abort());
      await page.goto(path);
      await expect(toggle(page)).toBeVisible();
      expect(await arrived(page)).toEqual([]);
      expect([await painted(page, display), await painted(page, text)]).toEqual([true, true]);
    });

    for (const size of [phone, desktop]) {
      test(`late fonts: text shows first, and the shift stays good, at ${size.width} px on ${path}`, async ({
        page,
      }) => {
        await page.setViewportSize(size);
        // Adds up every layout shift from the first frame on.
        await page.addInitScript(() => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              total += (entry as PerformanceEntry & { value: number }).value;
            }
            document.documentElement.dataset['shift'] = String(total);
          }).observe({ type: 'layout-shift', buffered: true });
        });
        let release: () => void = () => undefined;
        const held = new Promise<void>((resolve) => {
          release = resolve;
        });
        await page.route(FONTS, async (route) => {
          await held;
          await route.continue();
        });
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await expect(toggle(page)).toBeVisible();

        // Before the fonts: none has arrived, and the text is on the screen.
        expect(await arrived(page)).toEqual([]);
        expect([await painted(page, display), await painted(page, text)]).toEqual([true, true]);

        release();
        await expect.poll(() => arrived(page)).toEqual(['IBM Plex Sans', 'Pixelify Sans']);
        const shift = () =>
          page.evaluate(async () => {
            // Two frames, so the swapped fonts are laid out and any shift has been reported.
            await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
            return Number(document.documentElement.dataset['shift'] ?? '0');
          });
        const total = await shift();
        expect(total).toBeLessThanOrEqual(GOOD_SHIFT);
        // The measurement does see shifts, so the limit above can fail.
        await page.evaluate(() => {
          const spacer = document.createElement('div');
          spacer.style.height = '200px';
          document.querySelector('main')?.prepend(spacer);
        });
        await expect.poll(shift).toBeGreaterThan(total + GOOD_SHIFT / 10);
      });
    }
  }
});
