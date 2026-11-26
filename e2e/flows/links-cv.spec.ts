import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const phone = { width: 390, height: 844 };
const desktop = { width: 1280, height: 800 };
const GITHUB = 'https://github.com/Vnslv';
const LINKEDIN = 'https://www.linkedin.com/in/vonn-salve-1b05b9403/';
const CV = 'https://drive.google.com/uc?export=download&id=1Ocqt2HoIjLeVMKR24qlCmPaDSc8vUUyj';
const SMALL = '/images/profile-small.webp';
const FULL = '/images/profile.jpg';
const ALT = 'Vonn Salve wearing glasses and a tan polo shirt, looking down';
const WARNING = `profile: image failed to load ${SMALL}`;

const intro = (page: Page) => page.locator('#welcome');
const links = (page: Page) => page.locator('#links');
const figure = (page: Page) => intro(page).locator('figure');
const photo = (page: Page) => intro(page).getByRole('img', { name: ALT });
const cvIn = (area: Locator) => area.getByRole('link', { name: 'Download Resume', exact: true });
// The exact accessible name, so no pattern is built from a name.
const profileLink = (page: Page, name: 'GitHub' | 'LinkedIn') =>
  links(page).getByRole('link', { name: `${name} (opens in a new tab)`, exact: true });

const box = async (locator: Locator) => {
  const b = await locator.boundingBox();
  if (!b) throw new Error('no box');
  return b;
};

// Presses Tab from the top of the page until the element has focus, or gives up after 40 presses.
async function tabTo(page: Page, target: Locator): Promise<boolean> {
  const handle = await target.elementHandle();
  if (!handle) return false;
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab');
    if (await handle.evaluate((el) => el === document.activeElement)) return true;
  }
  return false;
}

// The three outside addresses answer from here, so no test reaches the real sites.
async function answerOutside(page: Page) {
  const hosts = ['github.com', 'www.linkedin.com', 'drive.google.com'];
  await page.context().route(
    (url) => url.protocol === 'https:' && hosts.includes(url.hostname),
    (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>outside</title>' }),
  );
}

// The page is hydrated once the work filter, which needs script, is on.
const hydrated = (page: Page) =>
  expect(page.locator('#work').getByRole('radio', { name: 'All' })).toBeEnabled();

// Empty state: the built site holds every link and the photo, so the missing-link and no-photo
// cases are proven by render tests with fixtures in src/components/Links.test.tsx.
test.describe('LINK-01, LINK-02 profile links and CV', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(desktop);
  });

  test('happy: GitHub, LinkedIn and the CV open the owner addresses', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (r) => requested.push(r.url()));
    await page.goto('/');
    await expect(links(page).getByRole('heading', { level: 2, name: 'Links' })).toBeVisible();

    await test.step('LINK-01: GitHub and LinkedIn go to the owner profiles, in a new tab', async () => {
      for (const [name, href] of [
        ['GitHub', GITHUB],
        ['LinkedIn', LINKEDIN],
      ] as const) {
        const link = profileLink(page, name);
        await expect(link).toHaveAttribute('href', href);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener/);
        await expect(link).toHaveAttribute('rel', /noreferrer/);
        await expect(link).toContainText(name);
      }
    });

    await test.step('LINK-02: the Resume is a plain link to the Drive address, in the intro and in Links', async () => {
      await expect(page.getByRole('link', { name: 'Download Resume' })).toHaveCount(2);
      for (const area of [intro(page), links(page)]) {
        await expect(cvIn(area)).toHaveAttribute('href', CV);
        await expect(cvIn(area)).not.toHaveAttribute('target', /.*/);
        await expect(cvIn(area)).not.toHaveAttribute('rel', /.*/);
      }
    });

    await test.step('the page asks no outside address on load: nothing is downloaded', () => {
      expect(requested.filter((u) => !u.startsWith('http://localhost'))).toEqual([]);
    });
  });

  test('the controls are at least 44 px high, at 320, 390 and 1280 px', async ({ page }) => {
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await expect(intro(page).getByRole('link')).toHaveCount(2);
      await expect(links(page).getByRole('link')).toHaveCount(3);
      for (const area of [intro(page), links(page)]) {
        for (const link of await area.getByRole('link').all()) {
          expect((await box(link)).height).toBeGreaterThanOrEqual(44);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  });

  test('keyboard: Tab reaches each link with a visible focus, Enter opens it', async ({
    page,
    context,
  }) => {
    await answerOutside(page);
    await page.goto('/');

    for (const link of [
      cvIn(intro(page)),
      profileLink(page, 'GitHub'),
      profileLink(page, 'LinkedIn'),
      cvIn(links(page)),
    ]) {
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(await tabTo(page, link)).toBe(true);
      expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
    }

    await test.step('Enter on GitHub and LinkedIn opens the exact address in a new tab', async () => {
      for (const [name, href] of [
        ['GitHub', GITHUB],
        ['LinkedIn', LINKEDIN],
      ] as const) {
        const link = profileLink(page, name);
        await link.focus();
        const opened = context.waitForEvent('page');
        await page.keyboard.press('Enter');
        const tab = await opened;
        await expect(tab).toHaveURL(href);
        await tab.close();
      }
    });

    await test.step('Enter on Download Resume asks for the Drive address exactly, in the same tab', async () => {
      const link = cvIn(links(page));
      await link.focus();
      const asked = page.waitForRequest(CV);
      await page.keyboard.press('Enter');
      expect((await asked).url()).toBe(CV);
      await expect(page).toHaveURL(CV);
    });
  });

  test('the intro Download Resume, clicked, asks for the Drive address exactly', async ({
    page,
  }) => {
    await answerOutside(page);
    await page.goto('/');
    const asked = page.waitForRequest(CV);
    await cvIn(intro(page)).click();
    expect((await asked).url()).toBe(CV);
    await expect(page).toHaveURL(CV);
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false, viewport: phone });

    test('the links and the photo are all there', async ({ page }) => {
      await page.goto('/');
      await expect(cvIn(intro(page))).toHaveAttribute('href', CV);
      await expect(cvIn(links(page))).toHaveAttribute('href', CV);
      await expect(profileLink(page, 'GitHub')).toHaveAttribute('href', GITHUB);
      await expect(profileLink(page, 'LinkedIn')).toHaveAttribute('href', LINKEDIN);
      await expect
        .poll(() => photo(page).evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
    });
  });
});

test.describe('the intro photo', () => {
  test('happy: the small copy is shown with its description, in the reserved space', async ({
    page,
  }) => {
    await page.setViewportSize(desktop);
    await page.goto('/');
    await expect(photo(page)).toBeVisible();
    await expect
      .poll(() => photo(page).evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await expect(intro(page).getByText('<your photo>')).toHaveCount(0);
    // The photo is not a link: nothing in the picture opens anything.
    await expect(figure(page).getByRole('link')).toHaveCount(0);
  });

  for (const [width, w, h] of [
    [390, 108, 120],
    [639, 108, 120],
    [640, 180, 200],
    [768, 180, 200],
    [1280, 180, 200],
  ] as const) {
    test(`the picture is ${w} by ${h} px at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await expect(photo(page)).toBeVisible();
      const fig = await box(figure(page));
      expect(Math.round(fig.width)).toBe(w);
      expect(Math.round(fig.height)).toBe(h);
      // The photo fills the picture: no gap above or below it.
      const img = await box(photo(page));
      expect(img.width).toBeGreaterThan(w - 8);
      expect(img.height).toBeGreaterThan(h - 8);
    });
  }

  test('NFR-01: only the small copy is requested, as a plain address, and it is lighter', async ({
    page,
  }) => {
    await page.setViewportSize(phone);
    const requested: URL[] = [];
    page.on('request', (r) => {
      const url = new URL(r.url());
      if (url.pathname.startsWith('/images/')) requested.push(url);
    });
    await page.goto('/');
    await expect
      .poll(() => photo(page).evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    const paths = requested.map((u) => u.pathname);
    expect(paths).toContain(SMALL);
    expect(paths).not.toContain(FULL);
    expect(requested.filter((u) => u.search !== '')).toEqual([]);
    // The browser reports the address in full; its path and query are what must stay plain.
    const src = new URL((await photo(page).getAttribute('src')) ?? '', page.url());
    expect([src.pathname, src.search]).toEqual([SMALL, '']);
    const small = (await (await page.request.get(SMALL)).body()).length;
    const full = (await (await page.request.get(FULL)).body()).length;
    expect(small).toBeLessThan(full);
  });

  test('NFR-01: on a phone the photo is not the largest contentful paint', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 823 });
    await page.goto('/');
    await expect(photo(page)).toBeVisible();
    const lcp = await page.evaluate(async () => {
      // The load event has passed, so every image in view has loaded; the buffered entries then
      // hold every candidate, and the last one is the largest contentful paint.
      return new Promise<{ tag: string; photo: boolean }>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries() as unknown as { element?: Element | null }[];
          const last = entries.at(-1);
          resolve({
            tag: last?.element?.tagName ?? 'none',
            photo: Boolean(last?.element?.closest('#welcome figure')),
          });
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
    });
    expect(lcp.tag).not.toBe('none');
    expect(lcp.photo).toBe(false);
  });

  test('a loaded photo keeps its reserved space: nothing moves when it arrives', async ({
    page,
  }) => {
    // Measured still (T14): the opening would change the other windows' widths meanwhile.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const size of [phone, desktop]) {
      await page.setViewportSize(size);
      let release: () => void = () => undefined;
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(`**${SMALL}`, async (route) => {
        await held;
        await route.continue();
      });
      await page.goto('/', { waitUntil: 'commit' });
      await expect(figure(page)).toBeVisible();
      const before = {
        fig: await box(figure(page)),
        name: await box(intro(page).getByRole('heading', { level: 1 })),
        awards: await box(page.locator('#awards')),
        links: await box(links(page)),
      };
      release();
      await expect
        .poll(() => photo(page).evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
      const after = {
        fig: await box(figure(page)),
        name: await box(intro(page).getByRole('heading', { level: 1 })),
        awards: await box(page.locator('#awards')),
        links: await box(links(page)),
      };
      for (const key of ['fig', 'name', 'awards', 'links'] as const) {
        expect(after[key].y).toBeCloseTo(before[key].y, 1);
        expect(after[key].height).toBeCloseTo(before[key].height, 1);
        expect(after[key].width).toBeCloseTo(before[key].width, 1);
      }
      await page.unroute(`**${SMALL}`);
    }
  });

  test('phone: the picture sits above the name, and 320 px does not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    await expect(photo(page)).toBeVisible();
    const [fig, name] = [
      await box(figure(page)),
      await box(intro(page).getByRole('heading', { level: 1 })),
    ];
    expect(name.y).toBeGreaterThanOrEqual(fig.y + fig.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  });

  test.describe('a failed photo shows its description', () => {
    test('with script: in the same small space, readable, logged once with its path', async ({
      page,
    }) => {
      const warnings: string[] = [];
      page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
      await page.setViewportSize(phone);
      await page.route(`**${SMALL}`, (route) => route.abort());
      await page.goto('/');
      const text = figure(page).getByText(ALT);
      await expect(text).toBeVisible();
      await expect(figure(page).getByRole('img')).toHaveCount(0);
      expect(Math.round((await box(figure(page))).width)).toBe(108);
      expect((await box(figure(page))).height).toBeGreaterThanOrEqual(116);
      const fits = await text.evaluate((el) => ({
        across: el.scrollWidth <= el.clientWidth,
        down: el.scrollHeight <= el.clientHeight,
      }));
      expect(fits).toEqual({ across: true, down: true });
      const [t, f] = [await box(text), await box(figure(page))];
      expect(t.x).toBeGreaterThanOrEqual(f.x);
      expect(t.x + t.width).toBeLessThanOrEqual(f.x + f.width + 1);
      expect(t.y + t.height).toBeLessThanOrEqual(f.y + f.height + 1);
      await expect.poll(() => warnings.filter((w) => w.includes('image'))).toEqual([WARNING]);
    });

    test('with script, the failure arriving after the page is ready', async ({ page }) => {
      const warnings: string[] = [];
      page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
      let release: () => void = () => undefined;
      const ready = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(`**${SMALL}`, async (route) => {
        await ready;
        await route.abort();
      });
      await page.goto('/', { waitUntil: 'commit' });
      await hydrated(page);
      // The image is still pending: its picture holds the space, and it has not failed.
      await expect(figure(page)).toBeVisible();
      await expect(figure(page).getByRole('img')).toHaveCount(1);
      release();
      await expect(figure(page).getByText(ALT)).toBeVisible();
      await expect(figure(page).getByRole('img')).toHaveCount(0);
      await expect.poll(() => warnings.filter((w) => w.includes('image'))).toEqual([WARNING]);
    });

    test('with script, the failure arriving before the page is ready', async ({ page }) => {
      const warnings: string[] = [];
      page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
      let release: () => void = () => undefined;
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      // No script runs until the image has already failed.
      await page.route('**/_next/static/**/*.js', async (route) => {
        await held;
        await route.continue();
      });
      await page.route(`**${SMALL}`, (route) => route.abort());
      await page.goto('/', { waitUntil: 'commit' });
      await expect
        .poll(() =>
          intro(page)
            .locator('figure img')
            .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth === 0),
        )
        .toBe(true);
      expect(warnings.filter((w) => w.includes('image'))).toEqual([]);
      release();
      await expect(figure(page).getByText(ALT)).toBeVisible();
      await expect(figure(page).getByRole('img')).toHaveCount(0);
      await expect.poll(() => warnings.filter((w) => w.includes('image'))).toEqual([WARNING]);
    });

    test('at 1280 px it fills the 180 px column, and the page still has all its links', async ({
      page,
    }) => {
      await page.setViewportSize(desktop);
      await page.route(`**${SMALL}`, (route) => route.abort());
      await page.goto('/');
      await expect(figure(page).getByText(ALT)).toBeVisible();
      const fig = await box(figure(page));
      expect(Math.round(fig.width)).toBe(180);
      expect(fig.height).toBeGreaterThanOrEqual(196);
      await expect(cvIn(intro(page))).toHaveAttribute('href', CV);
    });

    test('at 320 px nothing overflows sideways', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.route(`**${SMALL}`, (route) => route.abort());
      await page.goto('/');
      await expect(figure(page).getByText(ALT)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
      );
    });

    test.describe('without script, 390 px', () => {
      test.use({ javaScriptEnabled: false, viewport: phone });

      test('the whole description is shown, in readable color, nothing cut off', async ({
        page,
      }) => {
        await page.route(`**${SMALL}`, (route) => route.abort());
        await page.goto('/');
        const img = photo(page);
        await expect(img).toBeVisible();
        const m = await img.evaluate((el: HTMLImageElement, text: string) => {
          // The same words, font and width as ordinary text: the least height they need.
          const style = getComputedStyle(el);
          const ref = document.createElement('div');
          ref.textContent = text;
          ref.style.cssText = `position:absolute;visibility:hidden;width:${el.clientWidth}px;font:${style.font};overflow-wrap:anywhere`;
          document.body.append(ref);
          const need = ref.getBoundingClientRect().height;
          ref.remove();
          return {
            height: el.getBoundingClientRect().height,
            need,
            across: el.scrollWidth <= el.clientWidth + 1,
            color: style.color,
          };
        }, ALT);
        expect(m.height).toBeGreaterThanOrEqual(m.need);
        expect(m.across).toBe(true);
        // next/image sets color: transparent, which hides the alt text a broken image draws.
        expect(m.color).not.toMatch(/^rgba\(0, 0, 0, 0\)$|^transparent$/);
        expect(Math.round((await box(figure(page))).width)).toBe(108);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          390,
        );
      });
    });
  });

  test('accessibility: no axe violations in either theme, loaded or failed, on a phone and a desktop', async ({
    page,
  }) => {
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      for (const size of [phone, desktop]) {
        await page.setViewportSize(size);
        await page.goto('/');
        await expect(photo(page)).toBeVisible();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

        await page.route(`**${SMALL}`, (route) => route.abort());
        await page.goto('/');
        await expect(figure(page).getByText(ALT)).toBeVisible();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.unroute(`**${SMALL}`);
      }
    }
  });
});
