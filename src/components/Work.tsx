'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react';
import type { Project, RoleFilter as Filter } from '../content/types';
import { filterProjects, projectIdFromHash } from '../lib/projects';
import { ProjectCard } from './ProjectCard';
import { RoleFilter } from './RoleFilter';
import { Window } from './Window';
import styles from './Work.module.css';

// The page address is an external value that changes on an open page (a pasted or clicked
// #link), so the page subscribes to it. The listener is attached when React subscribes, not
// after a delayed event.
//
// The snapshot is a version plus the hash, not the hash alone. Every address event or drop adds
// one to the version, so a link used again in the same instant as the close (the hash is the
// same before and after) is still seen as a change and opens its project.
const hashListeners = new Set<() => void>();
let linkVersion = 0;
function emitLinkChange() {
  linkVersion += 1;
  hashListeners.forEach((listener) => listener());
}
function subscribeToHash(listener: () => void) {
  hashListeners.add(listener);
  window.addEventListener('hashchange', emitLinkChange);
  return () => {
    hashListeners.delete(listener);
    if (hashListeners.size === 0) window.removeEventListener('hashchange', emitLinkChange);
  };
}

// Takes the #link off the address (without a new history entry) and tells the subscribers, so
// using the same link again is a change again. Closing a project or choosing a filter ends the
// link, as in the board. The browser's own method is used: the Next router replaces
// `history.replaceState` on the history object and, when told, applies its own address a moment
// later, which erased a hash set right after the close. The router keeps no state for a hash
// that only this page reads. Only a known project's hash is dropped: a section hash such as
// #work or #about, or an unknown one, is not this page's link and is left alone.
function dropLink(projects: readonly Project[]) {
  if (!projectIdFromHash(location.hash, projects)) return;
  History.prototype.replaceState.call(
    history,
    history.state as unknown,
    '',
    location.pathname + location.search,
  );
  emitLinkChange();
}
const currentLink = () => `${linkVersion}|${location.hash}`;
const serverLink = () => '0|';

const noSubscription = () => () => undefined;
const enhancedNow = () => true;
const enhancedOnServer = () => false;

const COMMANDS: Record<Filter, string> = {
  all: 'SHOW ALL',
  'software-development': 'SHOW SOFTWARE DEVELOPMENT',
  'project-management': 'SHOW PROJECT MANAGEMENT',
};

// The terminal line (MOTION-03). Decorative: the announcement beside it says the result in words.
// After a choice each character appears a moment after the one before, all within half a second.
// Before that, without script and with reduced motion, the whole line is simply there.
function TerminalLine({ text, typed }: { text: string; typed: boolean }) {
  const step = Math.min(22, 480 / text.length);
  return (
    <p
      className={typed ? `${styles.term} ${styles.typed}` : styles.term}
      aria-hidden="true"
      data-term=""
    >
      {typed
        ? Array.from(text, (character, i) => (
            <span key={i} style={{ animationDelay: `${i * step}ms` }}>
              {character}
            </span>
          ))
        : text}
      <span className={styles.caret} data-caret="" />
    </p>
  );
}

export function Work({ projects }: { projects: readonly Project[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  // How many filter choices were made, and what the last one found. Each choice moves the rows,
  // types the line and is announced once; a #link does none of that.
  const [choice, setChoice] = useState({ times: 0, found: 0 });
  // The last choice whose rows have come to rest.
  const [rested, setRested] = useState(0);
  const link = useSyncExternalStore(subscribeToHash, currentLink, serverLink);
  const hash = link.slice(link.indexOf('|') + 1);
  // False in the server HTML and until the page runs script, so the controls that need script
  // are in place but off.
  const enhanced = useSyncExternalStore(noSubscription, enhancedNow, enhancedOnServer);

  const list = useRef<HTMLUListElement>(null);

  const linkedId = projectIdFromHash(hash, projects) ?? undefined;
  const shown = filterProjects(projects, filter, linkedId);

  // Choosing a filter closes the open project and lists only the matching ones.
  function chooseFilter(next: Filter) {
    list.current?.querySelectorAll('details[open]').forEach((d) => {
      (d as HTMLDetailsElement).open = false;
    });
    dropLink(projects);
    setFilter(next);
    const found = filterProjects(projects, next, undefined).length;
    setChoice(({ times }) => ({ times: times + 1, found }));
  }

  // Runs before the browser opens or closes a section. A section that is open is about to close,
  // and opening a project other than the linked one closes the linked one; either ends the link.
  // A closed linked project that is opened stays linked.
  function onSummaryClick(event: MouseEvent<HTMLUListElement>) {
    const summary = event.target instanceof Element ? event.target.closest('summary') : null;
    const details = summary?.parentElement;
    if (!(details instanceof HTMLDetailsElement)) return;
    if (details.open || details.closest('li')?.id !== linkedId) dropLink(projects);
  }

  // While a choice moves the rows, that movement is theirs. Once every row has come to rest the
  // list lets go of it, so a row can slide in again when it is reached (MOTION-03).
  function onRowAnimationEnd() {
    const rows = Array.from(list.current?.children ?? []);
    if (rows.every((row) => row.getAnimations().length === 0)) setRested(choice.times);
  }

  // WORK-04: a known #link opens its project, which stays listed even when the filter hides it.
  useEffect(() => {
    if (!linkedId) return;
    const item = document.getElementById(linkedId);
    const details = item?.querySelector('details');
    if (details) details.open = true;
    item?.scrollIntoView();
  }, [link, linkedId]);

  return (
    <Window
      id="work"
      title="Projects"
      icon="folder"
      status={`${shown.length} of ${projects.length} projects`}
    >
      <RoleFilter value={filter} onChange={chooseFilter} disabled={!enhanced} />
      <TerminalLine
        key={choice.times}
        text={`> ${COMMANDS[filter]}  [${shown.length} FOUND]`}
        typed={choice.times > 0}
      />
      {/* A new node for each choice, so the same words are told again. */}
      <p className={styles.announce} aria-live="polite">
        {choice.times > 0 ? (
          <span key={choice.times}>
            {`Showing ${choice.found} ${choice.found === 1 ? 'project' : 'projects'}`}
          </span>
        ) : null}
      </p>
      {/* data-sort is there while the rows move, and changes its value at each choice, which
          starts the movement again even before the last one ended. */}
      <ul
        ref={list}
        className={styles.list}
        data-sort={choice.times > rested ? (choice.times % 2 ? 'a' : 'b') : undefined}
        onClick={onSummaryClick}
        onAnimationEnd={onRowAnimationEnd}
      >
        {shown.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            enhanced={enhanced}
            onClose={() => dropLink(projects)}
          />
        ))}
      </ul>
    </Window>
  );
}
