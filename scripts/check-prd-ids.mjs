#!/usr/bin/env node
// Checks that the PR (PR_TITLE, PR_BODY env) and every plan cite only IDs in docs/PRD.md.
// The PR check is skipped when PR_BODY is unset (local runs).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkPlans, checkPr } from './lib/prd.mjs';

const PRD_PATH = 'docs/PRD.md';
const PLANS_DIR = 'docs/plans';

if (!existsSync(PRD_PATH)) {
  console.error(`check-prd-ids: ${PRD_PATH} not found.`);
  process.exit(1);
}
const prdText = readFileSync(PRD_PATH, 'utf8');

const planTexts = existsSync(PLANS_DIR)
  ? readdirSync(PLANS_DIR)
      .map((dir) => join(PLANS_DIR, dir, 'plan.md'))
      .filter((path) => existsSync(path))
      .map((path) => ({ path, text: readFileSync(path, 'utf8') }))
  : [];

const errors = checkPlans({ prdText, planTexts });
if (process.env.PR_BODY !== undefined) {
  errors.push(...checkPr({ prdText, prBody: process.env.PR_BODY, prTitle: process.env.PR_TITLE ?? '' }));
}

for (const error of errors) console.error(error);
if (errors.length) process.exit(1);
console.log('check-prd-ids: ok');
