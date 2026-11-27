import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Tools board (T15): TOOL-01, SITE-01, NFR-04, NFR-08, NFR-01. The tools and groups are the
// owner's (T15 ticket); timings and colors are from the approved board, tools-board.html. The
// logos, black marks and credit line are the owner's option C2 (T15 ticket).

const phone = { width: 390, height: 844 };
const desktop = { width: 1280, height: 800 };
const GROUPS = [
  { name: 'Languages', key: 'Languages 1–5', tools: 'JavaScript,TypeScript,Python,HTML,CSS' },
  {
    name: 'Frontend and mobile',
    key: 'Frontend and mobile 6–13',
    tools: 'React,Vue.js,Next.js,React Native,Expo,Vite,Tailwind CSS,Bootstrap',
  },
  {
    name: 'Backend and data',
    key: 'Backend and data 14–21',
    tools: 'Node.js,Express.js,MySQL,Postgres,SQLite,Firebase,Supabase,Prisma',
  },
  {
    name: 'Project management',
    key: 'Project management 22–25',
    tools: 'Figma,GitHub Projects,Jira,Google Workspace',
  },
];
const TOOLS = GROUPS.flatMap((group, g) =>
  group.tools.split(',').map((name) => ({ name, group: group.name, g })),
);
const NAMES = TOOLS.map((tool) => tool.name);
// The pieces that show their brand's logo, with the symbol each uses; the rest are letter tiles.
const LOGOS: Record<string, string> = {
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  HTML: 'html',
  'Vue.js': 'vue',
  'Next.js': 'nextjs',
  Bootstrap: 'bootstrap',
  Figma: 'figma',
  'GitHub Projects': 'github',
};
const FILE = '/images/tools.svg';
const CREDIT =
  'Logos are trademarks of their owners and only name each tool. HTML5 logo by W3C, CC BY 3.0. Vue logo by Evan You, CC BY-NC-SA 4.0. JS logo by Christopher Williams, MIT. Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc. or its affiliates in the US and other countries.';
const PROMPT = 'Pick a piece';
const HELP = 'Hover, tap, or use Tab and the arrow keys.';
// Tile colors by group, the path, and each theme's title color, as on the approved board.
const COLORS = {
  light: {
    tiles: ['#bfe3c6', '#f7e3a8', '#f3c6cf', '#c9c6f2'],
    path: '#eadfc4',
    title: '#1c4587',
    muted: '#3d4a61',
  },
  dark: {
    tiles: ['#2c5a45', '#6a5726', '#6b3344', '#433f86'],
    path: '#2c3354',
    title: '#26337d',
    muted: '#b9c3de',
  },
} as const;
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

const tools = (page: Page) => page.locator('#tools');
const board = (page: Page) => tools(page).locator('ul').first();
const cells = (page: Page) => board(page).locator('> li');
const pieces = (page: Page) => board(page).getByRole('button');
const piece = (page: Page, name: string) => pieces(page).nth(NAMES.indexOf(name));
// The cell of a tool: Start is the first cell.
const cell = (page: Page, i: number) => cells(page).nth(i + 1);
const chip = (page: Page, i: number) => cell(page, i).locator('span:has(> svg)');
const status = (page: Page) => tools(page).getByRole('status');
const bar = (page: Page) => page.getByRole('navigation', { name: 'Taskbar' });
const ready = (page: Page) => expect(pieces(page)).toHaveCount(NAMES.length);
const violations = async (page: Page) => (await new AxeBuilder({ page }).analyze()).violations;

const credit = (page: Page) => tools(page).getByText(CREDIT, { exact: true });
// How much of each logo is drawn, as width by height: nothing until the file has arrived.
const inks = (page: Page) =>
  cells(page)
    .locator('use')
    .evaluateAll((els) =>
      els.map((el) => {
        const box = (el as SVGUseElement).getBBox();
        return box.width > 0 && box.height > 0;
      }),
    );
const allDrawn = (page: Page) =>
  expect.poll(() => inks(page)).toEqual(Object.keys(LOGOS).map(() => true));
// Holds the logo file back until the returned function is called.
async function holdFile(page: Page) {
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**${FILE}`, async (route) => {
    await held;
    await route.continue();
  });
  return release;
}
// Where everything on the board is, and the size of each mark.
const places = (page: Page) =>
  tools(page).evaluate((section) =>
    [...section.querySelectorAll('li, li span, li svg, [role="status"], p')].map((el) => {
      const box = el.getBoundingClientRect();
      return [box.x, box.y, box.width, box.height].map(Math.round).join(' ');
    }),
  );
const markSizes = (page: Page) =>
  cells(page)
    .locator('svg')
    .evaluateAll((els) =>
      els.map((el) => {
        const box = el.getBoundingClientRect();
        return `${box.width} by ${box.height}`;
      }),
    );

async function says(page: Page, name: string) {
  const tool = TOOLS[NAMES.indexOf(name)];
  await expect(status(page).locator('b')).toHaveText(name);
  await expect(status(page).locator('span')).toHaveText(tool?.group ?? '');
}

// Everything the browser is animating inside an element.
const moves = (target: Locator) =>
  target.evaluate((el) =>
    el.getAnimations({ subtree: true }).map((animation) => {
      const effect = animation.effect as KeyframeEffect;
      const timing = effect.getTiming();
      return {
        name:
          (animation as CSSAnimation).animationName?.replace(/^.*?(bob|hop)$/, '$1') ??
          `transition ${(animation as CSSTransition).transitionProperty}`,
        duration: Number(timing.duration),
        delay: Number(timing.delay),
        iterations: Number(timing.iterations),
        steps: [timing.easing, ...effect.getKeyframes().map((f) => f.easing)]
          .join(' ')
          .includes('steps('),
        state: animation.playState,
      };
    }),
  );
const names = async (target: Locator) => (await moves(target)).map((move) => move.name);

// The cells in path order, read from where they are drawn.
async function layout(page: Page) {
  const boxes = await cells(page).evaluateAll((els) =>
    els.map((el) => {
      // The place in the grid, which no transform moves.
      const e = el as HTMLElement;
      return { x: e.offsetLeft, y: e.offsetTop };
    }),
  );
  const sorted = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);
  const xs = sorted(boxes.map((b) => b.x));
  const ys = sorted(boxes.map((b) => b.y));
  return { columns: xs.length, at: boxes.map((b) => [ys.indexOf(b.y), xs.indexOf(b.x)]) };
}

// The path as it must be: along the first row, down, back along the next.
const winding = (columns: number) =>
  Array.from({ length: NAMES.length + 2 }, (_, k) => {
    const row = Math.floor(k / columns);
    const x = k % columns;
    return [row, row % 2 ? columns - 1 - x : x];
  });

for (const { size, menu } of [
  { size: phone, menu: true },
  { size: desktop, menu: false },
]) {
  test.describe(`SITE-01 the Tools section at ${size.width} px`, () => {
    test.use({ viewport: size });

    test('sits between Projects and Links, in the page, bar and Menu, at #tools', async ({
      page,
    }) => {
      await page.goto('/');
      const ids = await page.locator('main > section').evaluateAll((els) => els.map((e) => e.id));
      expect(ids).toEqual(['welcome', 'awards', 'work', 'tools', 'links']);
      await expect(tools(page).getByRole('heading', { level: 2 })).toHaveText('Tools');
      for (const list of [':scope > a', 'details a']) {
        const links = await bar(page)
          .locator(list)
          .evaluateAll((els) => els.map((e) => [e.textContent, e.getAttribute('href')]));
        expect(links.slice(2)).toEqual([
          ['Projects', '#work'],
          ['Tools', '#tools'],
          ['Links', '#links'],
        ]);
      }
      if (menu) await bar(page).locator('summary').click();
      const link = bar(page).getByRole('link', { name: 'Tools', exact: true });
      await expect(link.locator('svg')).toHaveCount(1);
      await link.click();
      await expect(page).toHaveURL('/#tools');
      await expect(tools(page)).toBeInViewport();
      await expect(bar(page).locator('[aria-current="true"]')).toHaveAttribute('href', '#tools');
    });

    test('the address #tools opens the page at the section', async ({ page }) => {
      await page.goto('/#tools');
      await ready(page);
      await expect
        .poll(async () => Math.round((await tools(page).boundingBox())?.y ?? -1))
        .toBe(12);
    });

    test('error state: the not-found Tools link goes to the board', async ({ page }) => {
      await page.goto('/no-such-page');
      if (menu) await bar(page).locator('summary').click();
      const link = bar(page).getByRole('link', { name: 'Tools', exact: true });
      await expect(link).toHaveAttribute('href', '/#tools');
      await link.click();
      await expect(page).toHaveURL('/#tools');
      await ready(page);
    });
  });
}

for (const size of [phone, desktop]) {
  test.describe(`TOOL-01 the pieces at ${size.width} px`, () => {
    test.use({ viewport: size });

    test('each shows its name and number, and gives its group to assistive technology', async ({
      page,
    }) => {
      await page.goto('/');
      await ready(page);
      for (const [i, { name, group }] of TOOLS.entries()) {
        await expect(pieces(page).nth(i)).toHaveAccessibleName(name);
        await expect(pieces(page).nth(i)).toHaveAccessibleDescription(group);
        await expect(pieces(page).nth(i).getByText(name, { exact: true })).toBeVisible();
        await expect(cell(page, i).getByText(String(i + 1), { exact: true })).toBeVisible();
      }
      await expect(cells(page).first()).toHaveText('Start');
      await expect(cells(page).last()).toHaveText('Finish');
      await expect(tools(page).locator('ul').last().locator('li')).toHaveText(
        GROUPS.map((group) => group.key),
      );
      await expect(cells(page).locator('svg[aria-hidden="true"]')).toHaveCount(NAMES.length);
      await expect(tools(page).locator('img, image')).toHaveCount(0);
    });

    for (const scheme of ['light', 'dark'] as const) {
      test(`${scheme}: tiles are colored by group, with black letters on a white chip`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.goto('/');
        await ready(page);
        const color = COLORS[scheme];
        for (const [i, { g }] of TOOLS.entries()) {
          await expect(cell(page, i)).toHaveCSS('background-color', rgb(color.tiles[g] ?? ''));
          await expect(chip(page, i)).toHaveCSS('background-color', rgb('#ffffff'));
          await expect(chip(page, i)).toHaveCSS('width', '48px');
        }
        const letters = cells(page).locator('svg > path');
        await expect(letters).toHaveCount(NAMES.length - Object.keys(LOGOS).length);
        for (const path of await letters.all()) {
          await expect(path).toHaveCSS('fill', rgb('#000000'));
        }
        await expect(cells(page).first()).toHaveCSS('background-color', rgb(color.path));
        await expect(cells(page).last()).toHaveCSS('background-color', rgb(color.path));
        await piece(page, 'React').focus();
        await expect(cell(page, 5)).toHaveCSS('background-color', rgb(color.title));
        await expect(cell(page, 5)).toHaveCSS('color', rgb('#ffffff'));
      });

      test(`${scheme}: no axe violations at rest and with a piece picked`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto('/#tools');
        await ready(page);
        await allDrawn(page);
        await expect(credit(page)).toBeVisible();
        await expect(credit(page)).toHaveCSS('color', rgb(COLORS[scheme].muted));
        await expect(credit(page)).toHaveCSS('font-size', '14px');
        expect(await violations(page)).toEqual([]);
        // One piece in each group, so every tile color is read next to a picked one.
        for (const name of ['Python', 'Vite', 'MySQL', 'Jira']) {
          await piece(page, name).click();
          await says(page, name);
          await expect
            .poll(async () => (await names(cell(page, NAMES.indexOf(name)))).length)
            .toBeLessThanOrEqual(1);
          expect(await violations(page)).toEqual([]);
        }
      });
    }
  });
}

test.describe('TOOL-01 the status box', () => {
  test.use({ viewport: desktop });

  test('names the tool and group on hover, and clears when the mouse leaves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#tools');
    await ready(page);
    await expect(status(page).locator('b')).toHaveText(PROMPT);
    await expect(status(page).locator('span')).toHaveText(HELP);
    await piece(page, 'Firebase').hover();
    await says(page, 'Firebase');
    await piece(page, 'Figma').hover();
    await says(page, 'Figma');
    await page.mouse.move(0, 0);
    await expect(status(page).locator('b')).toHaveText(PROMPT);
    await expect(cell(page, NAMES.indexOf('Figma'))).not.toHaveCSS(
      'background-color',
      rgb(COLORS.light.title),
    );
  });

  test('follows keyboard focus, and keeps the piece while focus is inside', async ({ page }) => {
    await page.goto('/#tools');
    await ready(page);
    await piece(page, 'Python').focus();
    await expect(piece(page, 'Python')).toBeFocused();
    await says(page, 'Python');
    await piece(page, 'Prisma').hover();
    await says(page, 'Prisma');
    await page.mouse.move(0, 0);
    await says(page, 'Prisma');
  });

  test.describe('touch', () => {
    test.use({ hasTouch: true, isMobile: true, viewport: phone });

    test('a tap picks a piece, and a second tap makes it hop again', async ({ page }) => {
      await page.goto('/#tools');
      await ready(page);
      await piece(page, 'Expo').tap();
      await says(page, 'Expo');
      const i = NAMES.indexOf('Expo');
      await expect.poll(() => names(chip(page, i))).toEqual([]);
      await piece(page, 'Expo').tap();
      await expect.poll(() => names(chip(page, i))).toContain('hop');
      await says(page, 'Expo');
    });
  });
});

test.describe('TOOL-01, NFR-04 the keyboard', () => {
  for (const size of [phone, desktop]) {
    test(`one tab stop; arrows, Home and End move between pieces at ${size.width} px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/#tools');
      await ready(page);
      const at = async (i: number) => {
        await expect(pieces(page).nth(i)).toBeFocused();
        await expect(pieces(page).nth(i)).toHaveAttribute('tabindex', '0');
        await expect(board(page).locator('button[tabindex="0"]')).toHaveCount(1);
        await expect(board(page).locator('button[tabindex="-1"]')).toHaveCount(NAMES.length - 1);
        await says(page, NAMES[i] ?? '');
      };
      // Tab from the window itself lands on the one stop; the next Tab leaves the board.
      await tools(page).focus();
      await page.keyboard.press('Tab');
      await at(0);
      await page.keyboard.press('Tab');
      expect(await board(page).evaluate((el) => el.contains(document.activeElement))).toBe(false);
      await page.keyboard.press('Shift+Tab');
      await at(0);
      for (const [key, i] of [
        ['ArrowRight', 1],
        ['ArrowDown', 2],
        ['ArrowLeft', 1],
        ['ArrowUp', 0],
        ['ArrowLeft', 0],
        ['End', 24],
        ['ArrowRight', 24],
        ['Home', 0],
        ['ArrowRight', 1],
        ['Control+ArrowRight', 1],
        ['Alt+ArrowDown', 1],
        ['Meta+End', 1],
      ] as const) {
        await page.keyboard.press(key);
        await at(i);
      }
      // Every piece, along the whole path, stays clear of the bar.
      const covered: string[] = [];
      for (let i = 2; i < NAMES.length; i += 1) {
        await page.keyboard.press('ArrowRight');
        await at(i);
        const [target, taskbar] = [
          await pieces(page).nth(i).boundingBox(),
          await bar(page).boundingBox(),
        ];
        if (!target || !taskbar || target.y + target.height > taskbar.y + 0.5) {
          covered.push(NAMES[i] ?? '');
        }
      }
      expect(covered).toEqual([]);
      // The tab stop stays where the visitor left it.
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await at(24);
      await pieces(page).nth(9).click();
      await at(9);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await at(9);
    });
  }

  test('the focused piece shows a dashed outline inside its tile', async ({ page }) => {
    await page.goto('/#tools');
    await ready(page);
    await tools(page).focus();
    await page.keyboard.press('Tab');
    await expect(pieces(page).first()).toHaveCSS('outline-style', 'dashed');
    await expect(pieces(page).first()).toHaveCSS('outline-offset', '-5px');
    await expect(pieces(page).first()).toHaveCSS('outline-color', rgb('#ffffff'));
  });
});

test.describe('TOOL-01 the winding path', () => {
  for (const [width, columns] of [
    [1280, 7],
    [761, 7],
    [760, 5],
    [561, 5],
    [560, 3],
    [390, 3],
    [320, 3],
  ] as const) {
    test(`runs ${columns} columns, turning at each end, at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await ready(page);
      expect(await layout(page)).toEqual({ columns, at: winding(columns) });
    });
  }

  for (const scheme of ['light', 'dark'] as const) {
    test(`${scheme}: at 320 px nothing is cut off and nothing scrolls sideways`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/#tools');
      await ready(page);
      const clipped = await tools(page).evaluate((section) =>
        [...section.querySelectorAll<HTMLElement>('li, button, button span, [role="status"], p')]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            const across = el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1;
            return box.left < 0 || box.right > window.innerWidth || across;
          })
          .map((el) => el.textContent),
      );
      expect(clipped).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
      );
    });
  }
});

test.describe('TOOL-01, NFR-08 motion', () => {
  test.use({ viewport: desktop });

  test('every piece bobs on a 1.6 s loop, each starting at its own time', async ({ page }) => {
    await page.goto('/#tools');
    await ready(page);
    for (let i = 0; i < NAMES.length; i += 1) {
      const [bob, ...others] = await moves(chip(page, i));
      expect(others).toEqual([]);
      expect(bob).toMatchObject({
        name: 'bob',
        duration: 1600,
        iterations: Infinity,
        steps: true,
        state: 'running',
      });
      expect(bob?.delay).toBeCloseTo(-230 * i, 5);
    }
  });

  test('a hidden tab pauses the bobbing, and coming back resumes it', async ({ page }) => {
    await page.goto('/#tools');
    await ready(page);
    const hide = (hidden: boolean) =>
      page.evaluate((value) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
    const states = async () => {
      const bobs = (await moves(board(page))).filter((move) => move.name === 'bob');
      return [bobs.length, ...new Set(bobs.map((move) => move.state))];
    };
    await expect.poll(states).toEqual([NAMES.length, 'running']);
    await hide(true);
    await expect.poll(states).toEqual([NAMES.length, 'paused']);
    await hide(false);
    await expect.poll(states).toEqual([NAMES.length, 'running']);
  });

  for (const [how, pick] of [
    ['hover', (target: Locator) => target.hover()],
    ['keyboard focus', (target: Locator) => target.focus()],
    ['a click', (target: Locator) => target.dispatchEvent('click')],
  ] as const) {
    test(`a piece hops on ${how}, in steps, within half a second`, async ({ page }) => {
      await page.goto('/#tools');
      await ready(page);
      // Holds the hop at its first frame, so it can be read however fast the machine draws.
      await page.addStyleTag({
        content: '#tools li span { animation-play-state: paused !important }',
      });
      await pick(piece(page, 'Vite'));
      const i = NAMES.indexOf('Vite');
      await expect
        .poll(async () => (await moves(chip(page, i))).filter((move) => move.name === 'hop'))
        .toEqual([
          { name: 'hop', duration: 450, delay: 0, iterations: 1, steps: true, state: 'paused' },
        ]);
      // Its neighbors stop bobbing and lift 3 px; no other piece changes.
      for (const near of [i - 1, i + 1]) {
        await expect(chip(page, near)).toHaveCSS('transition-duration', '0.15s');
        await expect(chip(page, near)).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -3)');
        expect(await names(chip(page, near))).not.toContain('bob');
      }
      expect(await names(chip(page, i + 2))).toEqual(['bob']);
    });
  }

  test('the whole board moves in steps, and only bobbing lasts over half a second', async ({
    page,
  }) => {
    await page.goto('/#tools');
    await ready(page);
    await expect.poll(() => page.locator('[data-reveal]').count()).toBe(0);
    await piece(page, 'Vite').hover();
    const seen = await moves(board(page));
    expect(seen.map((move) => move.name)).toContain('hop');
    expect(seen.filter((move) => !move.steps)).toEqual([]);
    expect(
      seen.filter((move) => move.name !== 'bob' && move.duration * move.iterations > 500),
    ).toEqual([]);
  });
});

for (const size of [phone, desktop]) {
  test(`NFR-08 reduced motion: nothing on the board moves at ${size.width} px`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#tools');
    await ready(page);
    const still = async () => {
      expect(await moves(tools(page))).toEqual([]);
      expect(
        await tools(page).evaluate((section) =>
          [section, ...section.querySelectorAll('*')]
            .filter((el) => getComputedStyle(el).transform !== 'none')
            .map((el) => el.outerHTML.slice(0, 60)),
        ),
      ).toEqual([]);
    };
    await still();
    await piece(page, 'Vite').hover();
    await says(page, 'Vite');
    await still();
    await piece(page, 'Vite').click();
    await page.keyboard.press('ArrowRight');
    await says(page, 'Tailwind CSS');
    await still();
  });

  test.describe(`NFR-08 without JavaScript at ${size.width} px`, () => {
    test.use({ javaScriptEnabled: false, viewport: size });

    test('every tool shows with its name and group, with no dead control', async ({ page }) => {
      await page.goto('/#tools');
      for (const [i, { name, group }] of TOOLS.entries()) {
        await expect(cell(page, i).getByText(name, { exact: true })).toBeVisible();
        await expect(cell(page, i).getByText(group, { exact: true })).toBeVisible();
        await expect(chip(page, i).locator('svg')).toBeVisible();
      }
      await expect(tools(page).locator('ul').last().locator('li')).toHaveText(
        GROUPS.map((group) => group.key),
      );
      await expect(tools(page).locator('button, [tabindex="0"]')).toHaveCount(0);
      await expect(status(page)).toBeHidden();
      await expect(tools(page).getByText(HELP)).toBeHidden();
      expect((await layout(page)).at).toEqual(winding(size === phone ? 3 : 7));
      await allDrawn(page);
      await expect(credit(page)).toBeVisible();
    });
  });

  test(`error state: with page scripts blocked every tool still shows at ${size.width} px`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.route('**/_next/static/**/*.js', (route) => route.abort());
    await page.goto('/#tools');
    for (const [i, { name }] of TOOLS.entries()) {
      await expect(cell(page, i).getByText(name, { exact: true })).toBeVisible();
    }
    await expect(tools(page).locator('ul').last().locator('li')).toHaveText(
      GROUPS.map((group) => group.key),
    );
    await expect(tools(page).locator('button')).toHaveCount(0);
    // The server's page, as it also is without JavaScript (where axe itself cannot run).
    expect(await violations(page)).toEqual([]);
  });
}

for (const size of [phone, desktop]) {
  test.describe(`TOOL-01 the logos at ${size.width} px`, () => {
    test.use({ viewport: size });

    test('the eight allowed pieces use their symbols at 40 px; seventeen are letter tiles', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/#tools');
      await ready(page);
      for (const [i, { name }] of TOOLS.entries()) {
        const symbol = LOGOS[name];
        const uses = await chip(page, i)
          .locator('use')
          .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
        expect([name, uses]).toEqual([name, symbol ? [`${FILE}#${symbol}`] : []]);
        await expect(chip(page, i).locator('svg > path')).toHaveCount(symbol ? 0 : 1);
      }
      await allDrawn(page);
      expect(await markSizes(page)).toEqual(NAMES.map(() => '40 by 40'));
      await expect(credit(page)).toBeVisible();
      // Under the board: below the pieces, the status box and the key.
      const [note, key] = [
        await credit(page).boundingBox(),
        await tools(page).locator('ul').last().boundingBox(),
      ];
      expect(note?.y).toBeGreaterThanOrEqual((key?.y ?? 0) + (key?.height ?? 0));
    });

    test('NFR-01: the logo file is requested once, however the board is used', async ({ page }) => {
      const asked: string[] = [];
      page.on('request', (r) => {
        if (new URL(r.url()).pathname === FILE) asked.push(r.url());
      });
      await page.goto('/#tools');
      await ready(page);
      await allDrawn(page);
      await piece(page, 'Vue.js').click();
      // A click on the logo itself reaches the piece.
      const mark = await chip(page, NAMES.indexOf('Vue.js')).boundingBox();
      await page.mouse.click((mark?.x ?? 0) + 24, (mark?.y ?? 0) + 24);
      await says(page, 'Vue.js');
      await expect(piece(page, 'Vue.js')).toBeFocused();
      await piece(page, 'Figma').hover();
      await piece(page, 'CSS').focus();
      await page.keyboard.press('ArrowRight');
      await page.getByRole('button', { name: /^(Dark|Light) theme$/ }).click();
      await allDrawn(page);
      expect(asked).toHaveLength(1);
    });

    test('NFR-01: no second request when the script starts after the file arrived', async ({
      page,
    }) => {
      const asked: string[] = [];
      page.on('request', (r) => {
        if (new URL(r.url()).pathname === FILE) asked.push(r.url());
      });
      let release: () => void = () => undefined;
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route('**/_next/static/**/*.js', async (route) => {
        await held;
        await route.continue();
      });
      await page.goto('/#tools', { waitUntil: 'commit' });
      await allDrawn(page);
      await expect(pieces(page)).toHaveCount(0);
      release();
      await ready(page);
      await allDrawn(page);
      expect(asked).toHaveLength(1);
    });

    test('NFR-01: the page paints and works before the file arrives, then nothing shifts', async ({
      page,
    }) => {
      const asked: string[] = [];
      page.on('request', (r) => {
        if (new URL(r.url()).pathname === FILE) asked.push(r.url());
      });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() => {
        const shifts: number[] = [];
        Object.assign(window, { shifts });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            shifts.push((entry as PerformanceEntry & { value: number }).value);
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      const release = await holdFile(page);
      // The load event may wait for the file; the first paint must not.
      await page.goto('/#tools', { waitUntil: 'domcontentloaded' });
      await expect
        .poll(() =>
          page.evaluate(() => performance.getEntriesByName('first-contentful-paint').length),
        )
        .toBe(1);
      await ready(page);
      await page.evaluate(() => document.fonts.ready);
      for (const name of NAMES) {
        await expect(piece(page, name).getByText(name, { exact: true })).toBeVisible();
      }
      expect(await inks(page)).toEqual(Object.keys(LOGOS).map(() => false));
      expect(await markSizes(page)).toEqual(NAMES.map(() => '40 by 40'));
      const before = await places(page);
      const shifted = () =>
        page.evaluate(() => (window as unknown as { shifts: number[] }).shifts.length);
      const start = await shifted();

      release();
      await allDrawn(page);
      await page.evaluate(
        () =>
          new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(0)))),
      );
      expect(await places(page)).toEqual(before);
      expect(await shifted()).toBe(start);
      expect(asked).toHaveLength(1);
      const blocking = await page.evaluate(
        (file) =>
          performance
            .getEntriesByType('resource')
            .filter((entry) => new URL(entry.name).pathname === file)
            .map(
              (entry) =>
                (entry as PerformanceEntry & { renderBlockingStatus: string }).renderBlockingStatus,
            ),
        FILE,
      );
      expect(blocking).toEqual(['non-blocking']);
    });

    for (const scheme of ['light', 'dark'] as const) {
      test(`${scheme}: error state: with the logo file failing every name still shows`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.route(`**${FILE}`, (route) => route.abort());
        await page.goto('/#tools');
        await ready(page);
        for (const name of NAMES) {
          await expect(piece(page, name).getByText(name, { exact: true })).toBeVisible();
        }
        expect(await inks(page)).toEqual(Object.keys(LOGOS).map(() => false));
        expect(await markSizes(page)).toEqual(NAMES.map(() => '40 by 40'));
        await piece(page, 'Vue.js').click();
        await says(page, 'Vue.js');
        await expect(credit(page)).toBeVisible();
        expect(await violations(page)).toEqual([]);
      });
    }
  });
}

// NFR-01: the page carries each drawing once, as drawn, and not again in the data for its script.
test('NFR-01: each letter tile drawing is in the HTML once', async ({ page }) => {
  await page.goto('/');
  const html = await (await page.request.get('/')).text();
  const drawn = await tools(page)
    .locator('svg[viewBox="0 0 20 20"] path')
    .evaluateAll((els) => els.map((el) => el.getAttribute('d') ?? ''));
  expect(drawn).toHaveLength(NAMES.length - Object.keys(LOGOS).length);
  expect(drawn.filter((d) => d === '' || html.split(d).length !== 2)).toEqual([]);
  // The page asks for the file only through its use elements: no preload puts it first.
  expect(html).not.toMatch(/<link[^>]*tools\.svg/);
});
