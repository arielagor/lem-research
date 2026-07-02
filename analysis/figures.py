"""Paper figures from results/*/metrics.json series.

Usage: python analysis/figures.py --filter t1500   (writes paper/figs/*.pdf)
"""
import argparse, json
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "results"
FIGS = ROOT / "paper" / "figs"
ARM_COLORS = {"A": "#999999", "B": "#4477aa", "LEM": "#cc3311"}
ARM_LABELS = {"A": "Control A (stateless)", "B": "Control B (episodic+RAG)", "LEM": "LEM (self-model)"}


def load(filter_str):
    runs = []
    for d in sorted(RESULTS.iterdir()):
        m = d / "metrics.json"
        if m.exists() and (not filter_str or filter_str in d.name):
            runs.append(json.loads(m.read_text()))
    return runs


def smooth(x, w=25):
    x = np.asarray(x, float)
    if len(x) < w:
        return x
    return np.convolve(x, np.ones(w) / w, mode="valid")


def per_arm_mean(runs, arm, series_key):
    seqs = [r["series"][series_key] for r in runs if r["arm"] == arm]
    if not seqs:
        return None
    n = min(len(s) for s in seqs)
    return np.mean([s[:n] for s in seqs], axis=0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--filter", default="")
    args = ap.parse_args()
    runs = load(args.filter)
    if not runs:
        raise SystemExit("no runs")
    FIGS.mkdir(parents=True, exist_ok=True)
    trigger = runs[0]["trigger"]

    # Fig 1: context tokens per turn (H1)
    fig, ax = plt.subplots(figsize=(6, 3.2))
    for arm in ["A", "B", "LEM"]:
        y = per_arm_mean(runs, arm, "ctxPerTurn")
        if y is not None:
            ax.plot(np.arange(len(smooth(y))), smooth(y), color=ARM_COLORS[arm], label=ARM_LABELS[arm], lw=1.6)
    ax.axvline(trigger, color="k", ls=":", lw=0.8)
    ax.set_xlabel("turn"); ax.set_ylabel("context tokens / turn (25-turn MA)")
    ax.legend(fontsize=8, frameon=False); fig.tight_layout()
    fig.savefig(FIGS / "fig1_ctx_tokens.pdf"); plt.close(fig)

    # Fig 2: adaptation — JSD + watcher pressure around the trigger (H2)
    fig, axes = plt.subplots(2, 1, figsize=(6, 4.4), sharex=True)
    for arm in ["A", "B", "LEM"]:
        conc = per_arm_mean(runs, arm, "concentration")
        watch = per_arm_mean(runs, arm, "watchers")
        if conc is not None:
            axes[0].plot(np.arange(len(smooth(conc))), smooth(conc), color=ARM_COLORS[arm], lw=1.4, label=ARM_LABELS[arm])
        if watch is not None:
            axes[1].plot(np.arange(len(smooth(watch))), smooth(watch), color=ARM_COLORS[arm], lw=1.4)
    for ax in axes:
        ax.axvline(trigger, color="k", ls=":", lw=0.8)
    axes[0].set_ylabel("agent predictability\n(watcher concentration)")
    axes[0].legend(fontsize=8, frameon=False)
    axes[1].set_ylabel("active watchers (of 4)")
    axes[1].set_xlabel("turn")
    fig.tight_layout(); fig.savefig(FIGS / "fig2_adaptation.pdf"); plt.close(fig)

    # Fig 3: net worth trajectories
    fig, ax = plt.subplots(figsize=(6, 3.2))
    for arm in ["A", "B", "LEM"]:
        y = per_arm_mean(runs, arm, "netWorth")
        if y is not None:
            ax.plot(np.arange(len(smooth(y))), smooth(y), color=ARM_COLORS[arm], label=ARM_LABELS[arm], lw=1.6)
    ax.axvline(trigger, color="k", ls=":", lw=0.8)
    ax.set_xlabel("turn"); ax.set_ylabel("net worth (25-turn MA)")
    ax.legend(fontsize=8, frameon=False); fig.tight_layout()
    fig.savefig(FIGS / "fig3_networth.pdf"); plt.close(fig)

    # Fig 4: memory artifact size over time (H1 compression evidence)
    fig, ax = plt.subplots(figsize=(6, 3.2))
    for arm in ["A", "B", "LEM"]:
        y = per_arm_mean(runs, arm, "artifactTokens")
        if y is not None:
            ax.plot(np.arange(len(y)), y, color=ARM_COLORS[arm], label=ARM_LABELS[arm], lw=1.6)
    ax.set_xlabel("turn"); ax.set_ylabel("memory artifact size (tokens)")
    ax.legend(fontsize=8, frameon=False); fig.tight_layout()
    fig.savefig(FIGS / "fig4_artifact.pdf"); plt.close(fig)

    print(f"figures written to {FIGS}")


if __name__ == "__main__":
    main()
