import type { ToolBoard } from './types';

// The letters A to Z, 5 wide and 7 high: one base-32 digit for each row.
const FONT = [
  'ehhvhhh uhhuhhu ehggghe uhhhhhu vgguggv vgguggg ehgnhhf hhhvhhh e44444e',
  '72222ic hikokih ggggggv hrllhhh hhpljhh ehhhhhe uhhuggg ehhhlid uhhukih',
  'fgge11u v444444 hhhhhhe hhhhha4 hhhllla hha4ahh hha4444 v1248gv',
]
  .join(' ')
  .split(' ');

// A plain pixel letter tile: two capital letters, each drawn 9 wide (the middle column once, the
// others twice) and 14 high, in the 20 by 20 bitmap.
export function letterTile(text: string): readonly string[] {
  const glyphs = [...text].map((letter) => FONT[letter.charCodeAt(0) - 65]);
  const [left, right] = glyphs;
  if (glyphs.length !== 2 || !left || !right) {
    throw new Error(`a letter tile takes two letters from A to Z, not "${text}"`);
  }
  const wide = (digit: string) =>
    [...parseInt(digit, 32).toString(2).padStart(5, '0')]
      .map((bit, i) => (bit === '1' ? '#' : '.').repeat(i === 2 ? 1 : 2))
      .join('');
  const blank = Array<string>(3).fill('.'.repeat(20));
  const letters = [...left].flatMap((digit, i) => {
    const row = `${wide(digit)}..${wide(right.charAt(i))}`;
    return [row, row];
  });
  return [...blank, ...letters, ...blank];
}

const logo = (name: string, symbol: string) => ({ name, logo: symbol });
const tile = (name: string, letters: string) => ({ name, tile: letterTile(letters) });

// TOOL-01: the board on the page. The tools and groups are the owner's (2026-11-26); the wording
// is the approved board's. A piece has a logo only where the brand's own rules allow it, and the
// credit line is the ticket's (T15, option C2). A new logo needs that check, its symbol in
// public/images/tools.svg, and any credit it asks for.
export const toolBoard: ToolBoard = {
  lead: 'Languages and tools I use. Follow the path from Start to Finish.',
  prompt: { title: 'Pick a piece', text: 'Hover, tap, or use Tab and the arrow keys.' },
  start: 'Start',
  finish: 'Finish',
  credit:
    'Logos are trademarks of their owners and only name each tool. HTML5 logo by W3C, CC BY 3.0. Vue logo by Evan You, CC BY-NC-SA 4.0. JS logo by Christopher Williams, MIT. Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc. or its affiliates in the US and other countries.',
  groups: [
    {
      name: 'Languages',
      tools: [
        logo('JavaScript', 'javascript'),
        logo('TypeScript', 'typescript'),
        tile('Python', 'PY'),
        logo('HTML', 'html'),
        tile('CSS', 'CS'),
      ],
    },
    {
      name: 'Frontend and mobile',
      tools: [
        tile('React', 'RE'),
        logo('Vue.js', 'vue'),
        logo('Next.js', 'nextjs'),
        tile('React Native', 'RN'),
        tile('Expo', 'XP'),
        tile('Vite', 'VI'),
        tile('Tailwind CSS', 'TW'),
        logo('Bootstrap', 'bootstrap'),
      ],
    },
    {
      name: 'Backend and data',
      tools: [
        tile('Node.js', 'NJ'),
        tile('Express.js', 'EJ'),
        tile('MySQL', 'MY'),
        tile('Postgres', 'PG'),
        tile('SQLite', 'SL'),
        tile('Firebase', 'FB'),
        tile('Supabase', 'SB'),
        tile('Prisma', 'PR'),
      ],
    },
    {
      name: 'Project management',
      tools: [
        logo('Figma', 'figma'),
        logo('GitHub Projects', 'github'),
        tile('Jira', 'JR'),
        tile('Google Workspace', 'GW'),
      ],
    },
  ],
};
