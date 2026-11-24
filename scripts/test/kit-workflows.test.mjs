// The kit's own workflows must stay green before the stack is scaffolded (no package.json yet).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function jobs(file) {
  const text = readFileSync(`.github/workflows/${file}`, 'utf8').replaceAll('\r\n', '\n');
  const body = text.slice(text.indexOf('\njobs:'));
  return body.split(/\n(?= {2}[a-z][\w-]*:\n)/).slice(1).map((block) => ({
    name: block.match(/^ {2}([\w-]+):/)[1],
    block,
  }));
}

for (const file of ['ci.yml', 'compliance.yml']) {
  test(`${file}: every job that needs the app is gated on detect`, () => {
    for (const { name, block } of jobs(file)) {
      if (!/pnpm|osv-scanner/.test(block)) continue;
      assert.match(block, /needs:\s*\[?[^\n]*\bdetect\b/, `${file} job ${name} must need detect`);
      assert.match(block, /if:[^\n]*needs\.detect\.outputs\.has_app == 'true'/, `${file} job ${name} must check has_app`);
    }
  });
}

test('ci-pass accepts skipped jobs only when there is no app yet', () => {
  const ciPass = jobs('ci.yml').find((job) => job.name === 'ci-pass').block;
  assert.match(ciPass, /HAS_APP/);
  assert.match(ciPass, /skipped/);
});
