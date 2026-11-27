import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { letterTile, toolBoard } from './tools';

// The eight brands whose rules allow the logo, with their symbols (T15 ticket, option C2).
const LOGOS = {
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  HTML: 'html',
  'Vue.js': 'vue',
  'Next.js': 'nextjs',
  Bootstrap: 'bootstrap',
  Figma: 'figma',
  'GitHub Projects': 'github',
};
const CREDIT =
  'Logos are trademarks of their owners and only name each tool. HTML5 logo by W3C, CC BY 3.0. Vue logo by Evan You, CC BY-NC-SA 4.0. JS logo by Christopher Williams, MIT. Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc. or its affiliates in the US and other countries.';

// The groups, tools and order the owner supplied (T15 ticket, 2026-11-26).
const OWNER = [
  ['Languages', ['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS']],
  [
    'Frontend and mobile',
    ['React', 'Vue.js', 'Next.js', 'React Native', 'Expo', 'Vite', 'Tailwind CSS', 'Bootstrap'],
  ],
  [
    'Backend and data',
    ['Node.js', 'Express.js', 'MySQL', 'Postgres', 'SQLite', 'Firebase', 'Supabase', 'Prisma'],
  ],
  ['Project management', ['Figma', 'GitHub Projects', 'Jira', 'Google Workspace']],
];

const tools = toolBoard.groups.flatMap((group) => group.tools);
const filled = (rows: readonly string[], from: number, to: number) =>
  rows.some((row) => row.slice(from, to).includes('#'));

describe('the tools content (TOOL-01, CONT-01)', () => {
  it('has exactly the owner tools and groups, in order', () => {
    expect(
      toolBoard.groups.map((group) => [group.name, group.tools.map((tool) => tool.name)]),
    ).toEqual(OWNER);
  });

  it('gives the logo to the eight allowed brands only', () => {
    const logos = tools.flatMap((t) => ('logo' in t ? [[t.name, t.logo]] : []));
    expect(Object.fromEntries(logos)).toEqual(LOGOS);
  });

  it('finds every logo it names in the supplied file', () => {
    const file = readFileSync('public/images/tools.svg', 'utf8');
    const symbols = [...file.matchAll(/<symbol id="([a-z]+)"/g)].map((m) => m[1]);
    expect(symbols.sort()).toEqual(Object.values(LOGOS).sort());
  });

  // The other seventeen: 20 by 20 bitmaps with a letter on each side of a blank middle.
  it('draws a different two-letter tile for each of the other seventeen', () => {
    const tiles = tools.flatMap((t) => ('tile' in t ? [t] : []));
    expect(tiles).toHaveLength(17);
    for (const { name, tile } of tiles) {
      expect(tile, name).toHaveLength(20);
      for (const row of tile) expect(row).toMatch(/^[#.]{20}$/);
      expect([filled(tile, 0, 9), filled(tile, 9, 11), filled(tile, 11, 20)], name).toEqual([
        true,
        false,
        true,
      ]);
    }
    expect(new Set(tiles.map(({ tile }) => tile.join())).size).toBe(tiles.length);
  });

  it('carries the credit line exactly', () => {
    expect(toolBoard.credit).toBe(CREDIT);
  });

  it('carries the wording of the approved board', () => {
    expect(toolBoard).toMatchObject({
      lead: 'Languages and tools I use. Follow the path from Start to Finish.',
      prompt: { title: 'Pick a piece', text: 'Hover, tap, or use Tab and the arrow keys.' },
      start: 'Start',
      finish: 'Finish',
    });
  });
});

describe('letterTile', () => {
  it('draws two letters, each 9 wide and 14 high, centered in the 20 by 20 bitmap', () => {
    const blank = '.'.repeat(20);
    const side = '##.....##..' + '..#####..';
    const stem = '##.....##..' + '....#....';
    const bar = '#########..' + '....#....';
    expect(letterTile('HI')).toEqual([
      ...[blank, blank, blank],
      ...[side, side, stem, stem, stem, stem, bar, bar, stem, stem, stem, stem, side, side],
      ...[blank, blank, blank],
    ]);
  });

  it('says which text it cannot draw, instead of drawing it wrong', () => {
    expect(() => letterTile('A1')).toThrow('A1');
    expect(() => letterTile('A')).toThrow('A');
    expect(() => letterTile('ABC')).toThrow('ABC');
  });
});
