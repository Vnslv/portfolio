import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { toolBoard } from '../content/tools';
import type { ToolBoard } from '../content/types';
import { Tools } from './Tools';

// The server's HTML: what a visitor gets before, or without, the page's script.
const html = renderToStaticMarkup(<Tools />);
const tools = toolBoard.groups.flatMap((group) =>
  group.tools.map((tool) => ({ name: tool.name, group: group.name })),
);
const cells = (out: string) => out.match(/<li[^>]*style="[^"]*"[^>]*>.*?<\/li>/g) ?? [];
const text = (out: string) => out.replace(/<style>.*?<\/style>|<[^>]*>/g, ' ');

describe('the Tools section before script runs (TOOL-01, NFR-08)', () => {
  it('is a window titled Tools at #tools', () => {
    expect(html).toMatch(/^<section[^>]* id="tools"/);
    expect(html).toMatch(/<h2[^>]*>.*?Tools<\/h2>/);
  });

  it('shows every tool with its name and group, in order, between Start and Finish', () => {
    const found = cells(html);
    expect(found).toHaveLength(tools.length + 2);
    tools.forEach(({ name, group }, i) => {
      const cell = found[i + 1] ?? '';
      expect(cell).toContain(`>${name}</span>`);
      // The group is under the name only where script is off.
      expect(cell).toMatch(new RegExp(`<noscript><span[^>]*>${group}</span></noscript>`));
    });
    for (const [cell, word] of [
      [found[0], 'Start'],
      [found.at(-1), 'Finish'],
    ]) {
      expect(cell).toContain('aria-hidden="true"');
      expect(text(cell ?? '').trim()).toBe(word);
    }
  });

  it('points the eight allowed pieces at their symbols and draws the other seventeen', () => {
    const used = [...html.matchAll(/<use href="\/images\/tools\.svg#([a-z]+)"/g)].map((m) => m[1]);
    expect(used).toEqual([
      'javascript',
      'typescript',
      'html',
      'vue',
      'nextjs',
      'bootstrap',
      'figma',
      'github',
    ]);
    const marks = cells(html).slice(1, -1);
    const drawn = marks.flatMap((cell) => cell.match(/<svg[^>]*>/g) ?? []);
    expect(drawn).toHaveLength(tools.length);
    for (const svg of drawn) expect(svg).toContain('aria-hidden="true"');
    expect(drawn.filter((svg) => svg.includes('viewBox="0 0 20 20"'))).toHaveLength(17);
    expect(html).not.toMatch(/<img|<image|url\(/);
  });

  it('ends with the credit line', () => {
    expect(html).toMatch(
      /<\/ul><p[^>]*>Logos are trademarks of their owners[^<]*in the US and other countries\.<\/p>/,
    );
  });

  it('has no control that cannot work yet, and hides the status box where script is off', () => {
    expect(html).not.toContain('<button');
    expect(html).not.toContain('tabindex="0"');
    expect(html).toMatch(/<noscript><style>[^<]*display:none[^<]*<\/style><\/noscript>/);
    expect(html).toContain('role="status"');
  });

  it('gives each group in the key its numbers', () => {
    const key = text(html.slice(html.lastIndexOf('<ul'), html.lastIndexOf('</ul>'))).replace(
      /\s+/g,
      ' ',
    );
    expect(key.trim()).toBe(
      'Languages 1–5 Frontend and mobile 6–13 Backend and data 14–21 Project management 22–25',
    );
  });
});

describe('the board follows the content (CONT-01)', () => {
  const dot = Array<string>(20).fill('#'.repeat(20));
  const fixture: ToolBoard = {
    lead: 'Fixture lead',
    prompt: { title: 'Fixture prompt', text: 'Fixture help' },
    start: 'Go',
    finish: 'End',
    credit: 'Fixture credit',
    groups: [
      { name: 'Fixture one', tools: [{ name: 'Alpha', logo: 'fixture-mark' }] },
      {
        name: 'Fixture two',
        tools: ['Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'].map((name) => ({
          name,
          tile: dot,
        })),
      },
    ],
  };
  const out = renderToStaticMarkup(<Tools board={fixture} />);

  it('shows the given wording, tools, marks and numbers', () => {
    expect(cells(out)).toHaveLength(10);
    for (const words of ['Fixture lead', 'Fixture prompt', 'Fixture help', 'Go', 'End']) {
      expect(out).toContain(`>${words}<`);
    }
    expect(out).toContain('>Fixture credit<');
    expect(out).toContain('href="/images/tools.svg#fixture-mark"');
    expect(out).toContain('d="M0 0h20v20h-20z"');
    expect(text(out).replace(/\s+/g, ' ')).toContain('Fixture one 1 Fixture two 2–8');
  });

  // The winding path: every other row runs right to left, at 3, 5 and 7 columns.
  it('places each cell on a winding path', () => {
    const at = (k: number) =>
      [3, 5, 7].map((n) => cells(out)[k]?.match(new RegExp(`--a${n}:(\\d+/\\d+)`))?.[1]);
    expect(at(0)).toEqual(['1/1', '1/1', '1/1']);
    expect(at(2)).toEqual(['1/3', '1/3', '1/3']);
    expect(at(3)).toEqual(['2/3', '1/4', '1/4']);
    expect(at(5)).toEqual(['2/1', '2/5', '1/6']);
    expect(at(7)).toEqual(['3/2', '2/3', '2/7']);
    expect(at(9)).toEqual(['4/3', '2/1', '2/5']);
  });
});
