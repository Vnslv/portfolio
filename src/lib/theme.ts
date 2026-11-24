export type Theme = 'light' | 'dark';

export const THEME_KEY = 'theme';

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

// A stored choice wins, else the device setting, else light.
export function resolveTheme(stored: string | null, deviceDark: boolean | null | undefined): Theme {
  if (isTheme(stored)) return stored;
  return deviceDark ? 'dark' : 'light';
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'light' ? 'dark' : 'light';
}

// The toggle names the theme it switches to.
export function toggleLabel(theme: Theme): 'Dark theme' | 'Light theme' {
  return theme === 'light' ? 'Dark theme' : 'Light theme';
}

// Reading the property can throw when the browser blocks device storage.
export function getStorage<S>(win: { localStorage: S }): S | null {
  try {
    return win.localStorage;
  } catch {
    // Expected when storage is blocked: the site follows the device setting instead.
    return null;
  }
}

export function readStoredTheme(storage: ReadableStorage | null): string | null {
  try {
    return storage?.getItem(THEME_KEY) ?? null;
  } catch {
    // Expected when storage is blocked: no stored choice, so the device setting applies.
    return null;
  }
}

// False when the choice could not be kept; the page view still switches.
export function storeTheme(storage: WritableStorage | null, theme: Theme): boolean {
  try {
    if (!storage) return false;
    storage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    // Expected when storage is blocked: the choice lasts only for this page view.
    return false;
  }
}

// Runs in <head> before first paint. It sets data-theme only for a valid stored choice; with no
// choice, or blocked storage, the CSS follows the device setting.
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})()`;
