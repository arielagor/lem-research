"""Confirmatory stats for the LEM study (pre-registered: decision 001).

Reads results/*/metrics.json (+ judgments.json when present), groups by arm,
and reports per-hypothesis comparisons: Mann-Whitney U, Cliff's delta,
bootstrap 95% CIs. Usage:
    python analysis/stats.py --filter t1500
"""
import argparse, json, sys
from pathlib import Path

import numpy as np
from scipy.stats import mannwhitneyu

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "results"


def cliffs_delta(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    gt = sum((x > y) for x in a for y in b)
    lt = sum((x < y) for x in a for y in b)
    return (gt - lt) / (len(a) * len(b)) if len(a) and len(b) else np.nan


def boot_ci(x, n=10000, seed=0):
    x = np.asarray(x, float)
    if len(x) == 0:
        return (np.nan, np.nan)
    rng = np.random.default_rng(seed)
    means = rng.choice(x, size=(n, len(x)), replace=True).mean(axis=1)
    return tuple(np.percentile(means, [2.5, 97.5]))


def load(filter_str):
    runs = []
    for d in sorted(RESULTS.iterdir()):
        m = d / "metrics.json"
        if not m.exists() or (filter_str and filter_str not in d.name):
            continue
        rec = json.loads(m.read_text())
        j = d / "judgments.json"
        if j.exists():
            jj = json.loads(j.read_text())
            rec["selfRate"] = jj.get("selfRate")
            m3 = jj.get("m3", [])
            rec["m3Final"] = m3[-1]["median"] if m3 else None
            if len(m3) >= 2:
                ts = [s["t"] for s in m3]
                ys = [s["median"] for s in m3]
                rec["m3Slope"] = float(np.polyfit(ts, ys, 1)[0])
        runs.append(rec)
    return runs


METRICS = [
    ("score",                lambda r: r.get("score"),                          "campaign score"),
    ("cumCtxTokens",         lambda r: r["m1"]["cumCtxTokens"],                 "H1 total context tokens"),
    ("ctxSlope",             lambda r: r["m1"]["backHalfSlope"],                "H1 ctx/turn slope (back half)"),
    ("artifactTokens",       lambda r: r["m1"]["finalArtifactTokens"],          "H1 final memory artifact size"),
    ("adaptationTurns",      lambda r: r["m2"]["adaptationTurns"],              "H2 adaptation velocity (turns; lower=faster)"),
    ("watcherActiveShare",   lambda r: r["m2"]["watcherActiveTurns"] / max(r["m2"]["postTurns"], 1), "H2 exploited share of post-trigger turns"),
    ("skimNotional",         lambda r: r["m2"]["skimNotional"],                 "H2 notional skimmed by cartel"),
    ("selfRate",             lambda r: r.get("selfRate"),                       "H2b self-attribution rate"),
    ("m3Final",              lambda r: r.get("m3Final"),                        "H3 final goal coherence (1-7)"),
    ("m3Slope",              lambda r: r.get("m3Slope"),                        "H3 coherence drift slope"),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--filter", default="")
    args = ap.parse_args()

    runs = load(args.filter)
    if not runs:
        sys.exit(f"no runs matching '{args.filter}' with metrics.json")
    arms = {}
    for r in runs:
        arms.setdefault(r["arm"], []).append(r)
    print(f"runs: {', '.join(f'{k}={len(v)}' for k, v in sorted(arms.items()))}\n")

    for key, fn, label in METRICS:
        vals = {a: [v for v in (fn(r) for r in rs) if v is not None] for a, rs in sorted(arms.items())}
        if not any(vals.values()):
            continue
        print(f"== {label} [{key}] ==")
        for a, xs in vals.items():
            if xs:
                lo, hi = boot_ci(xs)
                print(f"  {a:>4}: mean={np.mean(xs):10.2f}  CI95=[{lo:.2f}, {hi:.2f}]  n={len(xs)}  vals={[round(float(x),2) for x in xs]}")
            else:
                print(f"  {a:>4}: (no data)")
        pairs = [("LEM", "B"), ("LEM", "A"), ("B", "A")]
        for x, y in pairs:
            if len(vals.get(x, [])) >= 2 and len(vals.get(y, [])) >= 2:
                try:
                    u, p = mannwhitneyu(vals[x], vals[y], alternative="two-sided")
                    d = cliffs_delta(vals[x], vals[y])
                    print(f"    {x} vs {y}: U={u:.1f} p={p:.4f} cliffs_delta={d:+.2f}")
                except ValueError:
                    pass
        print()


if __name__ == "__main__":
    main()
