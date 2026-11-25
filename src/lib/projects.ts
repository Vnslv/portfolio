import type { Project, Role, RoleFilter } from '../content/types';

// The PRD role labels (WORK-01), software development first, whatever the order in the content.
export function roleLabel(roles: readonly Role[]): string {
  const software = roles.includes('software-development');
  const management = roles.includes('project-management');
  if (software && management) return 'Software development and project management';
  return software ? 'Software development' : 'Project management';
}

// Solo for one person, "Team of n" otherwise, nothing when the owner gave no size (WORK-05).
export function teamLabel(teamSize: number | undefined): string | null {
  if (teamSize === undefined) return null;
  return teamSize === 1 ? 'Solo project' : `Team of ${teamSize}`;
}

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
