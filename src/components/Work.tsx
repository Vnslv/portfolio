'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Project, RoleFilter as Filter } from '../content/types';
import { filterProjects, projectIdFromHash } from '../lib/projects';
import { ProjectCard } from './ProjectCard';
import { RoleFilter } from './RoleFilter';
import { Window } from './Window';
import styles from './Work.module.css';

// The page address is an external value that changes on an open page (a pasted or clicked
// #link), so the page subscribes to it. The listener is attached when React subscribes, not
// after a delayed event.
function subscribeToHash(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
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

  const linkedId = projectIdFromHash(hash, projects) ?? undefined;
  const shown = filterProjects(projects, filter, linkedId);

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
      <RoleFilter value={filter} onChange={setFilter} disabled={!enhanced} />
      <ul className={styles.list}>
        {shown.map((project) => (
          <ProjectCard key={project.id} project={project} enhanced={enhanced} />
        ))}
      </ul>
    </Window>
  );
}
