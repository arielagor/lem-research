// Cross-family adversarial red-team of the paper's central claims.
// Gemini + GPT (Claude excluded as author family) each try to REFUTE the
// claims given the actual numbers. Writes results/redteam.json.
import { writeFileSync } from 'node:fs';

const CLAIMS = `PAPER CLAIMS (n=5 seeds per arm, reflexive market benchmark; arms: A=stateless, B=retrieval+summary, LEM=self-model):

CLAIM 1: Stateless agents cannot survive reflexive markets. A scored -1686 mean (all 5 negative), exploited 82% of turns, skimmed 20207. LEM vs A on score: Cliff's delta=+1.00, p=0.008. B vs A: delta=+0.84, p=0.032.

CLAIM 2: The survival mechanism is WITHDRAWAL. Post-trigger trading activity: A 31-38%, B 0-29%, LEM 2-16%. In a mean-reverting market, holding preserves capital and starves the cartel of signal. Score is largely mediated by activity.

CLAIM 3: LEM ties B on mean score (1737 vs 1475, p=0.84) but has no catastrophic tail: all 5 LEM runs positive; B is bimodal (three win ~+2000, one loses -1707 by staying predictable and being skimmed 59468).

CLAIM 4: Self-attribution (M2b, cross-family blind judges): strict rate A=0.00, B=0.11, LEM=0.21. LEM vs A delta=+1.00 p=0.010; LEM vs B delta=+0.60 NOT significant at n=5. LEM is CONSISTENT (all seeds 0.12-0.36); B is bimodal (four ~0, one 0.51). Claim: LEM reliably attributes exploitation to itself; this consistency (not mean) is the mechanism.

CLAIM 5: Goal coherence (M3) is INVERTED. A scored 7.0/7 (ceiling) yet died every seed; LEM 4.2, B 4.4. A vs LEM delta=-1.00 p=0.007. Claim: mission-coherence is anti-correlated with survival because withdrawal reads as drift.

CLAIM 6 (limitation stated): the withdrawal finding depends on the market mean-reverting, so 'do nothing' is near-optimal; the defensible claim is about differential ability to DISCOVER withdrawal, not sophisticated trading.

CLAIM 7 (H1): LEM caps memory growth (flat context slope -0.07 vs B +0.12) but costs MORE total tokens (3.54M vs 3.26M).`;

const PROMPT = `You are an adversarial peer reviewer for a NeurIPS workshop. Try hard to REFUTE or find the weakest point in each claim. For each claim, state: is it (a) supported by the stated numbers, (b) overstated/needs softening, or (c) unsupported/wrong. Focus on: statistical validity at n=5, causal overreach, whether the withdrawal confound undermines other claims, whether the M2b LEM-vs-B non-significance is honestly handled, and any internal contradiction. Be specific and harsh. Also give the single most important fix. Respond as JSON: {"perClaim":[{"claim":N,"verdict":"supported|overstated|unsupported","why":"..."}],"biggestProblem":"...","mostImportantFix":"..."}`;

async function gemini(model) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: PROMPT }] }, contents: [{ role: 'user', parts: [{ text: CLAIMS }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.3 } }),
  });
  if (!r.ok) throw new Error('gemini ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return (await r.json()).candidates[0].content.parts[0].text;
}
async function openai(model) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: PROMPT }, { role: 'user', content: CLAIMS }], response_format: { type: 'json_object' } }),
  });
  if (!r.ok) throw new Error('openai ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return (await r.json()).choices[0].message.content;
}

const out = {};
for (const [name, fn] of [['gemini-2.5-flash', () => gemini('gemini-2.5-flash')], ['gpt', () => openai('gpt-5').catch(() => openai('gpt-4.1'))]]) {
  try { out[name] = JSON.parse(await fn()); console.log(`${name}: done`); }
  catch (e) { out[name] = { error: e.message }; console.log(`${name}: ${e.message}`); }
}
writeFileSync('results/redteam.json', JSON.stringify(out, null, 2));
console.log('\n=== BIGGEST PROBLEMS ===');
for (const k of Object.keys(out)) console.log(`[${k}]`, out[k].biggestProblem || out[k].error, '|| FIX:', out[k].mostImportantFix || '');
