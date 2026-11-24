#!/usr/bin/env node
// A change that touches code must also update an active plan's evidence.md.
// Usage (CI): BASE_SHA=<sha> node scripts/check-evidence.mjs
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const NON_CODE = [/^docs\//, /^\.github\//, /\.md$/, /^\.claude\//, /^scripts\/test\//];
const EVIDENCE = /^docs\/plans\/plan-(?!00-template\/)[^/]+\/evidence\.md$/;

export function isCodePath(path) {
  return !NON_CODE.some((pattern) => pattern.test(path));
}

export function checkEvidence(changedPaths) {
  const codeChanged = changedPaths.some(isCodePath);
  const evidenceChanged = changedPaths.some((path) => EVIDENCE.test(path));
  if (codeChanged && !evidenceChanged) {
    return ['Code changed but no docs/plans/<plan>/evidence.md was updated. Record what you ran and observed.'];
  }
  return [];
}

/** An app exists when package.json is in the tree now or was at the base. */
function hasApp(base) {
  if (existsSync('package.json')) return true;
  return execFileSync('git', ['ls-tree', '--name-only', base, '--', 'package.json'], { encoding: 'utf8' }).trim() !== '';
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = process.env.BASE_SHA || 'origin/main';
  if (!hasApp(base)) {
    console.log('check-evidence: skipped (no app yet)');
    process.exit(0);
  }
  const output = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' });
  const errors = checkEvidence(output.split('\n').filter(Boolean));
  for (const error of errors) console.error(error);
  if (errors.length) process.exit(1);
  console.log('check-evidence: ok');
}
