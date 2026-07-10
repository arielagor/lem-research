# Zenodo DOI — ready-to-publish (no endorsement gate)

Zenodo (CERN) mints a permanent DOI with no gatekeeping. Two routes; the GitHub route is cleanest since the repo is already public.

## Route 1 (recommended): GitHub release -> auto-DOI
1. Log in at https://zenodo.org (use "Log in with GitHub" or ORCID).
2. Go to https://zenodo.org/account/settings/github/ and flip the toggle **ON** for `arielagor/lem-research`.
3. Tell me it's toggled on. I'll create a GitHub Release (tag `v1.0`), which Zenodo auto-archives and issues a DOI for the whole artifact (paper + code + logs).
   - The DOI then appears on the Zenodo GitHub settings page and in a badge you can add to the repo README.
- Note: the toggle MUST be on **before** the release, or Zenodo won't catch it. That's the one ordering constraint.

## Route 2: direct upload of the PDF
1. Log in at https://zenodo.org -> "New upload".
2. Upload `paper/main.pdf`.
3. Fill the metadata below.
4. Publish -> DOI issued immediately.

## Metadata (both routes)

- **Title:** Learning to Withdraw: Reflexive Environments as a Benchmark for Long-Horizon Agent Memory
- **Authors:** Ariel Agor (Independent Researcher); ORCID if you have one
- **Resource type:** Publication -> Preprint
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Keywords:** LLM agents, agent memory, reflexive environments, benchmark, self-attribution, multi-agent systems, performative prediction, long-horizon evaluation
- **Related identifier:** the GitHub repo (https://github.com/arielagor/lem-research) as "is supplemented by"
- **Description:** (paste the abstract from ARXIV_SUBMISSION.md)

## Why do this even with arXiv pending
- The repo is already public (citable by URL + commit), but a Zenodo DOI is a permanent, versioned, formally-citable record you get **today**, with zero endorsement gate.
- arXiv can follow once endorsed; you can list the Zenodo DOI in the arXiv comments and vice-versa.
