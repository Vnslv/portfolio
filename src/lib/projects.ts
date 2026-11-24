import type { Project, RoleFilter } from '../content/types';

// Keeps the list order. A linked project stays visible even when the filter hides it.
export function filterProjects(
  projects: readonly Project[],
  filter: RoleFilter,
  linkedId?: string,
): Project[] {
  return projects.filter((p) => filter === 'all' || p.id === linkedId || p.roles.includes(filter));
}

// Returns the id of a known project in a URL hash, or null. The hash is matched as
// written, so a malformed or unknown hash never throws and gives no project.
export function projectIdFromHash(hash: string, projects: readonly Project[]): string | null {
  const id = hash.startsWith('#') ? hash.slice(1) : hash;
  return projects.find((p) => p.id === id)?.id ?? null;
}
