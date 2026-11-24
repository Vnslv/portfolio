import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  THEME_KEY,
  getStorage,
  otherTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  themeInitScript,
  toggleLabel,
} from './theme';

// A storage that fails like a browser with device storage blocked.
const blocked = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

function memory(initial?: string) {
  const map = new Map<string, string>(initial === undefined ? [] : [[THEME_KEY, initial]]);
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

describe('THEME-01 theme choice', () => {
  it('a stored choice wins over the device setting', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('without a stored choice the device setting decides', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('with neither, or a stored value that is not a theme, the result is light', () => {
    expect(resolveTheme(null, null)).toBe('light');
    expect(resolveTheme('blue', undefined)).toBe('light');
    expect(resolveTheme('blue', true)).toBe('dark');
  });

  it('the toggle names the theme it switches to', () => {
    expect(otherTheme('light')).toBe('dark');
    expect(otherTheme('dark')).toBe('light');
    expect(toggleLabel('light')).toBe('Dark theme');
    expect(toggleLabel('dark')).toBe('Light theme');
  });
});

describe('THEME-01 device storage', () => {
  it('reads what was stored, and null when nothing or storage is blocked', () => {
    expect(readStoredTheme(memory('dark'))).toBe('dark');
    expect(readStoredTheme(memory())).toBeNull();
    expect(readStoredTheme(blocked)).toBeNull();
    expect(readStoredTheme(null)).toBeNull();
  });

  it('stores the choice, and reports false instead of throwing when blocked', () => {
    const storage = memory();
    expect(storeTheme(storage, 'dark')).toBe(true);
    expect(readStoredTheme(storage)).toBe('dark');
    expect(storeTheme(blocked, 'dark')).toBe(false);
    expect(storeTheme(null, 'dark')).toBe(false);
  });

  it('getStorage returns the storage, or null when merely reading it throws', () => {
    const storage = memory();
    expect(getStorage({ localStorage: storage })).toBe(storage);
    const denied = {
      get localStorage(): never {
        throw new Error('SecurityError');
      },
    };
    expect(getStorage(denied)).toBeNull();
  });
});

describe('THEME-01 first-paint script', () => {
  function run(storage: unknown) {
    const root: { dataset: Record<string, string> } = { dataset: {} };
    runInNewContext(themeInitScript, {
      localStorage: storage,
      document: { documentElement: root },
    });
    return root.dataset['theme'];
  }

  it('sets the stored theme before first paint', () => {
    expect(run(memory('dark'))).toBe('dark');
    expect(run(memory('light'))).toBe('light');
  });

  it('sets nothing when there is no valid choice or storage is blocked', () => {
    expect(run(memory())).toBeUndefined();
    expect(run(memory('blue'))).toBeUndefined();
    expect(run(blocked)).toBeUndefined();
  });
});
