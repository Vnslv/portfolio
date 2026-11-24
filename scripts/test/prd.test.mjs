import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrdIds, extractIds, checkPr, checkPlans } from '../lib/prd.mjs';

const PRD = [
  '# PRD',
  '### AUTH-01: Sign in',
  '### NFR-02: Rate limit',
  '```md',
  '### XX-01: Example',
  '```',
].join('\n');

test('parsePrdIds reads headings outside code fences only', () => {
  assert.deepEqual([...parsePrdIds(PRD)].sort(), ['AUTH-01', 'NFR-02']);
});

test('extractIds dedupes in order', () => {
  assert.deepEqual(extractIds('AUTH-01, PAY-09 and AUTH-01'), ['AUTH-01', 'PAY-09']);
});

test('checkPr names the unknown ID', () => {
  const errors = checkPr({ prdText: PRD, prBody: 'Implements AUTH-01, PAY-09', prTitle: 'feat: pay' });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /PAY-09/);
});

test('checkPr allows PRD: none for docs, chore, ci, build titles', () => {
  for (const type of ['docs', 'chore', 'ci', 'build']) {
    assert.deepEqual(checkPr({ prdText: PRD, prBody: 'PRD: none', prTitle: `${type}: fix typo` }), []);
  }
  assert.deepEqual(checkPr({ prdText: PRD, prBody: 'PRD: none', prTitle: 'docs(readme): fix' }), []);
});

test('checkPr rejects PRD: none on a feature PR', () => {
  assert.equal(checkPr({ prdText: PRD, prBody: 'PRD: none', prTitle: 'feat: x' }).length, 1);
});

test('checkPr requires at least one ID', () => {
  assert.equal(checkPr({ prdText: PRD, prBody: 'no ids here', prTitle: 'fix: y' }).length, 1);
});

test('checkPlans flags an ID missing from the PRD', () => {
  const errors = checkPlans({
    prdText: PRD,
    planTexts: [
      { path: 'docs/plans/plan-01-a/plan.md', text: '**PRD IDs:** AUTH-01, AUTH-02' },
      { path: 'docs/plans/plan-02-b/plan.md', text: '**PRD IDs:** NFR-02' },
    ],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /plan-01-a.*AUTH-02/);
});
