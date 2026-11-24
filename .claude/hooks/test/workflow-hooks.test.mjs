import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { activePlan, briefFor } from '../session-brief.mjs';
import { shouldRunDone } from '../done-check.mjs';
import { binPath, shouldLint } from '../lint-file.mjs';

function repo(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'kit-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

const plans = {
  'docs/plans/plan-00-template/gate.md': '**Status:** Planned',
  'docs/plans/plan-01-a/gate.md': '**Status:** Complete',
  'docs/plans/plan-02-b/gate.md': '**Status:** In progress',
  'docs/plans/plan-02-b/plan.md': '- [x] T01 done (AUTH-01)\n- [ ] T02 next thing (AUTH-02)\n- [ ] T03 later',
  'docs/plans/plan-02-b/evidence.md': '| date | task |\n| --- | --- |\n| 2026-11-01 | T01 passed |',
};

test('shouldRunDone skips on stop-hook re-entry', () => {
  const root = repo({ 'package.json': '{"scripts":{"check":"x"}}' });
  assert.equal(shouldRunDone({ stop_hook_active: true }, root).run, false);
});

test('shouldRunDone skips with a note when there is no check script', () => {
  const result = shouldRunDone({}, repo());
  assert.equal(result.run, false);
  assert.match(result.note, /No pnpm check/);
  assert.equal(shouldRunDone({}, repo({ 'package.json': '{"scripts":{}}' })).run, false);
});

test('shouldRunDone runs when a check script exists', () => {
  assert.equal(shouldRunDone({}, repo({ 'package.json': '{"scripts":{"check":"x"}}' })).run, true);
});

test('shouldRunDone skips when no code changed (e.g. the agent only answered a question)', () => {
  const root = repo({ 'package.json': '{"scripts":{"check":"x"}}' });
  assert.equal(shouldRunDone({}, root, []).run, false);
  assert.equal(shouldRunDone({}, root, ['docs/plans/plan-01-a/plan.md']).run, false);
  assert.equal(shouldRunDone({}, root, ['src/a.ts']).run, true);
});

test('activePlan picks the highest open plan and ignores the template', () => {
  assert.equal(activePlan(repo(plans)), 'docs/plans/plan-02-b');
  assert.equal(activePlan(repo({ 'docs/plans/plan-00-template/gate.md': '**Status:** Planned' })), null);
});

test('briefFor shows the plan, first open task, and last evidence row', () => {
  const brief = briefFor(repo(plans));
  assert.match(brief, /plan-02-b/);
  assert.match(brief, /T02 next thing/);
  assert.match(brief, /T01 passed/);
  assert.doesNotMatch(brief, /T03/);
});

test('briefFor without an active plan points to grill-spec', () => {
  assert.match(briefFor(repo()), /No active plan/);
});

test('shouldLint needs package.json and a lintable extension', () => {
  const withPkg = repo({ 'package.json': '{}' });
  assert.equal(shouldLint('src/a.ts', withPkg), true);
  assert.equal(shouldLint('src/a.png', withPkg), false);
  assert.equal(shouldLint('src/a.ts', repo()), false);
  assert.equal(shouldLint('', withPkg), false);
});

const hook = (name, root, input, bin = root) =>
  spawnSync(process.execPath, [resolve('.claude/hooks', name)], {
    cwd: root, encoding: 'utf8', input: JSON.stringify(input),
    env: { ...process.env, CLAUDE_PROJECT_DIR: root, PATH: bin + delimiter + process.env.PATH },
  });

const tool = (name, code) => ({
  ['node_modules/' + name + '/package.json']: JSON.stringify({ bin: { [name]: 'bin.cjs' } }),
  ['node_modules/' + name + '/bin.cjs']: code,
});

test('binPath finds a tool script and returns null when it is not installed', () => {
  const root = repo(tool('eslint', ''));
  assert.equal(binPath(root, 'eslint'), join(root, 'node_modules/eslint', 'bin.cjs'));
  assert.equal(binPath(root, 'prettier'), null);
});

test('lint-file runs the tools on this platform, with odd file names kept intact', () => {
  const root = repo({
    'package.json': '{}', 'src/a & b.ts': 'x',
    ...tool('prettier', ''),
    ...tool('eslint', "console.log('SEEN ' + process.argv.at(-1)); process.exit(require('fs').existsSync('ok') ? 0 : 1);"),
  });
  const input = { tool_input: { file_path: 'src/a & b.ts' } };
  const bad = hook('lint-file.mjs', root, input);
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /SEEN src\/a & b\.ts/);
  writeFileSync(join(root, 'ok'), '');
  assert.equal(hook('lint-file.mjs', root, input).status, 0);
});

test('lint-file says so when eslint is not installed', () => {
  const root = repo({ 'package.json': '{}', 'a.ts': 'x' });
  const result = hook('lint-file.mjs', root, { tool_input: { file_path: 'a.ts' } });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /eslint is not installed/);
});

test('done-check runs pnpm on this platform and reports its result', () => {
  const root = repo({
    'package.json': '{"name":"x","scripts":{"check":"node check.cjs"}}',
    'src/a.ts': 'x',
    'stub/pnpm.cmd': '@echo CHECK RAN %1\r\n@exit /b 1\r\n',
    'stub/pnpm': '#!/bin/sh\necho CHECK RAN $1\nexit 1\n',
  });
  const git = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd: root, stdio: 'pipe' });
  git('init');
  git('commit', '--allow-empty', '-m', 'x');
  chmodSync(join(root, 'stub/pnpm'), 0o755);
  const result = hook('done-check.mjs', root, {}, join(root, 'stub'));
  assert.equal(result.status, 2);
  assert.match(result.stderr, /CHECK RAN check/);
});
