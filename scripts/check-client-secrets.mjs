#!/usr/bin/env node
// Flags server-only env vars (not NEXT_PUBLIC_*) read inside 'use client' files.
// Usage: node scripts/check-client-secrets.mjs   (scans src/ and app/ when present)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ENV_READ = /process\.env(?:\.([A-Z_][A-Z0-9_]*)|\[\s*['"]([A-Z_][A-Z0-9_]*)['"]\s*\])/g;
const SOURCE = /\.(tsx?|jsx?|mjs)$/;

function isClientFile(text) {
  const body = text.replace(/^(\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/))*/, '').trimStart();
  return /^['"]use client['"]/.test(body);
}

export function findClientSecretUses(files) {
  const hits = [];
  for (const { path, text } of files) {
    if (!isClientFile(text)) continue;
    for (const match of text.matchAll(ENV_READ)) {
      const name = match[1] ?? match[2];
      if (!name.startsWith('NEXT_PUBLIC_') && name !== 'NODE_ENV') hits.push({ path, name });
    }
  }
  return hits;
}

function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (SOURCE.test(name)) out.push({ path: full, text: readFileSync(full, 'utf8') });
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = ['src', 'app'].filter((d) => existsSync(d)).flatMap((d) => collect(d));
  const hits = findClientSecretUses(files);
  for (const hit of hits) console.error(`${hit.path}: server-only env var ${hit.name} read in client code`);
  if (hits.length) process.exit(1);
  console.log('check-client-secrets: ok');
}
