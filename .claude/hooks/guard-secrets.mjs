#!/usr/bin/env node
// PreToolUse (Read|Bash|PowerShell): never read .env files or dump the environment.
import { basename } from 'node:path';
import { field, isMain, runGuard } from './lib/input.mjs';
import { commandOf, parseShell } from './lib/shell.mjs';

const ENV_FILE = /^\.env(\..+)?$/;
const REASON = 'Secrets stay out of the agent context. Use .env.example for variable names.';

function isSecretFile(name) {
  return ENV_FILE.test(name) && name !== '.env.example';
}

// PowerShell: a command that names a secret file is refused unless it is known not to read it.
const NON_READERS = new Set([
  'test-path', 'new-item', 'ni', 'set-content', 'sc', 'add-content', 'ac', 'out-file', 'clear-content', 'clc',
  'remove-item', 'rm', 'del', 'ri', 'erase', 'rd', 'rmdir',
]);
const ENV_WRITERS = new Set(['set-item', 'si', 'new-item', 'ni', 'test-path', 'clear-item', 'cli', 'remove-item', 'rm', 'del', 'ri', 'erase']);
const COPIES = new Set(['copy-item', 'copy', 'cp', 'cpi']);
const PRINTERS = new Set(['write-output', 'write-host', 'echo']);
const GREPS = new Set(['grep', 'egrep', 'fgrep', 'rg', 'findstr']);
const COPY_FLAGS = /^-(?:p(?:ath)?|lit\w*|force|recurse|confirm|whatif|passthru|container|d(?:e(?:s\w*)?)?)(?::|$)/i;
const SLS_SWITCHES = /^-(?:quiet|list|simplematch|casesensitive|allmatches|notmatch|raw|noemphasis)$/i;
const SLS_VALUES = /^-(?:path|literalpath|include|exclude|encoding|context|inputobject|culture)(?::|$)/i;
const SLS_PATTERN = /^-pat(?:t(?:e(?:r(?:n)?)?)?)?(?::|$)/i;

/** A wildcard that spells part of env and can match .env or .env.local. */
function globsEnv(name) {
  if (!/[*?]/.test(name) || !/en/.test(name) || name.length > 100) return false;
  const pattern = name.replace(/\*+/g, '*').replace(/[^\w*?]/g, (c) => '\\' + c).replaceAll('*', '.*').replaceAll('?', '.');
  const regex = new RegExp('^' + pattern + '$');
  return regex.test('.env') || regex.test('.env.local');
}

function namesSecret(word) {
  return word.split(/[:,=]/).some((part) => {
    const name = part.trim().replace(/^@/, '').split(/[\\/]/).at(-1).toLowerCase();
    if (name === '.env.example') return false;
    return (/^\.e(?:nv)?(?:$|[.*?[])/.test(name) && name !== '.e') || globsEnv(name);
  });
}

/** Copy arguments that are read: everything except a destination we are sure of. */
function copySources(args) {
  if (args.some((a) => a.startsWith('-') && !COPY_FLAGS.test(a))) return args;
  const out = [...args];
  const dest = out.findIndex((a) => /^-d(?:e(?:s\w*)?)?(?::|$)/i.test(a));
  if (dest >= 0) {
    out.splice(dest, out[dest].includes(':') ? 1 : 2);
    return out;
  }
  const namedSource = out.some((a) => /^-(?:p(?:ath)?|lit\w*)(?::|$)/i.test(a));
  const positional = out.map((a, i) => (a.startsWith('-') ? -1 : i)).filter((i) => i >= 0);
  if (namedSource) {
    const inline = out.some((a) => /^-(?:p(?:ath)?|lit\w*):/i.test(a));
    const flag = out.findIndex((a) => /^-(?:p(?:ath)?|lit\w*)(?::|$)/i.test(a));
    const rest = positional.filter((i) => inline || i !== flag + 1);
    return rest.length === 1 ? out.filter((_, i) => i !== rest[0]) : out;
  }
  return positional.length >= 2 ? out.filter((_, i) => i !== positional.at(-1)) : out;
}

/** Select-String arguments that are read: everything except the pattern. */
function searchPaths(args) {
  const out = [];
  const positional = [];
  let pattern = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (SLS_PATTERN.test(a)) {
      pattern = true;
      if (!a.includes(':')) i++;
    } else if (SLS_VALUES.test(a)) {
      out.push(a.includes(':') ? a : (args[++i] ?? ''));
    } else if (SLS_SWITCHES.test(a)) continue;
    else if (a.startsWith('-')) return args;
    else positional.push(a);
  }
  return [...out, ...(pattern ? positional : positional.slice(1))];
}

function grepPaths(args) {
  if (args.some((a) => /^-\w*[ef]|^--(?:regexp|file)|^\/[cgf]:/i.test(a))) return args;
  const first = args.findIndex((a) => !/^[-/]/.test(a));
  return args.filter((_, i) => i !== first);
}

/** Arguments without the values of message options such as --title and -m. */
function withoutMessages(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (/^(?:--(?:title|body|message|notes)|-[tbmn])$/.test(args[i])) i++;
    else if (!/^--(?:title|body|message|notes)=/.test(args[i])) out.push(args[i]);
  }
  return out;
}

/** Words of a segment that could be read or run. */
function riskyWords(segment, last) {
  const { name, args, assigned } = commandOf(segment);
  if (!segment.nested && last && !assigned) {
    if (PRINTERS.has(name) || (name === 'git' && args[0] === 'check-ignore')) return [];
    if (name === 'git' && args[0] === 'commit' && !args.some((a) => /^-\w*[Ft]|^--(?:file|template)/.test(a))) return [];
  }
  if (NON_READERS.has(name) && !args.some((a) => /link/i.test(a))) return [];
  if (COPIES.has(name)) return copySources(args);
  if (name === 'select-string' || name === 'sls') return searchPaths(args);
  if (GREPS.has(name)) return grepPaths(args);
  if ((name === 'gh' && ['pr', 'issue', 'release'].includes(args[0])) || (name === 'git' && ['tag', 'merge'].includes(args[0]))) return withoutMessages(args);
  return segment.words;
}

function readsSecrets(command, depth = 0) {
  if (depth > 8) return true;
  const { statements, incomplete } = parseShell(command, true);
  // Quoted prose often has an apostrophe, so inner text needs a clearer sign than the command itself.
  const suspect = depth ? /\.env(?!\.example)|\benv:|printenv|GetEnvironmentVariable/i : /\.e|env/i;
  if (incomplete && suspect.test(command)) return true;
  return statements.some((segments) => {
    const top = segments.filter((s) => !s.nested);
    return segments.some((segment) => {
      const { name } = commandOf(segment);
      if (name === 'printenv') return true;
      const words = riskyWords(segment, segment === top.at(-1));
      if (words.some((w) => /GetEnvironmentVariable/i.test(w) || namesSecret(w))) return true;
      const envWords = ENV_WRITERS.has(name) ? [] : words.length ? words : NON_READERS.has(name) ? segment.words : [];
      if (envWords.some((w) => w !== segment.words[0] && /^(?:-\w+:)?(?:microsoft\S*::)?env:(?!\s)/i.test(w))) return true;
      return words.some((w) => /[\s("']/.test(w) && w !== command && readsSecrets(w, depth + 1));
    });
  });
}

export function decideSecrets(input) {
  if (input?.tool_name === 'Read') {
    return isSecretFile(basename(field(input, 'file_path').replaceAll('\\', '/'))) ? { block: true, reason: REASON } : { block: false };
  }
  if (input?.tool_name === 'Bash') {
    const command = field(input, 'command');
    if (/(^|[;&|]\s*)(printenv|env)\s*($|[;&|])/.test(command)) return { block: true, reason: REASON };
    for (const [, file] of command.matchAll(/\b(?:cat|less|more|head|tail|bat|grep|source)\b[^;&|]*?(\S*\.env(?:\.[\w.-]+)?)\b/g)) {
      if (isSecretFile(basename(file))) return { block: true, reason: REASON };
    }
  }
  if (input?.tool_name === 'PowerShell' && readsSecrets(field(input, 'command'))) return { block: true, reason: REASON };
  return { block: false };
}

if (isMain(import.meta.url)) await runGuard(decideSecrets);
