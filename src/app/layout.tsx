import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_TITLE } from '@/lib/site';

export const metadata: Metadata = {
  title: SITE_TITLE,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
