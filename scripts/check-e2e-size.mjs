#!/usr/bin/env node
// Warns when an E2E flow file grows past the size an agent can read in one pass.
// Always exits 0: this is a signal to split the flow, not a gate.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function oversizedFlows(files, max = 150) {
  return files.filter((file) => file.lines > max).map((file) => file.path);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = 'e2e/flows';
  const files = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.spec.ts'))
        .map((f) => ({ path: join(dir, f), lines: readFileSync(join(dir, f), 'utf8').split('\n').length }))
    : [];
  const big = oversizedFlows(files);
  for (const path of big) console.warn(`warning: ${path} is over 150 lines; split the flow.`);
  if (!big.length) console.log('check-e2e-size: ok');
}
