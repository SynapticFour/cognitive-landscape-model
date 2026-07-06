# Research action plan
## Cognitive Landscape Model (CLM)

Sequenced path from research prototype toward evidence-backed integration. Adjust timelines to funding and partner availability.

## Phase 0 — Foundation (current)

- [x] Layered TypeScript monorepo with boundary tests
- [x] Vector-based landscape API with PCMS preset
- [x] Dynamics simulation with structural modulation
- [x] End-to-end integration test (calibrate → simulate → explain → interpret)
- [x] Documentation and ethics framework aligned with PCMS governance

## Phase 1 — PCMS bridge (3–6 months)

- Publish stable adapter contract from PCMS pipeline output → `CognitiveState`
- Joint golden vectors between PCMS and CLM repos
- Document reproducible commit pins for paired releases
- Pilot: export anonymized PCMS sessions → offline CLM simulation (no cloud requirement)

## Phase 2 — Structural evidence (6–12 months)

- Pre-register hypotheses linking latent parameters to observed dimension patterns
- Collect N ≥ 150 per locale for calibration stability analysis
- Report posterior uncertainty and residual variance from `CalibrationEngine` on real data
- Sensitivity analysis: modulator roles vs simulation outcomes

## Phase 3 — Longitudinal & explanation (12–18 months)

- Compare simulated trajectories to repeated PCMS sessions (where ethically collected)
- Evaluate trajectory explanation narratives for researcher usability (not user-facing diagnosis)
- Maintain strict separation: mechanistic explanation ≠ worldview interpretation

## Phase 4 — Publication & governance

- Open methods paper: layer architecture, non-diagnostic stance, PCMS relationship
- OSF pre-registration for any human-subjects calibration study
- Release tags with changelog and validation status updates

## Non-goals

- Clinical diagnostic labels or ICD/DSM mapping in core packages
- Automated institutional decision support
- Replacing PCMS as the public-facing assessment product

See also [`VALIDATION_PROTOCOL.md`](./VALIDATION_PROTOCOL.md) and PCMS [`RESEARCH_ACTION_PLAN.md`](../../perceptual-cognitive-mapping-system/docs/RESEARCH_ACTION_PLAN.md).
