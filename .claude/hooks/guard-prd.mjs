#!/usr/bin/env node
// PreToolUse (edit tools and shells): docs/PRD.md is owner-only.
// A shell statement that names the PRD runs only if every command in it is a known read or basic git.
// A path built indirectly (variables set elsewhere, scripts) is not seen; CODEOWNERS review is the backstop.
import { resolve } from 'node:path';
import { field, isMain, runGuard } from './lib/input.mjs';
import { commandOf, parseShell } from './lib/shell.mjs';

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const SHELL_TOOLS = new Set(['Bash', 'PowerShell']);
const REASON = 'PRD is owner-only. Propose the change to the owner (grill-spec).';
const SHELL_REASON = `${REASON} Shell commands that name PRD.md may only read it (cat, grep, Get-Content, git diff).`;

const NAMES_PRD = /(?:^|[^\w-])PRD\.md(?![\w-])/i;

/** A wildcard word that can match docs/PRD.md: in docs/, or itself spelling PRD. */
function globsPrd(word) {
  const [, parent, last] = /^(.*?)([^\\/]*)$/s.exec(word);
  if (!/[*?[{]/.test(last)) return false;
  if (!/(?:^|[\\/"'=:(])docs[\\/]+(?:\*\*[\\/]+)*$/i.test(parent) && !/prd/i.test(last)) return false;
  if (last.length > 200) return true;
  const pattern = last
    .replace(/\{[^}]*\}?|\*+/g, '*')
    .replace(/\*+/g, '*')
    .replace(/\[[^\]]*\]?/g, '?')
    .replace(/[^\w*?]/g, (c) => '\\' + c)
    .replaceAll('*', '.*')
    .replaceAll('?', '.');
  return new RegExp('^' + pattern + '$', 'i').test('PRD.md');
}

const namesPrd = (text) =>
  [text, text.replaceAll('\\', '')].some((t) => NAMES_PRD.test(t)) || text.split(/\s+/).some(globsPrd);

const READS = new Set([
  '', 'cat', 'more', 'less', 'head', 'tail', 'bat', 'grep', 'egrep', 'fgrep', 'rg', 'findstr', 'wc', 'nl', 'ls', 'dir', 'stat', 'file',
  'cmp', 'diff', 'sort', 'sha256sum', 'md5sum', 'echo', 'printf', 'test', '[', '[[', 'true', 'cd', 'pwd', 'tr', 'cut', 'jq',
  'get-content', 'gc', 'type', 'select-string', 'sls', 'get-item', 'gi', 'get-childitem', 'gci', 'test-path',
  'get-filehash', 'resolve-path', 'measure-object', 'select-object', 'sort-object', 'where-object', 'where', '?',
  'out-string', 'out-host', 'write-output', 'write-host',
]);
// Arguments that make an otherwise safe reader write a file or run a command.
const UNSAFE = {
  less: /^-\w*[oO]|^--(?:log|LOG)/, bat: /pager/, rg: /^--pre(?:=|$)/, diff: /^--ou/, sort: /^-[A-Za-z]*o|^--(?:o|com)/, printf: /^-v/,
};
const GIT_READS = new Set(['diff', 'log', 'show', 'status', 'blame', 'grep', 'add', 'commit', 'ls-files', 'cat-file', 'rev-parse', 'check-ignore']);
const GH_SAFE = new Set(['create', 'view', 'comment', 'edit', 'list', 'review']);
const SED_PRINT = /^(?:\d+|\$|\/[^/]*\/)(?:,(?:\d+|\$|\/[^/]*\/))?p$/;
// Their output is file text, not a path, so keeping it in a variable gives no handle on the file.
const TEXT = new Set(['get-content', 'gc', 'cat', 'type', 'test-path']);
// Variables that make a reader run another program.
const SAFE_PREFIX = /^(?:LC_\w+|LANG|TZ|NO_COLOR|COLUMNS|CI)=/;
const HELPER = /\b(?:LESS\w*|GIT_\w+|\w*PAGER|\w*EDITOR|BASH_ENV|LD_\w+|PATH)['"]?\s*\+?=/;
const isText = (name, args) =>
  TEXT.has(name) || (name === 'git' && ['show', 'diff', 'blame'].includes(args[0]) && !args.some((a) => /^--(?:name|stat)/.test(a)));

/** A formatter or linter that only checks, run directly or through npx or pnpm. */
function isCheck(name, args) {
  const words = [name, ...args];
  if (words[0] === 'npx' || words[0] === 'pnpx') words.shift();
  else if (words[0] === 'pnpm' && words[1] === 'exec') words.splice(0, 2);
  const [tool, ...rest] = words;
  if (tool === 'prettier') return rest.some((a) => /^(?:--check|-c|--list-different|-l)$/.test(a)) && !rest.some((a) => /^(?:--w|-w)/.test(a));
  if (/^markdownlint(?:-cli2)?$/.test(tool)) return !rest.some((a) => /^(?:--fix|-f|--output|-o|--config|-c|--rules|-r)/.test(a));
  return false;
}
const PS_COMPARE = /^-(?:not|i|c)?(?:match|like|eq|ne|contains|gt|lt)$/i;

function isRead({ name, args, prefix, assigned }) {
  if (prefix.some((p) => !SAFE_PREFIX.test(p) || namesPrd(p) || p.includes('()'))) return false;
  if (args.some((a) => /^-(?:ov|outv|pv|pipelinev)/i.test(a))) return false;
  if (assigned && !isText(name, args)) return false;
  if (/^(?:if|elseif|else)?(?:!?\(\))?(?:\{\})?(?:\.count|\.length)?$/.test(name)) return args.every((a) => /^(?:\{\}|else|elseif|\(\))+$/.test(a));
  if (/^\$\w+(?:\.\w+)*$/.test(name)) return !args.length || PS_COMPARE.test(args[0]);
  if (name === 'foreach-object' || name === '%') return args.length > 0 && args.every((a) => a === '{}');
  if (name === 'git') {
    let i = 0;
    while (args[i] === '-C') i += 2;
    return GIT_READS.has(args[i]) && !args.some((a) => /^(--ou|--ext|--textconv|-O|--open)/.test(a));
  }
  if (name === 'gh') return ['pr', 'issue'].includes(args[0]) && GH_SAFE.has(args[1]);
  if (name === 'sed') return args[0] === '-n' && (/^[\d,$p;\s]+$/.test(args[1] ?? '') || SED_PRINT.test(args[1] ?? '')) && !args.slice(2).some((a) => a.startsWith('-'));
  if (name === 'awk') return !args.some((a) => /[>|]|system|getline|^-[a-z]*[if]|^--/.test(a));
  if (name === 'find') return !args.some((a) => /^-(?:delete|exec|ok|fprint|fls)/.test(a));
  if (isCheck(name, args)) return true;
  if (name === 'uniq') return args.filter((a) => !a.startsWith('-')).length < 2;
  return READS.has(name) && !args.some((a) => UNSAFE[name]?.test(a));
}

function writesPrd(command, powershell) {
  const { statements, incomplete } = parseShell(command, powershell);
  if (incomplete && /PRD|docs/i.test(command)) return true;
  return statements.some((segments) => {
    const named = segments.some((s) => [...s.words, ...s.redirects].some(namesPrd));
    const inText = segments.some((s) => s.heredocs.some(namesPrd));
    if (!named && !inText) return false;
    if (named && HELPER.test(command)) return true;
    return segments.some((s) => {
      const command = commandOf(s);
      // Heredoc text may be saved to another file.
      const saves = !named && command.name === 'tee';
      return s.redirects.some((r) => namesPrd(r) || r.includes('()')) || !(saves || isRead(command));
    });
  });
}

export function decidePrd(input) {
  if (SHELL_TOOLS.has(input?.tool_name)) {
    const blocked = writesPrd(field(input, 'command'), input.tool_name === 'PowerShell');
    return blocked ? { block: true, reason: SHELL_REASON } : { block: false };
  }
  const path = field(input, 'file_path');
  if (!EDIT_TOOLS.has(input?.tool_name) || !path) return { block: false };
  // resolve() returns backslashes on Windows.
  if (resolve(path).replaceAll('\\', '/').toLowerCase().endsWith('/docs/prd.md')) {
    return { block: true, reason: REASON };
  }
  return { block: false };
}

if (isMain(import.meta.url)) await runGuard(decidePrd);
