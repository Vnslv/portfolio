import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEvidence, isCodePath } from '../check-evidence.mjs';

test('code change without evidence fails', () => {
  assert.equal(checkEvidence(['src/a.ts']).length, 1);
});

test('code change with a plan evidence update passes', () => {
  assert.deepEqual(checkEvidence(['src/a.ts', 'docs/plans/plan-01-x/evidence.md']), []);
});

test('docs and CI only changes pass', () => {
  assert.deepEqual(checkEvidence(['README.md', '.github/workflows/ci.yml']), []);
});

test('isCodePath classifies paths', () => {
  assert.equal(isCodePath('docs/PRD.md'), false);
  assert.equal(isCodePath('.claude/hooks/x.mjs'), false);
  assert.equal(isCodePath('scripts/test/a.test.mjs'), false);
  assert.equal(isCodePath('app/page.tsx'), true);
  assert.equal(isCodePath('package.json'), true);
});

test('template evidence does not count', () => {
  assert.equal(checkEvidence(['src/a.ts', 'docs/plans/plan-00-template/evidence.md']).length, 1);
});

function evidenceRun(baseFiles, change) {
  const root = mkdtempSync(join(tmpdir(), 'ev-'));
  const git = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
  git('init');
  for (const name of baseFiles) writeFileSync(join(root, name), '{}');
  git('add', '-A');
  git('commit', '--allow-empty', '-m', 'base');
  const base = git('rev-parse', 'HEAD');
  change(root);
  git('add', '-A');
  git('commit', '-m', 'change');
  return spawnSync(process.execPath, [resolve('scripts/check-evidence.mjs')], { cwd: root, encoding: 'utf8', env: { ...process.env, BASE_SHA: base } });
}

test('evidence is not required before the app exists (the kit itself)', () => {
  const result = evidenceRun([], (root) => writeFileSync(join(root, 'tool.mjs'), 'x'));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /skipped/);
});

test('evidence is required once there is an app, even in the PR that adds or removes package.json', () => {
  const code = (root) => writeFileSync(join(root, 'tool.mjs'), 'x');
  assert.equal(evidenceRun(['package.json'], code).status, 1);
  assert.equal(evidenceRun([], (root) => { code(root); writeFileSync(join(root, 'package.json'), '{}'); }).status, 1);
  assert.equal(evidenceRun(['package.json'], (root) => { code(root); rmSync(join(root, 'package.json')); }).status, 1);
});
