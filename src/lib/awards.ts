import type { Award } from '../content/types';

// An award needs at least its hackathon name and placement to appear (AWARD-01).
export function awardsToShow(awards: readonly Award[]): Award[] {
  return awards.filter((a) => a.hackathon.trim() !== '' && a.placement.trim() !== '');
}
