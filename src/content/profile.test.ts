import { describe, expect, it } from 'vitest';
import { profile } from './profile';

describe('profile text (SITE-02, T12 ticket)', () => {
  it('has the owner intro line', () => {
    expect(profile.intro).toBe('Full-stack developer and project manager');
  });

  it('has the owner About text, with only the one sentence changed', () => {
    expect(profile.about).toBe(
      'BS Computer Science, University of Makati (UMak), College of Computing and Information Sciences. I build full-stack web apps and lead teams from idea to shipped product as project manager. Member of the UMak SIC Research and Development Committee.',
    );
  });
});
