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

const DEVICE_DARK = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();

// Listens for clicks and for the device setting changing on an open page.
function subscribe(listener: () => void) {
  listeners.add(listener);
  const query = matchMedia(DEVICE_DARK);
  query.addEventListener('change', listener);
  return () => {
    listeners.delete(listener);
    query.removeEventListener('change', listener);
  };
}

// The theme in force: data-theme (set by the head script or by a click), else the device setting.
function currentTheme(): Theme {
  const attr = document.documentElement.dataset['theme'] ?? null;
  return resolveTheme(isTheme(attr) ? attr : null, matchMedia(DEVICE_DARK).matches);
}

// The slot is always rendered and sized by invisible copies of both labels in one grid cell, so
// it never changes size when the button mounts or its label changes, whatever the font. Without
// JavaScript the toggle cannot work, so only the invisible copies are there.
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
      {(['light', 'dark'] as const).map((name) => (
        <span key={name} className={`button ${styles.ghost}`} aria-hidden="true">
          {toggleLabel(name)}
        </span>
      ))}
      {theme && (
        <button type="button" className="button" onClick={onClick}>
          {toggleLabel(theme)}
        </button>
      )}
    </span>
  );
}
