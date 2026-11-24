import { describe, expect, it } from 'vitest';
import { profile } from '../content/profile';
import { INTRO_STRIP, SECTIONS, SITE_TITLE, copyrightLine } from './site';

describe('site', () => {
  it('uses the owner name from the profile as the title (T04 ticket)', () => {
    expect(SITE_TITLE).toBe(profile.name);
  });

  it('lists the five sections in the SITE-01 order, with the board labels', () => {
    expect(SECTIONS.map((section) => section.id)).toEqual([
      'welcome',
      'awards',
      'work',
      'about',
      'links',
    ]);
    expect(SECTIONS.map((section) => section.label)).toEqual([
      'Welcome',
      'Awards',
      'Work',
      'About',
      'Links',
    ]);
  });

  it('words the intro strip as the owner chose (T10 ticket)', () => {
    expect(INTRO_STRIP).toBe('Frontend developer, project manager');
  });

  it('writes the copyright line as in the design board', () => {
    expect(copyrightLine('Vonn Salve')).toBe('© 2026 Vonn Salve');
  });
});
