// Shared helpers for Claude Code hooks. Node built-ins only.
import { pathToFileURL } from 'node:url';

/** Parse the hook's JSON from stdin. Bad or empty input becomes {} (allow). */
export async function readHookInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** String field from tool_input, or '' when missing or not a string. */
export function field(input, name) {
  const value = input?.tool_input?.[name];
  return typeof value === 'string' ? value : '';
}

/** True when the module is run directly (not imported by a test). */
export function isMain(metaUrl) {
  return process.argv[1] !== undefined && metaUrl === pathToFileURL(process.argv[1]).href;
}

/** Run a PreToolUse decider: exit 2 with the reason on stderr to block. A decider that fails blocks. */
export async function runGuard(decide) {
  const input = await readHookInput();
  let result;
  try {
    result = decide(input);
  } catch (error) {
    result = { block: true, reason: `Guard failed, so the call is blocked: ${error.message}` };
  }
  if (result.block) {
    process.stderr.write(`${result.reason}\n`);
    process.exit(2);
  }
  process.exit(0);
}
