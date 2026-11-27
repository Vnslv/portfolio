import { gzipSync } from 'node:zlib';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The sky theme (T13 ticket): THEME-01 light and dark, NFR-01 weight, NFR-04 contrast.

// Token values from docs/standards/design-brief.md.
const TOKENS = {
  light: {
    desk: '#8fb8ee',
    desk2: '#c9dcf7',
    face: '#d6dfec',
    field: '#fafcff',
    text: '#141c2b',
    muted: '#3d4a61',
    hi: '#ffffff',
    lo: '#7f8ea8',
    edge: '#1c2a44',
    title: '#1c4587',
    title2: '#2b69b0',
    titleText: '#ffffff',
    link: '#1c4587',
    badge: '#b7f0d0',
    badgeText: '#08351f',
  },
  dark: {
    desk: '#0c1030',
    desk2: '#1b1440',
    face: '#222a47',
    field: '#161c33',
    text: '#eef2ff',
    muted: '#b9c3de',
    hi: '#4a5680',
    lo: '#6c7aa8',
    edge: '#060917',
    title: '#26337d',
    title2: '#3b4ba3',
    titleText: '#ffffff',
    link: '#b9c9ff',
    badge: '#7fe0b0',
    badgeText: '#08351f',
  },
} as const;

// The tiles of the owner's mock A2, exactly as the owner gave them (2026-11-26).
const SKY = {
  light: {
    width: 640,
    height: 420,
    paths: [
      ['#f4f8ff', 'M346 206h80v16h-80zM330 222h112v16h-112zM362 190h40v16h-40z'],
      [
        '#ffffff',
        'M52 72h60v12h-60zM40 84h84v12h-84zM64 60h30v12h-30zM160 330h50v10h-50zM150 340h70v10h-70zM170 320h25v10h-25z',
      ],
    ],
  },
  dark: {
    width: 512,
    height: 512,
    paths: [
      [
        '#ffffff',
        'M470 148h2v2h-2zM170 78h4v4h-4zM448 30h2v2h-2zM260 214h2v2h-2zM472 262h2v2h-2zM272 314h2v2h-2zM202 362h4v4h-4zM208 78h2v2h-2zM112 322h4v4h-4zM140 4h2v2h-2zM0 314h2v2h-2zM250 352h2v2h-2zM352 456h2v2h-2zM446 470h2v2h-2zM484 246h2v2h-2zM370 148h2v2h-2zM458 18h2v2h-2zM54 42h2v2h-2zM484 98h2v2h-2zM212 30h2v2h-2zM246 508h2v2h-2zM160 2h2v2h-2z',
      ],
      [
        '#cdb4ff',
        'M276 350h2v2h-2zM26 350h2v2h-2zM412 62h4v4h-4zM352 328h4v4h-4zM464 190h4v4h-4zM150 478h2v2h-2zM28 186h4v4h-4zM144 186h2v2h-2zM234 440h4v4h-4zM178 168h2v2h-2zM114 106h2v2h-2zM202 120h4v4h-4zM286 178h4v4h-4zM170 370h2v2h-2zM68 254h2v2h-2zM84 338h2v2h-2zM258 386h2v2h-2zM12 152h2v2h-2zM12 390h4v4h-4zM344 124h2v2h-2zM62 106h2v2h-2zM38 138h2v2h-2zM410 338h4v4h-4zM208 254h2v2h-2zM368 340h2v2h-2z',
      ],
      [
        '#7f8cc9',
        'M272 168h2v2h-2zM122 190h4v4h-4zM264 258h2v2h-2zM448 56h2v2h-2zM302 70h2v2h-2zM454 452h4v4h-4zM120 190h4v4h-4zM250 0h2v2h-2zM472 10h2v2h-2zM494 288h2v2h-2zM392 358h2v2h-2zM16 56h2v2h-2zM440 508h4v4h-4zM214 126h2v2h-2zM158 504h2v2h-2zM218 38h2v2h-2zM468 464h4v4h-4zM216 344h4v4h-4zM498 78h4v4h-4zM46 118h2v2h-2zM390 222h2v2h-2zM452 432h2v2h-2zM248 490h2v2h-2z',
      ],
    ],
  },
} as const;

const SCHEMES = ['light', 'dark'] as const;
type Scheme = (typeof SCHEMES)[number];
const PATHS = ['/', '/no-such-page'];
const phone = { width: 390, height: 844 };
const desktop = { width: 1280, height: 800 };
const SMALL = '/images/profile-small.webp';
const ALT = 'Vonn Salve wearing glasses and a tan polo shirt, looking down';

// The compressed size of the page's CSS before this ticket (gzip, build of the untouched source),
// and the ticket's limit on what the new background may add: 3 KB.
const CSS_BEFORE = 3922;
const CSS_ALLOWANCE = 3 * 1024;

const toggle = (page: Page) => page.getByRole('button', { name: /^(Dark|Light) theme$/ });

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgb = (hex: string) => `rgb(${channels(hex).join(', ')})`;

// WCAG 2.2 contrast of two opaque colors, from "rgb(r, g, b)" strings.
function contrast(a: string, b: string): number {
  const luminance = (color: string) => {
    const [r = 0, g = 0, bl = 0] = (color.match(/[\d.]+/g) ?? []).map((n) => {
      const v = Number(n) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Every token as the browser resolves it on this page.
function paintedTokens(page: Page, names: string[]) {
  return page.evaluate((list) => {
    const probe = document.createElement('div');
    document.body.append(probe);
    const out = list.map((name) => {
      probe.style.color = `var(--${name})`;
      return [name, getComputedStyle(probe).color] as const;
    });
    probe.remove();
    return Object.fromEntries(out);
  }, names);
}

function skyLayer(page: Page) {
  return page.evaluate(() => {
    const s = getComputedStyle(document.body, '::before');
    const url = /url\("((?:[^"\\]|\\.)*)"\)/.exec(s.backgroundImage)?.[1] ?? '';
    const address = url.replace(/\\(.)/g, '$1');
    const svg = new DOMParser().parseFromString(
      decodeURIComponent(address.slice(address.indexOf(',') + 1)),
      'image/svg+xml',
    ).documentElement;
    return {
      position: s.position,
      zIndex: s.zIndex,
      pointerEvents: s.pointerEvents,
      willChange: s.willChange,
      repeat: s.backgroundRepeat,
      at: s.backgroundPosition,
      attachment: s.backgroundAttachment,
      image: s.backgroundImage,
      addresses: [...s.backgroundImage.matchAll(/url\("([^,]*),/g)].map((m) => m[1]),
      urls: s.backgroundImage.split('url(').length - 1,
      body: getComputedStyle(document.body).backgroundImage,
      tile: {
        width: Number(svg.getAttribute('width')),
        height: Number(svg.getAttribute('height')),
        edges: svg.getAttribute('shape-rendering'),
        paths: [...svg.querySelectorAll('path')].map((p) => [
          p.getAttribute('fill'),
          p.getAttribute('d'),
        ]),
      },
    };
  });
}

type Rect = { x: number; y: number; w: number; h: number; color: number[] };

function rects(scheme: Scheme): Rect[] {
  return SKY[scheme].paths.flatMap(([fill, d]) =>
    [...d.matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-\d+z/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
      w: Number(m[3]),
      h: Number(m[4]),
      color: channels(fill),
    })),
  );
}

// Compares every pixel of a screenshot of the sky alone with what it must be: the gradient from
// --desk at the top to --desk2 at the bottom, with the tile repeated from the top left. A seam, a
// band, a gap or a shape out of place is a wrong pixel.
function wrongPixels(page: Page, png: Buffer, scheme: Scheme) {
  return page.evaluate(
    async ({ data, top, bottom, shapes, tileW, tileH }) => {
      const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('no canvas');
      context.drawImage(bitmap, 0, 0);
      const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
      const tile = new Int16Array(tileW * tileH).fill(-1);
      shapes.forEach((r, i) => {
        for (let y = r.y; y < r.y + r.h; y += 1) {
          tile.fill(i, y * tileW + r.x, y * tileW + r.x + r.w);
        }
      });
      let wrong = 0;
      let drawn = 0;
      for (let y = 0; y < bitmap.height; y += 1) {
        const t = (y + 0.5) / bitmap.height;
        const sky = top.map((v, c) => v + ((bottom[c] ?? 0) - v) * t);
        for (let x = 0; x < bitmap.width; x += 1) {
          const shape = shapes[tile[(y % tileH) * tileW + (x % tileW)] ?? -1];
          if (shape) drawn += 1;
          const want = shape ? shape.color : sky;
          const at = (y * bitmap.width + x) * 4;
          if (want.some((v, c) => Math.abs((pixels[at + c] ?? -99) - v) > 3)) wrong += 1;
        }
      }
      return { width: bitmap.width, height: bitmap.height, wrong, drawn: drawn > 0 };
    },
    {
      data: png.toString('base64'),
      top: channels(TOKENS[scheme].desk),
      bottom: channels(TOKENS[scheme].desk2),
      shapes: rects(scheme),
      tileW: SKY[scheme].width,
      tileH: SKY[scheme].height,
    },
  );
}

test.describe('THEME-01 the sky theme tokens', () => {
  for (const scheme of SCHEMES) {
    for (const path of PATHS) {
      test(`${scheme}: every token, from the device setting and from the toggle, on ${path}`, async ({
        page,
      }) => {
        const names = Object.keys(TOKENS[scheme]);
        const wanted = Object.fromEntries(
          Object.entries(TOKENS[scheme]).map(([name, hex]) => [name, rgb(hex)]),
        );
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        await expect(toggle(page)).toBeVisible();
        expect(await paintedTokens(page, names)).toEqual(wanted);

        // The same values when the visitor chooses the theme against the device setting.
        await page.emulateMedia({ colorScheme: scheme === 'light' ? 'dark' : 'light' });
        await toggle(page).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
        expect(await paintedTokens(page, names)).toEqual(wanted);
      });
    }
  }
});

test.describe('the sky and the night', () => {
  for (const scheme of SCHEMES) {
    for (const path of PATHS) {
      test(`${scheme}: a fixed layer with the gradient and the owner tile, on ${path}`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        const layer = await skyLayer(page);
        expect(layer).toMatchObject({
          position: 'fixed',
          zIndex: '-1',
          pointerEvents: 'none',
          willChange: 'transform',
          repeat: 'repeat, repeat',
          at: '0% 0%, 0% 0%',
          attachment: 'scroll, scroll',
          addresses: ['data:image/svg+xml'],
          urls: 1,
          body: 'none',
        });
        expect(layer.image).toContain(
          `linear-gradient(${rgb(TOKENS[scheme].desk)}, ${rgb(TOKENS[scheme].desk2)})`,
        );
        expect(layer.tile).toEqual({ ...SKY[scheme], edges: 'crispEdges' });
      });
    }

    test(`${scheme}: no shape is cut at a tile edge`, () => {
      const { width, height, paths } = SKY[scheme];
      const shapes = rects(scheme);
      // Every shape in the paths was read, so the check cannot pass on a missed one.
      expect(shapes).toHaveLength(
        paths.map(([, d]) => d.split('M').length - 1).reduce((a, b) => a + b),
      );
      expect(
        shapes.filter((r) => r.x < 0 || r.y < 0 || r.x + r.w > width || r.y + r.h > height),
      ).toEqual([]);
    });

    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [640, 800],
      [1280, 800],
      [700, 2400],
      [2560, 1440],
    ] as const) {
      test(`${scheme}: no seam or band at ${width} by ${height} px, at any scroll position`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        // The still sky (T14): a drifting one is never the same in two pictures.
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.goto('/');
        await expect(toggle(page)).toBeVisible();
        // The sky alone: the page keeps its height, so it still scrolls.
        await page.addStyleTag({ content: 'body > * { visibility: hidden !important }' });
        const end = await page.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight,
        );
        const shots: Buffer[] = [];
        for (const y of [0, Math.round(end / 2), end]) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          shots.push(await page.screenshot());
        }
        const [first] = shots;
        if (!first) throw new Error('no screenshot');
        expect(await wrongPixels(page, first, scheme)).toEqual({
          width,
          height,
          wrong: 0,
          drawn: true,
        });
        // The layer stays still: every scroll position shows the same sky.
        expect(shots.map((shot) => shot.equals(first))).toEqual([true, true, true]);
      });
    }

    test(`${scheme}: scrolling does not repaint the sky layer`, async ({ page }) => {
      await page.setViewportSize(desktop);
      // The still sky (T14): the opening repaints it once or twice just after load, which is not
      // scrolling. motion.spec.ts checks the drifting sky.
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      const session = await page.context().newCDPSession(page);
      const paints = new Map<number, number>();
      session.on('LayerTree.layerTreeDidChange', ({ layers }) => {
        for (const layer of layers ?? []) {
          if (layer.backendNodeId) paints.set(layer.backendNodeId, layer.paintCount);
        }
      });
      await page.goto('/');
      await expect(toggle(page)).toBeVisible();
      await session.send('DOM.enable');
      const { root } = await session.send('DOM.getDocument', { depth: -1 });
      const body = root.children
        ?.find((n) => n.nodeName === 'HTML')
        ?.children?.find((n) => n.nodeName === 'BODY');
      const sky = body?.pseudoElements?.find((n) => n.pseudoType === 'before')?.backendNodeId;
      if (!sky) throw new Error('no sky layer element');
      await session.send('LayerTree.enable');
      // Layer changes are reported as frames are drawn, so each step draws some.
      const frames = async (y: number) => {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.screenshot();
        await page.screenshot();
      };
      // The sky has a compositing layer of its own, and it has been painted.
      await expect
        .poll(async () => {
          await frames(0);
          return paints.get(sky) ?? 0;
        })
        .toBeGreaterThan(0);
      const before = paints.get(sky) ?? 0;
      for (const y of [300, 900, 1500, 0, 900]) await frames(y);
      expect(paints.get(sky)).toBe(before);
      // The count does move when the sky must be drawn again, so the check above can fail.
      await toggle(page).click();
      await expect
        .poll(async () => {
          await frames(900);
          return paints.get(sky) ?? 0;
        })
        .toBeGreaterThan(before);
    });
  }

  test('the background makes no network request, on load or when the theme changes', async ({
    page,
    baseURL,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const requested: { url: string; type: string }[] = [];
    page.on('request', (r) => requested.push({ url: r.url(), type: r.resourceType() }));
    await page.goto('/');
    await expect(toggle(page)).toBeVisible();
    expect((await skyLayer(page)).urls).toBe(1);
    expect(requested.filter((r) => !r.url.startsWith(baseURL ?? 'no base'))).toEqual([]);
    // The only pictures the page asks for are its own photos and the tab icon.
    expect(
      requested
        .filter((r) => r.type === 'image' || r.url.includes('.svg'))
        .map((r) => new URL(r.url).pathname)
        .filter((p) => !p.startsWith('/images/') && p !== '/icon.svg'),
    ).toEqual([]);
    const loaded = requested.length;
    await toggle(page).click();
    await page.screenshot();
    expect((await skyLayer(page)).tile.width).toBe(SKY.dark.width);
    expect(requested.slice(loaded)).toEqual([]);
  });

  test('NFR-01: the background adds at most 3 KB of compressed CSS', async ({ page }) => {
    await page.goto('/');
    const sheets = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    expect(sheets.length).toBeGreaterThan(0);
    let compressed = 0;
    for (const href of sheets) {
      compressed += gzipSync(await (await page.request.get(href)).body()).length;
    }
    expect(compressed).toBeLessThanOrEqual(CSS_BEFORE + CSS_ALLOWANCE);
  });
});

// The color behind a focus outline: inside the control for an inward outline, else around it.
// Null means the outline lies on the sky itself.
function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el.hasAttribute('data-seen')) return null;
    el.setAttribute('data-seen', '');
    const style = getComputedStyle(el);
    let node = parseFloat(style.outlineOffset) < 0 ? el : el.parentElement;
    let behind: string | null = null;
    while (node && node !== document.body) {
      const color = getComputedStyle(node).backgroundColor;
      if (color !== 'rgba(0, 0, 0, 0)') {
        behind = color;
        break;
      }
      node = node.parentElement;
    }
    return {
      name: `${el.tagName} ${(el.textContent ?? '').trim().slice(0, 40)}`,
      current: el.getAttribute('aria-current') === 'true',
      line: style.outlineStyle,
      color: style.outlineColor,
      behind,
    };
  });
}

test.describe('NFR-04 contrast in the sky theme', () => {
  for (const scheme of SCHEMES) {
    test(`${scheme}: every text color meets 4.5 to 1 on its background`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      const t = await paintedTokens(page, Object.keys(TOKENS[scheme]));
      const pairs = [
        ['text', 'face'],
        ['text', 'field'],
        ['muted', 'face'],
        ['muted', 'field'],
        ['link', 'face'],
        ['link', 'field'],
        ['titleText', 'title'],
        ['titleText', 'title2'],
        ['badgeText', 'badge'],
      ] as const;
      expect(pairs.filter(([a, b]) => contrast(t[a] ?? '', t[b] ?? '') < 4.5)).toEqual([]);
    });

    for (const size of [phone, desktop]) {
      test(`${scheme}: every focus outline meets 3 to 1 at ${size.width} px`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.emulateMedia({ colorScheme: scheme });
        const low: unknown[] = [];
        let currentSeen = 0;
        const check = (stop: NonNullable<Awaited<ReturnType<typeof focused>>>) => {
          const behind = stop.behind
            ? [stop.behind]
            : [rgb(TOKENS[scheme].desk), rgb(TOKENS[scheme].desk2)];
          if (stop.current) currentSeen += 1;
          if (stop.line === 'none' || behind.some((b) => contrast(stop.color, b) < 3)) {
            low.push(stop);
          }
        };
        for (const path of PATHS) {
          await page.goto(path);
          await expect(toggle(page)).toBeVisible();
          let stops = 0;
          for (let i = 0; i < 100; i += 1) {
            await page.keyboard.press('Tab');
            const stop = await focused(page);
            if (!stop) break;
            stops += 1;
            check(stop);
          }
          expect(stops).toBeGreaterThan(1);
        }
        // A window takes focus when its section link is used; its outline lies on the sky.
        await page.goto('/');
        await page.keyboard.press('Tab');
        for (const id of ['welcome', 'awards', 'work', 'tools', 'links']) {
          await page.locator(`#${id}`).focus();
          const stop = await focused(page);
          if (!stop) throw new Error(`no focus on ${id}`);
          expect(stop.behind).toBeNull();
          check(stop);
        }
        expect(low).toEqual([]);
        // From 900 px the current section is in the title colors; it must be among the stops.
        expect(currentSeen).toBeGreaterThanOrEqual(size.width >= 900 ? 1 : 0);
      });
    }

    test(`${scheme}: the chosen role radio meets 3 to 1 on its window`, async ({ page }) => {
      await page.setViewportSize(desktop);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      const colors = await page
        .locator('#work')
        .getByRole('radio', { name: 'All' })
        .evaluate((el) => {
          let node: Element | null = el.parentElement;
          while (node && getComputedStyle(node).backgroundColor === 'rgba(0, 0, 0, 0)') {
            node = node.parentElement;
          }
          return [
            getComputedStyle(el).accentColor,
            node ? getComputedStyle(node).backgroundColor : '',
          ] as const;
        });
      expect(contrast(...colors)).toBeGreaterThanOrEqual(3);
    });

    for (const size of [phone, desktop]) {
      test(`${scheme}: no axe violations at ${size.width} px, home, failed photo, not-found`, async ({
        page,
      }) => {
        await page.setViewportSize(size);
        await page.emulateMedia({ colorScheme: scheme });
        const violations = async () => (await new AxeBuilder({ page }).analyze()).violations;
        for (const path of PATHS) {
          await page.goto(path);
          await expect(toggle(page)).toBeVisible();
          expect(await violations()).toEqual([]);
        }
        await page.route(`**${SMALL}`, (route) => route.abort());
        await page.goto('/');
        await expect(page.locator('#welcome figure').getByText(ALT)).toBeVisible();
        await expect(toggle(page)).toBeVisible();
        expect(await violations()).toEqual([]);
      });
    }
  }
});
