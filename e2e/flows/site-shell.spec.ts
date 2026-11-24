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

async function openMenu(page: Page) {
  await page.locator('summary', { hasText: 'Menu' }).click();
}

// Opens the Menu and presses Escape in one page task, before any delayed event can run.
// False until the page has hydrated, so callers poll it.
function fastEscapeCloses(page: Page) {
  return page.evaluate(() => {
    const details = document.querySelector('details');
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
      const details = document.querySelector('details');
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
      await expect(intro.getByText('Software developer, project manager')).toBeVisible();
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

  test('desktop: order, tree links, current section, accessibility', async ({ page }) => {
    await page.setViewportSize(desktop);
    await page.goto('/');

    await test.step('SITE-01: sections appear in order (About and Links side by side)', async () => {
      await sectionOrder(page, false);
    });

    await test.step('SITE-01: each section opens from the tree, which marks the current one', async () => {
      const tree = page.getByRole('navigation', { name: 'Sections' });
      for (const [i, id] of IDS.entries()) {
        await tree.getByRole('link', { name: LABELS[i] }).click();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        await expect(page.locator(`#${id}`)).toBeInViewport();
      }
      await expect(tree.getByRole('link', { name: 'Links' })).toHaveAttribute(
        'aria-current',
        'true',
      );
    });

    await test.step('the footer has the copyright line', async () => {
      await expect(page.getByRole('contentinfo')).toContainText('© 2026 Vonn Salve');
    });

    await test.step('accessibility: no axe violations on the home page', async () => {
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });

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

    // Board: from 900 px the window sits in the content column of the same 1200 px page.
    await page.setViewportSize(desktop);
    await page.goto('/no-such-page');
    const box = await page.locator('section').boundingBox();
    expect(Math.abs((box?.x ?? 0) - 308)).toBeLessThanOrEqual(2);
    expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) - 1212)).toBeLessThanOrEqual(2);
  });

  test('SITE-02: the browser tab title is the owner name', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Vonn Salve');
  });
});
