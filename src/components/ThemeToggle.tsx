'use client';

import { useSyncExternalStore } from 'react';
import {
  getStorage,
  isTheme,
  otherTheme,
  resolveTheme,
  storeTheme,
  toggleLabel,
  type Theme,
} from '@/lib/theme';
import styles from './ThemeToggle.module.css';

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// The theme in force: data-theme (set by the head script or by a click), else the device setting.
function currentTheme(): Theme {
  const attr = document.documentElement.dataset['theme'] ?? null;
  return resolveTheme(
    isTheme(attr) ? attr : null,
    matchMedia('(prefers-color-scheme: dark)').matches,
  );
}

// The slot is always rendered, so the button mounting later shifts nothing. Without JavaScript
// the toggle cannot work, so only the empty slot shows.
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, currentTheme, () => null);

  function onClick() {
    if (!theme) return;
    const next = otherTheme(theme);
    document.documentElement.dataset['theme'] = next;
    // If storage is blocked the choice lasts for this page view only.
    storeTheme(getStorage(window), next);
    listeners.forEach((listener) => listener());
  }

  return (
    <span className={styles.slot} data-theme-slot="">
      {theme && (
        <button type="button" className={`button ${styles.toggle}`} onClick={onClick}>
          {toggleLabel(theme)}
        </button>
      )}
    </span>
  );
}
