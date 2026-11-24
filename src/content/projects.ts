import type { Project } from './types';

// Problem, work and outcome are not supplied yet, so every project is "Coming soon".
export const projects: readonly Project[] = [
  {
    id: 'alunsina',
    name: 'Alunsina',
    roles: ['project-management'],
    ready: false,
  },
  {
    id: 'heronpay',
    name: 'HeronPay',
    roles: ['project-management'],
    ready: false,
  },
  {
    id: 'ehanda',
    name: 'eHanda',
    roles: ['project-management'],
    ready: false,
  },
  {
    id: 'taskvane',
    name: 'Taskvane',
    roles: ['software-development', 'project-management'],
    teamSize: 1,
    ownerRole: 'Full-stack developer and project manager',
    ready: false,
  },
  {
    id: 'umak-kalinga',
    name: 'UMak Kalinga',
    roles: ['software-development', 'project-management'],
    ready: false,
  },
];
