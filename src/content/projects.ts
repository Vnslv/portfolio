import type { Project } from './types';

// Owner-supplied text (2026-11-25). No outcome, no images, no private links.
export const projects: readonly Project[] = [
  {
    id: 'alunsina',
    name: 'Alunsina',
    roles: ['project-management'],
    teamSize: 4,
    ready: true,
    problem:
      "Pet owners often can't quickly tell whether a food is toxic, whether symptoms need a vet, or where the nearest clinic is.",
    work: {
      line: 'Lead the capstone team building a smart pet companion mobile app:',
      points: [
        'NLP toxic-food detection and a symptom checker',
        'Vet finder using Haversine distance, plus appointment booking',
        'An @alunsina assistant that uses tool calling and suggests care schedules the owner approves',
        'Manage the thesis chapters, requirements and test cases',
      ],
    },
    links: [{ label: 'Landing page', url: 'https://alunsina-landing.vercel.app/' }],
  },
  {
    id: 'heronpay',
    name: 'HeronPay',
    roles: ['project-management'],
    teamSize: 3,
    ready: true,
    problem:
      'UMak campus payments are cash-heavy and slow, even though every student already carries an NFC-enabled UMak ID.',
    work: {
      line: 'Led the team building an offline-first NFC campus wallet:',
      points: [
        'Students pay by tapping their UMak ID (Web NFC)',
        'Payments settle through a smart contract on BNB Smart Chain, with gasless relayer transactions',
        'The wallet uses the tPHP ("Tagak PHP") stablecoin',
        'Isolation Forest anomaly detection flags suspicious payments',
      ],
    },
  },
  {
    id: 'ehanda',
    name: 'eHanda',
    roles: ['project-management'],
    teamSize: 5,
    ready: true,
    problem:
      'After a fire or other local disaster, barangay officials have no fast way to know which households were affected and what help they need.',
    work: {
      points: [
        'Wrote the PRD and the formal System Analysis and Design document for HANDA (Household Assessment and Needs Determination Application)',
        'Defined the flow: officials launch a check-in campaign, residents report their status and needs',
        'After a mentor review, added the fixes (household matching, offline workflow, role-based access, duplicate reports) and kept the scope to the barangay level',
      ],
    },
    stack: 'React, Vite, Supabase',
    links: [{ label: 'Live', url: 'https://e-handa.vercel.app/' }],
  },
  {
    id: 'idiya',
    name: 'Idiya',
    roles: ['software-development', 'project-management'],
    teamSize: 1,
    ownerRole: 'Full-stack developer and project manager',
    ready: true,
    problem:
      'Students and small teams juggle tasks, deadlines and files across different apps. Free tools rarely combine task dependencies, sprints and SDLC-style planning in one place.',
    work: {
      line: 'Designed and built a free, multi-team task platform on my own:',
      points: [
        'Board and Gantt timeline views, with drag-to-reschedule',
        'Enforced task dependencies; dependent tasks reschedule automatically when a blocker slips',
        'Sprints, plus templates for Kanban, Scrum, Waterfall, V-Model, Spiral and DevOps',
        'Google Drive attachments, and creating Google Docs or Sheets from a task',
        'IdiyaBot, an optional AI assistant (Groq/Gemini) that previews every change before applying it',
        'Google and GitHub sign-in, team invites, and a platform admin view that never sees team content',
      ],
    },
    stack: 'Next.js 15, TypeScript, Tailwind, Prisma, Neon Postgres, Auth.js',
    links: [{ label: 'Live', url: 'https://idiya.vercel.app/' }],
  },
  {
    id: 'umak-kalinga',
    name: 'UMak Kalinga',
    roles: ['software-development', 'project-management'],
    teamSize: 4,
    ready: true,
    problem:
      "UMak's CCED ran in-kind donation drives with no central place to post campaigns, track donations or keep donors informed.",
    work: {
      line: 'Co-led a two-platform system: a web admin module and mobile modules.',
      points: [
        'Built the React frontend: login, sign-up, three-step password reset, campaign feed, posting a campaign, explore, notifications and profile',
        'Owned the documentation: requirements, DFDs, test plan, traceability matrix (RTM), project charter and user manual',
      ],
    },
    stack: 'React, Vite, React Router',
  },
];
