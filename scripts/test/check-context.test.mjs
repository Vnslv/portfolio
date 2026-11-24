import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkBudget, checkRules, REQUIRED_RULES } from '../check-context.mjs';

function repo(files) {
  const root = mkdtempSync(join(tmpdir(), 'ctx-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}
const lines = (n) => Array(n).fill('x').join('\n') + '\n';
const rule = '---\npaths:\n  - "src/**"\n---\n\n# Rule\n';
const allRules = Object.fromEntries(REQUIRED_RULES.map((name) => [`.claude/rules/${name}`, rule]));

test('budget counts CLAUDE.md plus its imports: 200 passes, 201 fails', () => {
  assert.deepEqual(checkBudget(repo({ 'CLAUDE.md': '@AGENTS.md\n', 'AGENTS.md': lines(199) })), []);
  assert.match(checkBudget(repo({ 'CLAUDE.md': '@AGENTS.md\n', 'AGENTS.md': lines(200) })).join(), /201 lines/);
});

test('budget follows nested and inline imports, once each, and survives cycles', () => {
  const root = repo({ 'CLAUDE.md': 'See @./a.md\n', 'a.md': '@docs/b.md\n', 'docs/b.md': '@../a.md\n' + lines(199) });
  assert.match(checkBudget(root).join(), /202 lines/);
});

test('budget ignores emails and @tokens in code', () => {
  const root = repo({ 'CLAUDE.md': 'me@big.md `@big.md`\n```\n@big.md\n```\n', 'big.md': lines(500) });
  assert.deepEqual(checkBudget(root), []);
});

test('budget reports a missing CLAUDE.md and a missing Markdown import', () => {
  assert.match(checkBudget(repo({})).join(), /CLAUDE.md not found/);
  assert.match(checkBudget(repo({ 'CLAUDE.md': '@gone.md\n' })).join(), /gone\.md/);
});

test('rules pass with paths, including CRLF files', () => {
  assert.deepEqual(checkRules(repo(allRules)), []);
  assert.deepEqual(checkRules(repo({ ...allRules, '.claude/rules/prd.md': rule.replace(/\n/g, '\r\n') })), []);
});

test('rules fail when missing, unscoped, empty, or too long', () => {
  const missing = { ...allRules };
  delete missing['.claude/rules/security.md'];
  assert.match(checkRules(repo(missing)).join(), /security\.md.*missing/);
  for (const bad of ['# No frontmatter\n', '---\npaths:\n---\n# Empty\n', '---\nname: x\n---\n# None\n', '---\npaths:\n  - "**"\n---\n# All\n']) {
    assert.match(checkRules(repo({ ...allRules, '.claude/rules/prd.md': bad })).join(), /prd\.md.*paths/, bad);
  }
  assert.match(checkRules(repo({ ...allRules, '.claude/rules/prd.md': rule + lines(200) })).join(), /prd\.md.*lines/);
});

test('rules in subfolders are checked too', () => {
  assert.match(checkRules(repo({ ...allRules, '.claude/rules/extra/x.md': '# X\n' })).join(), /extra\/x\.md.*paths/);
});

test('budget ignores @tokens that are folders or only dots', () => {
  assert.deepEqual(checkBudget(repo({ 'CLAUDE.md': 'Ask @docs or @.. or @./docs\n', 'docs/a.md': 'x' })), []);
});

test('kit rules: security covers all product code; builder bookkeeping matches no rule', () => {
  const scope = (name) => readFileSync('.claude/rules/' + name, 'utf8');
  assert.match(scope('security.md'), /^ {2}- "src\/\*\*"\r?$/m);
  for (const text of [/Validate every input/, /Never log secrets/, /Parameterized queries/]) assert.match(scope('security.md'), text);
  for (const name of REQUIRED_RULES) assert.doesNotMatch(scope(name), /- "docs\/plans\/\*\*"/);
  assert.match(readFileSync('.claude/agents/builder.md', 'utf8'), /evidence\.md.*never count/);
});
