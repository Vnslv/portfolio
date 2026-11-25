import type { Award } from './types';

// Dates, placements and images from the owner (2026-11-25).
export const awards: readonly Award[] = [
  {
    hackathon: 'Blockchain Campus Conference 2026',
    organizer: 'Binance Academy',
    placement: 'Champion',
    date: 'November 2026',
    project: 'HeronPay',
    role: 'Project manager',
    teamSize: 3,
    image: {
      src: '/images/bcc.jpg',
      small: '/images/bcc-small.webp',
      alt: 'Six people on stage under a screen that reads Your hackathon champion, HeronPay',
    },
  },
  {
    hackathon: 'UMak CCIS Infotechnolympics Hackathon',
    organizer: 'University of Makati',
    placement: 'Champion',
    date: 'October 2026',
    project: 'HeronHub',
    role: 'Project manager',
    teamSize: 3,
    image: {
      src: '/images/infotech.jpg',
      small: '/images/infotech-small.webp',
      alt: 'Three teammates wearing champion medals, one holding an Infotechnolympics 2026 envelope',
    },
  },
  {
    hackathon: 'eGovPH Hackathon 2026',
    organizer: 'eGovPH',
    placement: 'Top 30',
    date: 'July 2026',
    project: 'eHanda',
    role: 'Project manager',
    teamSize: 5,
    image: {
      src: '/images/egovph.jpg',
      small: '/images/egovph-small.webp',
      alt: 'Five teammates and three others on stage holding a check for the Top 30 eGovHackathon 2026 finalist teams',
    },
  },
];
