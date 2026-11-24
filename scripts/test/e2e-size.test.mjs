import { test } from 'node:test';
import assert from 'node:assert/strict';
import { oversizedFlows } from '../check-e2e-size.mjs';

test('flags flows over the max', () => {
  const files = [
    { path: 'e2e/flows/a.spec.ts', lines: 151 },
    { path: 'e2e/flows/b.spec.ts', lines: 150 },
  ];
  assert.deepEqual(oversizedFlows(files), ['e2e/flows/a.spec.ts']);
});

test('respects a custom max', () => {
  assert.deepEqual(oversizedFlows([{ path: 'x', lines: 20 }], 10), ['x']);
});
