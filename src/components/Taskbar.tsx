'use client';

import { useEffect, useRef } from 'react';
import type { Section } from '../lib/awards';
import { SECTIONS } from '../lib/site';
import { Icon } from './Icon';
import { useCurrentSection } from './SectionNav';
import styles from './Taskbar.module.css';
import { ThemeToggle } from './ThemeToggle';

// hrefBase is "/" on pages that have no sections, so the links go to the home page. The sections
// default to all of them; the page leaves out Awards while it is hidden.
export function Taskbar({
  hrefBase = '',
  sections = SECTIONS,
}: {
  hrefBase?: string;
  sections?: readonly Section[];
}) {
  const current = useCurrentSection();
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);

  // The listener is always attached and reads the element itself, so it never waits for a
  // delayed toggle event or a React state update.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !details.current?.open) return;
      details.current.open = false;
      summary.current?.focus();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const label = SECTIONS.find((section) => section.id === current)?.label ?? '';

  return (
    <nav className={styles.bar} aria-label="Taskbar">
      {/* A details element, so the section links open and work without JavaScript. */}
      <details ref={details} className={styles.menu}>
        <summary ref={summary} className={`button ${styles.summary}`}>
          <Icon name="home" />
          Menu
        </summary>
        <div
          className={styles.panel}
          onClick={() => {
            if (details.current) details.current.open = false;
          }}
        >
          {sections.map((section) => (
            <a key={section.id} className="button" href={`${hrefBase}#${section.id}`}>
              <Icon name={section.icon} />
              {section.label}
            </a>
          ))}
        </div>
      </details>
      {sections.map((section) => (
        <a
          key={section.id}
          className={`button ${styles.section}`}
          href={`${hrefBase}#${section.id}`}
          aria-current={current === section.id ? 'true' : undefined}
        >
          {section.label}
        </a>
      ))}
      <span className={styles.now}>{label}</span>
      <ThemeToggle />
    </nav>
  );
}
