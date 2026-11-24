export type Role = 'software-development' | 'project-management';
export type RoleFilter = 'all' | Role;

export type ProjectLink = { label: string; url: string };
export type ProjectImage = { src: string; alt: string };

type ProjectBase = {
  id: string;
  name: string;
  roles: readonly Role[];
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
};

export type Profile = {
  name: string;
  intro: string;
  about: string;
  github: string;
  linkedin: string;
  photo?: ProjectImage;
  cvUrl?: string;
};
