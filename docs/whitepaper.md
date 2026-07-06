# CLM Whitepaper (Technical Foundation)
## Cognitive Landscape Model v0.2

## Abstract

The Cognitive Landscape Model (CLM) formalizes cognition as a **continuous multidimensional landscape**: a vector of coordinates at each time point, evolving under feedback dynamics, constrained by latent structure, optionally explained mechanistically over simulated time, and optionally **read** through non-causal worldview frames. CLM enforces **measurement ≠ interpretation** at compile time and in project governance.

## 1. Motivation

Categorical labels (diagnostic or informal) collapse continuous variation and carry cultural risk. CLM provides a **layered architecture** so researchers can:

1. Represent state (`@clm/landscape`)
2. Simulate change (`@clm/dynamics` + `@clm/structural`)
3. Explain simulated trajectories (`@clm/trajectory-explanation`)
4. Map coordinates into human-readable frames (`@clm/interpretation`) without causal claims

## 2. Layer definitions

### 2.1 Landscape

- **Object**: `CognitiveState` — immutable normalized coordinates + per-dimension uncertainty
- **Space**: `StateSpace` — dimension metadata, normalization, manufacturing
- **PCMS preset**: ten routing axes F–V on [0, 1]

### 2.2 Dynamics

- **Graph**: directed influences + optional feedback loops + delay
- **Engine**: discrete-time integration with damping and attractor pull
- **Runner**: multi-step simulation; optional per-step structural modulation

### 2.3 Structural

- **Model**: latent parameters with priors/posteriors
- **Influences**: probabilistic many-to-many weights to observed dimensions
- **Calibration**: soft fit from observed patterns (regularized, non-collapsing)
- **Modulator**: stochastic draws → step size, damping, drift modifiers

### 2.4 Trajectory explanation

- Consumes simulation output read-only
- Attributes step changes to influences, loops, attractors, structural context
- **Causal within the model** — not about real-world etiology

### 2.5 Interpretation

- Plugins: scientific/psychological, systems-theory, optional Christian theological
- **Non-causal**, read-only, with explicit disclaimers
- Optional `MeasurementBundle` context for cross-layer traceability

## 3. Design invariants

1. Measurement packages never import interpretation or trajectory explanation.
2. No diagnostic category names in measurement layer source (boundary tests).
3. Legacy snapshot APIs deprecated in favor of `CognitiveState`.
4. Provenance attached to published artifacts via `@clm/core`.

## 4. PCMS relationship

PCMS produces assessment coordinates; CLM generalizes downstream modeling. See [`RELATIONSHIP_TO_PCMS.md`](./RELATIONSHIP_TO_PCMS.md).

## 5. Validation stance

CLM tests verify **software correctness**. Psychometric validity of any human-facing instrument requires a separate evidence programme — see [`VALIDATION_PROTOCOL.md`](./VALIDATION_PROTOCOL.md).

## 6. Future work

- Unified feedback-loop mathematics in `TransitionEngine`
- Per-step structural sample attribution in trajectory explanation
- Published PCMS ↔ CLM adapter version matrix
- Empirical calibration of structural presets on normative samples

## References (indicative)

- Haslam (2003); Haslam et al. (2020) — categorical vs dimensional constructs
- Kotov et al. (2017) — HiTOP
- Insel et al. (2010) — RDoC

## License

MIT — see [`LICENSE`](../LICENSE).
