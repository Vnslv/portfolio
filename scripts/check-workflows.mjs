#!/usr/bin/env node
// Line-based "no slop" lint for GitHub Actions workflows. No YAML parser needed.
// Usage: node scripts/check-workflows.mjs   (scans .github/workflows/*.yml)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PINNED = /@[0-9a-f]{40}(\s|$)/;

function jobBlocks(lines) {
  const start = lines.findIndex((line) => /^jobs:\s*$/.test(line));
  if (start < 0) return [];
  const jobs = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i])) break;
    const head = lines[i].match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (head) jobs.push({ name: head[1], lines: [] });
    else if (jobs.length) jobs.at(-1).lines.push(lines[i]);
  }
  return jobs;
}

export function lintWorkflow(yamlText) {
  const lines = yamlText.split('\n');
  const errors = [];
  if (!lines.some((line) => /^permissions:/.test(line))) errors.push('missing top-level permissions:');
  lines.forEach((line, i) => {
    const code = line.replace(/\s#.*$/, '');
    const uses = code.match(/^\s*(?:-\s*)?uses:\s*(\S+)/);
    if (uses && !uses[1].startsWith('./') && !PINNED.test(uses[1] + ' ')) {
      errors.push(`line ${i + 1}: ${uses[1]} is not pinned to a full commit SHA`);
    }
    if (/continue-on-error:/.test(code)) errors.push(`line ${i + 1}: continue-on-error is banned`);
    if (/\|\|\s*true\b/.test(code)) errors.push(`line ${i + 1}: "|| true" is banned`);
  });
  for (const job of jobBlocks(lines)) {
    const reusable = job.lines.some((line) => /^ {4}uses:/.test(line));
    if (!reusable && !job.lines.some((line) => /^ {4}timeout-minutes:/.test(line))) {
      errors.push(`job ${job.name}: missing timeout-minutes`);
    }
  }
  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = '.github/workflows';
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)) : [];
  const errors = files.flatMap((f) => lintWorkflow(readFileSync(join(dir, f), 'utf8')).map((e) => `${f}: ${e}`));
  for (const error of errors) console.error(error);
  if (errors.length) process.exit(1);
  console.log(`check-workflows: ok (${files.length} files)`);
}
