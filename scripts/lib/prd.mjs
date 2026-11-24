// PRD requirement-ID parsing and checks. Node built-ins only.
import { stripFences } from './md.mjs';

const ID = /\b[A-Z]{2,6}-\d{2,3}\b/g;
const HEADING = /^###\s+([A-Z]{2,6}-\d{2,3}):/;
const PLAN_IDS_LINE = /^\*\*PRD IDs:\*\*(.*)$/m;
const NO_PRD_TYPES = /^(chore|ci|docs|build)(\([^)]*\))?!?:/;

/** IDs defined by `### <ID>: ...` headings, ignoring fenced examples. */
export function parsePrdIds(prdText) {
  const ids = new Set();
  for (const line of stripFences(prdText).split('\n')) {
    const match = line.match(HEADING);
    if (match) ids.add(match[1]);
  }
  return ids;
}

/** Every ID-shaped token in text, deduplicated, in first-seen order. */
export function extractIds(text) {
  return [...new Set(text.match(ID) ?? [])];
}

/** Errors for a PR body: needs known PRD IDs, or `PRD: none` on chore/ci/docs/build. */
export function checkPr({ prdText, prBody, prTitle }) {
  const known = parsePrdIds(prdText);
  const ids = extractIds(prBody);
  if (ids.length === 0) {
    if (/PRD:\s*none/i.test(prBody) && NO_PRD_TYPES.test(prTitle)) return [];
    if (/PRD:\s*none/i.test(prBody)) {
      return ['"PRD: none" is only allowed on chore, ci, docs, or build PRs.'];
    }
    return ['PR body must cite at least one PRD ID (or "PRD: none" for chore/ci/docs/build).'];
  }
  return ids.filter((id) => !known.has(id)).map((id) => `PR cites ${id}, which is not in docs/PRD.md.`);
}

/** Errors for plans whose `**PRD IDs:**` line names IDs the PRD no longer has. */
export function checkPlans({ prdText, planTexts }) {
  const known = parsePrdIds(prdText);
  const errors = [];
  for (const { path, text } of planTexts) {
    const line = stripFences(text).match(PLAN_IDS_LINE);
    if (!line) continue;
    for (const id of extractIds(line[1])) {
      if (!known.has(id)) errors.push(`${path} cites ${id}, which is not in docs/PRD.md.`);
    }
  }
  return errors;
}
