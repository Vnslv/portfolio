export type Role = 'software-development' | 'project-management';
export type RoleFilter = 'all' | Role;

export type ProjectLink = { label: string; url: string };
// `small` is an optional smaller copy of the same picture (same ratio) for the visible picture;
// `src` stays the full image that a link opens, and the picture's fallback when `small` is absent.
export type ProjectImage = { src: string; small?: string; alt: string };

type ProjectBase = {
  id: string;
  name: string;
  // Which filters list the project (WORK-02).
  roles: readonly Role[];
  // The role label the project shows (WORK-01).
  roleLabel: string;
  teamSize?: number;
  // The owner's own role wording, only where the owner supplied it (WORK-05).
  ownerRole?: string;
};

// What the owner did: an optional lead-in line, then the points (WORK-03).
export type ProjectWork = { line?: string; points: readonly string[] };

// A project that is not ready has no problem or work fields at all (WORK-06).
export type ComingSoonProject = ProjectBase & { ready: false };

export type ReadyProject = ProjectBase & {
  ready: true;
  problem: string;
  work: ProjectWork;
  stack?: string;
  links?: readonly ProjectLink[];
  images?: readonly ProjectImage[];
};

export type Project = ComingSoonProject | ReadyProject;

export type Award = {
  hackathon: string;
  placement: string;
  organizer?: string;
  date?: string;
  project?: string;
  role?: string;
  teamSize?: number;
  // Owner-supplied proof image with its text description (AWARD-03).
  image?: ProjectImage;
};

// A piece (TOOL-01) shows the brand's logo, a symbol in public/images/tools.svg, where the brand
// allows it, and otherwise a two-letter tile: 20 rows of 20 characters, "#" filled.
export type Tool = { name: string } & ({ logo: string } | { tile: readonly string[] });

// The tools board: its wording, and the groups with their tools in path order.
export type ToolBoard = {
  lead: string;
  prompt: { title: string; text: string };
  start: string;
  finish: string;
  // The notices the logos need, under the board.
  credit: string;
  groups: readonly { name: string; tools: readonly Tool[] }[];
};

export type Profile = {
  name: string;
  intro: string;
  // Text the owner has not supplied is a labeled placeholder (SITE-02).
  about?: string;
  github: string;
  // A link the owner has not supplied is a labeled placeholder, never an invented address.
  linkedin?: string;
  photo?: ProjectImage;
  cvUrl?: string;
};
