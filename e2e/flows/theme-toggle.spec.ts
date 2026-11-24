import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Token values from docs/standards/design-brief.md.
const TOKENS = {
  light: { face: '#d8d4e0', text: '#1d1826', desk: 'rgb(90, 74, 120)' },
  dark: { face: '#322b42', text: '#f3effa', desk: 'rgb(29, 22, 48)' },
};
const BLOCKED = 'warning: theme: device storage is blocked, so the site follows the device setting';
const toggle = (page: Page) => page.getByRole('button', { name: /^(Dark|Light) theme$/ });
const slot = (page: Page) => page.locator('[data-theme-slot]');

async function paint(page: Page) {
  return page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    return {
      attr: document.documentElement.getAttribute('data-theme'),
      face: css.getPropertyValue('--face').trim().toLowerCase(),
      text: css.getPropertyValue('--text').trim().toLowerCase(),
      desk: getComputedStyle(document.body).backgroundColor,
    };
  });
}

// A font much wider than the site's, so the reserved width cannot depend on the real font.
const FONT_CSS = {
  site: '',
  wide: '*{font-family:monospace!important;letter-spacing:3px!important}',
};
// Board natural button width is about 112 px; a wide font must make the slot wider.
const WIDTHS = { site: [105, 121], wide: [121, 400] };

test.describe('THEME-01 light and dark', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`first visit matches a ${scheme} device`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await expect(toggle(page)).toBeVisible();
      expect(await paint(page)).toMatchObject({ attr: null, ...TOKENS[scheme] });
      await expect(toggle(page)).toHaveText({ light: 'Dark theme', dark: 'Light theme' }[scheme]);
    });
  }

  test('the keyboard reaches the toggle; Enter and Space switch and rename it', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(toggle(page)).toBeVisible();

    await test.step('Shift+Tab from the page start reaches the toggle, the last control', async () => {
      await page.keyboard.press('Shift+Tab');
      await expect(toggle(page)).toBeFocused();
    });

    await test.step('Enter switches to dark and the label names light', async () => {
      await page.keyboard.press('Enter');
      expect(await paint(page)).toMatchObject({ attr: 'dark', ...TOKENS.dark });
      await expect(toggle(page)).toHaveText('Light theme');
    });

    await test.step('Space switches back to light', async () => {
      await page.keyboard.press('Space');
      expect(await paint(page)).toMatchObject({ attr: 'light', ...TOKENS.light });
      await expect(toggle(page)).toHaveText('Dark theme');
    });
  });

  test('the label and the next click follow a device change on an open page', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(toggle(page)).toHaveText('Dark theme');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(toggle(page)).toHaveText('Light theme');
    await toggle(page).click();
    expect(await paint(page)).toMatchObject({ attr: 'light', ...TOKENS.light });
  });

  test('the choice survives a reload and no request carries it', async ({ page, context }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(toggle(page)).toBeVisible();
    const sent: { url: string; cookie?: string; body: string | null }[] = [];
    page.on('request', (r) =>
      sent.push({ url: r.url(), cookie: r.headers()['cookie'], body: r.postData() }),
    );
    await toggle(page).click();
    await page.reload();
    await expect(toggle(page)).toHaveText('Light theme');
    expect(await paint(page)).toMatchObject({ attr: 'dark', ...TOKENS.dark });
    expect(sent.length).toBeGreaterThan(0);
    for (const r of sent) {
      expect(new URL(r.url).search).toBe('');
      expect(r.cookie).toBeUndefined();
      expect(r.body).toBeNull();
    }
    expect(await context.cookies()).toEqual([]);
  });

  for (const font of ['site', 'wide'] as const) {
    test(`a stored choice paints before any script runs; the slot never resizes (${font} font)`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
      await page.addInitScript((css) => {
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style');
          style.textContent = css;
          document.head.append(style);
          document.documentElement.dataset['fontReady'] = '';
        });
      }, FONT_CSS[font]);
      await page.route('**/_next/static/**/*.js', (route) => route.abort());
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => 'fontReady' in document.documentElement.dataset);
      expect(await paint(page)).toMatchObject({ attr: 'dark', ...TOKENS.dark });
      await expect(toggle(page)).toHaveCount(0);
      const before = await slot(page).boundingBox();
      await page.unroute('**/_next/static/**/*.js');
      await page.reload();
      await expect(toggle(page)).toBeVisible();
      expect(await slot(page).boundingBox()).toEqual(before);
      await toggle(page).click();
      await expect(toggle(page)).toHaveText('Dark theme');
      expect(await slot(page).boundingBox()).toEqual(before);
      const [min, max] = WIDTHS[font];
      expect(before!.width).toBeGreaterThan(min);
      expect(before!.width).toBeLessThan(max);
    });
  }

  test('with storage blocked: follows the device, toggles for the page view, warns', async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (m) => warnings.push(`${m.type()}: ${m.text()}`));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() =>
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('blocked');
        },
      }),
    );
    await page.goto('/');
    await expect(toggle(page)).toHaveText('Light theme');
    expect(await paint(page)).toMatchObject({ attr: null, ...TOKENS.dark });
    expect(warnings.filter((w) => w.includes('theme:'))).toEqual([BLOCKED]);
    await toggle(page).click();
    expect(await paint(page)).toMatchObject({ attr: 'light', ...TOKENS.light });
    expect(warnings.filter((w) => w.includes('theme:'))).toEqual([BLOCKED, BLOCKED]);
    await page.reload();
    expect(await paint(page)).toMatchObject({ attr: null, ...TOKENS.dark });
  });

  test('NFR-04: no axe violations in either theme; the toggle sits at the taskbar right', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await expect(toggle(page)).toBeVisible();
      const bar = await page.getByRole('navigation', { name: 'Taskbar' }).boundingBox();
      const box = await toggle(page).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(bar!.x + bar!.width - (box!.x + box!.width)).toBeCloseTo(4, 0);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await toggle(page).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.goto('/no-such-page');
    await expect(toggle(page)).toBeVisible();
  });
});
