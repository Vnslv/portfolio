import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Profile } from '../content/types';
import { Intro } from './Intro';
import { Links } from './Links';

// Fixtures, only for this test. The real content is in src/content/profile.ts.
const full: Profile = {
  name: 'Fixture Name',
  intro: 'Fixture intro line',
  about: 'Fixture about text',
  github: 'https://example.com/fixture-github',
  linkedin: 'https://example.com/fixture-linkedin',
  cvUrl: 'https://example.com/fixture-cv?export=download&id=abc',
  photo: {
    src: '/images/fixture.jpg',
    small: '/images/fixture-small.webp',
    alt: 'A fixture photo description',
  },
};

const anchors = (html: string) => html.match(/<a [^>]*>/g) ?? [];
const anchorFor = (html: string, href: string) => {
  const found = anchors(html).find((a) => a.includes(`href="${href}"`));
  if (!found) throw new Error(`no link to ${href}`);
  return found;
};

describe('Links with every link supplied (LINK-01, LINK-02)', () => {
  const html = renderToStaticMarkup(<Links profile={full} />);

  it('is the links section with its three links', () => {
    expect(html).toContain('id="links"');
    expect(anchors(html)).toHaveLength(3);
    expect(html).toContain('GitHub');
    expect(html).toContain('LinkedIn');
    expect(html).toContain('Download CV');
  });

  it('opens each profile in a new tab, safely, and says so in its name', () => {
    for (const [href, name] of [
      ['https://example.com/fixture-github', 'GitHub'],
      ['https://example.com/fixture-linkedin', 'LinkedIn'],
    ] as const) {
      const a = anchorFor(html, href);
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener noreferrer"');
      expect(a).toContain(`aria-label="${name} (opens in a new tab)"`);
    }
  });

  it('links the CV to the address in content, as a plain link', () => {
    const a = anchorFor(html, 'https://example.com/fixture-cv?export=download&amp;id=abc');
    expect(a).not.toContain('target=');
    expect(a).not.toContain('rel=');
    expect(a).not.toContain('aria-label');
  });

  it('has no dead or invented address', () => {
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('href=""');
    expect(html).not.toContain('href="#"');
  });
});

describe('Links with a link missing (empty state)', () => {
  it('shows a labeled placeholder, not a link, for a missing LinkedIn', () => {
    const html = renderToStaticMarkup(<Links profile={{ ...full, linkedin: undefined }} />);
    expect(html).toContain('&lt;your LinkedIn link&gt;');
    expect(anchors(html)).toHaveLength(2);
    expect(html).not.toContain('fixture-linkedin');
    expect(html).toContain('Download CV');
  });

  it('shows a labeled placeholder, not a link, for a missing CV', () => {
    const html = renderToStaticMarkup(<Links profile={{ ...full, cvUrl: undefined }} />);
    expect(html).toContain('&lt;your CV link&gt;');
    expect(anchors(html)).toHaveLength(2);
    expect(html).not.toContain('Download CV');
    expect(html).toContain('href="https://example.com/fixture-github"');
  });

  it('treats a blank address as missing, for all three', () => {
    const html = renderToStaticMarkup(
      <Links profile={{ ...full, github: '  ', linkedin: '', cvUrl: ' ' }} />,
    );
    expect(anchors(html)).toHaveLength(0);
    expect(html).toContain('&lt;your GitHub link&gt;');
    expect(html).toContain('&lt;your LinkedIn link&gt;');
    expect(html).toContain('&lt;your CV link&gt;');
    expect(html).not.toContain('href=');
  });
});

describe('Intro: the Download CV button (LINK-02)', () => {
  it('links the CV to the same address as Links, as a plain link', () => {
    const html = renderToStaticMarkup(<Intro profile={full} />);
    const a = anchorFor(html, 'https://example.com/fixture-cv?export=download&amp;id=abc');
    expect(a).not.toContain('target=');
    expect(a).not.toContain('rel=');
    expect(html).toContain('Download CV');
    expect(anchorFor(html, '#work')).toContain('class="button"');
  });

  it('shows a labeled placeholder and keeps See my projects when the CV is missing', () => {
    for (const cvUrl of [undefined, '', '  ']) {
      const html = renderToStaticMarkup(<Intro profile={{ ...full, cvUrl }} />);
      expect(html).toContain('&lt;your CV link&gt;');
      expect(html).not.toContain('Download CV');
      expect(anchors(html)).toHaveLength(1);
      expect(html).toContain('>See my projects</a>');
    }
  });
});

describe('Intro: the photo', () => {
  it('shows the small copy with its description, and no link around it', () => {
    const html = renderToStaticMarkup(<Intro profile={full} />);
    const start = html.indexOf('<img');
    const img = html.slice(start, html.indexOf('>', start));
    expect(img).toContain('src="/images/fixture-small.webp"');
    expect(img).toContain('alt="A fixture photo description"');
    expect(html).not.toContain('fixture.jpg');
    // The only links in the intro are See my projects and Download CV.
    expect(anchors(html)).toHaveLength(2);
    expect(html).not.toContain('&lt;your photo&gt;');
  });

  it('shows the full image when there is no small copy', () => {
    const html = renderToStaticMarkup(
      <Intro profile={{ ...full, photo: { src: '/images/fixture.jpg', alt: 'Plain' } }} />,
    );
    expect(html).toContain('src="/images/fixture.jpg"');
  });

  it('keeps the labeled placeholder, and no image, until a photo is supplied', () => {
    const html = renderToStaticMarkup(<Intro profile={{ ...full, photo: undefined }} />);
    expect(html).toContain('&lt;your photo&gt;');
    expect(html).not.toContain('<img');
  });
});

describe('Intro: the owner words (SITE-02, T12 ticket)', () => {
  const html = renderToStaticMarkup(<Intro />);

  it('shows the intro line and the strip', () => {
    expect(html).toContain('>Full-stack developer and project manager</p>');
    expect(html).toContain('Full-stack developer, project manager');
    expect(html).not.toContain('Frontend developer');
  });

  it('names the button See my projects and keeps its #work address', () => {
    expect(html).toMatch(/<a [^>]*href="#work"[^>]*>See my projects<\/a>/);
  });
});

describe('the owner content (LINK-01, LINK-02)', () => {
  it('links the profiles and the CV to the owner addresses', () => {
    const html = renderToStaticMarkup(<Links />);
    expect(html).toContain('href="https://github.com/Vnslv"');
    expect(html).toContain('href="https://www.linkedin.com/in/vonn-salve-1b05b9403/"');
    expect(html).toContain(
      'href="https://drive.google.com/uc?export=download&amp;id=1Ocqt2HoIjLeVMKR24qlCmPaDSc8vUUyj"',
    );
    expect(html).not.toContain('&lt;your');
  });

  it('shows the owner photo, small copy, with the owner description', () => {
    const html = renderToStaticMarkup(<Intro />);
    expect(html).toContain('src="/images/profile-small.webp"');
    expect(html).toContain('alt="Vonn Salve wearing glasses and a tan polo shirt, looking down"');
    expect(html).toContain(
      'href="https://drive.google.com/uc?export=download&amp;id=1Ocqt2HoIjLeVMKR24qlCmPaDSc8vUUyj"',
    );
  });
});
