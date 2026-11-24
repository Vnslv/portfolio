'use client';

import { useEffect, useRef, useState } from 'react';
import { SECTIONS } from '@/lib/site';
import { Icon } from './Icon';
import { useCurrentSection } from './SectionNav';
import styles from './Taskbar.module.css';

export function Taskbar() {
  const current = useCurrentSection();
  const [open, setOpen] = useState(false);
  const summary = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      summary.current?.focus();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const label = SECTIONS.find((section) => section.id === current)?.label ?? '';

  return (
    <nav className={styles.bar} aria-label="Taskbar">
      {/* A details element, so the section links open and work without JavaScript. */}
      <details
        className={styles.menu}
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary ref={summary} className={`button ${styles.summary}`}>
          <Icon name="home" />
          Menu
        </summary>
        <div className={styles.panel} onClick={() => setOpen(false)}>
          {SECTIONS.map((section) => (
            <a key={section.id} className="button" href={`#${section.id}`}>
              <Icon name={section.icon} />
              {section.label}
            </a>
          ))}
        </div>
      </details>
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          className={`button ${styles.section}`}
          href={`#${section.id}`}
          aria-current={current === section.id ? 'true' : undefined}
        >
          {section.label}
        </a>
      ))}
      <span className={styles.now}>{label}</span>
    </nav>
  );
}
