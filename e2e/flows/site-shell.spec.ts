import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const IDS = ['welcome', 'awards', 'work', 'about', 'links'];
const LABELS = ['Welcome', 'Awards', 'Work', 'About', 'Links'];
const phone = { width: 390, height: 844 };
const desktop = { width: 1280, height: 800 };

async function sectionOrder(page: Page, strict: boolean) {
  const ids = await page.locator('main section').evaluateAll((els) => els.map((el) => el.id));
  expect(ids).toEqual(IDS);
  const tops = await Promise.all(
    IDS.map(async (id) => (await page.locator(`#${id}`).boundingBox())?.y ?? -1),
  );
  tops.slice(1).forEach((top, i) => {
    const before = tops[i] ?? 0;
    // About and Links sit side by side on desktop, so their tops are equal there.
    if (strict) expect(top).toBeGreaterThan(before);
    else expect(top).toBeGreaterThanOrEqual(before);
  });
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

test.describe('SITE-01, SITE-02, SITE-03 page shell', () => {
  test('phone: a fast Escape or a fast link click closes the Menu', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto('/');
    await expect.poll(() => fastEscapeCloses(page)).toBe(true);
    const openAfterLinkClick = await page.evaluate(() => {
      const details = document.querySelector<HTMLDetailsElement>(
        'nav[aria-label="Taskbar"] details',
      );
      details?.querySelector('summary')?.click();
      details?.querySelector<HTMLElement>('a[href="#about"]')?.click();
      return details?.open;
    });
    expect(openAfterLinkClick).toBe(false);
  });

  test('phone: order, intro first, menu, links, keyboard', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto('/');

    await test.step('SITE-01: sections appear in order, top to bottom', async () => {
      await sectionOrder(page, true);
      for (const [i, id] of IDS.entries()) {
        await expect(
          page.locator(`#${id}`).getByRole('heading', { name: LABELS[i], level: 2 }),
        ).toBeVisible();
      }
    });

    await test.step('SITE-02: the intro is the first content, with name, intro line and strip', async () => {
      const intro = page.locator('#welcome');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vonn Salve');
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
      await expect(intro.getByText('Frontend developer and project manager')).toBeVisible();
      await expect(intro.getByText('Frontend developer, project manager')).toBeVisible();
      const firstTop = await intro.boundingBox();
      expect(firstTop?.y).toBeLessThan(40);
    });

    await test.step('SITE-03: the about window shows the owner text', async () => {
      await expect(page.locator('#about')).toContainText(
        'BS Computer Science, University of Makati',
      );
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
          page.getByRole('navigation', { name: 'Taskbar' }).getByRole('link', { name: 'Work' }),
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
        page.getByRole('navigation', { name: 'Taskbar' }).getByRole('link', { name: 'About' }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('navigation', { name: 'Taskbar' }).getByRole('link', { name: 'About' }),
      ).toBeHidden();
      await expect(menu).toBeFocused();
    });
  });

  test('desktop: order, taskbar links, current section, accessibility', async ({ page }) => {
    await page.setViewportSize(desktop);
    await page.goto('/');

    await test.step('SITE-01: sections appear in order (About and Links side by side)', async () => {
      await sectionOrder(page, false);
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
        await page.goto('/');
        const sections = page.locator('main > section, main > div > section');
        await expect(sections).toHaveCount(5);
        const first = await sections.first().boundingBox();
        expect(first!.width).toBeLessThanOrEqual(1040);
        // 984 px at 1280: the 1040 px page less its 28 px edges. 844 px at 900.
        expect(Math.round(first!.width)).toBe(Math.min(984, width - 56));
        expect(first!.x + first!.width / 2).toBeCloseTo(width / 2, 0);
        // One column: the full-width windows share both edges; About and Links share the last row.
        const edges = async (id: string) => {
          const b = await page.locator(`#${id}`).boundingBox();
          return [Math.round(b!.x), Math.round(b!.x + b!.width)];
        };
        const column = await edges('welcome');
        expect(await edges('awards')).toEqual(column);
        expect(await edges('work')).toEqual(column);
        expect((await edges('about'))[0]).toBe(column[0]);
        expect((await edges('links'))[1]).toBe(column[1]);
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
        await barLink(page, 'About').focus();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL('/#about');
        await expect(page.locator('#about')).toBeInViewport();
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
          await expect(barLink(page, 'About').locator('svg')).toBeVisible();
          await barLink(page, 'About').click();
          await expect(page).toHaveURL('/#about');
          await expect(page.locator('#about')).toBeInViewport();
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
        await barLink(page, 'About').click();
        await expect(page).toHaveURL('/#about');
        await expect(page.locator('#about')).toBeInViewport();
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
        .getByRole('link', { name: 'About' })
        .click();
      await expect(page).toHaveURL(/#about$/);
      await expect(page.locator('#about')).toBeInViewport();
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
      .getByRole('link', { name: 'About' })
      .click();
    await expect(page).toHaveURL('/#about');
    await expect(page.locator('#about')).toBeInViewport();

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
});
