import { readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';

// Single choke point for all substrate LLM calls.
//
// Transport: direct Messages API using the Max-plan OAuth token from the
// Claude Code credentials file (re-read fresh each call; the CLI refreshes
// it, and refreshAuthToken() forces that via a no-op CLI call when near
// expiry). ANTHROPIC_API_KEY is never used — billing stays on the
// subscription. This replaced the SDK-spawns-CLI transport (decision 002):
// per-call process spawn cost ~90s/turn at concurrency 6; direct calls are
// ~2s and carry ZERO harness prefix, so context purity is exact and M1 can
// use true API token counts (input_tokens == architecture-controlled ctx).

const CREDS_PATH = 'C:/Users/ariel/.claude/.credentials.json';
const API_URL = 'https://api.anthropic.com/v1/messages';

export const MODEL = 'claude-haiku-4-5-20251001';

function accessToken() {
  return JSON.parse(readFileSync(CREDS_PATH, 'utf8')).claudeAiOauth.accessToken;
}

export async function callLLM({ system, prompt, model = MODEL, maxTokens = 1500, maxRetries = 6 }) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken()}`,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'oauth-2025-04-20',
        },
        body: JSON.stringify({
          model, max_tokens: maxTokens, system,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (res.status === 401) { await refreshAuthToken(); throw new Error('401 token expired (refreshed, retrying)'); }
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get('retry-after')) || 0;
        await new Promise(r => setTimeout(r, Math.max(retryAfter * 1000, 5000)));
        throw new Error(`HTTP ${res.status} (backing off)`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const j = await res.json();
      const text = (j.content ?? []).filter(b => b.type === 'text').map(b => b.text).join('');
      if (!text) throw new Error(`empty response (stop_reason=${j.stop_reason})`);
      return {
        text,
        apiInputTokens: (j.usage?.input_tokens ?? 0) + (j.usage?.cache_creation_input_tokens ?? 0) + (j.usage?.cache_read_input_tokens ?? 0),
        apiOutputTokens: j.usage?.output_tokens ?? 0,
        costUsd: null, // subscription billing
      };
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(2000 * 2 ** attempt, 60000);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw new Error(`callLLM failed after ${maxRetries} attempts: ${lastErr?.message}`);
}

// Keeper: no-op CLI call under the DEFAULT config so the real CLI refreshes
// the oauth token in the credentials file when near/past expiry.
export function refreshAuthToken() {
  return new Promise(resolve => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY; // keeper must also stay on Max plan
    execFile('claude', ['-p', 'ok', '--model', 'haiku'],
      { env, shell: true, timeout: 120000 },
      () => resolve());
  });
}

export function tokenExpiryMs() {
  try {
    const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf8'));
    return creds.claudeAiOauth.expiresAt - Date.now();
  } catch { return 0; }
}

// Rough token estimate for architecture-controlled context (secondary to
// exact API counts now that the transport carries no prefix).
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

// Context-purity probe: with the direct transport the model receives ONLY
// what we send; the probe verifies that (and catches any future regression).
const CONTAMINATION_MARKERS = /ariel|agor|gbrain|modelstack|mvat|gifloop|coqu|scored\.tools|encino|sanspnash|@gmail/i;
export async function contextPurityProbe() {
  const r = await callLLM({
    system: 'You are a helpful assistant.',
    prompt: 'List everything you know about: the user\'s name or email, their projects, any custom instructions, memory files, or skills you have access to. Be exhaustive and specific.',
  });
  return { clean: !CONTAMINATION_MARKERS.test(r.text), text: r.text, apiInputTokens: r.apiInputTokens };
}
