#!/usr/bin/env node
// Keeps agent context small: CLAUDE.md plus its imports stays within 200 lines,
// and every rule in .claude/rules/ is path-scoped so it loads only when needed.
// Usage: node scripts/check-context.mjs [root]
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { listMarkdown, stripFences } from './lib/md.mjs';

export const MAX_LINES = 200;
export const REQUIRED_RULES = ['testing.md', 'api-design.md', 'system-design.md', 'security.md', 'prd.md'];
const RULES_DIR = '.claude/rules';
const IMPORT = /(?:^|\s)@([\w./~-]+)/g;

const read = (path) => readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
const countLines = (text) => text.replace(/\n$/, '').split('\n').length;

export function checkBudget(root, max = MAX_LINES) {
  const entry = resolve(root, 'CLAUDE.md');
  if (!existsSync(entry)) return ['CLAUDE.md not found.'];
  const errors = [];
  const seen = new Set();
  let total = 0;
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const text = read(file);
    total += countLines(text);
    const prose = stripFences(text).replace(/`[^`\n]*`/g, '');
    for (const [, raw] of prose.matchAll(IMPORT)) {
      const target = raw.replace(/\.+$/, '');
      if (!target) continue;
      const path = resolve(dirname(file), target);
      if (existsSync(path)) {
        if (statSync(path).isFile()) visit(path);
      }
      else if (target.endsWith('.md')) errors.push(`CLAUDE.md import not found: ${target}`);
    }
  };
  visit(entry);
  if (total > max) {
    errors.push(`CLAUDE.md plus imports is ${total} lines (max ${max}). Move detail into ${RULES_DIR}/.`);
  }
  return errors;
}

function rulePaths(text) {
  const front = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  const block = front?.[1].match(/^paths:[ \t]*\n((?:[ \t]*-[ \t]*\S.*(?:\n|$))+)/m);
  if (!block) return [];
  return block[1].trimEnd().split('\n').map((line) => line.replace(/^\s*-\s*/, '').replace(/["']/g, '').trim());
}

export function checkRules(root, max = MAX_LINES) {
  const errors = REQUIRED_RULES
    .filter((name) => !existsSync(join(root, RULES_DIR, name)))
    .map((name) => `${RULES_DIR}/${name} is missing.`);
  const dir = join(root, RULES_DIR);
  if (!existsSync(dir)) return errors;
  for (const name of listMarkdown(dir)) {
    const label = `${RULES_DIR}/${name.replaceAll('\\', '/')}`;
    const text = read(join(dir, name));
    const paths = rulePaths(text);
    if (!paths.length || paths.some((p) => ['**', '**/*', '*'].includes(p))) {
      errors.push(`${label}: needs a "paths:" list in its frontmatter that does not match everything.`);
    }
    if (countLines(text) > max) errors.push(`${label}: ${countLines(text)} lines (max ${max}).`);
  }
  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] ?? '.';
  const errors = [...checkBudget(root), ...checkRules(root)];
  for (const error of errors) console.error(error);
  if (errors.length) process.exit(1);
  console.log('check-context: ok');
}
