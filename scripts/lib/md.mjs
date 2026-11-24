// Shared Markdown helpers for the kit's check scripts. Node built-ins only.
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SKIP_DIRS = new Set(['.git', 'node_modules']);

/** Replace fenced code blocks with blank lines so line numbers stay stable. */
export function stripFences(text) {
  let inFence = false;
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return '';
      }
      return inFence ? '' : line;
    })
    .join('\n');
}

/** All .md files under root, as paths relative to root. */
export function listMarkdown(root) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.md')) out.push(relative(root, full));
    }
  };
  walk(root);
  return out.sort();
}
