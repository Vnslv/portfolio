import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Project } from '../content/types';
import { Work } from './Work';

// A fixture, only for this test. The real content has no project that is not ready (WORK-06).
const fixture: readonly Project[] = [
  {
    id: 'ready-one',
    name: 'Ready One',
    roles: ['software-development', 'project-management'],
    // Wording that `roles` could not produce, so it can only come from the content (CONT-01).
    roleLabel: 'Fixture robotics and project management',
    teamSize: 1,
    ownerRole: 'Solo builder',
    ready: true,
    problem: 'A problem sentence.',
    work: { line: 'A lead-in line:', points: ['First point', 'Second point'] },
    stack: 'Stack A, Stack B',
    links: [{ label: 'Live', url: 'https://example.com/live' }],
    images: [{ src: '/images/x.png', alt: 'An image description' }],
  },
  {
    id: 'soon-one',
    name: 'Soon One',
    roles: ['project-management'],
    roleLabel: 'Fixture coordination',
    ready: false,
  },
];

const html = renderToStaticMarkup(<Work projects={fixture} />);

// The markup of one project item, up to the next project item (points are list items too).
function item(id: string): string {
  const chunk = html
    .split(/(?=<li[^>]*data-project=)/)
    .find((part) => part.startsWith('<li') && part.includes(`data-project="${id}"`));
  if (!chunk) throw new Error(`no list item ${id}`);
  return chunk;
}

describe('the Projects window (SITE-01, T12 ticket)', () => {
  it('is titled Projects and keeps the id work', () => {
    expect(html).toMatch(/^<section[^>]*id="work"/);
    // The title follows the window icon inside the heading.
    expect(html).toContain('</svg>Projects</h2>');
    expect(html).not.toContain('</svg>Work</h2>');
  });
});

describe('Work with a project that is not ready (WORK-06)', () => {
  it('shows its name, role label and "Coming soon"', () => {
    const soon = item('soon-one');
    expect(soon).toContain('Soon One');
    expect(soon).toContain('>Fixture coordination</span>');
    expect(soon).toContain('Coming soon');
  });

  it('cannot be opened and shows no invented content', () => {
    const soon = item('soon-one');
    expect(soon).not.toContain('<details');
    expect(soon).not.toContain('<summary');
    expect(soon).not.toContain('<button');
    expect(soon).not.toContain('Problem');
    expect(soon).not.toContain('What I did');
  });
});

describe('Work with a ready project (WORK-01, WORK-03, WORK-05)', () => {
  it('has its text in the page as a closed native section, so it can be read without scripts', () => {
    const ready = item('ready-one');
    expect(ready).toMatch(/<details(?![^>]*\sopen)[^>]*>/);
    expect(ready).toContain('<summary');
    for (const text of [
      'Problem',
      'A problem sentence.',
      'What I did',
      'A lead-in line:',
      'First point',
      'Second point',
      'Stack',
      'Stack A, Stack B',
      'Live',
      'https://example.com/live',
      'Solo builder',
    ]) {
      expect(ready).toContain(text);
    }
    expect(ready).not.toContain('Outcome');
  });

  it('shows its role label and team label, and opening one section closes the others', () => {
    const ready = item('ready-one');
    expect(ready).toContain('>Fixture robotics and project management</span>');
    expect(ready).not.toContain('Software development and project management');
    expect(ready).toContain('Solo project');
    expect(ready).toContain('name="projects"');
  });

  it('reserves the image space and keeps its description', () => {
    expect(item('ready-one')).toContain('An image description');
  });

  it('shows the count and the filter, with every project listed before any script runs', () => {
    expect(html).toContain('2 of 2 projects');
    expect(html).toContain('Software development');
    expect(html.match(/data-project=/g)).toHaveLength(2);
  });
});
