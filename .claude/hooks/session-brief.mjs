#!/usr/bin/env node
// SessionStart: print only what a fresh session needs (stdout becomes context).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMain } from './lib/input.mjs';

const PLANS = 'docs/plans';

function read(root, path) {
  const full = join(root, path);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function activePlan(root) {
  const dir = join(root, PLANS);
  if (!existsSync(dir)) return null;
  const open = readdirSync(dir)
    .filter((name) => /^plan-\d+-/.test(name) && name !== 'plan-00-template')
    .filter((name) => !/\*\*Status:\*\*\s*Complete/.test(read(root, join(PLANS, name, 'gate.md'))))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  return open.length ? `${PLANS}/${open.at(-1)}` : null;
}

export function briefFor(root) {
  const plan = activePlan(root);
  if (!plan) return 'No active plan. Start with grill-spec or the plan skill.';
  const task = read(root, `${plan}/plan.md`).split('\n').find((l) => /^\s*- \[ \]/.test(l));
  const rows = read(root, `${plan}/evidence.md`).split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l));
  return [
    `Active plan: ${plan} (read plan.md, evidence.md, gate.md before changing code).`,
    `Next open task: ${task ? task.trim() : 'none; all tasks checked'}`,
    `Last evidence row: ${rows.length > 1 ? rows.at(-1) : 'none yet'}`,
    'PRD (docs/PRD.md) is the only source of truth. Stop and report on any conflict.',
  ].join('\n');
}

if (isMain(import.meta.url)) console.log(briefFor(process.env.CLAUDE_PROJECT_DIR ?? process.cwd()));
