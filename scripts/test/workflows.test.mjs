import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintWorkflow } from '../check-workflows.mjs';

const ok = [
  'name: ci',
  'on: [pull_request]',
  'permissions:',
  '  contents: read',
  'jobs:',
  '  build:',
  '    runs-on: ubuntu-latest',
  '    timeout-minutes: 10',
  '    steps:',
  '      - uses: actions/checkout@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa # v4.2.2',
  '      - uses: ./.github/actions/local',
  '      - run: pnpm build',
].join('\n');

test('a clean workflow passes', () => {
  assert.deepEqual(lintWorkflow(ok), []);
});

test('flags a tag-pinned action', () => {
  const errors = lintWorkflow(ok.replace('@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '@v4'));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /actions\/checkout@v4/);
});

test('flags a job without timeout-minutes', () => {
  assert.match(lintWorkflow(ok.replace('    timeout-minutes: 10\n', '')).join(), /build.*timeout-minutes/);
});

test('flags continue-on-error and || true', () => {
  const bad = ok.replace('pnpm build', 'pnpm build || true') + '\n        continue-on-error: true';
  assert.equal(lintWorkflow(bad).length, 2);
});

test('flags missing top-level permissions', () => {
  assert.match(lintWorkflow(ok.replace('permissions:\n  contents: read\n', '')).join(), /permissions/);
});

test('reusable-workflow jobs (uses at job level) need no timeout', () => {
  const reuse = ok + '\n  call:\n    uses: org/repo/.github/workflows/x.yml@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  assert.deepEqual(lintWorkflow(reuse), []);
});
