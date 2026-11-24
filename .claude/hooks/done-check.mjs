#!/usr/bin/env node
// Stop: before the agent says "done", pnpm check must pass and evidence must be recorded.
// Exit 2 sends the agent back to work with the reason.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkEvidence, isCodePath } from '../../scripts/check-evidence.mjs';
import { isMain, readHookInput } from './lib/input.mjs';

/** changed: uncommitted paths; when given and none is code, there is nothing to check. */
export function shouldRunDone(input, root, changed = null) {
  if (input?.stop_hook_active) return { run: false };
  if (changed && !changed.some(isCodePath)) return { run: false };
  const pkgPath = join(root, 'package.json');
  const scripts = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')).scripts ?? {} : {};
  if (!scripts.check) return { run: false, note: 'No pnpm check yet; skipped (scaffold the stack first).' };
  return { run: true };
}

function changedPaths(root) {
  const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
  return [...git(['diff', '--name-only', 'HEAD']), ...git(['ls-files', '--others', '--exclude-standard'])];
}

if (isMain(import.meta.url)) {
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const changed = changedPaths(root);
  const decision = shouldRunDone(await readHookInput(), root, changed);
  if (!decision.run) {
    if (decision.note) console.log(decision.note);
    process.exit(0);
  }
  // pnpm is a .cmd file on Windows, which needs a shell. The command is constant, so this is safe.
  const check = spawnSync('pnpm check', { cwd: root, encoding: 'utf8', shell: true });
  if (check.status !== 0) {
    const tail = `${check.stdout}${check.stderr}`.split('\n').slice(-30).join('\n');
    process.stderr.write(`pnpm check failed. Fix it before finishing:\n${tail}\n`);
    process.exit(2);
  }
  const errors = checkEvidence(changed);
  if (errors.length) {
    process.stderr.write(`${errors.join('\n')}\n`);
    process.exit(2);
  }
  process.exit(0);
}
