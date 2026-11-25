import type { Award, Project } from '../content/types';
import { teamLabel } from './projects';
import { SECTIONS } from './site';

export type Section = (typeof SECTIONS)[number];

const filled = (text: string | undefined): text is string =>
  text !== undefined && text.trim() !== '';

// An award needs at least its hackathon name and placement to appear (AWARD-01).
export function awardsToShow(awards: readonly Award[]): Award[] {
  return awards.filter((a) => a.hackathon.trim() !== '' && a.placement.trim() !== '');
}

// The page anchor of an award. The prefix keeps it apart from project ids and section ids, which
// the page also uses as anchors.
export function awardId(award: Award): string {
  const slug = award.hackathon
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `award-${slug}`;
}

export type AwardFacts = { heading: string; byline: string | null; details: string[] };

// Only the facts the owner supplied; a missing or blank one is left out (AWARD-01).
export function awardFacts(award: Award): AwardFacts {
  const byline = [award.organizer, award.date].filter(filled).map((t) => t.trim());
  const team = teamLabel(award.teamSize);
  const details = [
    filled(award.project) ? `Project: ${award.project.trim()}` : null,
    filled(award.role) ? `My role: ${award.role.trim()}` : null,
    team,
  ].filter((d): d is string => d !== null);
  return {
    heading: `${award.placement.trim()}, ${award.hackathon.trim()}`,
    byline: byline.length > 0 ? byline.join(', ') : null,
    details,
  };
}

// The awards a project's badge links to, matched by project name (AWARD-02). Only awards that
// appear in the section count, so a badge never links to a missing anchor.
export function awardsForProject(project: Project, awards: readonly Award[]): Award[] {
  return awardsToShow(awards).filter((a) => a.project?.trim() === project.name);
}

// Navigation leaves out Awards while the section is hidden (AWARD-01).
export function sectionsFor(awards: readonly Award[]): readonly Section[] {
  const hasAwards = awardsToShow(awards).length > 0;
  return SECTIONS.filter((s) => s.id !== 'awards' || hasAwards);
}
