import type { Metadata } from 'next';
import { IBM_Plex_Sans, Pixelify_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { SITE_TITLE } from '@/lib/site';
import { themeInitScript } from '@/lib/theme';
import './tokens.css';

const pixelify = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-pixelify',
  display: 'swap',
  preload: false,
});

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-plex',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: SITE_TITLE,
};

// MOTION-01: marks the first view of a visit before the first paint, so the opening neither starts
// late nor plays again. A constant string. It reads one session flag, which the motion component
// sets, and nothing else; a blocked store counts as a first view. With reduced motion set, or on a
// page without the opening, the mark does nothing. A blocked store is logged here, because the
// motion component does not run on every page, or at all if the page scripts fail; the second mark
// keeps the component from logging it again.
const openingScript = `(function(){var d=document.documentElement;try{if(sessionStorage.getItem('opening'))return}catch(e){console.warn('motion: session storage is blocked, so the opening and confetti play on each load');d.setAttribute('data-storage-warned','')}d.setAttribute('data-opening','')})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The head scripts set data-theme and data-opening before React hydrates, so the attributes differ on purpose.
    <html lang="en" className={`${pixelify.variable} ${plex.variable}`} suppressHydrationWarning>
      <head>
        {/* A constant string from src/lib/theme.ts, never visitor input. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: openingScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
