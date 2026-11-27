import { describe, expect, it } from 'vitest';
import { profile } from '../content/profile';
import { SECTIONS, SITE_TITLE, copyrightLine } from './site';

describe('site', () => {
  it('uses the owner name from the profile as the title (T04 ticket)', () => {
    expect(SITE_TITLE).toBe(profile.name);
  });

  it('lists the five sections in the SITE-01 order, with the board labels', () => {
    expect(SECTIONS.map((section) => section.id)).toEqual([
      'welcome',
      'awards',
      'work',
      'tools',
      'links',
    ]);
    expect(SECTIONS.map((section) => section.label)).toEqual([
      'Welcome',
      'Awards',
      'Projects',
      'Tools',
      'Links',
    ]);
  });

  it('writes the copyright line as in the design board', () => {
    expect(copyrightLine('Vonn Salve')).toBe('© 2026 Vonn Salve');
  });
});
