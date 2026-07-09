// Single choke point for all substrate LLM calls: direct Messages API.
//
// Reproducibility note: set ANTHROPIC_API_KEY in the environment. The
// original experiments were run against `claude-haiku-4-5` via the Messages
// API; the runs were billed to a Claude subscription rather than a metered
// API key, but the request shape is identical and any valid API key
// reproduces the study. We switched to this direct transport (decision 002)
// from an earlier SDK-spawns-CLI approach that cost ~90s/turn and injected a
// large fixed context prefix; direct calls are ~2s and carry no prefix, so
// M1 context accounting uses true per-call input_tokens.

const API_URL = 'https://api.anthropic.com/v1/messages';

export const MODEL = 'claude-haiku-4-5-20251001';

function apiKey() {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) throw new Error('ANTHROPIC_API_KEY is not set');
  return k;
}

export async function callLLM({ system, prompt, model = MODEL, maxTokens = 1500, maxRetries = 10 }) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model, max_tokens: maxTokens, system,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(120000),
      });
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
        costUsd: null,
      };
    } catch (err) {
      lastErr = err;
      // Network-level failures (fetch failed = DNS/TCP down) get a longer
      // floor: a multi-minute outage should stall runs, not kill them
      // (a mid-run outage once killed 7 runs at a short retry cap).
      const isNetwork = /fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(String(err?.message));
      const backoff = Math.min((isNetwork ? 15000 : 2000) * 2 ** attempt, 300000);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw new Error(`callLLM failed after ${maxRetries} attempts: ${lastErr?.message}`);
}

// Retained for API compatibility with the orchestrator's token-keeper hooks;
// no-ops under a standard API key (keys do not expire per-call).
export function refreshAuthToken() { return Promise.resolve(); }
export function tokenExpiryMs() { return Infinity; }

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
