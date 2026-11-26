import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Motion } from './Motion';
import styles from './Motion.module.css';

describe('Motion: the startup box (MOTION-01, T14 ticket)', () => {
  const html = renderToStaticMarkup(<Motion />);

  it('is one "Starting" line with its bar, hidden from assistive technology', () => {
    expect(html).toMatch(/^<div[^>]*aria-hidden="true"/);
    expect(html).toMatch(/^<div[^>]*data-boot=""/);
    // The whole markup, so the only text is "Starting" and nothing else is in the box.
    expect(html).toBe(
      `<div class="${styles.boot}" aria-hidden="true" data-boot="">Starting<span class="${styles.bar}"><span class="${styles.fill}"></span></span></div>`,
    );
  });

  it('adds no section, heading or control to the page', () => {
    expect(html).not.toMatch(/<(section|h[1-6]|a|button|input|dialog)[ >]/);
    expect(html).not.toContain('tabindex');
    expect(html).not.toContain('role=');
  });
});
