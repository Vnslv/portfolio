#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): format and lint the edited file; errors go back to the agent.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { field, isMain, readHookInput } from './lib/input.mjs';

const LINTABLE = /\.(tsx?|jsx?|mjs|cjs|css|md|json)$/;
const ESLINT = /\.(tsx?|jsx?|mjs|cjs)$/;

export function shouldLint(path, root) {
  return Boolean(path) && LINTABLE.test(path) && existsSync(join(root, 'package.json'));
}

/** A dev tool's script, run with node: no shell, so it works on Windows and with any file name. */
export function binPath(root, name) {
  const dir = join(root, 'node_modules', name);
  const pkg = join(dir, 'package.json');
  if (!existsSync(pkg)) return null;
  const { bin } = JSON.parse(readFileSync(pkg, 'utf8'));
  const script = typeof bin === 'string' ? bin : bin?.[name];
  return script ? join(dir, script) : null;
}

if (isMain(import.meta.url)) {
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const path = field(await readHookInput(), 'file_path');
  if (!shouldLint(path, root)) process.exit(0);
  const run = (bin, args) => spawnSync(process.execPath, [bin, ...args], { cwd: root, encoding: 'utf8' });
  const prettier = binPath(root, 'prettier');
  if (prettier) run(prettier, ['--write', path]);
  if (ESLINT.test(path)) {
    const eslint = binPath(root, 'eslint');
    if (!eslint) {
      process.stderr.write('eslint is not installed; run pnpm install.\n');
      process.exit(2);
    }
    const lint = run(eslint, ['--fix', path]);
    if (lint.status !== 0) {
      process.stderr.write(`Lint errors in ${path}:\n${lint.stdout}${lint.stderr}\n`);
      process.exit(2);
    }
  }
  process.exit(0);
}
