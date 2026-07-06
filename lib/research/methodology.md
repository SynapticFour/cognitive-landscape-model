# CLM Research Methodology Notes

Companion to [`docs/whitepaper.md`](../docs/whitepaper.md) and [`docs/VALIDATION_PROTOCOL.md`](../docs/VALIDATION_PROTOCOL.md).

## Unit of analysis

- **State**: one `CognitiveState` snapshot (coordinates + uncertainty at `observedAt`)
- **Trajectory**: ordered states from `SimulationRunner` (simulated) or repeated assessments (empirical, integrator-provided)
- **Bundle**: optional `MeasurementBundle` linking landscape, dynamics, and structural refs for interpretation traceability

## Reproducibility

Pin for publications:

- Git commit SHA or release tag
- `DYNAMICS_VERSION`, `STRUCTURAL_VERSION`, package versions under `packages/*/package.json`
- Simulation `runId`, step count, random seeds for structural modulation
- PCMS assessment version if landscape input originates from PCMS

## Analysis workflow (recommended)

1. Import or construct landscape states
2. Document calibration inputs (`observedPatternsFromState` or manual patterns)
3. Record calibrated posteriors and fit scores
4. Run simulation with documented graph and engine config
5. Store `structuralSamples` when modulation enabled
6. Generate trajectory explanation for mechanistic narrative (research audience)
7. Apply interpretation plugins only with non-causal disclaimers (optional)

## Ethics cross-reference

Human subjects requirements are defined in [`docs/ethics.md`](../docs/ethics.md). CLM does not implement consent UI — integrators must.

## Related PCMS materials

When CLM consumes PCMS output, cite PCMS study design and validation status from the PCMS repository (`lib/research/`, `docs/VALIDATION_PROTOCOL.md`).
