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

describe('project content (CONT-01, WORK-01, WORK-03, WORK-05)', () => {
  it('lists the five projects once each with the PRD role labels', () => {
    expect(projects.map((p) => p.name)).toEqual([
      'Alunsina',
      'HeronPay',
      'eHanda',
      'Idiya',
      'UMak Kalinga',
    ]);
    const roles = Object.fromEntries(projects.map((p) => [p.name, [...p.roles].sort()]));
    const pm = ['project-management'];
    const both = ['project-management', 'software-development'];
    expect(roles).toEqual({
      Alunsina: pm,
      HeronPay: pm,
      eHanda: pm,
      Idiya: both,
      'UMak Kalinga': both,
    });
  });

  it('uses the locked ids', () => {
    expect(ids(projects)).toEqual(['alunsina', 'heronpay', 'ehanda', 'idiya', 'umak-kalinga']);
  });

  it('shows Idiya as solo, full-stack developer and project manager', () => {
    const idiya = projects.find((p) => p.id === 'idiya');
    expect(idiya?.teamSize).toBe(1);
    expect(idiya?.ownerRole).toBe('Full-stack developer and project manager');
  });

  it('gives the team sizes from the owner', () => {
    expect(Object.fromEntries(projects.map((p) => [p.id, p.teamSize]))).toEqual({
      alunsina: 4,
      heronpay: 3,
      ehanda: 5,
      idiya: 1,
      'umak-kalinga': 4,
    });
  });

  it('marks all five ready, with a problem, at least one point and no outcome', () => {
    for (const p of projects) {
      expect(p.ready).toBe(true);
      expect(p).not.toHaveProperty('outcome');
      expect(p).not.toHaveProperty('images');
      if (!p.ready) throw new Error(`${p.id} is not ready`);
      expect(p.problem.length).toBeGreaterThan(0);
      expect(p.work.points.length).toBeGreaterThan(0);
    }
  });

  it('has a "What I did" line for every project except eHanda', () => {
    const withLine = projects.flatMap((p) => (p.ready && p.work.line ? [p.id] : []));
    expect(withLine).toEqual(['alunsina', 'heronpay', 'idiya', 'umak-kalinga']);
    const ehanda = projects.find((p) => p.id === 'ehanda');
    expect(ehanda?.ready && ehanda.work).not.toHaveProperty('line');
  });

  it('has exactly the three owner links', () => {
    const links = projects.flatMap((p) => (p.ready && p.links ? [[p.id, p.links]] : []));
    expect(links).toEqual([
      ['alunsina', [{ label: 'Landing page', url: 'https://alunsina-landing.vercel.app/' }]],
      ['ehanda', [{ label: 'Live', url: 'https://e-handa.vercel.app/' }]],
      ['idiya', [{ label: 'Live', url: 'https://idiya.vercel.app/' }]],
    ]);
  });

  it('shows a stack only where the owner supplied one', () => {
    const stacks = projects.flatMap((p) => (p.ready && p.stack ? [[p.id, p.stack]] : []));
    expect(stacks).toEqual([
      ['ehanda', 'React, Vite, Supabase'],
      ['idiya', 'Next.js 15, TypeScript, Tailwind, Prisma, Neon Postgres, Auth.js'],
      ['umak-kalinga', 'React, Vite, React Router'],
    ]);
  });
});

describe('filterProjects (WORK-02, WORK-04)', () => {
  it('returns the full list for "all"', () => {
    expect(ids(filterProjects(projects, 'all'))).toEqual(ids(projects));
  });

  it('software development: Idiya and UMak Kalinga', () => {
    expect(ids(filterProjects(projects, 'software-development'))).toEqual([
      'idiya',
      'umak-kalinga',
    ]);
  });

  it('project management: all five, so Idiya and UMak Kalinga are in both', () => {
    expect(ids(filterProjects(projects, 'project-management'))).toEqual([
      'alunsina',
      'heronpay',
      'ehanda',
      'idiya',
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
    expect(projectIdFromHash('#idiya', projects)).toBe('idiya');
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
    '#Idiya',
    '##idiya',
    '#taskvane',
  ])('gives no project for %j', (hash) => {
    expect(projectIdFromHash(hash, projects)).toBeNull();
  });
});
