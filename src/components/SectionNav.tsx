'use client';

import { useSyncExternalStore } from 'react';
import type { Section } from '../lib/awards';
import { SECTIONS, type SectionId } from '../lib/site';
import { Icon } from './Icon';
import styles from './SectionNav.module.css';

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

// Ported from the design board: the last section whose top has passed 40% of the viewport.
// Where two sections share a top (About and Links side by side), the earlier one wins.
function currentSnapshot(): SectionId | null {
  // A page without the sections (the not-found page) marks nothing current.
  if (!document.getElementById(SECTIONS[0].id)) return null;
  const viewport = window.innerHeight;
  let current: SectionId = SECTIONS[0].id;
  let best = -Infinity;
  for (const section of SECTIONS) {
    const el = document.getElementById(section.id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top;
    if (top < viewport * 0.4 && top > best) {
      best = top;
      current = section.id;
    }
  }
  const atBottom = viewport + window.scrollY >= document.documentElement.scrollHeight - 4;
  return atBottom ? (SECTIONS[SECTIONS.length - 1]?.id ?? current) : current;
}

// Null on the server and without JavaScript, so no section is ever marked current by mistake.
export function useCurrentSection(): SectionId | null {
  return useSyncExternalStore(subscribe, currentSnapshot, () => null);
}

// The sections to list default to all of them; the page leaves out Awards while it is hidden.
export function SectionNav({ sections = SECTIONS }: { sections?: readonly Section[] }) {
  const current = useCurrentSection();
  return (
    <nav className={styles.tree} aria-label="Sections">
      <p className={styles.title}>
        <Icon name="folder" />
        Contents
      </p>
      <div className={styles.body}>
        {sections.map((section) => (
          <a
            key={section.id}
            className={`button ${styles.link}`}
            href={`#${section.id}`}
            aria-current={current === section.id ? 'true' : undefined}
          >
            <Icon name={section.icon} />
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
