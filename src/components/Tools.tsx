'use client';

import {
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { toolBoard } from '../content/tools';
import type { ToolBoard } from '../content/types';
import styles from './Tools.module.css';
import { Window } from './Window';

const STEPS: Partial<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

// Where cell k lies on the winding path, as "row/column", at each number of columns the stylesheet
// uses: every other row runs right to left.
function place(k: number): CSSProperties {
  const at = (columns: number) => {
    const row = Math.floor(k / columns);
    const x = k % columns;
    return `${row + 1}/${row % 2 ? columns - x : x + 1}`;
  };
  return { '--a3': at(3), '--a5': at(5), '--a7': at(7) } as CSSProperties;
}

// The bitmap as one SVG path: each run of filled pixels, as tall as the equal rows below it.
function drawing(rows: readonly string[]): string {
  let path = '';
  for (let y = 0, next = 1; y < rows.length; y = next, next += 1) {
    while (rows[next] === rows[y]) next += 1;
    for (const run of rows[y]?.matchAll(/#+/g) ?? []) {
      path += `M${run.index} ${y}h${run[0].length}v${next - y}h-${run[0].length}z`;
    }
  }
  return path;
}

// The logos, one symbol each: the pieces point into the one file, which the browser fetches once
// and does not wait for before painting.
const LOGOS = '/images/tools.svg';

// Starts a chip's movement again, so a piece already picked hops again. The chip is not drawn
// anew, which would fetch the logo file again.
function replay(chip: Element | null) {
  if (!(chip instanceof HTMLElement)) return;
  chip.style.animation = 'none';
  // Reading the box applies the style above before it is taken away.
  chip.getBoundingClientRect();
  chip.style.animation = '';
}

const never = () => () => undefined;

// False on the server and without JavaScript, so no piece looks usable before it is.
function useScript(): boolean {
  return useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
}

// The content is imported here and not passed in by the page, so the page's data does not repeat
// the drawings. The prop is for tests.
export function Tools({ board = toolBoard }: { board?: ToolBoard }) {
  const script = useScript();
  const [picked, setPicked] = useState<number | null>(null);
  const [stop, setStop] = useState(0);

  const pieces = board.groups.flatMap((group, g) =>
    group.tools.map((tool) => ({ ...tool, group: group.name, g })),
  );
  const current = picked === null ? undefined : pieces[picked];
  const Tile = script ? 'button' : 'div';

  function pick(i: number) {
    setPicked(i);
    setStop(i);
  }

  function move(event: KeyboardEvent<HTMLElement>, i: number) {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const step = STEPS[event.key];
    const ends: Partial<Record<string, number>> = { Home: 0, End: pieces.length - 1 };
    const next = step === undefined ? ends[event.key] : i + step;
    if (next === undefined || next < 0 || next >= pieces.length) return;
    event.preventDefault();
    event.currentTarget.closest('ul')?.querySelectorAll('button')[next]?.focus();
  }

  // A cell at an end of the path: a word, for the eyes only.
  const end = (word: string, k: number) => (
    <li className={styles.cell} style={place(k)} aria-hidden="true">
      <span className={styles.mark}>{word}</span>
    </li>
  );

  return (
    <Window id="tools" title="Tools" icon="board">
      <p className={styles.lead}>{board.lead}</p>
      <ul
        className={styles.board}
        onMouseLeave={(event) => {
          if (!event.currentTarget.contains(document.activeElement)) setPicked(null);
        }}
      >
        {end(board.start, 0)}
        {pieces.map((piece, i) => {
          const { name, group, g } = piece;
          const near = picked !== null && Math.abs(picked - i) === 1;
          return (
            <li
              key={name}
              className={[
                styles.cell,
                styles[`g${g}`],
                picked === i ? styles.on : '',
                near ? styles.near : '',
              ].join(' ')}
              style={{ ...place(i + 1), '--d': `${(-i * 0.23).toFixed(2)}s` } as CSSProperties}
              onMouseEnter={script ? () => setPicked(i) : undefined}
            >
              <span className={styles.no} aria-hidden="true">
                {i + 1}
              </span>
              {/* Outside the tile, which turns into a button once script runs: a mark drawn
                  anew would fetch the logo file again. */}
              <span className={styles.chip}>
                {/* The size is fixed here, so nothing moves when the logo file arrives. */}
                {'logo' in piece ? (
                  <svg width="40" height="40" aria-hidden="true">
                    <use href={`${LOGOS}#${piece.logo}`} />
                  </svg>
                ) : (
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 20 20"
                    shapeRendering="crispEdges"
                    aria-hidden="true"
                  >
                    <path d={drawing(piece.tile)} />
                  </svg>
                )}
              </span>
              <Tile
                className={styles.tile}
                {...(script && {
                  type: 'button',
                  tabIndex: i === stop ? 0 : -1,
                  'aria-describedby': `tools-group-${g}`,
                  onFocus: () => pick(i),
                  onClick: (event: MouseEvent<HTMLElement>) => {
                    pick(i);
                    replay(event.currentTarget.previousElementSibling);
                  },
                  onKeyDown: (event: KeyboardEvent<HTMLElement>) => move(event, i),
                })}
              >
                <span className={styles.name}>{name}</span>
                <noscript>
                  <span className={styles.group}>{group}</span>
                </noscript>
              </Tile>
            </li>
          );
        })}
        {end(board.finish, pieces.length + 1)}
      </ul>
      {/* The status box asks for actions that need script, so it goes without it. */}
      <noscript>
        <style>{`.${styles.box}{display:none}`}</style>
      </noscript>
      <div className={styles.box} role="status">
        <b>{current?.name ?? board.prompt.title}</b>
        <span>{current?.group ?? board.prompt.text}</span>
      </div>
      <ul className={styles.key}>
        {board.groups.map((group, g) => {
          const first = pieces.findIndex((piece) => piece.g === g) + 1;
          const last = first + group.tools.length - 1;
          return (
            <li key={group.name}>
              <i className={styles[`g${g}`]} aria-hidden="true" />
              <span id={`tools-group-${g}`}>{group.name}</span>
              {first === last ? ` ${first}` : ` ${first}–${last}`}
            </li>
          );
        })}
      </ul>
      <p className={styles.credit}>{board.credit}</p>
    </Window>
  );
}
