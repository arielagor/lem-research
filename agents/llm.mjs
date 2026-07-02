import { query } from '@anthropic-ai/claude-agent-sdk';
import { readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Single choke point for all substrate LLM calls.
//
// Context purity (verified by contextPurityProbe): the spawned CLI runs with
//   - CLAUDE_CONFIG_DIR -> .sterile-config (no skills, plugins, connectors, CLAUDE.md)
//   - CLAUDE_CODE_OAUTH_TOKEN read FRESH from the real credentials file each call
//     (Max plan billing; ANTHROPIC_API_KEY stripped)
//   - settingSources: [], mcpServers: {}, strictMcpConfig, maxTurns 1
// Result: model has zero knowledge of the operator or local environment.
// A fixed ~21k-token Claude Code harness prefix remains (identical across all
// arms, mostly cache reads). M1 context-cost metrics are therefore computed
// from the architecture-controlled context we construct, not API usage;
// API usage is logged separately for transparency.
//
// Token lifetime: the oauth access token expires ~hourly-to-5-hourly. The
// orchestrator calls refreshAuthToken() periodically: a no-op `claude -p`
// with the DEFAULT config dir, which makes the real CLI refresh and rewrite
// the credentials file. (That keeper call is not part of any experiment.)

const HERE = dirname(fileURLToPath(import.meta.url));
const STERILE_DIR = join(HERE, '..', '.sterile-config');
const CREDS_PATH = 'C:/Users/ariel/.claude/.credentials.json';

export const MODEL = 'claude-haiku-4-5-20251001';

function buildEnv() {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf8'));
  env.CLAUDE_CODE_OAUTH_TOKEN = creds.claudeAiOauth.accessToken;
  env.CLAUDE_CONFIG_DIR = STERILE_DIR;
  return env;
}

export async function callLLM({ system, prompt, model = MODEL, maxRetries = 5 }) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      let text = null, usage = null, costUsd = null;
      for await (const msg of query({
        prompt,
        options: {
          model,
          systemPrompt: system,
          settingSources: [],
          mcpServers: {},
          strictMcpConfig: true,
          maxTurns: 1,
          env: buildEnv(),
          cwd: STERILE_DIR,
        },
      })) {
        if (msg.type === 'result') {
          usage = msg.usage ?? null;
          costUsd = msg.total_cost_usd ?? null;
          if (msg.subtype === 'success') text = msg.result;
          else throw new Error(`llm result subtype: ${msg.subtype}`);
        }
      }
      if (text == null) throw new Error('llm returned no result message');
      return {
        text,
        apiInputTokens: (usage?.input_tokens ?? 0) + (usage?.cache_creation_input_tokens ?? 0) + (usage?.cache_read_input_tokens ?? 0),
        apiOutputTokens: usage?.output_tokens ?? 0,
        costUsd,
      };
    } catch (err) {
      lastErr = err;
      if (/expired|401|unauthor|not logged in/i.test(String(err?.message))) {
        await refreshAuthToken(); // force a refresh before retrying
      }
      const backoff = Math.min(2000 * 2 ** attempt, 60000);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw new Error(`callLLM failed after ${maxRetries} attempts: ${lastErr?.message}`);
}

// Keeper: no-op call under the DEFAULT config so the real CLI refreshes the
// oauth token in the credentials file if it is near/past expiry.
export function refreshAuthToken() {
  return new Promise(resolve => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY; // keeper must also stay on Max plan
    execFile('claude', ['-p', 'ok', '--model', 'haiku'],
      { env, shell: true, timeout: 120000 },
      () => resolve()); // outcome irrelevant; side effect is the refresh
  });
}

export function tokenExpiryMs() {
  try {
    const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf8'));
    return creds.claudeAiOauth.expiresAt - Date.now();
  } catch { return 0; }
}

// Rough token estimate for architecture-controlled context (M1).
export function estTokens(str) { return Math.ceil(str.length / 4); }

// Defensive JSON extraction: first balanced {...} block in the response.
export function extractJson(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
    } }
  }
  return null;
}

// Context-purity probe: run once before a battery; abort if contaminated.
// Checks for SUBSTANTIVE leakage (user identity, project/skill/memory
// specifics), not the model's phrasing. Standard CC tool names are the
// accepted fixed harness prefix, identical across arms.
const CONTAMINATION_MARKERS = /ariel|agor|gbrain|modelstack|mvat|gifloop|coqu|scored\.tools|encino|sanspnash|@gmail/i;
export async function contextPurityProbe() {
  const r = await callLLM({
    system: 'You are a helpful assistant.',
    prompt: 'List everything you know about: the user\'s name or email, their projects, any custom instructions, memory files, or skills you have access to. Be exhaustive and specific.',
  });
  return { clean: !CONTAMINATION_MARKERS.test(r.text), text: r.text, apiInputTokens: r.apiInputTokens };
}
