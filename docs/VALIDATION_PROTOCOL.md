# CLM validation protocol

**Audience:** researchers, institutional reviewers, and funders evaluating the Cognitive Landscape Model (CLM).

This document states what evidence **exists today**, what **does not**, and what a **minimum credible path** toward publication-grade use looks like. CLM is a **layered modeling framework**; any production instrument (e.g. built on PCMS + CLM) requires its own validation programme.

---

## Current status (be honest)

### Framework vs instrument

CLM provides **typed layers**, **simulation mechanics**, and **separation of measurement from interpretation**. It does **not** by itself constitute a validated psychometric instrument. Package tests demonstrate **internal consistency of code**, not **external validity** of scores in human populations.

### Structural and dynamics parameters

Latent priors, influence weights, and dynamics roles in presets (`createAbstractStructuralModel`, `createPcmsStructuralModel`) are **design- and literature-informed hypotheses**, not parameters estimated from a dedicated CLM normative corpus.

### PCMS integration

When CLM consumes PCMS dimensions via `@clm/landscape`, **PCMS validation status applies to the assessment input**. See PCMS [`VALIDATION_PROTOCOL.md`](../../perceptual-cognitive-mapping-system/docs/VALIDATION_PROTOCOL.md) in the companion repository.

### Simulation outputs

Simulated trajectories are **model outputs** under stated feedback and structural assumptions. They must not be presented as observed longitudinal data without explicit labeling.

---

## Validation roadmap (Phase 1 — minimum for research publication using CLM)

1. **Define the instrument boundary** — Which layers are in scope (landscape only vs full pipeline)?
2. **Pilot sample** — Document N, locale, consent, and inclusion criteria for any human data entering the pipeline.
3. **Reliability** — Report sample-based reliability for **observed dimensions** of the integrator’s instrument, not CLM unit tests.
4. **Simulation validation** — Where simulations inform claims, report sensitivity to priors, seeds, and graph specification.
5. **Interpretation firewall** — Demonstrate that worldview narratives are optional, non-causal, and never fed back into measurement code (CLM boundary tests are necessary but not sufficient for your deployment audit).

---

## What CLM CANNOT currently claim

- That simulated trajectories **predict real-world outcomes** without empirical longitudinal studies.
- That structural calibration **identifies latent traits** in a clinical or diagnostic sense.
- That interpretation plugins **explain causes** of measured coordinates (they explicitly do not).
- That presets are **locally normed** in any geography without integrator-run norm studies.

---

## What integrators need that the library does not provide

- Privacy policy, consent flows, and retention rules for stored states
- IRB / ethics approval for human subjects research
- Locale-appropriate information sheets and non-stigmatising copy
- Decision rules for any institutional use (employment, placement, clinical triage) — **out of scope and discouraged**

---

## Contact

Research and partnership enquiries: [contact@synapticfour.com](mailto:contact@synapticfour.com)
