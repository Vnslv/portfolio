import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Award, Project } from '../content/types';
import { sectionsFor } from '../lib/awards';
import { Awards } from './Awards';
import { ProjectCard } from './ProjectCard';
import { SectionNav } from './SectionNav';
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

  it('has no navigation entry in the sidebar or the taskbar', () => {
    const sections = sectionsFor([]);
    const nav = renderToStaticMarkup(<SectionNav sections={sections} />);
    const bar = renderToStaticMarkup(<Taskbar sections={sections} />);
    for (const html of [nav, bar]) {
      expect(html).not.toContain('href="#awards"');
      expect(html).not.toContain('Awards');
      expect(html).toContain('href="#work"');
    }
  });
});

describe('navigation with awards (SITE-01)', () => {
  it('lists Awards by default and when an award shows', () => {
    expect(renderToStaticMarkup(<SectionNav />)).toContain('href="#awards"');
    expect(renderToStaticMarkup(<Taskbar />)).toContain('href="#awards"');
    expect(renderToStaticMarkup(<SectionNav sections={sectionsFor([full])} />)).toContain(
      'href="#awards"',
    );
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
