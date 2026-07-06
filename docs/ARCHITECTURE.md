# CLM Architecture

## Layer diagram

```mermaid
flowchart TB
  subgraph measurement [Measurement layers — no worldview content]
    L[Landscape Layer<br/>@clm/landscape]
    D[Dynamics Layer<br/>@clm/dynamics]
    S[Structural Layer<br/>@clm/structural]
  end

  subgraph explanation [Explanation layers — read-only consumers]
    T[Trajectory Explanation<br/>@clm/trajectory-explanation]
    I[Interpretation Layer<br/>@clm/interpretation]
  end

  C[@clm/core<br/>contracts & provenance]

  L --> C
  D --> C
  S --> C
  D --> L
  D --> S
  T --> C
  T --> D
  T --> L
  T --> S
  I --> C
  I --> L
  I -. optional bundle .-> D
  I -. optional bundle .-> S

  L -x I
  L -x T
  D -x I
  S -x I
  S -x T
```

Solid arrows: allowed compile-time dependencies.  
Dashed arrows: optional cross-layer references via `MeasurementBundle` at interpretation time.  
Cross marks: measurement layers must never import interpretation or trajectory explanation.

## Layer responsibilities

### Landscape Layer (`@clm/landscape`)

Continuous multidimensional state vectors. The initial instrument is **PCMS** (ten routing dimensions F–V on the unit interval, plus per-dimension uncertainty).

**Primary API:** `StateSpace`, `CognitiveState`, trajectory serialization (`clm-landscape-trajectory`).  
**Legacy:** `LandscapeSnapshot` — deprecated; use `cognitiveStateFromPcmsPipeline()` or `createPcmsStateSpace()`.  
**Must not contain:** narrative labels, diagnostic categories, worldview framing.

### Dynamics Layer (`@clm/dynamics`)

Temporal evolution over `CognitiveState` vectors: directed influences, feedback loops, attractor pull, discrete-time integration.

**Primary API:** `FeedbackGraph`, `TransitionEngine`, `SimulationRunner`.  
**Structural integration:** `SimulationRunConfig.structuralModulation` applies `ProbabilisticDynamicsModulator` samples each step via `applyStructuralInfluence`.  
**Legacy:** `Trajectory`, `DynamicsSnapshot` — deprecated.

### Structural Layer (`@clm/structural`)

Slow-moving latent structure: probabilistic many-to-many influences from hidden parameters to observed dimensions.

**Primary API:** `StructuralModel`, `CalibrationEngine`, `ProbabilisticDynamicsModulator`.  
**Presets:** `createAbstractStructuralModel()` (v1–v4), `createPcmsStructuralModel()` (F–V).  
**Calibration helpers:** `observedPatternsFromState()`, `calibrateFromCognitiveStates()`.  
**Legacy:** `StructuralPrior`, `ConstraintSet` — deprecated.

### Trajectory Explanation (`@clm/trajectory-explanation`)

Mechanistic bridge between landscape snapshots and dynamics transitions. Produces time-aware causal chains (influences, loops, attractors, structural context) without mutating state.

**Distinct from interpretation:** explains *how* coordinates changed, not *what they mean* in a worldview frame.

### Interpretation Layer (`@clm/interpretation`)

Maps measurement coordinates into **worldview frames** for human-readable reading. Mappings are explicitly **non-causal**.

**Primary API:** `interpret(state, worldview)`.  
**Optional context:** `InterpretOptions.measurementBundle` → `InterpretationNarrative.measurementContext`.  
**Legacy:** `interpretMeasurement()` — deprecated.

## Core contracts (`@clm/core`)

| Type | Purpose |
|------|---------|
| `Provenance` | Version, layer id, instrument id, timestamp |
| `LayerId` | `'landscape' \| 'dynamics' \| 'structural' \| 'interpretation'` |
| `MeasurementBundle` | Immutable snapshot container for cross-layer handoff |
| `createMeasurementBundleFromTrajectory()` | Builds bundle refs from simulation metadata |
| `UnitInterval` | Branded numeric domain [0, 1] for scores |

## Dependency matrix

| Package | May depend on |
|---------|----------------|
| `@clm/core` | (none) |
| `@clm/landscape` | `@clm/core` |
| `@clm/dynamics` | `@clm/core`, `@clm/landscape`, `@clm/structural` |
| `@clm/structural` | `@clm/core` |
| `@clm/trajectory-explanation` | `@clm/core`, `@clm/landscape`, `@clm/dynamics`, `@clm/structural` |
| `@clm/interpretation` | `@clm/core`, `@clm/landscape`, `@clm/dynamics`, `@clm/structural` |

## Testing strategy

- **Unit tests** per package (`packages/*/src/**/__tests__/`).
- **Integration tests** in `tests/integration/` — full calibrate → simulate → explain → interpret pipeline.
- **Boundary tests** in `tests/boundaries/` — verify measurement packages cannot import interpretation or trajectory explanation.
- **Golden-vector tests** in `tests/golden/` — PCMS neutral profile, zero confidence, and state-space manufacturing.

## Future integration with PCMS app

Adapters in `@clm/landscape` (`pcms-adapter.ts`, `cognitive-state-bridge.ts`) convert PCMS pipeline output into `CognitiveState`. The production PCMS app can emit modern state vectors without pulling in dynamics, structural, or interpretation code.
