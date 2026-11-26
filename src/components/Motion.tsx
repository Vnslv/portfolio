'use client';

import { useEffect } from 'react';
import styles from './Motion.module.css';

// The windows after Welcome, and the award and project rows.
const SLIDES = 'main > section ~ section, main li[id]';
// What is still behind the taskbar has not been reached.
const REACHED = '0px 0px -64px';
const PIECES = 40;
const COLORS = ['--badge', '--link', '--title2', '--title'];

const moving = () => matchMedia('(prefers-reduced-motion: no-preference)').matches;

// "Once per visit" is a flag in the tab's session store. A blocked store is normal in private
// browsing and is not an error, so it fails quietly: the effect then plays once on each page load
// (lead decision, T14 ticket, 2026-11-26).
function played(key: string): boolean {
  try {
    return sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function remember(key: string): void {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // A blocked store: see above.
  }
}

// Decorative pixels inside the window, clipped to it.
function confetti(host: HTMLElement): HTMLElement {
  const layer = document.createElement('div');
  layer.className = styles.confetti ?? '';
  layer.setAttribute('data-confetti', '');
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < PIECES; i += 1) {
    const piece = document.createElement('i');
    piece.style.cssText = `left:${(i * 37) % 100}%;top:${(i % 5) * 8}px;background:var(${COLORS[i % COLORS.length]});--x:${((i % 7) - 3) * 12}px;--y:${80 + (i % 6) * 28}px`;
    layer.append(piece);
  }
  host.style.position = 'relative';
  host.append(layer);
  return layer;
}

// The part of the motion that needs script (MOTION-01 to MOTION-03). The rest is CSS. The markup
// is the startup box, which CSS alone shows and removes. Nothing here hides any content.
export function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const timers: number[] = [];
    const after = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));

    // The head script marks the first view of a visit. The first tap or key ends the opening.
    const endOpening = () => root.removeAttribute('data-opening');
    if (root.hasAttribute('data-opening')) {
      remember('opening');
      after(2000, endOpening);
    }
    window.addEventListener('pointerdown', endOpening);
    window.addEventListener('keydown', endOpening);

    const onVisibility = () => root.toggleAttribute('data-hidden', document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);

    const waiting = new WeakSet<Element>();
    const slides = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting) {
            waiting.add(target);
            continue;
          }
          slides.unobserve(target);
          // What is on the screen from the start stays as it is.
          if (!waiting.has(target) || !moving()) continue;
          endOpening();
          target.setAttribute('data-reveal', '');
          after(500, () => target.removeAttribute('data-reveal'));
        }
      },
      { rootMargin: REACHED },
    );
    document.querySelectorAll(SLIDES).forEach((el) => slides.observe(el));
    // A filter puts project rows back as new elements, which are reached like any other.
    const list = document.querySelector('#work ul');
    const rows = new MutationObserver((changes) => {
      for (const { addedNodes } of changes) {
        addedNodes.forEach((node) => {
          if (node instanceof HTMLLIElement) slides.observe(node);
        });
      }
    });
    if (list) rows.observe(list, { childList: true });

    const award = document.querySelector('#awards li');
    const awards = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        awards.disconnect();
        const host = award?.closest('section');
        if (!host || !moving() || played('confetti')) return;
        remember('confetti');
        const layer = confetti(host);
        after(500, () => layer.remove());
      },
      { rootMargin: REACHED, threshold: 0.5 },
    );
    if (award) awards.observe(award);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      slides.disconnect();
      rows.disconnect();
      awards.disconnect();
      window.removeEventListener('pointerdown', endOpening);
      window.removeEventListener('keydown', endOpening);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className={styles.boot} aria-hidden="true" data-boot="">
      Starting
      <span className={styles.bar}>
        <span className={styles.fill} />
      </span>
    </div>
  );
}
