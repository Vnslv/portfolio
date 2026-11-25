import { describe, expect, it } from 'vitest';
import { awards } from '../content/awards';
import { projects } from '../content/projects';
import type { Award, Project } from '../content/types';
import { awardFacts, awardId, awardsForProject, awardsToShow, sectionsFor } from './awards';
import { SECTIONS } from './site';

describe('award content (AWARD-01, AWARD-03)', () => {
  it('holds the three owner-supplied awards', () => {
    expect(
      awards.map((a) => [a.hackathon, a.organizer, a.placement, a.project, a.role, a.teamSize]),
    ).toEqual([
      [
        'Blockchain Campus Conference 2026',
        'Binance Academy',
        'Champion',
        'HeronPay',
        'Project manager',
        3,
      ],
      [
        'UMak CCIS Infotechnolympics Hackathon',
        'University of Makati',
        'Champion',
        'HeronHub',
        'Project manager',
        3,
      ],
      ['eGovPH Hackathon 2026', 'eGovPH', 'Top 30', 'eHanda', 'Project manager', 5],
    ]);
  });

  it('has the owner dates (2026-11-25)', () => {
    expect(awards.map((a) => a.date)).toEqual(['November 2026', 'October 2026', 'July 2026']);
  });

  it('has the three approved images with descriptions (eGovPH: owner, 2026-11-25)', () => {
    expect(awards.map((a) => a.image)).toEqual([
      {
        src: '/images/bcc.jpg',
        small: '/images/bcc-small.webp',
        alt: 'Six people on stage under a screen that reads Your hackathon champion, HeronPay',
      },
      {
        src: '/images/infotech.jpg',
        small: '/images/infotech-small.webp',
        alt: 'Three teammates wearing champion medals, one holding an Infotechnolympics 2026 envelope',
      },
      {
        src: '/images/egovph.jpg',
        small: '/images/egovph-small.webp',
        alt: 'Five teammates and three others on stage holding a check for the Top 30 eGovHackathon 2026 finalist teams',
      },
    ]);
  });

  it('shows all three', () => {
    expect(awardsToShow(awards)).toHaveLength(3);
  });
});

describe('awardFacts (AWARD-01 acceptance 1-2)', () => {
  it('gives every supplied fact', () => {
    const a: Award = {
      hackathon: 'Hack',
      placement: 'Champion',
      organizer: 'Org',
      date: 'May 2026',
      project: 'Proj',
      role: 'Lead',
      teamSize: 3,
    };
    expect(awardFacts(a)).toEqual({
      heading: 'Champion, Hack',
      byline: 'Org, May 2026',
      details: ['Project: Proj', 'My role: Lead', 'Team of 3'],
    });
  });

  it('leaves out every fact that is missing or blank, and invents none', () => {
    expect(awardFacts({ hackathon: 'Hack', placement: 'Top 10' })).toEqual({
      heading: 'Top 10, Hack',
      byline: null,
      details: [],
    });
    expect(
      awardFacts({
        hackathon: 'Hack',
        placement: 'Top 10',
        organizer: ' ',
        date: 'July 2026',
        project: '',
        role: 'Lead',
      }),
    ).toEqual({ heading: 'Top 10, Hack', byline: 'July 2026', details: ['My role: Lead'] });
  });

  it('says solo for a team of one', () => {
    expect(awardFacts({ hackathon: 'H', placement: 'P', teamSize: 1 }).details).toEqual([
      'Solo project',
    ]);
  });
});

describe('awardId (AWARD-02 anchors)', () => {
  const ids = () => awards.map(awardId);

  it('is a readable slug of the hackathon name', () => {
    expect(ids()).toEqual([
      'award-blockchain-campus-conference-2026',
      'award-umak-ccis-infotechnolympics-hackathon',
      'award-egovph-hackathon-2026',
    ]);
  });

  it('is unique and never equals a project id or a section id', () => {
    expect(new Set(ids()).size).toBe(awards.length);
    for (const id of ids()) {
      expect(projects.map((p) => p.id)).not.toContain(id);
      expect(SECTIONS.map((s) => s.id)).not.toContain(id);
    }
  });
});

describe('awardsForProject (AWARD-02)', () => {
  const project = (name: string): Project => ({
    id: 'p',
    name,
    roles: ['project-management'],
    ready: false,
  });
  const byName = (name: string) => awardsForProject(project(name), awards).map((a) => a.hackathon);

  it('finds the award by project name', () => {
    expect(byName('HeronPay')).toEqual(['Blockchain Campus Conference 2026']);
    expect(byName('eHanda')).toEqual(['eGovPH Hackathon 2026']);
  });

  it('gives no badge to a project with no award, or to a different spelling', () => {
    expect(byName('Idiya')).toEqual([]);
    expect(byName('Alunsina')).toEqual([]);
    expect(byName('heronpay')).toEqual([]);
  });

  it('never gives a badge for an award that is not shown', () => {
    const hidden: Award = { hackathon: '', placement: 'Champion', project: 'HeronPay' };
    expect(awardsForProject(project('HeronPay'), [hidden])).toEqual([]);
  });

  it('lists every award a project won, in order', () => {
    const one: Award = { hackathon: 'One', placement: 'Champion', project: 'X' };
    const two: Award = { hackathon: 'Two', placement: 'Top 10', project: 'X' };
    expect(awardsForProject(project('X'), [one, two])).toEqual([one, two]);
  });
});

describe('sectionsFor (AWARD-01 acceptance 4, navigation)', () => {
  const ids = (list: readonly { id: string }[]) => list.map((s) => s.id);

  it('keeps all five sections while an award shows', () => {
    expect(ids(sectionsFor(awards))).toEqual(['welcome', 'awards', 'work', 'about', 'links']);
  });

  it('leaves out Awards with no award to show', () => {
    expect(ids(sectionsFor([]))).toEqual(['welcome', 'work', 'about', 'links']);
    expect(ids(sectionsFor([{ hackathon: 'Hack', placement: '' }]))).toEqual([
      'welcome',
      'work',
      'about',
      'links',
    ]);
  });
});

describe('awardsToShow (AWARD-01 acceptance 3)', () => {
  const full: Award = { hackathon: 'Hack', placement: 'Champion' };

  it('keeps an award that has a hackathon and a placement, without other facts', () => {
    expect(awardsToShow([full])).toEqual([full]);
  });

  it('drops an award with no hackathon', () => {
    expect(awardsToShow([{ hackathon: '', placement: 'Champion' }])).toEqual([]);
  });

  it('drops an award with no placement', () => {
    expect(awardsToShow([{ hackathon: 'Hack', placement: '' }])).toEqual([]);
  });

  it('treats whitespace-only text as missing', () => {
    expect(
      awardsToShow([
        { hackathon: '  ', placement: 'Top 10' },
        { hackathon: 'Hack', placement: ' \n' },
      ]),
    ).toEqual([]);
  });

  it('keeps order and drops only the incomplete ones', () => {
    const second: Award = { hackathon: 'Other', placement: 'Top 10' };
    expect(awardsToShow([full, { hackathon: '', placement: 'x' }, second])).toEqual([full, second]);
  });

  it('gives none for an empty list', () => {
    expect(awardsToShow([])).toEqual([]);
  });
});
