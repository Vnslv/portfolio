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
});

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: SITE_TITLE,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme is set by the head script before React hydrates, so the attributes differ on purpose.
    <html lang="en" className={`${pixelify.variable} ${plex.variable}`} suppressHydrationWarning>
      <head>
        {/* A constant string from src/lib/theme.ts, never visitor input. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
