import { gzipSync } from 'node:zlib';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Motion (T14): MOTION-01 opening, MOTION-02 sky and confetti, MOTION-03 interaction, NFR-08
// limits, NFR-01 weight, NFR-04 contrast and keyboard. The numbers are from the PRD, the T14
// ticket with its lead decisions (2026-11-26), the design brief and the motion board.

const phone = { width: 390, height: 844 };
const desktop = { width: 1280, height: 800 };
const SIZES = [{ width: 320, height: 568 }, phone, desktop];
const NAMES = ['alunsina', 'heronpay', 'ehanda', 'idiya', 'umak-kalinga'];
const SOFTWARE = 'Software development';
const MANAGEMENT = 'Project management';
// The cap on all of the page's CSS that theme-sky.spec.ts already sets (3922 + 3072 bytes), and
// the lead's cap on the inline script before the first paint.
const CSS_CAP = 6994;
const SCRIPT_CAP = 400;

const idle = (page: Page, ms: number) =>
  page.evaluate((wait) => new Promise((done) => setTimeout(done, wait)), ms);
const toggle = (page: Page) => page.getByRole('button', { name: /^(Dark|Light) theme$/ });
const box = (page: Page) => page.locator('[data-boot]');
const term = (page: Page) => page.locator('#work [data-term]');
const announce = (page: Page) => page.locator('#work [aria-live="polite"]');
const rows = (page: Page) => page.locator('#work li[data-project]');
const radio = (page: Page, name: string) => page.locator('#work').getByRole('radio', { name });
const summary = (page: Page, id: string) => page.locator(`li[data-project="${id}"] summary`);
// The page has run its script once the filter is on; below 640 px the radios are hidden.
const ready = (page: Page) =>
  expect(page.locator('#work input[type="radio"]').first()).toBeEnabled();

type Played = {
  // 'sky', 'boot', 'fill', 'window', 'reveal', 'row', 'unfold', 'typed', 'caret', 'confetti',
  // 'hover' or 'other', from what moves.
  kind: string;
  target: string;
  duration: number;
  delay: number;
  iterations: number;
  // The CSS properties its keyframes (or its transition) change.
  properties: string[];
  frames: string[];
  timing: string;
};

// Every animation and transition that exists in any frame of the page, from the first one on.
async function record(page: Page) {
  await page.addInitScript(() => {
    const played: unknown[] = [];
    const seen = new WeakSet<Animation>();
    Object.assign(window, { played });
    const read = () => {
      for (const animation of document.getAnimations()) {
        if (seen.has(animation)) continue;
        seen.add(animation);
        const effect = animation.effect as KeyframeEffect;
        const el = effect.target;
        if (!el) continue;
        const timing = effect.getTiming();
        const frames = effect.getKeyframes();
        const skip = ['offset', 'computedOffset', 'easing', 'composite'];
        const properties = [
          ...new Set(frames.flatMap((f) => Object.keys(f).filter((k) => !skip.includes(k)))),
        ];
        // A reached row can be moved by a filter at the same time, so the two are told apart by
        // the name of the movement (the build keeps it at the end of the CSS module's name).
        const name = (animation as CSSAnimation).animationName ?? '';
        let kind = 'other';
        if ('transitionProperty' in animation) kind = 'hover';
        else if (effect.pseudoElement === '::before' && el === document.body) kind = 'sky';
        else if (el.closest('[data-boot]')) kind = el.matches('[data-boot]') ? 'boot' : 'fill';
        else if (el.closest('[data-confetti]')) kind = 'confetti';
        else if (el.closest('[data-term]')) kind = el.matches('[data-caret]') ? 'caret' : 'typed';
        else if (/sort-[ab]$/.test(name)) kind = 'row';
        else if (/reveal$/.test(name)) kind = 'reveal';
        else if (/unfold$/.test(name)) kind = 'unfold';
        else if (el.matches('main > section')) kind = 'window';
        const id = el.closest('[id]')?.id ?? '';
        played.push({
          kind,
          target: `${el.tagName.toLowerCase()}#${id}`,
          duration: Number(timing.duration),
          delay: Number(timing.delay),
          iterations: Number(timing.iterations),
          properties,
          frames: frames.map((f) => String(f['transform'] ?? '')),
          timing: [timing.easing, ...frames.map((f) => f.easing)].join(' '),
        });
      }
      requestAnimationFrame(read);
    };
    requestAnimationFrame(read);
  });
}

const playedNow = (page: Page) =>
  page.evaluate(() => (window as unknown as { played: Played[] }).played);
const kinds = async (page: Page) => [...new Set((await playedNow(page)).map((p) => p.kind))].sort();
const ofKind = async (page: Page, kind: string) =>
  (await playedNow(page)).filter((p) => p.kind === kind);

// Everything that is animating now.
const animating = (page: Page) =>
  page.evaluate(() =>
    document.getAnimations().map((a) => {
      const effect = a.effect as KeyframeEffect;
      const el = effect.target;
      return `${a.constructor.name} ${el?.tagName}${effect.pseudoElement ?? ''} ${a.playState}`;
    }),
  );

// The sections and rows that are not where they rest, or not shown.
const unsettled = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('main > section, main li[id], footer')]
      .filter((el) => {
        const style = getComputedStyle(el);
        return (
          style.transform !== 'none' || style.opacity !== '1' || style.visibility !== 'visible'
        );
      })
      .map((el) => el.id || el.tagName),
  );

const hiddenText = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('main *')]
      .filter((el) => {
        // Closed details and the other width's filter are hidden by design, not by motion.
        if (el.closest('details:not([open]) > :not(summary)') || !el.checkVisibility()) {
          return false;
        }
        const style = getComputedStyle(el);
        // The browser dims a disabled control; only text that cannot be seen counts.
        return style.visibility !== 'visible' || style.opacity === '0';
      })
      .map((el) => el.outerHTML.slice(0, 60)),
  );

async function scrollThrough(page: Page) {
  const end = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= end; y += 200) {
    await page.evaluate(
      (top) =>
        new Promise<void>((done) => {
          window.scrollTo(0, top);
          requestAnimationFrame(() => requestAnimationFrame(() => done()));
        }),
      y,
    );
  }
}

const opening = (page: Page) =>
  page.evaluate(() => document.documentElement.hasAttribute('data-opening'));

const rect = async (page: Page, selector: string) => {
  const found = await page.locator(selector).boundingBox();
  if (!found) throw new Error(`no box for ${selector}`);
  return found;
};

test.describe('NFR-08 reduced motion', () => {
  for (const size of [phone, desktop]) {
    test(`control: with motion allowed, the sky drifts and the opening plays at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await record(page);
      await page.goto('/');
      await expect.poll(() => kinds(page)).toEqual(expect.arrayContaining(['sky', 'window']));
      expect(await kinds(page)).toContain('boot');
    });

    test(`nothing moves and everything shows at once at ${size.width} px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await record(page);
      await page.goto('/');

      await test.step('at load', async () => {
        await expect(box(page)).toBeHidden();
        expect(await animating(page)).toEqual([]);
        expect(await unsettled(page)).toEqual([]);
        expect(await hiddenText(page)).toEqual([]);
        await expect(rows(page)).toHaveCount(5);
        await expect(term(page)).toHaveText('> SHOW ALL  [5 FOUND]');
      });

      await test.step('scrolling, awards, a filter, a project and hover', async () => {
        await ready(page);
        await scrollThrough(page);
        await expect(page.locator('[data-confetti]')).toHaveCount(0);
        if (size.width >= 640) await radio(page, SOFTWARE).check();
        else await page.locator('#work select').selectOption({ label: SOFTWARE });
        await expect(rows(page)).toHaveCount(2);
        await expect(term(page)).toHaveText('> SHOW SOFTWARE DEVELOPMENT  [2 FOUND]');
        expect(await term(page).innerText()).toContain('[2 FOUND]');
        await expect(announce(page)).toHaveText('Showing 2 projects');
        await summary(page, 'idiya').click();
        await summary(page, 'idiya').hover();
        await toggle(page).hover();
        await expect(toggle(page)).toHaveCSS('transform', 'none');
        expect(await animating(page)).toEqual([]);
        expect(await unsettled(page)).toEqual([]);
        expect(await playedNow(page)).toEqual([]);
      });
    });
  }
});

test.describe('NFR-08 without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const size of [phone, desktop]) {
    test(`all content and controls are there and work at ${size.width} px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');

      await test.step('no opening, nothing waiting for an animation', async () => {
        expect(await opening(page)).toBe(false);
        await expect(box(page)).toBeHidden();
        await expect(page.locator('main > section')).toHaveCount(4);
        for (const section of await page.locator('main > section').all()) {
          await expect(section).toBeVisible();
        }
        await expect(rows(page)).toHaveCount(5);
        await expect(page.locator('#awards li')).toHaveCount(3);
        expect(await unsettled(page)).toEqual([]);
        expect(await hiddenText(page)).toEqual([]);
        await expect(term(page)).toHaveText('> SHOW ALL  [5 FOUND]');
        await expect(page.locator('[data-confetti]')).toHaveCount(0);
      });

      await test.step('the sky still drifts: it is CSS only', async () => {
        expect(
          await page.evaluate(() => getComputedStyle(document.body, '::before').animationName),
        ).not.toBe('none');
      });

      await test.step('a project opens and its link and the page links work', async () => {
        await summary(page, 'idiya').click();
        await expect(
          page.locator('#idiya').getByRole('link', { name: 'Live', exact: true }),
        ).toBeVisible();
        await expect(page.locator('#idiya').getByText('Problem')).toBeVisible();
        await page.getByRole('link', { name: 'See my projects' }).click();
        await expect(page).toHaveURL('/#work');
      });
    });
  }
});

test.describe('MOTION-01 the opening', () => {
  test('windows open in sequence once per visit and end within 2 seconds', async ({ page }) => {
    await page.setViewportSize(desktop);
    await record(page);
    await page.goto('/');
    await expect.poll(async () => (await ofKind(page, 'window')).length).toBe(3);

    await test.step('the three windows after Welcome, one after the other', async () => {
      const windows = await ofKind(page, 'window');
      expect(windows.map((w) => w.target)).toEqual([
        'section#awards',
        'section#work',
        'section#links',
      ]);
      const delays = windows.map((w) => w.delay);
      expect(delays).toEqual([...new Set(delays)].sort((a, b) => a - b));
      for (const w of windows) {
        // Movement only: nothing starts invisible, and no window moves up or down.
        expect(w.properties).toEqual(['transform']);
        expect(w.delay + w.duration * w.iterations).toBeLessThanOrEqual(2000);
        expect(w.timing).toContain('steps(');
      }
    });

    await test.step('the box and its bar: fill in 0.5 s, gone by 1.5 s', async () => {
      const [shown] = await ofKind(page, 'boot');
      const [fill] = await ofKind(page, 'fill');
      expect((shown?.delay ?? 0) + (shown?.duration ?? 9999)).toBeLessThanOrEqual(1500);
      expect((fill?.delay ?? 0) + (fill?.duration ?? 9999)).toBeLessThanOrEqual(500);
      await expect(box(page)).toBeHidden({ timeout: 2000 });
    });

    await test.step('within 2 seconds it is over and the mark is gone', async () => {
      await expect.poll(() => opening(page), { timeout: 4000 }).toBe(false);
      expect(await unsettled(page)).toEqual([]);
    });

    await test.step('a reload in the same visit plays nothing', async () => {
      await page.reload();
      await ready(page);
      expect(await opening(page)).toBe(false);
      await expect(box(page)).toBeHidden();
      await expect.poll(() => kinds(page)).toContain('sky');
      expect(await ofKind(page, 'window')).toEqual([]);
      expect(await ofKind(page, 'boot')).toEqual([]);
    });
  });

  for (const size of SIZES) {
    test(`the box sits over the taskbar and the intro never moves, at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await record(page);
      // Holds every animation at its first frame, so the box can be measured.
      await page.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style');
          style.id = 'hold';
          style.textContent = '*, body::before { animation-play-state: paused !important }';
          document.head.append(style);
        });
      });
      await page.route('**/_next/static/**/*.js', (route) => route.abort());
      await page.goto('/');

      await test.step('one line, "Starting" with its bar, hidden from assistive technology', async () => {
        await expect(box(page)).toBeVisible();
        await expect(box(page)).toHaveText('Starting');
        await expect(box(page)).toHaveAttribute('aria-hidden', 'true');
        await expect(box(page)).toHaveCSS('pointer-events', 'none');
        const found = await rect(page, '[data-boot]');
        expect(found.height).toBeLessThanOrEqual(52);
        expect(found.x).toBeGreaterThanOrEqual(0);
        expect(found.x + found.width).toBeLessThanOrEqual(size.width);
      });

      await test.step('it lies inside the taskbar, so it covers nothing of the page', async () => {
        const found = await rect(page, '[data-boot]');
        const taskbar = await rect(page, 'nav[aria-label="Taskbar"]');
        expect(found.y).toBeGreaterThanOrEqual(taskbar.y);
        expect(found.y + found.height).toBeLessThanOrEqual(taskbar.y + taskbar.height);
      });

      await test.step('Welcome is still from the first frame', async () => {
        await expect(page.locator('#welcome')).toHaveCSS('animation-name', 'none');
        await expect(page.locator('#welcome')).toHaveCSS('transform', 'none');
        // A font arriving late would change the window's height, which is not motion.
        await page.evaluate(() => document.fonts.ready);
        const before = await rect(page, '#welcome');
        await page.evaluate(() => document.getElementById('hold')?.remove());
        // How long the box lasts is checked from its timing above; here a loaded machine may
        // draw the frames late.
        await expect(box(page)).toBeHidden({ timeout: 10000 });
        expect(await rect(page, '#welcome')).toEqual(before);
        expect((await playedNow(page)).filter((p) => p.target.endsWith('#welcome'))).toEqual([]);
      });
    });
  }

  test('a font arriving late moves nothing in the box', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.route('**/_next/static/**/*.js', (route) => route.abort());
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = '*, body::before { animation-play-state: paused !important }';
        document.head.append(style);
      });
    });
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/_next/static/media/**', async (route) => {
      await held;
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(box(page)).toBeVisible();
    const before = await rect(page, '[data-boot] > span');
    release();
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.fonts].some(
            (f) => f.status === 'loaded' && /^["']?Pixelify Sans["']?$/.test(f.family),
          ),
        ),
      )
      .toBe(true);
    await idle(page, 200);
    expect(await rect(page, '[data-boot] > span')).toEqual(before);
  });

  test('the first tap or key ends it', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    for (const type of ['keydown', 'pointerdown']) {
      await expect
        .poll(() =>
          page.evaluate((name) => {
            document.documentElement.setAttribute('data-opening', '');
            window.dispatchEvent(new Event(name, { bubbles: true }));
            return document.documentElement.hasAttribute('data-opening');
          }, type),
        )
        .toBe(false);
    }
  });

  test('keyboard focus hides the box before any script of the page runs', async ({ page }) => {
    await page.route('**/_next/static/**/*.js', (route) => route.abort());
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = '*, body::before { animation-play-state: paused !important }';
        document.head.append(style);
      });
    });
    await page.goto('/');
    await expect(box(page)).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(box(page)).toBeHidden();
  });

  test('error: with page scripts blocked the box still goes and everything shows', async ({
    page,
  }) => {
    await page.route('**/_next/static/**/*.js', (route) => route.abort());
    await page.goto('/');
    await expect(box(page)).toBeHidden({ timeout: 2500 });
    await expect.poll(() => unsettled(page), { timeout: 2500 }).toEqual([]);
    await expect(rows(page)).toHaveCount(5);
  });

  test('error: with storage blocked it plays on each load, and says nothing', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (m) => messages.push(m.text()));
    page.on('pageerror', (e) => messages.push(e.message));
    await page.addInitScript(() => {
      for (const name of ['sessionStorage', 'localStorage']) {
        Object.defineProperty(window, name, {
          get() {
            throw new Error('blocked');
          },
        });
      }
    });
    await record(page);
    for (let load = 0; load < 2; load += 1) {
      await page.goto('/');
      await ready(page);
      await expect.poll(async () => (await ofKind(page, 'window')).length).toBe(3);
      await page.locator('#awards li').first().scrollIntoViewIfNeeded();
      await expect.poll(async () => (await ofKind(page, 'confetti')).length).toBeGreaterThan(0);
    }
    // The theme's own warning is older than this ticket; motion adds nothing.
    expect(messages.filter((m) => !m.startsWith('theme:'))).toEqual([]);
  });

  test('empty: the not-found page has no opening, box or confetti', async ({ page }) => {
    await record(page);
    await page.goto('/no-such-page');
    await expect(toggle(page)).toBeVisible();
    await expect(box(page)).toHaveCount(0);
    await expect(page.locator('[data-confetti]')).toHaveCount(0);
    await expect.poll(() => kinds(page)).toEqual(['sky']);
    // The visit's opening is not used up there: the home page still plays it.
    await page.goto('/');
    await expect.poll(async () => (await ofKind(page, 'window')).length).toBe(3);
  });

  test('the script before the first paint is small and reads only the session flag', async ({
    page,
  }) => {
    const response = await page.goto('/');
    const html = (await response?.text()) ?? '';
    // The server's HTML, read by the browser's own parser, where nothing in it runs: the scripts
    // that have no attribute, and whether each is a child of the head.
    const scripts = await page.evaluate((source) => {
      const parsed = new DOMParser().parseFromString(source, 'text/html');
      return [...parsed.querySelectorAll('script')]
        .filter((el) => el.attributes.length === 0)
        .map((el) => ({ text: el.textContent ?? '', inHead: el.parentElement === parsed.head }));
    }, html);
    // Next also repeats the page's data in its own scripts; those are not this one.
    const found = scripts.filter(
      ({ text }) => text.includes('data-opening') && !text.includes('__next_f'),
    );
    expect(found).toHaveLength(1);
    const script = found[0]?.text ?? '';
    expect(Buffer.byteLength(script)).toBeLessThan(SCRIPT_CAP);
    expect(script).toContain('sessionStorage.getItem');
    expect(script).not.toMatch(
      /localStorage|cookie|location|referrer|navigator|history|screen|fetch|XMLHttpRequest|Beacon/,
    );
    // It is in the head, so it runs before anything is painted.
    expect(found[0]?.inHead).toBe(true);
    expect(html.indexOf(script)).toBeLessThan(html.indexOf('<body'));
  });
});

test.describe('MOTION-03 durations', () => {
  test('no movement lasts longer than half a second, except the listed ones', async ({ page }) => {
    await page.setViewportSize(desktop);
    await record(page);
    await page.goto('/');
    await ready(page);
    await expect.poll(() => opening(page), { timeout: 4000 }).toBe(false);

    await scrollThrough(page);
    await radio(page, SOFTWARE).check();
    await expect.poll(async () => (await ofKind(page, 'caret')).length).toBeGreaterThan(0);
    await summary(page, 'idiya').click();
    await expect.poll(async () => (await ofKind(page, 'unfold')).length).toBe(1);
    await toggle(page).hover();
    await expect.poll(async () => (await ofKind(page, 'hover')).length).toBeGreaterThan(0);
    await page.locator('#awards li').first().hover();
    await expect
      .poll(
        async () => (await ofKind(page, 'hover')).filter((p) => p.target.startsWith('li#')).length,
      )
      .toBeGreaterThan(0);

    await test.step('every kind of motion happened, so the limit below is not empty', async () => {
      expect(await kinds(page)).toEqual([
        'boot',
        'caret',
        'confetti',
        'fill',
        'hover',
        'reveal',
        'row',
        'sky',
        'typed',
        'unfold',
        'window',
      ]);
    });

    await test.step('each at most 0.5 s; the sky, the caret blink and the box stay aside', async () => {
      const long = (await playedNow(page)).filter(
        // The box staying up (at most 1.5 s) is not movement.
        (p) => !['sky', 'caret', 'boot'].includes(p.kind) && p.duration * p.iterations > 500,
      );
      expect(long).toEqual([]);
    });

    await test.step('the filtered rows and the typing, delays included, end within 0.5 s', async () => {
      const staggered = (await playedNow(page)).filter((p) => ['row', 'typed'].includes(p.kind));
      expect(staggered.filter((p) => p.delay + p.duration * p.iterations > 500)).toEqual([]);
    });

    await test.step('pixel steps, no smooth easing', async () => {
      expect((await playedNow(page)).filter((p) => !p.timing.includes('steps('))).toEqual([]);
    });
  });

  test('after a filter choice, rows not yet reached still slide in when reached', async ({
    page,
  }) => {
    // Short, so rows stay below the screen while the filter is used.
    const height = 300;
    await page.setViewportSize({ width: 390, height });
    // Every row marked to slide in, with the movement it then has. An observer sees each mark,
    // however slowly or quickly the machine draws.
    await page.addInitScript(() => {
      const marked: string[] = [];
      Object.assign(window, { marked });
      new MutationObserver((changes) => {
        for (const { target } of changes) {
          const el = target as Element;
          if (!el.hasAttribute('data-reveal')) continue;
          marked.push(`${el.id} ${getComputedStyle(el).animationName}`);
        }
      }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-reveal'] });
    });
    await page.goto('/');
    await ready(page);
    const select = page.locator('#work select');
    const marked = () => page.evaluate(() => (window as unknown as { marked: string[] }).marked);
    const choose = async (label: string) => {
      await select.selectOption({ label });
      // The filter's own movement ends and leaves the rows free for the next one.
      await expect
        .configure({ soft: true })
        .poll(() =>
          rows(page).evaluateAll((els) =>
            els.map((el) => getComputedStyle(el).animationName).filter((name) => name !== 'none'),
          ),
        )
        .toEqual([]);
    };
    const reach = async (id: string) => {
      expect((await rect(page, `#${id}`)).y).toBeGreaterThan(height);
      await page.evaluate(() => (window as unknown as { marked: string[] }).marked.splice(0));
      await page.locator(`#${id}`).evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await expect.poll(marked).toContain(`${id} reveal`);
    };

    await test.step('a row that stayed listed through the choice', async () => {
      await select.evaluate((el) => el.scrollIntoView());
      await choose(MANAGEMENT);
      await reach('umak-kalinga');
    });

    await test.step('a row the filter took out and put back', async () => {
      await select.evaluate((el) => el.scrollIntoView());
      await choose(SOFTWARE);
      await expect(rows(page)).toHaveCount(2);
      await choose('All');
      await expect(rows(page)).toHaveCount(5);
      await reach('ehanda');
    });
  });

  test('windows and rows below the screen slide in once as they are reached', async ({ page }) => {
    await page.setViewportSize(phone);
    await record(page);
    await page.goto('/');
    await ready(page);
    await expect.poll(() => opening(page), { timeout: 4000 }).toBe(false);
    expect(await ofKind(page, 'reveal')).toEqual([]);
    await scrollThrough(page);
    await expect
      .poll(async () => (await ofKind(page, 'reveal')).map((p) => p.target))
      .toEqual(expect.arrayContaining(['section#links', 'li#umak-kalinga']));
    await expect.poll(() => page.locator('[data-reveal]').count()).toBe(0);
    // Read once the last one has ended, so none arrives after the count.
    const revealed = await ofKind(page, 'reveal');
    expect(revealed.map((p) => p.target)).not.toContain('section#welcome');
    expect(revealed.flatMap((p) => p.properties).filter((p) => p !== 'transform')).toEqual([]);
    const count = revealed.length;
    await page.evaluate(() => window.scrollTo(0, 0));
    await scrollThrough(page);
    expect(await ofKind(page, 'reveal')).toHaveLength(count);
  });

  for (const id of ['idiya', 'heronpay']) {
    test(`a project unfolds each time it opens, and closes at once (${id})`, async ({ page }) => {
      await record(page);
      await page.goto('/');
      await ready(page);
      for (let open = 1; open <= 2; open += 1) {
        await summary(page, id).click();
        await expect.poll(async () => (await ofKind(page, 'unfold')).length).toBe(open);
        await expect.poll(() => animating(page).then((a) => a.length)).toBeLessThanOrEqual(1);
        await summary(page, id).click();
        await expect(page.locator(`li[data-project="${id}"] dl`)).toBeHidden();
      }
      const unfolds = await ofKind(page, 'unfold');
      expect(unfolds.flatMap((p) => p.properties).filter((p) => p !== 'transform')).toEqual([]);
    });
  }

  for (const size of [phone, desktop]) {
    test(`a link to a project the filter hid lands in its place at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await ready(page);
      if (size.width >= 640) await radio(page, SOFTWARE).check();
      else await page.locator('#work select').selectOption({ label: SOFTWARE });
      await expect(rows(page)).toHaveCount(2);
      await page.evaluate(() => (location.hash = '#alunsina'));
      await expect(page.locator('#alunsina details')).toHaveJSProperty('open', true);
      // Once nothing in it moves, this is where it rests. 12 px is its scroll margin.
      await expect
        .poll(() =>
          page.locator('#alunsina').evaluate((el) => el.getAnimations({ subtree: true }).length),
        )
        .toBe(0);
      expect(Math.round((await rect(page, '#alunsina')).y)).toBe(12);
    });
  }

  test('a shared project link lands where it did before motion, during the opening', async ({
    context,
  }) => {
    for (const size of [phone, desktop]) {
      // A new tab is a new visit, so the opening plays in it.
      const fresh = await context.newPage();
      await fresh.setViewportSize(size);
      await fresh.goto('/#idiya');
      await expect(fresh.locator('#idiya details')).toHaveJSProperty('open', true);
      await expect
        .poll(async () => Math.round((await fresh.locator('#idiya').boundingBox())?.y ?? -1))
        .toBe(12);
      await fresh.close();
    }
  });
});

test.describe('MOTION-02 the sky and the confetti', () => {
  for (const [scheme, seconds, tile, steps] of [
    ['light', 80, 640, 320],
    ['dark', 39.4, 512, 256],
  ] as const) {
    test(`${scheme}: the sky drifts left one tile in ${seconds} s, in 2 px steps, forever`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await record(page);
      await page.goto('/');
      await expect.poll(async () => (await ofKind(page, 'sky')).length).toBe(1);
      const [sky] = await ofKind(page, 'sky');
      expect(sky).toMatchObject({
        duration: seconds * 1000,
        iterations: Infinity,
        properties: ['transform'],
      });
      // The build writes translateX(n) as translate(n).
      expect(sky?.frames.at(-1)).toMatch(new RegExp(`^translateX?\\(-${tile}px\\)$`));
      expect(sky?.timing).toContain(`steps(${steps})`);
      expect(tile / steps).toBe(2);
    });

    test(`${scheme}: the drift moves by whole steps and never shows a gap`, async ({ page }) => {
      await page.setViewportSize(phone);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await ready(page);
      const at = (ms: number) =>
        page.evaluate((time) => {
          const [sky] = document
            .getAnimations()
            .filter((a) => (a.effect as KeyframeEffect).pseudoElement === '::before');
          if (!sky) throw new Error('no sky animation');
          sky.pause();
          sky.currentTime = time;
          const style = getComputedStyle(document.body, '::before');
          return {
            x: new DOMMatrix(style.transform).m41,
            width: parseFloat(style.width),
          };
        }, ms);
      expect((await at(0)).x).toBe(0);
      expect((await at((seconds * 1000) / 2 + 1)).x).toBeCloseTo(-tile / 2, 0);
      const end = await at(seconds * 1000 - 1);
      // At its farthest the layer still covers the screen.
      expect(end.width + end.x).toBeGreaterThanOrEqual(phone.width);
    });
  }

  test('drifting and scrolling do not repaint the sky layer', async ({ page }) => {
    await page.setViewportSize(desktop);
    const session = await page.context().newCDPSession(page);
    const paints = new Map<number, number>();
    session.on('LayerTree.layerTreeDidChange', ({ layers }) => {
      for (const layer of layers ?? []) {
        if (layer.backendNodeId) paints.set(layer.backendNodeId, layer.paintCount);
      }
    });
    await page.goto('/');
    await ready(page);
    await expect.poll(() => opening(page), { timeout: 4000 }).toBe(false);
    // The opening, its box and the confetti are over once only the sky is animating; what they
    // repaint, once, is past then.
    await expect.poll(() => animating(page)).toEqual(['CSSAnimation BODY::before running']);
    await session.send('DOM.enable');
    const { root } = await session.send('DOM.getDocument', { depth: -1 });
    const body = root.children
      ?.find((n) => n.nodeName === 'HTML')
      ?.children?.find((n) => n.nodeName === 'BODY');
    const sky = body?.pseudoElements?.find((n) => n.pseudoType === 'before')?.backendNodeId;
    if (!sky) throw new Error('no sky layer element');
    await session.send('LayerTree.enable');
    // Layer changes are reported as frames are drawn, so each look draws some.
    const count = async () => {
      await page.screenshot();
      await page.screenshot();
      return paints.get(sky) ?? 0;
    };
    await expect.poll(count).toBeGreaterThan(0);
    const before = await count();
    // Eight steps of the drift or more, then scrolling.
    for (let i = 0; i < 4; i += 1) {
      await idle(page, 600);
      expect(await count()).toBe(before);
    }
    for (const y of [300, 900, 0]) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      expect(await count()).toBe(before);
    }
  });

  test('confetti shows once per visit, when the awards are first seen, inside Awards', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    await record(page);
    // Each confetti layer as it is the moment it is put in the page: it is gone half a second
    // later, which may be before the test can look.
    await page.addInitScript(() => {
      const layers: unknown[] = [];
      Object.assign(window, { layers });
      new MutationObserver((changes) => {
        changes
          .flatMap((change) => [...change.addedNodes])
          .filter((node) => node instanceof HTMLElement)
          .filter((el) => el.hasAttribute('data-confetti'))
          .forEach((el) => {
            const style = getComputedStyle(el);
            const own = el.getBoundingClientRect();
            const host = el.closest('section')?.getBoundingClientRect();
            layers.push({
              host: el.parentElement?.id,
              hidden: el.getAttribute('aria-hidden'),
              overflow: style.overflow,
              pointer: style.pointerEvents,
              inside:
                !!host &&
                own.left >= host.left &&
                own.right <= host.right &&
                own.top >= host.top &&
                own.bottom <= host.bottom,
            });
          });
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto('/');
    await ready(page);
    await expect(page.locator('[data-confetti]')).toHaveCount(0);
    expect(await ofKind(page, 'confetti')).toEqual([]);

    await page
      .locator('#awards li')
      .first()
      .evaluate((el) => el.scrollIntoView());
    await expect.poll(async () => (await ofKind(page, 'confetti')).length).toBeGreaterThan(0);

    await test.step('decorative, clipped to the window, and not in the way', async () => {
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { layers: unknown[] }).layers))
        .toEqual([
          { host: 'awards', hidden: 'true', overflow: 'clip', pointer: 'none', inside: true },
        ]);
    });

    await expect(page.locator('[data-confetti]')).toHaveCount(0, { timeout: 2000 });
    const count = (await ofKind(page, 'confetti')).length;
    await page.evaluate(() => window.scrollTo(0, 0));
    await scrollThrough(page);
    expect(await ofKind(page, 'confetti')).toHaveLength(count);

    await test.step('not again after a reload in the same visit', async () => {
      await page.reload();
      await ready(page);
      await scrollThrough(page);
      await expect.poll(() => kinds(page)).toContain('sky');
      expect(await ofKind(page, 'confetti')).toEqual([]);
    });
  });

  test('empty: with no awards section there is no confetti and nothing breaks', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/(<section[^>]*) id="awards"/, '$1 id="none"');
      await route.fulfill({ response, body });
    });
    await record(page);
    await page.goto('/');
    await ready(page);
    await expect(page.locator('#awards')).toHaveCount(0);
    await scrollThrough(page);
    await expect.poll(async () => (await ofKind(page, 'reveal')).length).toBeGreaterThan(0);
    expect(await ofKind(page, 'confetti')).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('a hidden tab pauses the sky and the loops; coming back resumes them', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    const hide = (hidden: boolean) =>
      page.evaluate((value) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
    const skyState = () =>
      page.evaluate(() => getComputedStyle(document.body, '::before').animationPlayState);
    await expect.poll(skyState).toBe('running');
    await radio(page, SOFTWARE).check();
    await hide(true);
    await expect.poll(skyState).toBe('paused');
    // The loops are CSS animations. A short hover transition cannot be paused and just ends.
    const loops = (await animating(page)).filter((a) => a.startsWith('CSSAnimation'));
    expect(loops.length).toBeGreaterThan(0);
    expect(loops.filter((a) => !a.endsWith('paused'))).toEqual([]);
    await hide(false);
    await expect.poll(skyState).toBe('running');
  });
});

test.describe('MOTION-03 the filter', () => {
  for (const size of [phone, desktop]) {
    test(`results at once, one plain announcement, a decorative typed line at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await ready(page);
      await expect(announce(page)).toHaveCount(1);
      await expect(announce(page)).toHaveText('');
      await expect(term(page)).toHaveText('> SHOW ALL  [5 FOUND]');
      await expect(term(page)).toHaveAttribute('aria-hidden', 'true');
      await expect(term(page)).toHaveCSS('font-family', /Courier New.*monospace/);
      // Counts what a screen reader is told: each text put into the live region.
      await announce(page).evaluate((el) => {
        const told: string[] = [];
        Object.assign(window, { told });
        new MutationObserver((changes) => {
          for (const change of changes) {
            change.addedNodes.forEach((node) => told.push(node.textContent ?? ''));
          }
        }).observe(el, { childList: true, subtree: true });
      });
      const told = () => page.evaluate(() => (window as unknown as { told: string[] }).told);
      const choose = async (label: string) => {
        if (size.width >= 640) await radio(page, label).check();
        else await page.locator('#work select').selectOption({ label });
      };

      // The rows have first slid into place, so only the filter's own movement is counted.
      await page.locator('#work').evaluate((el) => el.scrollIntoView());
      await expect.poll(() => page.locator('[data-reveal]').count()).toBe(0);

      // Holds the rows' movement and the typing at their first frame, so what each choice starts
      // can be read however slowly or quickly the machine draws.
      const hold = await page.addStyleTag({
        content:
          '#work li[data-project], #work [data-term] span { animation-play-state: paused !important }',
      });
      // The movements each listed row has now, each marked new if no earlier read saw it, and how
      // many of the line's characters have a new typing movement.
      const started = () =>
        page.evaluate(() => {
          const read = (el: Element) =>
            el.getAnimations().map((animation) => {
              const fresh = !('counted' in animation);
              Object.assign(animation, { counted: true });
              const effect = animation.effect as KeyframeEffect;
              const timing = effect.getTiming();
              const frames = effect.getKeyframes();
              const skip = ['offset', 'computedOffset', 'easing', 'composite'];
              return {
                fresh,
                name: (animation as CSSAnimation).animationName,
                delay: Number(timing.delay),
                duration: Number(timing.duration),
                properties: [
                  ...new Set(
                    frames.flatMap((f) => Object.keys(f).filter((k) => !skip.includes(k))),
                  ),
                ],
                from: String(frames[0]?.['transform'] ?? ''),
              };
            });
          const characters = [
            ...document.querySelectorAll('#work [data-term] span:not([data-caret])'),
          ];
          return {
            rows: [...document.querySelectorAll('#work li[data-project]')].map(
              (el) => [el.id, read(el)] as const,
            ),
            characters: characters.length,
            typing: characters.filter((el) =>
              read(el).some((a) => a.fresh && a.name.endsWith('type')),
            ).length,
          };
        });
      // Each listed row starts one new sideways movement, one after the other, and every
      // character of the line starts to be typed.
      const starts = async (ids: readonly string[], line: string) =>
        expect(await started()).toEqual({
          rows: ids.map((id, i) => [
            id,
            [
              {
                fresh: true,
                name: expect.stringMatching(/sort-[ab]$/),
                delay: i * 40,
                duration: 240,
                properties: ['transform'],
                from: expect.stringMatching(/^translateX?\(-12px\)$/),
              },
            ],
          ]),
          characters: line.length,
          typing: line.length,
        });

      await choose(SOFTWARE);
      // At once: no row is waiting, invisible, for its movement.
      expect(
        await rows(page).evaluateAll((els) =>
          els.map((el) => [
            el.getAttribute('data-project'),
            getComputedStyle(el).visibility,
            getComputedStyle(el).opacity,
          ]),
        ),
      ).toEqual([
        ['idiya', 'visible', '1'],
        ['umak-kalinga', 'visible', '1'],
      ]);
      await expect(term(page)).toHaveText('> SHOW SOFTWARE DEVELOPMENT  [2 FOUND]');
      await expect.poll(told).toEqual(['Showing 2 projects']);
      await starts(['idiya', 'umak-kalinga'], '> SHOW SOFTWARE DEVELOPMENT  [2 FOUND]');

      await choose(MANAGEMENT);
      await expect.poll(told).toEqual(['Showing 2 projects', 'Showing 5 projects']);
      await expect(term(page)).toHaveText('> SHOW PROJECT MANAGEMENT  [5 FOUND]');
      await starts(NAMES, '> SHOW PROJECT MANAGEMENT  [5 FOUND]');

      // The same words again are still told once.
      await choose('All');
      await expect
        .poll(told)
        .toEqual(['Showing 2 projects', 'Showing 5 projects', 'Showing 5 projects']);
      await expect(term(page)).toHaveText('> SHOW ALL  [5 FOUND]');
      // The same five rows move again.
      await starts(NAMES, '> SHOW ALL  [5 FOUND]');

      await test.step('the rows move at every choice, and the line is typed in full', async () => {
        // Let go, the movements play to their end: the rows rest and are free for the next one.
        await hold.evaluate((el) => (el as Element).remove());
        for (const row of await rows(page).all()) {
          await expect(row).toHaveCSS('animation-name', 'none');
          await expect(row).toHaveCSS('transform', 'none');
        }
        await expect
          .poll(() =>
            term(page).evaluate(
              (el) =>
                [...el.querySelectorAll('span')].filter(
                  (s) => getComputedStyle(s).visibility !== 'visible' && !s.matches('[data-caret]'),
                ).length,
            ),
          )
          .toBe(0);
      });

      await test.step('opening a project or a link announces nothing more', async () => {
        await summary(page, 'idiya').click();
        await page.evaluate(() => (location.hash = '#ehanda'));
        await expect(page.locator('#ehanda details')).toHaveJSProperty('open', true);
        expect(await told()).toHaveLength(3);
        await expect(rows(page)).toHaveCount(5);
      });

      await test.step('the line is not in the accessibility tree', async () => {
        expect(await page.locator('#work').ariaSnapshot()).not.toContain('FOUND');
      });
    });
  }
});

// The pointing hand, and the arrow: original pixel drawings inside the CSS (hot spots 9 1, 0 0).
const ARROW = /^url\("data:image\/svg\+xml,.*"\) 0 0, auto$/;
const HAND = /^url\("data:image\/svg\+xml,.*"\) 9 1, pointer$/;
const cursor = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).cursor);
const CLICKABLE = ['#welcome a.button', '#work summary', '#work label:has(input)', 'nav button'];

test.describe('MOTION-03 the cursor and hover', () => {
  test('a mouse gets a pixel arrow, and a pixel hand over what can be used', async ({ page }) => {
    await page.setViewportSize(desktop);
    await page.goto('/');
    await ready(page);
    for (const selector of ['body', '#welcome h1', '#links']) {
      expect(await cursor(page, selector)).toMatch(ARROW);
    }
    for (const selector of CLICKABLE) expect(await cursor(page, selector)).toMatch(HAND);
    // Both drawings load: a broken one would silently leave the system cursor.
    const sizes = await page.evaluate(async () => {
      const addresses = [document.body, document.querySelector('summary') ?? document.body].map(
        (el) => /url\("((?:[^"\\]|\\.)*)"\)/.exec(getComputedStyle(el).cursor)?.[1] ?? '',
      );
      return Promise.all(
        addresses.map(async (src) => {
          const image = new Image();
          image.src = src.replace(/\\(.)/g, '$1');
          await image.decode();
          return [image.naturalWidth, image.naturalHeight];
        }),
      );
    });
    expect(sizes).toEqual([
      [24, 24],
      [24, 24],
    ]);
  });

  test.describe('touch', () => {
    test.use({ hasTouch: true, isMobile: true, viewport: phone });

    test('no pixel cursor, and every action works by tap alone', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#work select')).toBeEnabled();
      for (const selector of ['body', '#welcome a.button', '#work summary']) {
        expect(await cursor(page, selector)).not.toContain('url(');
      }
      await summary(page, 'idiya').tap();
      await expect(page.locator('#idiya').getByText('Problem')).toBeVisible();
      // No hover look sticks after the tap.
      await expect(page.locator('#idiya summary')).not.toHaveCSS(
        'background-color',
        'rgb(28, 69, 135)',
      );
      await page.locator('#work select').selectOption({ label: SOFTWARE });
      await expect(rows(page)).toHaveCount(2);
      await toggle(page).tap();
      await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
      expect(
        await page.evaluate(() => [window.innerWidth, document.documentElement.scrollWidth]),
      ).toEqual([phone.width, phone.width]);
    });
  });

  // --title, --title2 and --titleText from the design brief.
  const TITLE = {
    light: ['rgb(28, 69, 135)', 'rgb(43, 105, 176)', 'rgb(255, 255, 255)'],
    dark: ['rgb(38, 51, 125)', 'rgb(59, 75, 163)', 'rgb(255, 255, 255)'],
  } as const;

  for (const scheme of ['light', 'dark'] as const) {
    test(`${scheme}: hover raises buttons, inverts rows, lifts awards, lights title bars`, async ({
      page,
    }) => {
      const [title, title2, text] = TITLE[scheme];
      await page.setViewportSize(desktop);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await ready(page);
      await expect.poll(() => opening(page), { timeout: 4000 }).toBe(false);

      const button = page.getByRole('link', { name: 'See my projects' });
      await button.hover();
      await expect(button).toHaveCSS('background-color', title);
      await expect(button).toHaveCSS('color', text);
      await expect(button).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -2, -2)');
      await expect(page.locator('#welcome h2')).toHaveCSS(
        'background-image',
        `linear-gradient(90deg, ${title2}, ${title})`,
      );

      const row = summary(page, 'idiya');
      await row.hover();
      await expect(row).toHaveCSS('background-color', title);
      for (const part of await row.locator('h3, span').all()) {
        await expect(part).toHaveCSS('color', text);
      }
      expect(
        await row.locator('h3').evaluate((el) => getComputedStyle(el, '::before').content),
      ).toContain('> ');
      // The marker is for the eyes only.
      expect(await page.locator('#idiya').ariaSnapshot()).not.toContain('> Idiya');

      const award = page.locator('#awards li').first();
      await award.hover({ position: { x: 100, y: 40 } });
      await expect(award).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -3, -3)');
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });

    test(`${scheme}: a hovered, focused taskbar button keeps a visible focus outline`, async ({
      page,
    }) => {
      const [title, , text] = TITLE[scheme];
      await page.setViewportSize(desktop);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await expect(toggle(page)).toBeVisible();
      await toggle(page).focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await toggle(page).hover();
      await expect(toggle(page)).toHaveCSS('background-color', title);
      await expect(toggle(page)).toHaveCSS('outline-color', text);
    });
  }
});

test.describe('NFR-01 and NFR-04 with motion on', () => {
  for (const size of [phone, desktop]) {
    test(`no layout shift and no long task from motion at ${size.width} px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.addInitScript(() => {
        const seen = { shifts: [] as string[], long: [] as number[] };
        Object.assign(window, { seen });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
              sources: { node: Node | null }[];
            };
            if (shift.hadRecentInput) continue;
            // What moved. The taskbar is left out: from 900 px its current section turns bold,
            // which widens that button while the page scrolls (T13, not motion).
            // A shift that names nothing is counted too.
            for (const { node } of shift.sources.length ? shift.sources : [{ node: null }]) {
              const el = node instanceof Element ? node : node?.parentElement;
              if (el?.closest('nav[aria-label="Taskbar"]')) continue;
              seen.shifts.push(`${shift.value} ${el?.outerHTML.slice(0, 80) ?? 'unknown'}`);
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        window.addEventListener('load', () =>
          setTimeout(() => {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) seen.long.push(entry.duration);
            }).observe({ type: 'longtask' });
          }, 500),
        );
      });
      await page.goto('/');
      await ready(page);
      // The measure starts once the fonts are in: their swap is tested in fonts.spec.ts.
      await page.evaluate(() => document.fonts.ready);
      const result = () =>
        page.evaluate(
          () => (window as unknown as { seen: { shifts: string[]; long: number[] } }).seen,
        );
      const start = (await result()).shifts.length;
      await idle(page, 3000);
      await scrollThrough(page);
      await idle(page, 1000);
      const end = await result();
      expect(end.shifts.slice(start)).toEqual([]);
      expect(end.long).toEqual([]);
    });
  }

  for (const scheme of ['light', 'dark'] as const) {
    for (const size of [phone, desktop]) {
      test(`${scheme}: no axe violations with motion on at ${size.width} px`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.emulateMedia({ colorScheme: scheme });
        const violations = async () => (await new AxeBuilder({ page }).analyze()).violations;
        await page.goto('/');
        expect(await violations()).toEqual([]);
        await ready(page);
        await scrollThrough(page);
        if (size.width >= 640) await radio(page, SOFTWARE).check();
        else await page.locator('#work select').selectOption({ label: SOFTWARE });
        await summary(page, 'idiya').click();
        expect(await violations()).toEqual([]);
        await expect(term(page)).toHaveCSS(
          'background-color',
          scheme === 'light' ? 'rgb(28, 42, 68)' : 'rgb(6, 9, 23)',
        );
        await expect(term(page)).toHaveCSS(
          'color',
          scheme === 'light' ? 'rgb(183, 240, 208)' : 'rgb(127, 224, 176)',
        );
      });
    }
  }

  test('the keyboard reaches and operates the controls while motion plays', async ({ page }) => {
    await page.setViewportSize(desktop);
    await page.goto('/');
    await ready(page);
    await radio(page, 'All').focus();
    await page.keyboard.press('ArrowRight');
    await expect(radio(page, SOFTWARE)).toBeChecked();
    await expect(rows(page)).toHaveCount(2);
    await page.keyboard.press('Tab');
    await expect(summary(page, 'idiya')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#idiya').getByText('Problem')).toBeVisible();
    for (const name of NAMES.slice(3)) await expect(page.locator(`#${name}`)).toBeVisible();
  });

  test(`all of the page's CSS stays within ${CSS_CAP} compressed bytes`, async ({ page }) => {
    await page.goto('/');
    await ready(page);
    const sizes = { css: 0, js: 0, html: 0 };
    const addresses = await page.evaluate(() => ({
      css: [...document.querySelectorAll('link[rel="stylesheet"]')].map(
        (el) => el.getAttribute('href') ?? '',
      ),
      js: [...document.querySelectorAll('script[src]')]
        .filter((el) => !el.hasAttribute('nomodule'))
        .map((el) => el.getAttribute('src') ?? ''),
    }));
    for (const kind of ['css', 'js'] as const) {
      for (const href of new Set(addresses[kind])) {
        sizes[kind] += gzipSync(await (await page.request.get(href)).body()).length;
      }
    }
    sizes.html = gzipSync(await (await page.request.get('/')).body()).length;
    process.stdout.write(`motion sizes, gzip bytes: ${JSON.stringify(sizes)}\n`);
    expect(sizes.css).toBeLessThanOrEqual(CSS_CAP);
  });
});
