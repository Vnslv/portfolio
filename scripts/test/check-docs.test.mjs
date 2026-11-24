import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findBrokenLinks, findStrayPlaceholders } from '../check-docs.mjs';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'docs-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}

test('findBrokenLinks reports only missing relative targets', () => {
  const dir = fixture({
    'a.md': '[ok](b.md) [missing](c.md) [web](https://x.dev) [anchor](#top) [mail](mailto:a@b.c)',
    'b.md': '# B',
  });
  assert.deepEqual(findBrokenLinks(dir), [{ file: 'a.md', link: 'c.md' }]);
});

test('findBrokenLinks strips anchors from file links', () => {
  const dir = fixture({ 'a.md': '[x](b.md#part)', 'b.md': '# B' });
  assert.deepEqual(findBrokenLinks(dir), []);
});

test('findBrokenLinks ignores links inside fenced code', () => {
  const dir = fixture({ 'a.md': '```md\n[x](nope.md)\n```\n' });
  assert.deepEqual(findBrokenLinks(dir), []);
});

test('findStrayPlaceholders flags unknown tokens and allows PROJECT and OWNER', () => {
  const dir = fixture({ 'a.md': '{{PROJECT}} {{OWNER}} {{CHECK_CMD}}' });
  assert.deepEqual(findStrayPlaceholders(dir), [{ file: 'a.md', token: '{{CHECK_CMD}}' }]);
});
