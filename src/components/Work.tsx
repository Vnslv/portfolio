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
const hashListeners = new Set<() => void>();
function subscribeToHash(listener: () => void) {
  hashListeners.add(listener);
  window.addEventListener('hashchange', listener);
  return () => {
    hashListeners.delete(listener);
    window.removeEventListener('hashchange', listener);
  };
}

// Takes the #link off the address (without a new history entry) and tells the subscribers, so
// using the same link again is a change again. Closing a project or choosing a filter ends the
// link, as in the board.
function dropLink() {
  if (!location.hash) return;
  history.replaceState(history.state as unknown, '', location.pathname + location.search);
  hashListeners.forEach((listener) => listener());
}
const currentHash = () => location.hash;
const serverHash = () => '';

const noSubscription = () => () => undefined;
const enhancedNow = () => true;
const enhancedOnServer = () => false;

export function Work({ projects }: { projects: readonly Project[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const hash = useSyncExternalStore(subscribeToHash, currentHash, serverHash);
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
    dropLink();
    setFilter(next);
  }

  // Runs before the browser opens or closes a section. A section that is open is about to close,
  // and opening a project other than the linked one closes the linked one; either ends the link.
  // A closed linked project that is opened stays linked.
  function onSummaryClick(event: MouseEvent<HTMLUListElement>) {
    const summary = event.target instanceof Element ? event.target.closest('summary') : null;
    const details = summary?.parentElement;
    if (!(details instanceof HTMLDetailsElement)) return;
    if (details.open || details.closest('li')?.id !== linkedId) dropLink();
  }

  // WORK-04: a known #link opens its project, which stays listed even when the filter hides it.
  useEffect(() => {
    if (!linkedId) return;
    const item = document.getElementById(linkedId);
    const details = item?.querySelector('details');
    if (details) details.open = true;
    item?.scrollIntoView();
  }, [hash, linkedId]);

  return (
    <Window
      id="work"
      title="Work"
      icon="folder"
      status={`${shown.length} of ${projects.length} projects`}
    >
      <RoleFilter value={filter} onChange={chooseFilter} disabled={!enhanced} />
      <ul ref={list} className={styles.list} onClick={onSummaryClick}>
        {shown.map((project) => (
          <ProjectCard key={project.id} project={project} enhanced={enhanced} onClose={dropLink} />
        ))}
      </ul>
    </Window>
  );
}
