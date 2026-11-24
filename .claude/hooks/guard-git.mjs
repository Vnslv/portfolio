#!/usr/bin/env node
// PreToolUse (Bash|PowerShell): no push and no destructive git commands. The owner runs these.
import { field, isMain, runGuard } from './lib/input.mjs';

const BANNED = [
  [/\bgit\s+push\b/, 'git push'],
  [/\bgit\s+reset\s+[^;&|]*--hard\b/, 'git reset --hard'],
  [/\bgit\s+branch\s+[^;&|]*-D\b/, 'git branch -D'],
  [/\bgit\s+clean\s+[^;&|]*-[a-z]*f/, 'git clean -f'],
  [/\bgit\s+checkout\s+[^;&|]*--(\s|$)/, 'git checkout --'],
  [/\bgit\s+restore\b(?![^;&|]*--staged)/, 'git restore'],
];

export function decideGit(input) {
  if (!['Bash', 'PowerShell'].includes(input?.tool_name)) return { block: false };
  // Windows command names ignore case; flags such as -D do not.
  const command = field(input, 'command').replace(/\bgit(?:\.exe)?\s+[a-z]+/gi, (m) => m.toLowerCase().replace('git.exe', 'git'));
  for (const [pattern, name] of BANNED) {
    if (pattern.test(command)) {
      return { block: true, reason: `${name} is owner-only. Ask the owner to run it.` };
    }
  }
  return { block: false };
}

if (isMain(import.meta.url)) await runGuard(decideGit);
