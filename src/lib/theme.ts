export type Theme = 'light' | 'dark';

export const THEME_KEY = 'theme';

const BLOCKED_MESSAGE = 'theme: device storage is blocked, so the site follows the device setting';
const NOT_SAVED_MESSAGE = 'theme: could not save the choice, so it lasts for this page view only';

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
    // Expected when storage is blocked: logged, then the site follows the device setting.
    console.warn(BLOCKED_MESSAGE);
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
    // Expected when storage is blocked: logged, and the choice lasts only for this page view.
    console.warn(NOT_SAVED_MESSAGE);
    return false;
  }
}

// Runs in <head> before first paint. It sets data-theme only for a valid stored choice; with no
// choice, or blocked storage, the CSS follows the device setting.
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){console.warn(${JSON.stringify(BLOCKED_MESSAGE)})}})()`;
