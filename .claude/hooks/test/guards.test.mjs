import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decidePrd } from '../guard-prd.mjs';
import { decideSecrets } from '../guard-secrets.mjs';
import { decideGit } from '../guard-git.mjs';

const edit = (file_path) => ({ tool_name: 'Edit', tool_input: { file_path } });
const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });

test('decidePrd blocks every spelling of the PRD path', () => {
  for (const p of ['docs/PRD.md', './docs/PRD.md', resolve('docs/PRD.md'), 'docs/prd.md']) {
    assert.equal(decidePrd(edit(p)).block, true, p);
  }
  assert.equal(decidePrd({ tool_name: 'Write', tool_input: { file_path: 'docs/PRD.md' } }).block, true);
});

test('decidePrd allows other files and malformed input', () => {
  assert.equal(decidePrd(edit('docs/plans/x/plan.md')).block, false);
  assert.equal(decidePrd({}).block, false);
  assert.equal(decidePrd({ tool_name: 'Edit', tool_input: {} }).block, false);
  assert.equal(decidePrd({ tool_name: 'Read', tool_input: { file_path: 'docs/PRD.md' } }).block, false);
});

test('decideSecrets blocks env reads but not the example', () => {
  assert.equal(decideSecrets({ tool_name: 'Read', tool_input: { file_path: '.env.local' } }).block, true);
  assert.equal(decideSecrets({ tool_name: 'Read', tool_input: { file_path: 'app/.env' } }).block, true);
  assert.equal(decideSecrets({ tool_name: 'Read', tool_input: { file_path: '.env.example' } }).block, false);
  assert.equal(decideSecrets(bash('cat .env')).block, true);
  assert.equal(decideSecrets(bash('printenv')).block, true);
  assert.equal(decideSecrets(bash('ls -la')).block, false);
  assert.equal(decideSecrets(bash('cat .env.example')).block, false);
  assert.equal(decideSecrets({}).block, false);
});

test('decideGit blocks push and destructive commands', () => {
  for (const c of ['git push origin main', 'git reset --hard HEAD~1', 'git branch -D x', 'git clean -fd', 'git checkout -- .', 'cd a && git push -f']) {
    assert.equal(decideGit(bash(c)).block, true, c);
  }
  assert.equal(decideGit(bash('git status')).block, false);
  assert.equal(decideGit({ tool_name: 'Bash', tool_input: { command: 42 } }).block, false);
});

test('guard-prd wrapper exits 2 with a reason on stderr', () => {
  const run = (input) => {
    try {
      execFileSync('node', [resolve('.claude/hooks/guard-prd.mjs')], { input, stdio: 'pipe' });
      return 0;
    } catch (error) {
      return error.status;
    }
  };
  assert.equal(run(JSON.stringify(edit('docs/PRD.md'))), 2);
  assert.equal(run(JSON.stringify(edit('README.md'))), 0);
  assert.equal(run('not json'), 0);
});

test('decidePrd blocks Windows spellings of the PRD path on every platform', () => {
  for (const p of ['docs\\PRD.md', 'C:\\work\\app\\docs\\PRD.md', 'C:/work/app/docs/prd.md']) {
    assert.equal(decidePrd(edit(p)).block, true, p);
  }
});

test('decidePrd blocks common shell writes to the PRD', () => {
  for (const c of [
    'echo x > docs/PRD.md', 'echo x >> "docs/PRD.md"', 'cd docs && echo x >PRD.md',
    'echo x | tee -a docs/PRD.md', 'sed -i s/a/b/ docs/PRD.md', "perl -pi -e 's/a/b/' docs/PRD.md",
    'cp draft.md docs/PRD.md', 'mv docs/PRD.md old.md', 'rm docs/PRD.md', 'truncate -s 0 docs/PRD.md',
    "node -e \"require('fs').writeFileSync('docs/PRD.md','x')\"",
    "python -c \"open('docs/PRD.md','w').write('x')\"",
    "python - <<'X'\nopen('docs/PRD.md','w').write('x')\nX",
  ]) {
    assert.equal(decidePrd(bash(c)).block, true, c);
  }
  for (const c of ['Set-Content docs\\PRD.md x', "'x' | Out-File docs/PRD.md", 'Copy-Item a.md docs\\PRD.md', 'Remove-Item docs/PRD.md']) {
    assert.equal(decidePrd({ tool_name: 'PowerShell', tool_input: { command: c } }).block, true, c);
  }
});

test('decidePrd allows shell reads of the PRD and writes elsewhere', () => {
  for (const c of [
    'cat docs/PRD.md', 'grep -n AUTH docs/PRD.md > out.txt', 'cat docs/PRD.md 2>/dev/null',
    'git diff docs/PRD.md', "sed -n '1,5p' docs/PRD.md", 'rm old.md; cat docs/PRD.md', 'echo x > docs/myPRD.md',
  ]) {
    assert.equal(decidePrd(bash(c)).block, false, c);
  }
});

test('settings run guard-prd for edits and for both shells', () => {
  const { hooks } = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const matchers = hooks.PreToolUse
    .filter((entry) => entry.hooks.some((h) => h.command.includes('guard-prd')))
    .flatMap((entry) => entry.matcher.split('|'));
  for (const tool of ['Edit', 'Write', 'Bash', 'PowerShell']) assert.ok(matchers.includes(tool), tool);
});

const ps = (command) => ({ tool_name: 'PowerShell', tool_input: { command } });

test('decideGit blocks the same commands in PowerShell', () => {
  for (const c of ['git push', 'git reset --hard', 'cd a; git clean -fd', 'Git Push origin main']) {
    assert.equal(decideGit(ps(c)).block, true, c);
  }
  assert.equal(decideGit(ps('git status')).block, false);
});

test('decideSecrets blocks env reads in PowerShell', () => {
  for (const c of [
    'Get-Content .env', 'gc ".env.local"', 'type app\\.env', 'cat .env', "Select-String KEY '.env'",
    "[IO.File]::ReadAllText('.env')", 'Get-ChildItem env:', 'gci Env:', 'dir env:', 'printenv',
  ]) {
    assert.equal(decideSecrets(ps(c)).block, true, c);
  }
  for (const c of ['Get-Content .env.example', 'Get-Content README.md', '$env:CI = "1"', 'Get-ChildItem src']) {
    assert.equal(decideSecrets(ps(c)).block, false, c);
  }
});

test('decideSecrets blocks Windows Read paths', () => {
  assert.equal(decideSecrets({ tool_name: 'Read', tool_input: { file_path: 'C:\\app\\.env' } }).block, true);
});

test('settings run the secrets and git guards for both shells', () => {
  const { hooks } = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  for (const guard of ['guard-secrets', 'guard-git']) {
    const matchers = hooks.PreToolUse
      .filter((entry) => entry.hooks.some((h) => h.command.includes(guard)))
      .flatMap((entry) => entry.matcher.split('|'));
    for (const tool of ['Bash', 'PowerShell']) assert.ok(matchers.includes(tool), guard + ' ' + tool);
  }
});

const prdBlocked = (input) => decidePrd(input).block;

test('decidePrd blocks quoted separators, wrappers, and continuations', () => {
  for (const c of [
    'sed -i "s|a|b|" docs/PRD.md', 'sed -i "s/a/b/; s/c/d/" docs/PRD.md', 'perl -i -pe "s/a/b/; s/c/d/" docs/PRD.md',
    '(rm docs/PRD.md)', '{ rm docs/PRD.md; }', 'rm \\\n docs/PRD.md', 'if true; then rm docs/PRD.md; fi',
    'X=1 rm docs/PRD.md', 'echo docs/PRD.md | xargs rm', 'f=docs/PRD.md; rm $f', 'rm $(echo a; ls docs/PRD.md)',
    'echo "$(rm docs/PRD.md)"', 'bash -c "rm docs/PRD.md"', 'rm docs/PR"D".md', 'rm docs/PRD*', 'rm docs/*.md',
    'find docs -name PRD.md -delete', 'git checkout main docs/PRD.md', 'git diff --output=docs/PRD.md', 'sort a -o docs/PRD.md',
    "sed -n 'w docs/PRD.md' a.md", 'for f in docs/PRD.md; do rm $f; done',
  ]) assert.equal(prdBlocked(bash(c)), true, c);
});

test('decidePrd blocks PowerShell aliases, .NET calls, and named parameters', () => {
  for (const c of [
    'sc docs/PRD.md x', 'ac docs/PRD.md x', 'del docs/PRD.md', 'erase docs/PRD.md', 'ri docs/PRD.md', 'ni docs/PRD.md -Force',
    '[IO.File]::WriteAllText("docs/PRD.md","x")', 'if($true){Set-Content docs/PRD.md x}', 'Set-Content -Path:docs/PRD.md x',
    'Set-Content (Resolve-Path docs/PRD.md) x', 'gci docs/PRD.md | Remove-Item', 'gci docs/PRD.md | % { rm $_ }', "& 'rm' docs\\PRD.md",
    'Copy-Item a docs/PRD.md -Force', 'Copy-Item -Destination docs/PRD.md -Path a', 'cp a docs/PRD.md -Force',
  ]) assert.equal(prdBlocked(ps(c)), true, c);
});

test('decidePrd blocks copies with trailing words and quoted paths with spaces', () => {
  for (const c of [
    'cp a.md docs/PRD.md 2>/dev/null', 'cp a.md docs/PRD.md # note', 'cp PRD.md docs/',
    'echo x > "C:/my app/docs/PRD.md"', 'echo x > "/Users/a b/docs/PRD.md"', "echo x >> '/a b/docs/PRD.md'",
  ]) assert.equal(prdBlocked(bash(c)), true, c);
});

test('decidePrd allows reads, mentions, and basic git', () => {
  for (const c of [
    'node scripts/check-prd-ids.mjs && grep -n rewrite docs/PRD.md', 'git commit -m "fix(node): rename section in docs/PRD.md"',
    'echo "a > docs/PRD.md"', 'cat "C:/my app/docs/PRD.md"', 'cat docs/PRD.md | grep AUTH | head -5', 'git add docs/PRD.md',
    'git -C . log -- docs/PRD.md', 'wc -l docs/PRD.md 2>&1', 'cat docs/PRD.md; rm old.md', 'npm test', 'rm docs/plans/x.md',
    'LC_ALL=C cat docs/PRD.md', 'cat a.md # docs/PRD.md', 'if [ -f docs/PRD.md ]; then echo yes; fi',
  ]) assert.equal(prdBlocked(bash(c)), false, c);
  for (const c of ['Get-Content docs\\PRD.md', '(Get-Content docs/PRD.md).Count', 'Select-String AUTH docs/PRD.md | Select-Object -First 3', 'Test-Path docs/PRD.md']) {
    assert.equal(prdBlocked(ps(c)), false, c);
  }
});

test('decideSecrets blocks every PowerShell bypass from the review', () => {
  for (const c of [
    '$x = gci env:', 'Get-ChildItem -Path Env:', '& { gci env: }', 'Get-ChildItem -Path:Env:', 'gci Env:*', 'Get-Content env:KEY',
    '[System.Environment]::GetEnvironmentVariables()', 'Get-Content -Path:.env', '[IO.File]::ReadAllBytes(".env")',
    '[IO.File]::ReadLines(".env")', '[IO.File]::OpenText(".env")', 'if($true){gc .env}', 'findstr KEY .env', 'head .env', 'grep K .env',
    'gc "C:\\my app\\.env"', 'gc .env*', 'Copy-Item .env out.txt', 'cp .env out.txt', 'Copy-Item -Destination out.txt -Path .env',
    'Get-Content (Resolve-Path .env)', 'pwsh -c "gc .env"', 'git show HEAD:.env', 'Select-String -Pattern KEY -Path .env',
  ]) assert.equal(decideSecrets(ps(c)).block, true, c);
});

test('decideSecrets allows PowerShell setup and mentions', () => {
  for (const c of [
    'Copy-Item .env.example .env', 'cp .env.example .env', 'Copy-Item -Path .env.example -Destination .env -Force',
    'Select-String -Pattern ".env" README.md', 'sls .env README.md', 'Test-Path .env', 'New-Item .env', 'git check-ignore .env',
    'git commit -m "document .env"', '$env:CI = "1"', 'echo $env:PATH', 'Write-Output "x" > .env',
  ]) assert.equal(decideSecrets(ps(c)).block, false, c);
});

test('guards hold against a wider list of commands', () => {
  const run = (decide, tool, want, commands) => {
    for (const command of commands) {
      assert.equal(decide({ tool_name: tool, tool_input: { command } }).block, want, tool + ': ' + command);
    }
  };
  run(decidePrd, 'Bash', true, ['dd if=a of=docs/PRD.md',
    'ln -sf a docs/PRD.md',
    'rsync a docs/PRD.md',
    'cat a >|docs/PRD.md',
    'cat a &> docs/PRD.md',
    'cat a 1>docs/PRD.md',
    'cat a >& docs/PRD.md',
    'cat a>docs/PRD.md',
    'cat <<EOF > docs/PRD.md\nx\nEOF',
    'tee docs/PRD.md <<< x',
    '>docs/PRD.md',
    ': > docs/PRD.md',
    'eval "rm docs/PRD.md"',
    'env rm docs/PRD.md',
    'sudo rm docs/PRD.md',
    '\\rm docs/PRD.md',
    'git mv docs/PRD.md x',
    'git rm docs/PRD.md',
    'git apply x -- docs/PRD.md',
    'git -C . checkout -- docs/PRD.md',
    'git -c core.pager=x show docs/PRD.md',
    'cat docs/PRD.md | tee docs/PRD.md',
    'rm "docs"/PRD.md', "rm $'docs/PRD.md'", 'rm docs/{PRD.md,x}',
    'echo `rm docs/PRD.md`',
    'cat "a`rm docs/PRD.md`"',
    'awk -i inplace 1 docs/PRD.md',
    'ed docs/PRD.md',
    'vim docs/PRD.md',
    'patch docs/PRD.md a.diff',
    'curl -o docs/PRD.md u',
    'mv docs/PRD.md{,.bak}',
    'printf -v x docs/PRD.md; cat a > "./docs/PRD.md"',
    'grep x docs/PRD.md & rm docs/PRD.md',
    'cat >(tee docs/PRD.md)',
    'rm docs//PRD.md',
    'RM DOCS/prd.MD',
    'rm docs/PRD.??',
    'rm docs/P*D.md', "echo it\\'s; rm docs/PRD.md", 'echo "a\\\\"; rm docs/PRD.md']);
  run(decidePrd, 'PowerShell', true, ['"x" > docs/PRD.md',
    '"x" | Out-File -FilePath docs/PRD.md',
    'Set-Content -LiteralPath "C:\\my app\\docs\\PRD.md" -Value x',
    'move docs/PRD.md x',
    'ren docs/PRD.md x',
    'clc docs/PRD.md',
    'Tee-Object docs/PRD.md',
    'gc a | tee docs/PRD.md',
    '$p="docs/PRD.md"; rm $p',
    'iex "del docs/PRD.md"',
    '(gc docs/PRD.md) -replace "a","b" | sc docs/PRD.md',
    '(Get-Item docs/PRD.md).Delete()',
    'cmd /c del docs\\PRD.md', "Write-Output 'C:\\a\\' ; del docs\\PRD.md", 'Write-Output "C:\\a\\"; del docs\\PRD.md']);
  run(decidePrd, 'Bash', false, ['ls',
    'git status',
    'git log --oneline',
    'pnpm check',
    'git show HEAD:docs/PRD.md',
    'head -20 docs/PRD.md',
    'grep -c "^###" docs/PRD.md',
    'diff -u a b',
    'git diff main...HEAD -- docs/PRD.md | head -50']);
  run(decideSecrets, 'PowerShell', true, ['gc .\\.env',
    'gc ./.env.local',
    'Get-Content -Raw .env',
    'type .env.production',
    'cat "./.env"',
    'copy .env x',
    'gi .env | gc',
    '[IO.File]::ReadAllText("$PWD/.env")',
    '$f=".env"; gc $f',
    'Get-Content .env, a.txt',
    'gc a.txt,.env',
    'bash -c "cat .env"',
    'cmd /c type .env',
    '[Environment]::GetEnvironmentVariable("K")',
    'ls env:',
    'Get-PSDrive env; dir env:\\',
    'node -e "require(\'fs\').readFileSync(\'.env\')"',
    'Write-Output "$(gc .env)"',
    'Get-ChildItem Env: | Out-String',
    'gc .env > x']);
  run(decideSecrets, 'PowerShell', false, ['ls',
    'git status',
    'pnpm check',
    'Get-Content README.md',
    '$env:PATH -split ";"',
    'Get-Content .env.example',
    'npm run dev -- --env=test',
    'git add .env.example',
    'Write-Host "set .env first"',
    '${env:CI}']);
  run(decideSecrets, 'Bash', true, ['cat .env',
    'printenv',
    'grep K .env.local']);
});
