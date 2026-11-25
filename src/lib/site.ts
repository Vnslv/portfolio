import { profile } from '../content/profile';

// The browser tab title is the owner's name (T04 ticket).
export const SITE_TITLE = profile.name;

// SITE-01: the sections in page order. Labels and icons are from the design board. The work
// section reads "Projects" and keeps its #work address (T12 ticket).
export const SECTIONS = [
  { id: 'welcome', label: 'Welcome', icon: 'home' },
  { id: 'awards', label: 'Awards', icon: 'trophy' },
  { id: 'work', label: 'Projects', icon: 'folder' },
  { id: 'links', label: 'Links', icon: 'link' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

export function copyrightLine(name: string): string {
  return `© 2026 ${name}`;
}
