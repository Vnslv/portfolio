#!/usr/bin/env node
// Fails on broken relative links and unknown {{PLACEHOLDERS}} in Markdown.
// Usage: node scripts/check-docs.mjs [root]
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { listMarkdown, stripFences } from './lib/md.mjs';

const ALLOWED_PLACEHOLDERS = new Set(['{{PROJECT}}', '{{OWNER}}']);
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const EXTERNAL = /^(https?:|mailto:|#)/;

function read(root, file) {
  return stripFences(readFileSync(join(root, file), 'utf8'));
}

export function findBrokenLinks(root) {
  const broken = [];
  for (const file of listMarkdown(root)) {
    for (const [, target] of read(root, file).matchAll(LINK)) {
      if (EXTERNAL.test(target)) continue;
      const path = decodeURI(target.split('#')[0]);
      if (!path) continue;
      if (!existsSync(join(root, dirname(file), path))) broken.push({ file, link: target });
    }
  }
  return broken;
}

export function findStrayPlaceholders(root) {
  const stray = [];
  for (const file of listMarkdown(root)) {
    for (const [token] of read(root, file).matchAll(/\{\{[A-Z_]+\}\}/g)) {
      if (!ALLOWED_PLACEHOLDERS.has(token)) stray.push({ file, token });
    }
  }
  return stray;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] ?? '.';
  const problems = [
    ...findBrokenLinks(root).map((p) => `${p.file}: broken link ${p.link}`),
    ...findStrayPlaceholders(root).map((p) => `${p.file}: unknown placeholder ${p.token}`),
  ];
  for (const line of problems) console.error(line);
  if (problems.length) process.exit(1);
  console.log('check-docs: ok');
}
