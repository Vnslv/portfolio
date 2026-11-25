import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const phone = { width: 390, height: 844 };
const desktop = { width: 1280, height: 800 };
const SOFTWARE = 'Software development';
const ALUNSINA_ALT = 'Alunsina logo: a cat, a dog and a rabbit around a cross';
const HERONPAY_ALT = 'HeronPay logo: a heron with signal waves';

const card = (page: Page, id: string) => page.locator(`li[data-project="${id}"]`);
const summary = (page: Page, id: string) => card(page, id).locator('summary');
const isOpen = (page: Page, id: string) =>
  card(page, id)
    .locator('details')
    .evaluate((el: HTMLDetailsElement) => el.open);

// Replaces the clipboard before the page runs, so a test controls success and failure.
async function stubClipboard(page: Page, outcome: 'ok' | 'fail') {
  await page.addInitScript((o) => {
    const win = window as unknown as { copied: string[] };
    win.copied = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          if (o === 'fail') return Promise.reject(new Error('denied'));
          win.copied.push(text);
          return Promise.resolve();
        },
      },
    });
  }, outcome);
}

test.describe('WORK-01 to WORK-06 work list, filter, details', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(desktop);
  });

  test('happy: filter, return to all, open, close by keyboard', async ({ page }) => {
    await page.goto('/');
    const work = page.locator('#work');

    await test.step('WORK-01: five projects once each, with role and team labels', async () => {
      await expect(card(page, 'idiya')).toHaveCount(1);
      await expect(work.locator('li[data-project]')).toHaveCount(5);
      await expect(card(page, 'heronpay')).toContainText('Project management');
      await expect(card(page, 'idiya')).toContainText(
        'Software development and project management',
      );
      await expect(card(page, 'idiya')).toContainText('Solo project');
      await expect(card(page, 'idiya')).toContainText('Full-stack developer and project manager');
      await expect(card(page, 'ehanda')).toContainText('Team of 5');
      await expect(work).toContainText('5 of 5 projects');
    });

    await test.step('WORK-02: filter, then return to all', async () => {
      await work.getByRole('radio', { name: SOFTWARE }).check();
      await expect(work.locator('li[data-project]')).toHaveCount(2);
      await expect(card(page, 'umak-kalinga')).toBeVisible();
      await expect(card(page, 'idiya')).toBeVisible();
      await work.getByRole('radio', { name: 'Project management' }).check();
      await expect(work.locator('li[data-project]')).toHaveCount(5);
      await work.getByRole('radio', { name: 'All' }).check();
      await expect(work.locator('li[data-project]')).toHaveCount(5);
    });

    await test.step('WORK-03: open and close with the keyboard, no outcome', async () => {
      await summary(page, 'idiya').focus();
      await page.keyboard.press('Enter');
      const idiya = card(page, 'idiya');
      await expect(idiya.getByText('Problem')).toBeVisible();
      await expect(idiya.getByText('What I did')).toBeVisible();
      await expect(idiya).toContainText('Designed and built a free, multi-team task platform');
      await expect(idiya).toContainText('Next.js 15, TypeScript');
      await expect(idiya.getByRole('link', { name: 'Live' })).toHaveAttribute(
        'href',
        'https://idiya.vercel.app/',
      );
      await expect(idiya).not.toContainText('Outcome');
      await page.keyboard.press('Enter');
      expect(await isOpen(page, 'idiya')).toBe(false);
      await page.keyboard.press('Space');
      expect(await isOpen(page, 'idiya')).toBe(true);
      await idiya.getByRole('button', { name: 'Close' }).click();
      expect(await isOpen(page, 'idiya')).toBe(false);
      await expect(summary(page, 'idiya')).toBeFocused();
    });

    await test.step('opening one project closes the other; names use the text font', async () => {
      await summary(page, 'ehanda').click();
      await summary(page, 'idiya').click();
      expect(await isOpen(page, 'ehanda')).toBe(false);
      expect(await isOpen(page, 'idiya')).toBe(true);
      const font = await card(page, 'idiya')
        .locator('h3')
        .evaluate((el) => {
          const style = getComputedStyle(el);
          return { family: style.fontFamily, weight: style.fontWeight };
        });
      expect(font.family).toMatch(/Plex/i);
      expect(font.family).not.toMatch(/Pixelify/i);
      expect(Number(font.weight)).toBeGreaterThanOrEqual(700);
    });

    await test.step('accessibility: no axe violations with a project open', async () => {
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
  });

  test('WORK-04: a shared link opens its project even when a filter hides it', async ({ page }) => {
    await page.goto('/');
    const work = page.locator('#work');
    await work.getByRole('radio', { name: SOFTWARE }).check();
    await expect(card(page, 'alunsina')).toHaveCount(0);
    await page.evaluate(() => (location.hash = '#alunsina'));
    await expect(card(page, 'alunsina')).toBeVisible();
    await expect.poll(() => isOpen(page, 'alunsina')).toBe(true);
    await expect(work.locator('li[data-project]')).toHaveCount(3);
    await page.goto('/#umak-kalinga');
    await expect.poll(() => isOpen(page, 'umak-kalinga')).toBe(true);
    await expect(card(page, 'umak-kalinga').getByText('Problem')).toBeInViewport();
  });

  test('WORK-04: the same link opens its project again after it was closed', async ({ page }) => {
    await page.goto('/');
    // Wait for the page to run script: Next rewrites the address while it hydrates, which can
    // erase a hash set before then (seen with a scratch test, 3 of 6 runs; without this wait the
    // test failed 10 of 10 after the router fix).
    await expect(page.locator('#work').getByRole('radio', { name: 'All' })).toBeEnabled();
    const hash = () => new URL(page.url()).hash;
    const link = async (id: string) => {
      await page.evaluate((h) => (location.hash = h), `#${id}`);
      await expect.poll(() => isOpen(page, id)).toBe(true);
    };

    await test.step('closed with the summary', async () => {
      await link('idiya');
      await summary(page, 'idiya').click();
      await expect.poll(() => isOpen(page, 'idiya')).toBe(false);
      expect(hash()).toBe('');
      await link('idiya');
    });

    await test.step('closed with Close', async () => {
      await card(page, 'idiya').getByRole('button', { name: 'Close' }).click();
      await expect.poll(() => isOpen(page, 'idiya')).toBe(false);
      expect(hash()).toBe('');
      await link('idiya');
    });

    await test.step('closed by opening another project', async () => {
      await summary(page, 'ehanda').click();
      await expect.poll(() => isOpen(page, 'idiya')).toBe(false);
      await expect.poll(() => isOpen(page, 'ehanda')).toBe(true);
      expect(hash()).toBe('');
      await link('idiya');
      await expect.poll(() => isOpen(page, 'ehanda')).toBe(false);
    });
  });

  test('WORK-04: the same link works when set in the same instant as the close', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('#work').getByRole('radio', { name: 'All' })).toBeEnabled();
    const link = async () => {
      await page.evaluate(() => (location.hash = '#idiya'));
      await expect.poll(() => isOpen(page, 'idiya')).toBe(true);
    };
    // Closes the project and sets the same hash in one page task, so nothing can run between.
    const closeAndLink = (how: string) =>
      page.evaluate((how) => {
        const q = <T extends Element>(s: string) => document.querySelector<T>(s);
        if (how === 'summary') q<HTMLElement>('#idiya summary')?.click();
        if (how === 'close') {
          const buttons = [...document.querySelectorAll<HTMLElement>('#idiya button')];
          buttons.find((b) => b.textContent === 'Close')?.click();
        }
        if (how === 'filter') q<HTMLInputElement>('#work input[type=radio]:not(:checked)')?.click();
        if (how === 'another') q<HTMLElement>('#ehanda summary')?.click();
        location.hash = '#idiya';
      }, how);

    for (const how of ['summary', 'close', 'filter', 'another']) {
      await test.step(`closed by ${how}, then the link in the same task, five times`, async () => {
        for (let i = 0; i < 5; i++) {
          await link();
          await closeAndLink(how);
          await expect.poll(() => isOpen(page, 'idiya')).toBe(true);
          expect(new URL(page.url()).hash).toBe('#idiya');
        }
      });
    }
  });

  test('WORK-04: dropping the link keeps Back, Forward, section links and Copy link working', async ({
    page,
  }) => {
    await stubClipboard(page, 'ok');
    await page.goto('/');
    await expect(page.locator('#work').getByRole('radio', { name: 'All' })).toBeEnabled();
    const hash = () => new URL(page.url()).hash;
    await page.evaluate(() => (location.hash = '#idiya'));
    await expect.poll(() => isOpen(page, 'idiya')).toBe(true);
    await summary(page, 'idiya').click();
    expect(hash()).toBe('');

    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: 'About' })
      .click();
    await expect(page).toHaveURL(/#about$/);
    await page.goBack();
    await expect.poll(hash).toBe('');
    await page.goForward();
    await expect.poll(hash).toBe('#about');
    await page.goBack();
    await expect.poll(hash).toBe('');
    expect(await isOpen(page, 'idiya')).toBe(false);

    await summary(page, 'idiya').click();
    await card(page, 'idiya').getByRole('button', { name: 'Copy link' }).click();
    await expect(card(page, 'idiya').getByRole('status')).toHaveText('Link copied');
    expect(hash()).toBe('');
  });

  test('WORK-02: choosing a filter closes the open project and lists only matching ones', async ({
    page,
  }) => {
    await page.goto('/#alunsina');
    const work = page.locator('#work');
    await expect.poll(() => isOpen(page, 'alunsina')).toBe(true);
    await work.getByRole('radio', { name: SOFTWARE }).check();
    await expect(work.locator('li[data-project]')).toHaveCount(2);
    await expect(card(page, 'alunsina')).toHaveCount(0);
    await expect(work.locator('details[open]')).toHaveCount(0);
    expect(new URL(page.url()).hash).toBe('');

    await summary(page, 'idiya').click();
    await expect.poll(() => isOpen(page, 'idiya')).toBe(true);
    await work.getByRole('radio', { name: 'Project management' }).check();
    await expect(work.locator('li[data-project]')).toHaveCount(5);
    await expect(work.locator('details[open]')).toHaveCount(0);
  });

  test('WORK-06: nothing on the real page is "Coming soon"; the fixture is in Work.test.tsx', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('#work li[data-project]')).toHaveCount(5);
    await expect(page.getByText('Coming soon')).toHaveCount(0);
  });

  test('error: an unknown link shows the page normally', async ({ page }) => {
    await page.goto('/#nope');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vonn Salve');
    await expect(page.locator('#work li[data-project]')).toHaveCount(5);
    await expect(page.locator('#work details[open]')).toHaveCount(0);
  });

  test('error: images load, and a failed image shows its description', async ({ page }) => {
    await page.goto('/');
    await summary(page, 'alunsina').click();
    const logo = card(page, 'alunsina').getByRole('img', { name: ALUNSINA_ALT });
    await expect(logo).toBeVisible();
    await expect
      .poll(() => logo.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await expect(card(page, 'idiya').getByRole('img')).toHaveCount(0);

    await page.route('**/images/heronpay-logo.png', (route) => route.abort());
    await page.goto('/');
    await summary(page, 'heronpay').click();
    await expect(card(page, 'heronpay').getByText(HERONPAY_ALT)).toBeVisible();
    await expect(card(page, 'heronpay').getByRole('img')).toHaveCount(0);
  });

  test('error: a failed image is logged once, with its path and no visitor data', async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
    await page.route('**/images/heronpay-logo.png', (route) => route.abort());
    await page.goto('/');
    await summary(page, 'alunsina').click();
    await expect(card(page, 'alunsina').getByRole('img')).toBeVisible();
    await summary(page, 'heronpay').click();
    await expect(card(page, 'heronpay').getByText(HERONPAY_ALT)).toBeVisible();
    await expect
      .poll(() => warnings.filter((w) => w.includes('image')))
      .toEqual(['work: image failed to load /images/heronpay-logo.png']);
  });

  test.describe('without JavaScript, image blocked', () => {
    test.use({ javaScriptEnabled: false, viewport: phone });

    test('a failed image keeps its space and its description can be seen', async ({ page }) => {
      await page.route('**/images/heronpay-logo.png', (route) => route.abort());
      await page.goto('/');
      await summary(page, 'heronpay').click();
      const logo = card(page, 'heronpay').getByRole('img', { name: HERONPAY_ALT });
      await expect(logo).toBeVisible();
      const box = await logo.boundingBox();
      expect(box?.width).toBeGreaterThan(100);
      expect(box?.height).toBeGreaterThan(100);
      // next/image sets color: transparent, which hides the alt text a broken image draws.
      const color = await logo.evaluate((el) => getComputedStyle(el).color);
      expect(color).not.toMatch(/^rgba\(0, 0, 0, 0\)$|^transparent$/);
    });
  });

  test('Copy link reports success, and failure with the address shown', async ({ page }) => {
    await stubClipboard(page, 'ok');
    await page.goto('/');
    await summary(page, 'idiya').click();
    await card(page, 'idiya').getByRole('button', { name: 'Copy link' }).click();
    await expect(card(page, 'idiya').getByRole('status')).toHaveText('Link copied');
    const copied = await page.evaluate(() => (window as unknown as { copied: string[] }).copied);
    expect(copied).toEqual([new URL('/#idiya', page.url()).href]);

    const failing = await page.context().newPage();
    await stubClipboard(failing, 'fail');
    await failing.setViewportSize(desktop);
    await failing.goto('/');
    await summary(failing, 'idiya').click();
    await card(failing, 'idiya').getByRole('button', { name: 'Copy link' }).click();
    const status = card(failing, 'idiya').getByRole('status');
    await expect(status).toContainText('Could not copy');
    await expect(status).toContainText(new URL('/#idiya', failing.url()).href);
  });

  test('layout: radios from 640 px, select below; rows from 900 px, cards below', async ({
    page,
  }) => {
    const work = page.locator('#work');
    const sameRow = async () => {
      const name = await card(page, 'idiya').locator('h3').boundingBox();
      const role = await card(page, 'idiya')
        .getByText('Software development and project')
        .boundingBox();
      return Math.abs((name?.y ?? 0) - (role?.y ?? 99)) < 16;
    };
    await page.setViewportSize({ width: 639, height: 800 });
    await page.goto('/');
    await expect(work.getByRole('combobox', { name: 'Show' })).toBeVisible();
    await expect(work.getByRole('radio', { name: 'All' })).toBeHidden();
    await work.getByRole('combobox', { name: 'Show' }).selectOption({ label: SOFTWARE });
    await expect(work.locator('li[data-project]')).toHaveCount(2);
    await page.setViewportSize({ width: 640, height: 800 });
    await expect(work.getByRole('radio', { name: SOFTWARE })).toBeChecked();
    await expect(work.getByRole('combobox', { name: 'Show' })).toBeHidden();
    await page.setViewportSize({ width: 899, height: 800 });
    expect(await sameRow()).toBe(false);
    await page.setViewportSize({ width: 900, height: 800 });
    expect(await sameRow()).toBe(true);
    await page.setViewportSize(phone);
    expect(await sameRow()).toBe(false);
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false, viewport: phone });

    test('a project opens natively and its text can be read', async ({ page }) => {
      await page.goto('/#idiya');
      await summary(page, 'idiya').click();
      await expect(card(page, 'idiya').getByText('Problem')).toBeVisible();
      await expect(card(page, 'idiya')).toContainText('Designed and built a free');
      await expect(page.locator('#work').getByRole('radio', { name: 'All' })).toBeDisabled();
    });
  });
});
