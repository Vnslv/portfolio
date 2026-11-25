import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const phone = { width: 390, height: 844 };
const desktop = { width: 1280, height: 800 };
const BCC = 'award-blockchain-campus-conference-2026';
const INFOTECH = 'award-umak-ccis-infotechnolympics-hackathon';
const EGOVPH = 'award-egovph-hackathon-2026';
const BCC_ALT = 'Six people on stage under a screen that reads Your hackathon champion, HeronPay';
const INFOTECH_ALT =
  'Three teammates wearing champion medals, one holding an Infotechnolympics 2026 envelope';

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

const award = (page: Page, id: string) => page.locator(`#awards li[id="${id}"]`);
const card = (page: Page, id: string) => page.locator(`li[data-project="${id}"]`);
const openCards = (page: Page) => page.locator('#work details[open]');

// Empty state: with no award to show there is no section, no badge and no navigation entry. The
// built site always holds the owner's awards, so that case is proven by render tests with
// fixtures in src/components/Awards.test.tsx and src/lib/awards.test.ts.
test.describe('AWARD-01, AWARD-02, AWARD-03 awards and badges', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(desktop);
  });

  test('happy: facts, images, an award with no image, navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#awards li[id^="award-"]')).toHaveCount(3);
    await expect(page.locator('#awards').getByRole('heading', { level: 2 })).toHaveText('Awards');
    await expect(page.locator('#awards')).toContainText('3 awards');

    await test.step('AWARD-01: every supplied fact, once, in the owner wording', async () => {
      await expect(award(page, BCC)).toContainText('Champion, Blockchain Campus Conference 2026');
      await expect(award(page, BCC)).toContainText('Binance Academy, November 2026');
      await expect(award(page, BCC)).toContainText(
        'Project: HeronPay. My role: Project manager. Team of 3.',
      );
      await expect(award(page, INFOTECH)).toContainText('Champion, UMak CCIS Infotechnolympics');
      await expect(award(page, INFOTECH)).toContainText('University of Makati, October 2026');
      await expect(award(page, INFOTECH)).toContainText('Project: HeronHub. My role: Project');
      await expect(award(page, EGOVPH)).toContainText('Top 10, eGovPH Hackathon 2026');
      await expect(award(page, EGOVPH)).toContainText('eGovPH, July 2026');
      await expect(page.getByText('Binance Academy')).toHaveCount(1);
    });

    await test.step('AWARD-03: two images with descriptions; eGovPH still appears without one', async () => {
      for (const [id, alt] of [
        [BCC, BCC_ALT],
        [INFOTECH, INFOTECH_ALT],
      ] as const) {
        const img = award(page, id).getByRole('img', { name: alt });
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
          .toBeGreaterThan(0);
      }
      await expect(award(page, EGOVPH).getByRole('img')).toHaveCount(0);
    });

    await test.step('SITE-01: Awards is in the sidebar and the taskbar, between Welcome and Work', async () => {
      await page.locator('nav[aria-label="Sections"] a[href="#awards"]').click();
      await expect(page).toHaveURL(/#awards$/);
      await expect(page.locator('#awards')).toBeInViewport();
      // From 900 px the sidebar lists the sections; at 768 px the taskbar buttons do.
      await page.setViewportSize({ width: 768, height: 800 });
      await page.goto('/');
      await page.locator('nav[aria-label="Taskbar"] a[href="#awards"]:visible').click();
      await expect(page.locator('#awards')).toBeInViewport();
    });

    await test.step('anchors: no award id clashes with a section or project id', async () => {
      const ids = await page.locator('[id]').evaluateAll((els) => els.map((el) => el.id));
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  test('badges: on HeronPay and eHanda, link to the award, touch no project link', async ({
    page,
  }) => {
    await page.goto('/#idiya');
    await expect(openCards(page)).toHaveCount(1);

    await test.step('AWARD-02: the badge shows hackathon and placement', async () => {
      const badge = card(page, 'heronpay').getByRole('link', {
        name: 'Champion, Blockchain Campus Conference 2026',
      });
      await expect(badge).toHaveAttribute('href', `#${BCC}`);
      await expect(card(page, 'ehanda').getByRole('link')).toHaveAttribute('href', `#${EGOVPH}`);
      for (const id of ['idiya', 'alunsina', 'umak-kalinga']) {
        await expect(card(page, id).getByRole('link', { name: /Champion|Top 10/ })).toHaveCount(0);
      }
    });

    await test.step('a badge click moves to the award and leaves the open project open', async () => {
      await card(page, 'ehanda')
        .getByRole('link', { name: /Top 10/ })
        .click();
      await expect(page).toHaveURL(new RegExp(`#${EGOVPH}$`));
      await expect(award(page, EGOVPH)).toBeInViewport();
      await expect(openCards(page)).toHaveCount(1);
      await expect(card(page, 'idiya').locator('details')).toHaveJSProperty('open', true);
      await page.goBack();
      await expect(page).toHaveURL(/#idiya$/);
      await expect(openCards(page)).toHaveCount(1);
    });

    await test.step('an award anchor opens no project and an unknown one shows the page', async () => {
      // A fresh load: from the same page a hash change keeps the open project open.
      await page.goto('about:blank');
      await page.goto(`/#${BCC}`);
      await expect(award(page, BCC)).toBeInViewport();
      await expect(openCards(page)).toHaveCount(0);
      await expect(page.locator('#work li[data-project]')).toHaveCount(5);
      await page.goto('/#award-nope');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vonn Salve');
      await expect(openCards(page)).toHaveCount(0);
    });
  });

  const box = async (locator: Locator) => {
    const b = await locator.boundingBox();
    if (!b) throw new Error('no box');
    return b;
  };

  for (const width of [390, 768, 1280]) {
    test(`layout at ${width} px: an award with no image uses the full width`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const text = async (id: string) => (await box(award(page, id).locator('h3'))).width;
      expect(await text(EGOVPH)).toBeGreaterThanOrEqual(await text(BCC));
      const li = await box(award(page, EGOVPH));
      expect((await box(award(page, EGOVPH).locator('h3'))).x).toBeCloseTo(li.x, 0);
    });
  }

  test('phone, below 640 px: the photo is 120 px wide, about 80 high, beside the text', async ({
    page,
  }) => {
    await page.setViewportSize(phone);
    await page.goto('/');
    for (const id of [BCC, INFOTECH]) {
      const fig = await box(award(page, id).locator('figure'));
      const text = await box(award(page, id).locator('h3'));
      expect(Math.round(fig.width)).toBe(120);
      expect(Math.abs(fig.height - 80)).toBeLessThanOrEqual(2);
      expect(text.x).toBeGreaterThanOrEqual(fig.x + fig.width);
      expect(text.y).toBeLessThan(fig.y + fig.height);
      const style = await award(page, id)
        .locator('figure')
        .evaluate((el) => ({ min: getComputedStyle(el).minHeight }));
      expect(parseFloat(style.min) || 0).toBeLessThanOrEqual(80);
      const fit = await award(page, id)
        .getByRole('img')
        .evaluate((el) => getComputedStyle(el).objectFit);
      expect(fit).toBe('contain');
    }
  });

  for (const width of [768, 1280]) {
    test(`from 640 px the photo stays 260 px beside the text, at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const fig = await box(award(page, BCC).locator('figure'));
      const text = await box(award(page, BCC).locator('h3'));
      expect(Math.round(fig.width)).toBe(260);
      expect(text.x).toBeGreaterThanOrEqual(fig.x + fig.width);
    });
  }

  test('phone: Menu lists Awards, and nothing overflows sideways', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto('/');
    await page.locator('summary', { hasText: 'Menu' }).click();
    await page.locator('nav[aria-label="Taskbar"] a[href="#awards"]:visible').click();
    await expect(page.locator('#awards')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  });

  test('320 px: nothing overflows, with the photos and with both failed', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const sideways = () => page.evaluate(() => document.documentElement.scrollWidth);
    await page.goto('/');
    expect(await sideways()).toBeLessThanOrEqual(320);
    await page.route('**/images/*.jpg', (route) => route.abort());
    await page.goto('/');
    await expect(award(page, BCC).getByText(BCC_ALT)).toBeVisible();
    await expect(award(page, INFOTECH).getByText(INFOTECH_ALT)).toBeVisible();
    expect(await sideways()).toBeLessThanOrEqual(320);
  });

  test('the photo opens its full image in a new tab, and the keyboard reaches it', async ({
    page,
    context,
  }) => {
    await page.setViewportSize(phone);
    await page.goto('/');
    for (const [id, file, alt] of [
      [BCC, '/images/bcc.jpg', BCC_ALT],
      [INFOTECH, '/images/infotech.jpg', INFOTECH_ALT],
    ] as const) {
      const link = award(page, id).getByRole('link', {
        name: /opens the full image in a new tab/i,
      });
      await expect(link).toHaveAttribute('href', file);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
      await expect(link).toHaveAttribute('rel', /noreferrer/);
      expect(await link.getAttribute('aria-label')).toContain(alt);
    }
    await expect(award(page, EGOVPH).getByRole('link')).toHaveCount(0);

    const link = award(page, BCC).getByRole('link', { name: /opens the full image/i });
    expect(await tabTo(page, link)).toBe(true);
    expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
    const opened = context.waitForEvent('page');
    await page.keyboard.press('Enter');
    expect(new URL((await opened).url()).pathname).toBe('/images/bcc.jpg');
  });

  test('phone: a failed photo keeps its description in the small space, readable', async ({
    page,
  }) => {
    await page.setViewportSize(phone);
    await page.route('**/images/bcc.jpg', (route) => route.abort());
    await page.goto('/');
    const fig = award(page, BCC).locator('figure');
    const text = fig.getByText(BCC_ALT);
    await expect(text).toBeVisible();
    expect(Math.round((await box(fig)).width)).toBe(120);
    const fits = await text.evaluate((el) => ({
      across: el.scrollWidth <= el.clientWidth,
      down: el.scrollHeight <= el.clientHeight,
    }));
    expect(fits).toEqual({ across: true, down: true });
    const [t, f] = [await box(text), await box(fig)];
    expect(t.x).toBeGreaterThanOrEqual(f.x);
    expect(t.x + t.width).toBeLessThanOrEqual(f.x + f.width + 1);
    expect(t.y + t.height).toBeLessThanOrEqual(f.y + f.height + 1);
    await expect(
      award(page, BCC).getByRole('link', { name: /opens the full image in a new tab/i }),
    ).toHaveAttribute('href', '/images/bcc.jpg');
  });

  test('error: a failed image shows its description, logged once with its path', async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
    await page.route('**/images/bcc.jpg', (route) => route.abort());
    await page.goto('/');
    await expect(award(page, BCC).getByText(BCC_ALT)).toBeVisible();
    await expect(award(page, BCC).getByRole('img')).toHaveCount(0);
    await expect(award(page, INFOTECH).getByRole('img', { name: INFOTECH_ALT })).toBeVisible();
    await expect
      .poll(() => warnings.filter((w) => w.includes('image')))
      .toEqual(['awards: image failed to load /images/bcc.jpg']);
  });

  test('open card: the badge is between the row and the panel, in the same keyboard order', async ({
    page,
  }) => {
    await page.goto('/');
    const c = card(page, 'ehanda');
    const badge = c.getByRole('link', { name: /Top 10/ });

    await test.step('closed: the badge is visible and usable, the panel is not shown', async () => {
      await expect(badge).toBeVisible();
      await expect(c.locator('dl')).toBeHidden();
    });

    await c.locator('summary').click();
    await expect(c.locator('dl')).toBeVisible();

    await test.step('the badge sits below the row and above the panel, outside the summary', async () => {
      const [row, b, panel] = [
        await box(c.locator('summary')),
        await box(badge),
        await box(c.locator('dl')),
      ];
      expect(b.y).toBeGreaterThanOrEqual(row.y + row.height - 1);
      expect(panel.y).toBeGreaterThanOrEqual(b.y + b.height - 1);
      await expect(c.locator('summary a')).toHaveCount(0);
    });

    await test.step('the keyboard goes row, badge, then the panel', async () => {
      await c.locator('summary').focus();
      await page.keyboard.press('Tab');
      await expect(badge).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(c.getByRole('link', { name: 'Live' })).toBeFocused();
    });
  });

  test.describe('without JavaScript, open and closed card', () => {
    test.use({ javaScriptEnabled: false, viewport: phone });

    test('the badge shows closed, sits between row and panel open, and works', async ({ page }) => {
      await page.setViewportSize(phone);
      await page.goto('/');
      const c = card(page, 'heronpay');
      const badge = c.getByRole('link', { name: /Champion/ });
      await expect(badge).toBeVisible();
      await c.locator('summary').click();
      await expect(c.locator('dl')).toBeVisible();
      const [row, b, panel] = [
        await box(c.locator('summary')),
        await box(badge),
        await box(c.locator('dl')),
      ];
      expect(b.y).toBeGreaterThanOrEqual(row.y + row.height - 1);
      expect(panel.y).toBeGreaterThanOrEqual(b.y + b.height - 1);
      await badge.click();
      await expect(page).toHaveURL(new RegExp(`#${BCC}$`));
    });
  });

  test.describe('without JavaScript, 390 px, images blocked', () => {
    test.use({ javaScriptEnabled: false, viewport: phone });

    test('the whole description of each photo is shown, nothing is cut off', async ({ page }) => {
      await page.setViewportSize(phone);
      await page.route('**/images/*.jpg', (route) => route.abort());
      await page.goto('/');
      for (const [id, alt] of [
        [BCC, BCC_ALT],
        [INFOTECH, INFOTECH_ALT],
      ] as const) {
        const img = award(page, id).getByRole('img', { name: alt });
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
          };
        }, alt);
        expect(m.height).toBeGreaterThanOrEqual(m.need);
        expect(m.across).toBe(true);
        // The picture grew past the 120 by 80 box only because it failed.
        expect((await box(award(page, id).locator('figure'))).height).toBeGreaterThan(90);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
    });
  });

  test('a loaded photo keeps its reserved space: nothing moves when it arrives', async ({
    page,
  }) => {
    await page.setViewportSize(phone);
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/images/bcc.jpg', async (route) => {
      await held;
      await route.continue();
    });
    await page.goto('/');
    const fig = award(page, BCC).locator('figure');
    const before = await box(fig);
    const below = await box(award(page, INFOTECH));
    release();
    await expect
      .poll(() =>
        award(page, BCC)
          .getByRole('img')
          .evaluate((el: HTMLImageElement) => el.naturalWidth),
      )
      .toBeGreaterThan(0);
    expect((await box(fig)).height).toBeCloseTo(before.height, 1);
    expect((await box(award(page, INFOTECH))).y).toBeCloseTo(below.y, 1);
  });

  test.describe('without JavaScript, image blocked', () => {
    test.use({ javaScriptEnabled: false, viewport: phone });

    test('a failed image keeps its space and its description can be seen', async ({ page }) => {
      await page.route('**/images/infotech.jpg', (route) => route.abort());
      await page.goto('/');
      const img = award(page, INFOTECH).getByRole('img', { name: INFOTECH_ALT });
      await expect(img).toBeVisible();
      const box = await img.boundingBox();
      // The reserved space is the small phone photo, 120 by 80 px.
      expect(box?.width).toBeGreaterThan(100);
      expect(box?.height).toBeGreaterThan(60);
      // next/image sets color: transparent, which hides the alt text a broken image draws.
      expect(await img.evaluate((el) => getComputedStyle(el).color)).not.toMatch(
        /^rgba\(0, 0, 0, 0\)$|^transparent$/,
      );
      await expect(award(page, EGOVPH)).toContainText('Top 10, eGovPH Hackathon 2026');
    });
  });

  test('accessibility: no axe violations on the page with awards', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
