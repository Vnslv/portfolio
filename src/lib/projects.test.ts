import { describe, expect, it } from 'vitest';
import { projects } from '../content/projects';
import type { Project } from '../content/types';
import { filterProjects, projectIdFromHash } from './projects';

const fixture: readonly Project[] = [
  { id: 'dev-only', name: 'Dev Only', roles: ['software-development'], ready: false },
  { id: 'pm-only', name: 'PM Only', roles: ['project-management'], ready: false },
  {
    id: 'both',
    name: 'Both',
    roles: ['software-development', 'project-management'],
    ready: false,
  },
];

const ids = (list: readonly Project[]) => list.map((p) => p.id);

describe('project content (WORK-01, WORK-05, WORK-06)', () => {
  it('lists the five projects once each with the PRD role labels', () => {
    expect(projects.map((p) => p.name)).toEqual([
      'Alunsina',
      'HeronPay',
      'eHanda',
      'Taskvane',
      'UMak Kalinga',
    ]);
    const roles = Object.fromEntries(projects.map((p) => [p.name, [...p.roles].sort()]));
    const pm = ['project-management'];
    const both = ['project-management', 'software-development'];
    expect(roles).toEqual({
      Alunsina: pm,
      HeronPay: pm,
      eHanda: pm,
      Taskvane: both,
      'UMak Kalinga': both,
    });
  });

  it('uses the locked ids', () => {
    expect(ids(projects)).toEqual(['alunsina', 'heronpay', 'ehanda', 'taskvane', 'umak-kalinga']);
  });

  it('shows Taskvane as solo, full-stack developer and project manager', () => {
    const taskvane = projects.find((p) => p.id === 'taskvane');
    expect(taskvane?.teamSize).toBe(1);
    expect(taskvane?.ownerRole).toBe('Full-stack developer and project manager');
  });

  it('marks all five not ready, with no problem, work or outcome', () => {
    for (const p of projects) {
      expect(p.ready).toBe(false);
      expect(p).not.toHaveProperty('problem');
      expect(p).not.toHaveProperty('work');
      expect(p).not.toHaveProperty('outcome');
    }
  });
});

describe('filterProjects (WORK-02, WORK-04)', () => {
  it('returns the full list for "all"', () => {
    expect(ids(filterProjects(projects, 'all'))).toEqual(ids(projects));
  });

  it('software development: Taskvane and UMak Kalinga', () => {
    expect(ids(filterProjects(projects, 'software-development'))).toEqual([
      'taskvane',
      'umak-kalinga',
    ]);
  });

  it('project management: all five, so Taskvane and UMak Kalinga are in both', () => {
    expect(ids(filterProjects(projects, 'project-management'))).toEqual([
      'alunsina',
      'heronpay',
      'ehanda',
      'taskvane',
      'umak-kalinga',
    ]);
  });

  it('a project with both roles appears under both filters', () => {
    expect(ids(filterProjects(fixture, 'software-development'))).toContain('both');
    expect(ids(filterProjects(fixture, 'project-management'))).toContain('both');
  });

  it('keeps a linked project visible under a filter that would hide it', () => {
    expect(ids(filterProjects(fixture, 'software-development'))).toEqual(['dev-only', 'both']);
    expect(ids(filterProjects(fixture, 'software-development', 'pm-only'))).toEqual([
      'dev-only',
      'pm-only',
      'both',
    ]);
  });

  it('ignores a linked id that matches no project', () => {
    expect(ids(filterProjects(fixture, 'software-development', 'nope'))).toEqual([
      'dev-only',
      'both',
    ]);
  });
});

describe('projectIdFromHash (WORK-04)', () => {
  it('reads a known id with or without the leading #', () => {
    expect(projectIdFromHash('#taskvane', projects)).toBe('taskvane');
    expect(projectIdFromHash('umak-kalinga', projects)).toBe('umak-kalinga');
  });

  it.each([
    '',
    '#',
    '#unknown',
    '#__proto__',
    '#constructor',
    '#toString',
    '%E0%A4%A',
    '#%E0%A4%A',
    '#Taskvane',
    '##taskvane',
  ])('gives no project for %j', (hash) => {
    expect(projectIdFromHash(hash, projects)).toBeNull();
  });
});
