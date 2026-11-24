import { describe, expect, it } from 'vitest';
import { awards } from '../content/awards';
import type { Award } from '../content/types';
import { awardsToShow } from './awards';

describe('award content (AWARD-01)', () => {
  it('holds the three owner-supplied awards, with no date', () => {
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
      ['eGovPH Hackathon 2026', 'eGovPH', 'Top 10', 'eHanda', 'Project manager', 5],
    ]);
    for (const a of awards) expect(a).not.toHaveProperty('date');
  });

  it('shows all three', () => {
    expect(awardsToShow(awards)).toHaveLength(3);
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
