import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const IDS = ['welcome', 'awards', 'work', 'tools', 'links'];
const LABELS = ['Welcome', 'Awards', 'Projects', 'Tools', 'Links'];
const phone = { width: 390, height: 844 };
const desktop = { width: 1280, height: 800 };
// The owner's words (T12 ticket).
const LEAD = 'Full-stack developer and project manager';
// The removed status strip under Welcome (T13 ticket): it must be nowhere on the page.
const STRIP = 'Full-stack developer, project manager';
const ABOUT =
  'BS Computer Science, University of Makati (UMak), College of Computing and Information Sciences. I build full-stack web apps and lead teams from idea to shipped product as project manager. Member of the UMak SIC Research and Development Committee.';

async function sectionOrder(page: Page) {
  const ids = await page.locator('main section').evaluateAll((els) => els.map((el) => el.id));
  expect(ids).toEqual(IDS);
  const tops = await Promise.all(
    IDS.map(async (id) => (await page.locator(`#${id}`).boundingBox())?.y ?? -1),
  );
  tops.slice(1).forEach((top, i) => expect(top).toBeGreaterThan(tops[i] ?? 0));
}

const bar = (page: Page) => page.getByRole('navigation', { name: 'Taskbar' });
const barLink = (page: Page, label: string) =>
  bar(page).getByRole('link', { name: label, exact: true });

async function openMenu(page: Page) {
  await page.locator('summary', { hasText: 'Menu' }).click();
}

// Opens the Menu and presses Escape in one page task, before any delayed event can run.
// False until the page has hydrated, so callers poll it.
function fastEscapeCloses(page: Page) {
  return page.evaluate(() => {
    const details = document.querySelector<HTMLDetailsElement>('nav[aria-label="Taskbar"] details');
    const summary = details?.querySelector('summary');
    if (!details || !summary) return false;
    details.open = false;
    summary.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return !details.open && document.activeElement === summary;
  });
}

test.describe('SITE-01, SITE-02 page shell', () => {
  test('phone: a fast Escape or a fast link click closes the Menu', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto('/');
    await expect.poll(() => fastEscapeCloses(page)).toBe(true);
    const openAfterLinkClick = await page.evaluate(() => {
      const details = document.querySelector<HTMLDetailsElement>(
        'nav[aria-label="Taskbar"] details',
      );
      details?.querySelector('summary')?.click();
      details?.querySelector<HTMLElement>('a[href="#links"]')?.click();
      return details?.open;
    });
    expect(openAfterLinkClick).toBe(false);
  });

  test('phone: order, intro first, menu, links, keyboard', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto('/');

    await test.step('SITE-01: sections appear in order, top to bottom', async () => {
      await sectionOrder(page);
      for (const [i, id] of IDS.entries()) {
        await expect(
          page.locator(`#${id}`).getByRole('heading', { name: LABELS[i], level: 2 }),
        ).toBeVisible();
      }
    });

    await test.step('SITE-02: the intro is the first content, with name, intro line and about text', async () => {
      const intro = page.locator('#welcome');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vonn Salve');
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
      await expect(intro.getByText(LEAD)).toBeVisible();
      await expect(intro.getByText(ABOUT, { exact: true })).toBeVisible();
      const firstTop = await intro.boundingBox();
      expect(firstTop?.y).toBeLessThan(40);
    });

    await test.step('SITE-01: each section opens from its own Menu link', async () => {
      for (const [i, id] of IDS.entries()) {
        await openMenu(page);
        await page
          .getByRole('navigation', { name: 'Taskbar' })
          .getByRole('link', { name: LABELS[i] })
          .click();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        await expect(page.locator(`#${id}`)).toBeInViewport();
        await expect(
          page.getByRole('navigation', { name: 'Taskbar' }).getByRole('link', { name: 'Projects' }),
        ).toBeHidden();
      }
    });

    await test.step('the taskbar names the current section while scrolling', async () => {
      const label = (text: string) =>
        page
          .getByRole('navigation', { name: 'Taskbar' })
          .getByText(text, { exact: true })
          .filter({ visible: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(label('Welcome')).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(label('Links')).toBeVisible();
    });

    await test.step('keyboard: Menu opens, Escape closes it and returns focus', async () => {
      const menu = page.locator('summary', { hasText: 'Menu' });
      await menu.focus();
      await page.keyboard.press('Enter');
      await expect(
        page.getByRole('navigation', { name: 'Taskbar' }).getByRole('link', { name: 'Links' }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('navigation', { name: 'Taskbar' }).getByRole('link', { name: 'Links' }),
      ).toBeHidden();
      await expect(menu).toBeFocused();
    });
  });

  test('desktop: order, taskbar links, current section, accessibility', async ({ page }) => {
    await page.setViewportSize(desktop);
    await page.goto('/');

    await test.step('SITE-01: sections appear in order, top to bottom', async () => {
      await sectionOrder(page);
    });

    await test.step('SITE-01: there is no sidebar; each section opens from the taskbar, which marks the current one', async () => {
      await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCount(0);
      for (const [i, id] of IDS.entries()) {
        await barLink(page, LABELS[i] ?? '').click();
        await expect(page).toHaveURL(`/#${id}`);
        await expect(page.locator(`#${id}`)).toBeInViewport();
      }
      await expect(barLink(page, 'Links')).toHaveAttribute('aria-current', 'true');
      await expect(page.locator('nav[aria-label="Taskbar"] [aria-current]')).toHaveCount(1);
    });

    await test.step('the footer has the copyright line', async () => {
      await expect(page.getByRole('contentinfo')).toContainText('© 2026 Vonn Salve');
    });

    await test.step('accessibility: no axe violations on the home page', async () => {
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });

  for (const width of [900, 1280]) {
    test.describe(`from 900 px, at ${width} px (SITE-01, NFR-04)`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
      });

      test('no sidebar; the bar has every section with its icon, no Menu, no section text', async ({
        page,
      }) => {
        await page.goto('/');
        await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCount(0);
        await expect(page.getByText('Contents', { exact: true })).toHaveCount(0);
        await expect(bar(page).locator('summary')).toBeHidden();
        await expect(bar(page).locator('details')).toBeHidden();
        // The text that names the current section (a direct child span) is hidden from 900 px.
        await expect(bar(page).locator(':scope > span:not([data-theme-slot])')).toBeHidden();
        for (const [i, id] of IDS.entries()) {
          const link = barLink(page, LABELS[i] ?? '');
          await expect(link).toBeVisible();
          await expect(link).toHaveAttribute('href', `#${id}`);
          await expect(link.locator('svg')).toBeVisible();
        }
        // Page order, left to right.
        const xs = await Promise.all(
          LABELS.map(async (l) => (await barLink(page, l).boundingBox())?.x ?? -1),
        );
        xs.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(xs[i] ?? 0));
      });

      test('the theme toggle is at the right, after the last section button', async ({ page }) => {
        await page.goto('/');
        await expect(bar(page).locator('button')).toBeVisible();
        const toggle = await bar(page).locator('button').boundingBox();
        const links = await barLink(page, 'Links').boundingBox();
        const nav = await bar(page).boundingBox();
        expect(toggle!.x).toBeGreaterThan(links!.x + links!.width);
        expect(nav!.x + nav!.width - (toggle!.x + toggle!.width)).toBeCloseTo(4, 0);
      });

      test('the windows are one centered column of at most 1040 px', async ({ page }) => {
        // Measured still (T14): the opening would change the windows' widths.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        const sections = page.locator('main > section, main > div > section');
        await expect(sections).toHaveCount(5);
        const first = await sections.first().boundingBox();
        expect(first!.width).toBeLessThanOrEqual(1040);
        // 984 px at 1280: the 1040 px page less its 28 px edges. 844 px at 900.
        expect(Math.round(first!.width)).toBe(Math.min(984, width - 56));
        expect(first!.x + first!.width / 2).toBeCloseTo(width / 2, 0);
        // One column: every window shares both edges, Links too.
        const edges = async (id: string) => {
          const b = await page.locator(`#${id}`).boundingBox();
          return [Math.round(b!.x), Math.round(b!.x + b!.width)];
        };
        const column = await edges('welcome');
        expect(await edges('awards')).toEqual(column);
        expect(await edges('work')).toEqual(column);
        expect(await edges('tools')).toEqual(column);
        expect(await edges('links')).toEqual(column);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
      });

      test('the keyboard reaches every section button in order, then the toggle; Enter goes', async ({
        page,
      }) => {
        await page.goto('/');
        // The toggle button exists once the page has hydrated; it is the last stop.
        await expect(bar(page).locator('button')).toBeVisible();
        await barLink(page, 'Welcome').focus();
        for (const label of LABELS.slice(1)) {
          await page.keyboard.press('Tab');
          await expect(barLink(page, label)).toBeFocused();
        }
        await page.keyboard.press('Tab');
        await expect(bar(page).locator('button')).toBeFocused();
        await barLink(page, 'Links').focus();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL('/#links');
        await expect(page.locator('#links')).toBeInViewport();
      });

      for (const scheme of ['light', 'dark'] as const) {
        test(`${scheme} theme: the current section is in the title colors; no axe violations`, async ({
          page,
        }) => {
          await page.emulateMedia({ colorScheme: scheme });
          await page.goto('/');
          await expect(barLink(page, 'Welcome')).toHaveAttribute('aria-current', 'true');
          await expect(bar(page).locator('[aria-current]')).toHaveCount(1);
          await barLink(page, 'Links').click();
          const link = barLink(page, 'Links');
          await expect(link).toHaveAttribute('aria-current', 'true');
          const [bg, fg, title, titleText] = await link.evaluate((el) => {
            const probe = document.createElement('div');
            probe.style.cssText = 'background:var(--title);color:var(--titleText)';
            document.body.append(probe);
            const p = getComputedStyle(probe);
            const out = [
              getComputedStyle(el).backgroundColor,
              getComputedStyle(el).color,
              p.backgroundColor,
              p.color,
            ];
            probe.remove();
            return out;
          });
          expect([bg, fg]).toEqual([title, titleText]);
          // Only the current one is marked.
          await expect(barLink(page, 'Welcome')).not.toHaveAttribute('aria-current', 'true');
          expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        });
      }

      test.describe('without JavaScript', () => {
        test.use({ javaScriptEnabled: false });

        test('the links work and no section is marked current', async ({ page }) => {
          await page.goto('/');
          await expect(page.locator('[aria-current]')).toHaveCount(0);
          await expect(bar(page).locator('summary')).toBeHidden();
          await expect(barLink(page, 'Links').locator('svg')).toBeVisible();
          await barLink(page, 'Links').click();
          await expect(page).toHaveURL('/#links');
          await expect(page.locator('#links')).toBeInViewport();
          await expect(page.locator('[aria-current]')).toHaveCount(0);
        });
      });

      test('error state: the not-found page has the same bar and column, and its links work', async ({
        page,
      }) => {
        await page.goto('/no-such-page');
        await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCount(0);
        const box = await page.locator('section').boundingBox();
        expect(Math.round(box!.width)).toBe(Math.min(984, width - 56));
        expect(box!.x + box!.width / 2).toBeCloseTo(width / 2, 0);
        await expect(bar(page).locator('summary')).toBeHidden();
        await expect(page.locator('[aria-current]')).toHaveCount(0);
        for (const [i, id] of IDS.entries()) {
          const link = barLink(page, LABELS[i] ?? '');
          await expect(link).toHaveAttribute('href', `/#${id}`);
          await expect(link.locator('svg')).toBeVisible();
        }
        await barLink(page, 'Links').click();
        await expect(page).toHaveURL('/#links');
        await expect(page.locator('#links')).toBeInViewport();
      });
    });
  }

  for (const width of [390, 639]) {
    test(`below 640 px nothing changed, at ${width} px: Menu and section name, no section buttons`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCount(0);
      await expect(bar(page).locator('summary')).toBeVisible();
      await expect(bar(page).locator(':scope > span:not([data-theme-slot])')).toBeVisible();
      await expect(bar(page).locator('a.button:visible')).toHaveCount(0);
    });
  }

  for (const width of [640, 768, 899]) {
    test(`640 to 899 px nothing changed, at ${width} px: Menu and section buttons without icons`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCount(0);
      await expect(bar(page).locator('summary')).toBeVisible();
      await expect(bar(page).locator(':scope > span:not([data-theme-slot])')).toBeHidden();
      for (const label of LABELS) {
        await expect(barLink(page, label)).toBeVisible();
        await expect(barLink(page, label).locator('svg')).toBeHidden();
      }
    });
  }

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false, viewport: phone });

    test('the Menu links work and no section is marked current', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[aria-current]')).toHaveCount(0);
      await openMenu(page);
      await page
        .getByRole('navigation', { name: 'Taskbar' })
        .getByRole('link', { name: 'Links' })
        .click();
      await expect(page).toHaveURL(/#links$/);
      await expect(page.locator('#links')).toBeInViewport();
    });
  });

  test('error state: a wrong address shows the not-found window with a way home', async ({
    page,
  }) => {
    const response = await page.goto('/no-such-page');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Go to the home page' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vonn Salve');
  });

  test('error state: not-found keeps the board layout, taskbar and working links', async ({
    page,
  }) => {
    await page.setViewportSize(phone);
    await page.goto('/no-such-page');
    await expect.poll(() => fastEscapeCloses(page)).toBe(true);
    await expect(page.locator('[aria-current]')).toHaveCount(0);
    await openMenu(page);
    await page
      .getByRole('navigation', { name: 'Taskbar' })
      .getByRole('link', { name: 'Links' })
      .click();
    await expect(page).toHaveURL('/#links');
    await expect(page.locator('#links')).toBeInViewport();

    // From 900 px the window is the one centered column, as on the home page (owner, 2026-11-25).
    await page.setViewportSize(desktop);
    await page.goto('/no-such-page');
    const box = await page.locator('section').boundingBox();
    expect(Math.abs((box?.x ?? 0) - 148)).toBeLessThanOrEqual(2);
    expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) - 1132)).toBeLessThanOrEqual(2);
  });

  test('SITE-02: the browser tab title is the owner name', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Vonn Salve');
  });

  for (const path of ['/', '/no-such-page']) {
    test(`the tab icon is the supplied file and nothing fails to load, on ${path}`, async ({
      page,
    }) => {
      const failed: string[] = [];
      page.on('requestfailed', (r) => failed.push(r.url()));
      // The not-found document itself answers 404 on purpose.
      page.on('response', (r) => {
        if (r.status() >= 400 && r.request().resourceType() !== 'document') failed.push(r.url());
      });
      await page.goto(path);
      const icon = page.locator('link[rel~="icon"]');
      await expect(icon).toHaveCount(1);
      await expect(icon).toHaveAttribute('href', /^\/icon\.svg(\?.*)?$/);
      await expect(icon).toHaveAttribute('type', 'image/svg+xml');
      const response = await page.request.get((await icon.getAttribute('href')) ?? '');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/svg+xml');
      const supplied = readFileSync(new URL('../../src/app/icon.svg', import.meta.url));
      expect((await response.body()).equals(supplied)).toBe(true);
      expect(failed).toEqual([]);
    });
  }
});

// Below 640 px the section links are in the Menu; from 900 px they are in the bar.
const NAV = [
  { size: phone, place: 'Menu', reveal: openMenu },
  { size: desktop, place: 'bar', reveal: () => Promise.resolve() },
];

test.describe('SITE-01, SITE-02 the owner words and the name Projects', () => {
  for (const { size, place, reveal } of NAV) {
    test(`the intro, the Projects names and the about text at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      const intro = page.locator('#welcome');
      await expect(intro.getByText(LEAD, { exact: true })).toBeVisible();
      await expect(page.getByText(STRIP, { exact: true })).toHaveCount(0);
      await expect(
        intro.getByRole('link', { name: 'See my projects', exact: true }),
      ).toHaveAttribute('href', '#work');
      await expect(page.locator('#work').getByRole('heading', { level: 2 })).toHaveText('Projects');
      await expect(intro.getByText(ABOUT, { exact: true })).toBeVisible();
      await reveal(page);
      await expect(barLink(page, 'Projects')).toBeVisible();
      await expect(barLink(page, 'Projects')).toHaveAttribute('href', '#work');
      await expect(
        bar(page).getByRole('link', { name: 'Work', exact: true, includeHidden: true }),
      ).toHaveCount(0);
    });

    test(`the intro button, #work and the current mark at ${size.width} px (${place})`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.getByRole('link', { name: 'See my projects', exact: true }).click();
      await expect(page).toHaveURL('/#work');
      await expect(page.locator('#work')).toBeInViewport();
      await page.goto('about:blank');
      await page.goto('/#work');
      await expect(page.locator('#work')).toBeInViewport();
      // The link in the Menu and the button in the bar are the same section; one is marked.
      await expect(bar(page).locator('[aria-current="true"]')).toHaveAttribute('href', '#work');
      // The bar names the section: in its text below 640 px, on its button from 900 px.
      await expect(
        bar(page).getByText('Projects', { exact: true }).filter({ visible: true }),
      ).toHaveCount(1);
      await reveal(page);
      await barLink(page, 'Projects').click();
      await expect(page).toHaveURL('/#work');
      await expect(page.locator('#work')).toBeInViewport();
    });

    test(`error state: the not-found Projects link goes to #work at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/no-such-page');
      await reveal(page);
      await expect(barLink(page, 'Projects')).toHaveAttribute('href', '/#work');
      await barLink(page, 'Projects').click();
      await expect(page).toHaveURL('/#work');
      await expect(page.locator('#work')).toBeInViewport();
      await expect(page.locator('#work').getByRole('heading', { level: 2 })).toHaveText('Projects');
    });
  }

  // The narrowest and widest width of each bar layout. "Projects" is longer than the old name.
  const NARROW = ['Menu', 'Projects', 'Dark theme'];
  const MIDDLE = ['Menu', ...LABELS, 'Dark theme'];
  const WIDE = [...LABELS, 'Dark theme'];
  for (const [width, shown] of [
    [320, NARROW],
    [390, NARROW],
    [639, NARROW],
    [640, MIDDLE],
    [899, MIDDLE],
    [900, WIDE],
    [1280, WIDE],
  ] as const) {
    test(`the bar fits on one row, inside the screen, at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/#work');
      await expect(bar(page).locator('button')).toBeVisible();
      await expect(bar(page).locator('a[href="#work"][aria-current="true"]')).toHaveCount(1);
      const items = await bar(page).evaluate((nav) =>
        [
          ...nav.querySelectorAll<HTMLElement>(
            ':scope > details > summary, :scope > a, :scope > span',
          ),
        ]
          .filter((el) => el.checkVisibility())
          .map((el) => {
            const box = el.getBoundingClientRect();
            return {
              // Only the text that is shown: the toggle also holds hidden text that sizes it.
              text: el.innerText.trim(),
              left: box.left,
              right: box.right,
              top: box.top,
              bottom: box.bottom,
              clipped: el.scrollWidth > el.clientWidth && el.clientWidth > 0,
            };
          }),
      );
      expect(items.map((i) => i.text)).toEqual(shown);
      expect(items.filter((i) => i.left < 0 || i.right > width)).toEqual([]);
      expect(items.filter((i) => i.clipped)).toEqual([]);
      // Left to right without overlap, and all sharing one row.
      expect(items.filter((i, n) => i.left < (items[n - 1]?.right ?? 0) - 0.5)).toEqual([]);
      expect(Math.max(...items.map((i) => i.top))).toBeLessThan(
        Math.min(...items.map((i) => i.bottom)),
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }
});

test.describe('SITE-01, SITE-02 the about text is in Welcome and there is no About section', () => {
  const targets = IDS.map((id) => `#${id}`);
  const hrefs = (page: Page, selector: string) =>
    bar(page)
      .locator(selector)
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));

  for (const { size, reveal } of NAV) {
    test(`five sections in the page, bar and Menu, and no About, at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await sectionOrder(page);
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(LABELS);
      expect(await hrefs(page, ':scope > a')).toEqual(targets);
      expect(await hrefs(page, 'details a')).toEqual(targets);
      await expect(page.locator('#about')).toHaveCount(0);
      await expect(page.locator('a[href$="#about"]')).toHaveCount(0);
      await expect(page.getByText('About', { exact: true })).toHaveCount(0);
      await expect(page.getByText(STRIP, { exact: true })).toHaveCount(0);
      await expect(page.locator('#welcome > p')).toHaveCount(0);
      // The about text is on the page once.
      await expect(page.getByText(ABOUT, { exact: true })).toHaveCount(1);
    });

    test(`Welcome shows the photo, name, role line, about text, then buttons, at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      const intro = page.locator('#welcome');
      const parts = [
        intro.locator('figure'),
        intro.getByRole('heading', { level: 1 }),
        intro.getByText(LEAD, { exact: true }),
        intro.getByText(ABOUT, { exact: true }),
        intro.getByRole('link', { name: 'See my projects', exact: true }),
      ];
      await expect(intro.getByRole('link', { name: 'Download Resume', exact: true })).toBeVisible();
      await expect(intro.getByText(ABOUT, { exact: true })).toHaveText(ABOUT);
      // The reading order, as a screen reader meets it.
      expect(
        await intro.locator('figure, h1, p, a').evaluateAll((els) => els.map((el) => el.tagName)),
      ).toEqual(['FIGURE', 'H1', 'P', 'P', 'A', 'A']);
      const boxes = [];
      for (const part of parts) {
        await expect(part).toBeVisible();
        const box = await part.boundingBox();
        if (!box) throw new Error('no box');
        boxes.push(box);
      }
      const [photo, ...text] = boxes;
      if (!photo || !text[0]) throw new Error('no photo or name');
      // On a phone the photo is above the name; from 640 px it is in the column to its left.
      const beside = photo.x + photo.width <= text[0].x;
      const above = photo.y + photo.height <= text[0].y;
      expect([beside, above]).toEqual(size.width < 640 ? [false, true] : [true, false]);
      expect(
        text.slice(1).filter((box, i) => box.y < (text[i]?.y ?? 0) + (text[i]?.height ?? 0)),
      ).toEqual([]);
    });

    test(`an old #about address shows the page at the top, at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/#about');
      // The page has run script once the filter is on; below 640 px its radios are hidden.
      await expect(page.locator('#work input[type="radio"]').first()).toBeEnabled();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vonn Salve');
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await sectionOrder(page);
      await expect(bar(page).locator('[aria-current="true"]')).toHaveAttribute('href', '#welcome');
      await expect(page.locator('a[href$="#about"]')).toHaveCount(0);
    });

    test(`the current mark follows each of the five sections, at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await expect(bar(page).locator('button')).toBeVisible();
      for (const i of [4, 3, 2, 1, 0]) {
        await reveal(page);
        await barLink(page, LABELS[i] ?? '').click();
        await expect(page).toHaveURL(`/#${IDS[i]}`);
        await expect(bar(page).locator('[aria-current="true"]')).toHaveCount(1);
        await expect(bar(page).locator('[aria-current="true"]')).toHaveAttribute(
          'href',
          `#${IDS[i]}`,
        );
        // The bar names it: in its own text below 640 px, on the button from 900 px.
        await expect(
          bar(page)
            .getByText(LABELS[i] ?? '', { exact: true })
            .filter({ visible: true }),
        ).toHaveCount(1);
      }
    });

    test(`error state: not-found has the same five links and no About, at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/no-such-page');
      const away = targets.map((t) => `/${t}`);
      expect(await hrefs(page, ':scope > a')).toEqual(away);
      expect(await hrefs(page, 'details a')).toEqual(away);
      await expect(page.locator('a[href$="#about"]')).toHaveCount(0);
      await expect(page.getByText('About', { exact: true })).toHaveCount(0);
      await expect(page.locator('[aria-current]')).toHaveCount(0);
    });
  }

  test('at 320 px the about text is readable, with no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    const about = page.locator('#welcome').getByText(ABOUT, { exact: true });
    await expect(about).toBeVisible();
    const box = await about.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        across: el.scrollWidth <= el.clientWidth,
        down: el.scrollHeight <= el.clientHeight,
        size: getComputedStyle(el).fontSize,
      };
    });
    expect(box).toMatchObject({ across: true, down: true, size: '16px' });
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  });
});

// The bar keeps room: for wider fallback fonts, with its five sections (T13 and T15 tickets; the
// 32 px is the lead's number, 2026-11-26).
test.describe('SITE-01 the room in the bar', () => {
  const measure = (page: Page) =>
    bar(page).evaluate((nav) => {
      const items = [
        ...nav.querySelectorAll<HTMLElement>(
          ':scope > details > summary, :scope > a, :scope > span',
        ),
      ].filter((el) => el.checkVisibility());
      const boxes = items.map((el) => el.getBoundingClientRect());
      const [before, toggle] = boxes.slice(-2);
      if (!before || !toggle) throw new Error('the bar is empty');
      return {
        // The space between the theme toggle and what is before it, beyond the usual gap.
        free: toggle.left - before.right - parseFloat(getComputedStyle(nav).columnGap),
        outside: boxes.filter((b) => b.left < 0 || b.right > window.innerWidth).length,
        rows:
          Math.max(...boxes.map((b) => b.top)) < Math.min(...boxes.map((b) => b.bottom)) ? 1 : 2,
        clipped: items.filter((el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth).length,
        sideways: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
  const FITS = { outside: 0, rows: 1, clipped: 0, sideways: false };

  const loadedFonts = (page: Page) =>
    page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts]
        .filter((f) => f.status === 'loaded' && !f.family.includes('Fallback'))
        .map((f) => f.family);
    });

  for (const path of ['/', '/#work', '/no-such-page']) {
    test(`at 640 px with five sections, at least 32 px stay free in the site font, on ${path}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 640, height: 800 });
      await page.goto(path);
      await expect(bar(page).locator('button')).toBeVisible();
      expect((await loadedFonts(page)).join()).toMatch(/Plex/);
      await expect(bar(page).locator(':scope > a:visible')).toHaveCount(5);
      const room = await measure(page);
      expect(room).toMatchObject(FITS);
      expect(room.free).toBeGreaterThanOrEqual(32);
    });

    test(`at 640 px with five sections and web fonts blocked, nothing overflows, on ${path}`, async ({
      page,
    }) => {
      await page.route('**/_next/static/media/**', (route) => route.abort());
      await page.setViewportSize({ width: 640, height: 800 });
      await page.goto(path);
      await expect(bar(page).locator('button')).toBeVisible();
      expect(await loadedFonts(page)).toEqual([]);
      await expect(bar(page).locator(':scope > a:visible')).toHaveCount(5);
      expect(await measure(page)).toMatchObject(FITS);
    });
  }

  for (const width of [899, 900]) {
    test(`at ${width} px the five sections fit on one row`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/#work');
      await expect(bar(page).locator('button')).toBeVisible();
      await expect(bar(page).locator(':scope > a:visible')).toHaveCount(5);
      expect(await measure(page)).toMatchObject(FITS);
    });
  }

  for (const blocked of [false, true]) {
    test(`one row inside the screen at every width from 320 to 960 px, web fonts ${blocked ? 'blocked' : 'loaded'}`, async ({
      page,
    }) => {
      if (blocked) await page.route('**/_next/static/media/**', (route) => route.abort());
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto('/#work');
      await expect(bar(page).locator('button')).toBeVisible();
      await loadedFonts(page);
      const bad: unknown[] = [];
      for (let width = 320; width <= 960; width += 1) {
        await page.setViewportSize({ width, height: 800 });
        const { outside, rows, clipped, sideways } = await measure(page);
        if (outside || rows !== 1 || clipped || sideways) {
          bad.push({ width, outside, rows, clipped, sideways });
        }
      }
      expect(bad).toEqual([]);
    });
  }
});
