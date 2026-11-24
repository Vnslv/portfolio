import type { Metadata } from 'next';
import { IBM_Plex_Sans, Pixelify_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { SITE_TITLE } from '@/lib/site';
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
    <html lang="en" className={`${pixelify.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
