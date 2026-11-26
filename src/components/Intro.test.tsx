import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Profile } from '../content/types';
import { Intro } from './Intro';

// Fixtures, only for this test. The real content is in src/content/profile.ts.
const full: Profile = {
  name: 'Fixture Name',
  intro: 'Fixture role line',
  // Wording and spacing the component must not change.
  about: 'Fixture about,  first sentence. Second sentence (with brackets).',
  github: 'https://example.com/fixture-github',
  cvUrl: 'https://example.com/fixture-cv',
  photo: { src: '/images/fixture.jpg', alt: 'A fixture photo description' },
};

const at = (html: string, part: string) => {
  const index = html.indexOf(part);
  if (index < 0) throw new Error(`not in the intro: ${part}`);
  return index;
};

describe('Intro (SITE-02, T13 ticket)', () => {
  const html = renderToStaticMarkup(<Intro profile={full} />);

  it('shows the photo, the name, the role line, the about text, then the buttons', () => {
    const order = [
      '<figure',
      '>Fixture Name</h1>',
      '>Fixture role line</p>',
      '>Fixture about,  first sentence. Second sentence (with brackets).</p>',
      '>See my projects</a>',
      'Download Resume</a>',
    ].map((part) => at(html, part));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('has no status strip under the window', () => {
    // The role line, then the about text: no other paragraph.
    expect(html.match(/<p[ >]/g)).toHaveLength(2);
    expect(renderToStaticMarkup(<Intro />)).not.toContain('Full-stack developer, project manager');
  });

  it('shows a labeled placeholder when the about text is missing or blank', () => {
    for (const about of [undefined, '', '   ']) {
      const out = renderToStaticMarkup(<Intro profile={{ ...full, about }} />);
      expect(out).toContain('>&lt;your about text&gt;</p>');
      expect(out).toContain('>Fixture role line</p>');
      expect(out).toContain('>See my projects</a>');
    }
  });

  it('shows no placeholder when the about text is supplied', () => {
    expect(html).not.toContain('your about text');
  });

  it('shows the owner about text from the content', () => {
    expect(renderToStaticMarkup(<Intro />)).toContain(
      '>BS Computer Science, University of Makati (UMak), College of Computing and Information Sciences. I build full-stack web apps and lead teams from idea to shipped product as project manager. Member of the UMak SIC Research and Development Committee.</p>',
    );
  });
});
