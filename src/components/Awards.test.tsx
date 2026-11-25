import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Award, Project } from '../content/types';
import { sectionsFor } from '../lib/awards';
import { Awards } from './Awards';
import { ProjectCard } from './ProjectCard';
import { Taskbar } from './Taskbar';

// The theme toggle is not under test, and it imports through the `@/` alias, which vitest does not
// resolve. Only this stand-in replaces it, in this test.
vi.mock('./ThemeToggle', () => ({ ThemeToggle: () => null }));

// Fixtures, only for this test. The real content is in src/content/awards.ts.
const full: Award = {
  hackathon: 'Fixture Hack One',
  placement: 'Champion',
  organizer: 'Fixture Org',
  date: 'May 2026',
  project: 'Fixture Project',
  role: 'Fixture role',
  teamSize: 4,
  image: { src: '/images/fixture.jpg', alt: 'A fixture image description' },
};
const bare: Award = { hackathon: 'Fixture Hack Two', placement: 'Top 10' };

const project: Project = {
  id: 'fixture-project',
  name: 'Fixture Project',
  roles: ['project-management'],
  roleLabel: 'Fixture role label',
  ready: false,
};

// The markup of one award, up to the next award.
function item(html: string, id: string): string {
  const chunk = html.split(/(?=<li[^>]*id="award-)/).find((p) => p.includes(`id="${id}"`));
  if (!chunk) throw new Error(`no award ${id}`);
  return chunk;
}

describe('Awards (AWARD-01, AWARD-03)', () => {
  const html = renderToStaticMarkup(<Awards awards={[full, bare]} />);

  it('is the awards section, with a count in its status', () => {
    expect(html).toContain('id="awards"');
    expect(html).toContain('2 awards');
  });

  it('shows every supplied fact of an award, and its image with its description', () => {
    const one = item(html, 'award-fixture-hack-one');
    expect(one).toContain('Champion, Fixture Hack One');
    expect(one).toContain('Fixture Org, May 2026');
    expect(one).toContain('Project: Fixture Project');
    expect(one).toContain('My role: Fixture role');
    expect(one).toContain('Team of 4');
    expect(one).toContain('alt="A fixture image description"');
  });

  it('links the photo to its full image in a new tab, with a name that says so', () => {
    const one = item(html, 'award-fixture-hack-one');
    expect(one).toContain('href="/images/fixture.jpg"');
    expect(one).toContain('target="_blank"');
    expect(one).toContain('rel="noopener noreferrer"');
    expect(one).toContain(
      'aria-label="A fixture image description (opens the full image in a new tab)"',
    );
    // An award with no image has no photo and so no link.
    expect(item(html, 'award-fixture-hack-two')).not.toContain('<a ');
  });

  it('shows the small copy as the picture and links to the full image', () => {
    const withSmall: Award = {
      ...full,
      hackathon: 'Fixture Hack Small',
      image: { ...full.image!, small: '/images/fixture-small.webp' },
    };
    const out = item(
      renderToStaticMarkup(<Awards awards={[withSmall]} />),
      'award-fixture-hack-small',
    );
    const img = out.slice(out.indexOf('<img'), out.indexOf('>', out.indexOf('<img')));
    expect(img).toContain('src="/images/fixture-small.webp"');
    expect(img).not.toContain('fixture.jpg');
    expect(out).toContain('href="/images/fixture.jpg"');
  });

  it('shows the full image as the picture when there is no small copy', () => {
    const one = item(html, 'award-fixture-hack-one');
    const img = one.slice(one.indexOf('<img'), one.indexOf('>', one.indexOf('<img')));
    expect(img).toContain('src="/images/fixture.jpg"');
  });

  it('leaves out missing facts and still shows an award with no image', () => {
    const two = item(html, 'award-fixture-hack-two');
    expect(two).toContain('Top 10, Fixture Hack Two');
    expect(two).not.toContain('Project:');
    expect(two).not.toContain('My role:');
    expect(two).not.toContain('Team of');
    expect(two).not.toContain('<img');
    expect(two).not.toContain('undefined');
  });

  it('says "1 award" for one', () => {
    expect(renderToStaticMarkup(<Awards awards={[bare]} />)).toContain('1 award<');
  });

  it('leaves out an award with no hackathon or placement', () => {
    const out = renderToStaticMarkup(
      <Awards awards={[{ hackathon: '', placement: 'Champion' }, bare]} />,
    );
    expect(out).toContain('1 award<');
  });
});

describe('with no award to show (AWARD-01 acceptance 4)', () => {
  it('renders no section', () => {
    expect(renderToStaticMarkup(<Awards awards={[]} />)).toBe('');
    expect(renderToStaticMarkup(<Awards awards={[{ hackathon: 'H', placement: ' ' }]} />)).toBe('');
  });

  it('has no badge on a card', () => {
    const html = renderToStaticMarkup(
      <ul>
        <ProjectCard project={project} enhanced awards={[]} onClose={() => undefined} />
      </ul>,
    );
    expect(html).not.toContain('href="#award-');
  });

  it('has no navigation entry in the taskbar', () => {
    const bar = renderToStaticMarkup(<Taskbar sections={sectionsFor([])} />);
    expect(bar).not.toContain('href="#awards"');
    expect(bar).not.toContain('Awards');
    expect(bar).toContain('href="#work"');
  });
});

describe('an award without an image (AWARD-03 acceptance 4)', () => {
  const html = renderToStaticMarkup(<Awards awards={[full, bare]} />);

  it('has no photo column class and no figure, so its text uses the full width', () => {
    const two = item(html, 'award-fixture-hack-two');
    expect(two).not.toContain('<figure');
    expect(two).not.toContain('withImage');
    // The same list item with an image does carry the column class.
    const one = item(html, 'award-fixture-hack-one');
    expect(one).toContain('<figure');
    expect(one).toContain('withImage');
  });
});

describe('the taskbar sections (SITE-01)', () => {
  // The section buttons, not the Menu panel: they carry the "section" class.
  const sectionLinks = (html: string) =>
    [...html.matchAll(/<a [^>]*class="[^"]*section[^"]*"[^>]*>(.*?)<\/a>/g)].map((m) => m[0]);

  it('lists Awards by default and when an award shows', () => {
    expect(renderToStaticMarkup(<Taskbar />)).toContain('href="#awards"');
    expect(renderToStaticMarkup(<Taskbar sections={sectionsFor([full])} />)).toContain(
      'href="#awards"',
    );
  });

  it('gives every section button its icon and its label, in page order', () => {
    const links = sectionLinks(renderToStaticMarkup(<Taskbar />));
    expect(links).toHaveLength(5);
    const hrefs = links.map((l) => l.match(/href="([^"]*)"/)?.[1]);
    expect(hrefs).toEqual(['#welcome', '#awards', '#work', '#about', '#links']);
    const labels = ['Welcome', 'Awards', 'Projects', 'About', 'Links'];
    links.forEach((link, i) => {
      expect(link).toContain('<svg');
      expect(link).toContain(`</svg>${labels[i]}</a>`);
    });
  });

  // The Menu panel and the section buttons both name the section.
  it('names the #work link Projects in the Menu and the bar (T12 ticket)', () => {
    const html = renderToStaticMarkup(<Taskbar />);
    expect(html.match(/<a [^>]*href="#work"[^>]*>.*?<\/a>/g)).toEqual([
      expect.stringContaining('</svg>Projects</a>'),
      expect.stringContaining('</svg>Projects</a>'),
    ]);
  });

  it('marks no section current before script runs, and keeps the Menu for small screens', () => {
    const html = renderToStaticMarkup(<Taskbar />);
    expect(html).not.toContain('aria-current');
    expect(html).toContain('Menu');
  });

  it('leaves the home page base on every link when given one', () => {
    const links = sectionLinks(renderToStaticMarkup(<Taskbar hrefBase="/" />));
    expect(links.map((l) => l.match(/href="([^"]*)"/)?.[1])).toEqual([
      '/#welcome',
      '/#awards',
      '/#work',
      '/#about',
      '/#links',
    ]);
  });
});

describe('an opened project (WORK-03, owner 2026-11-25)', () => {
  it('has no Copy link button and no status message, only links and Close', () => {
    const ready: Project = {
      id: 'fixture-project',
      name: 'Fixture Project',
      roles: ['project-management'],
      roleLabel: 'Fixture role label',
      ready: true,
      problem: 'P',
      work: { points: ['W'] },
      links: [{ label: 'Live', url: 'https://example.com/' }],
    };
    const html = renderToStaticMarkup(
      <ul>
        <ProjectCard project={ready} enhanced awards={[]} onClose={() => undefined} />
      </ul>,
    );
    expect(html).not.toContain('Copy link');
    expect(html).not.toContain('role="status"');
    expect(html).toContain('>Live</a>');
    expect(html).toContain('>Close</button>');
  });
});

describe('award badge on a card (AWARD-02)', () => {
  const card = (awards?: readonly Award[]) =>
    renderToStaticMarkup(
      <ul>
        <ProjectCard project={project} enhanced awards={awards} onClose={() => undefined} />
      </ul>,
    );

  it('shows the hackathon and placement and links to the award in the section', () => {
    const html = card([full, bare]);
    expect(html).toContain('href="#award-fixture-hack-one"');
    expect(html).toContain('Champion, Fixture Hack One');
    expect(html).not.toContain('Fixture Hack Two');
    // The award's details are listed once, in the awards section, not on the card.
    expect(html).not.toContain('Fixture Org');
    expect(html).not.toContain('May 2026');
  });

  it('is outside the summary, so no link sits inside a control', () => {
    const ready: Project = {
      id: 'fixture-project',
      name: 'Fixture Project',
      roles: ['project-management'],
      roleLabel: 'Fixture role label',
      ready: true,
      problem: 'P',
      work: { points: ['W'] },
    };
    const html = renderToStaticMarkup(
      <ul>
        <ProjectCard project={ready} enhanced awards={[full]} onClose={() => undefined} />
      </ul>,
    );
    const summary = html.slice(html.indexOf('<summary'), html.indexOf('</summary>'));
    expect(summary).not.toContain('<a');
    expect(html).toContain('href="#award-fixture-hack-one"');
  });

  it('sits between the row and the details panel, as on the board', () => {
    const ready: Project = {
      id: 'fixture-project',
      name: 'Fixture Project',
      roles: ['project-management'],
      roleLabel: 'Fixture role label',
      ready: true,
      problem: 'A problem sentence.',
      work: { points: ['W'] },
    };
    const html = renderToStaticMarkup(
      <ul>
        <ProjectCard project={ready} enhanced awards={[full]} onClose={() => undefined} />
      </ul>,
    );
    const row = html.indexOf('</summary>');
    const badge = html.indexOf('href="#award-fixture-hack-one"');
    const panel = html.indexOf('A problem sentence.');
    expect(row).toBeGreaterThan(0);
    expect(badge).toBeGreaterThan(row);
    expect(panel).toBeGreaterThan(badge);
    // The badge is not inside the native details element, so it shows on a closed card too.
    const details = html.slice(html.indexOf('<details'), html.indexOf('</details>'));
    expect(details).not.toContain('href="#award-');
  });

  it('defaults to the content awards: HeronPay has a badge, Idiya has none', () => {
    const named = (name: string): Project => ({ ...project, id: name, name });
    const render = (p: Project) =>
      renderToStaticMarkup(
        <ul>
          <ProjectCard project={p} enhanced onClose={() => undefined} />
        </ul>,
      );
    expect(render(named('HeronPay'))).toContain('href="#award-blockchain-campus-conference-2026"');
    expect(render(named('Idiya'))).not.toContain('href="#award-');
  });
});
