# Relationship to PCMS
## Cognitive Landscape Model ↔ Perceptual & Cognitive Mapping System

## Roles

| Project | Role |
|---------|------|
| **[PCMS](../../perceptual-cognitive-mapping-system/)** | Production web application — adaptive questionnaire, consent, results UI, optional Supabase storage |
| **CLM (this repo)** | Research library — layered measurement, simulation, structural calibration, explanation |

PCMS answers: *“What coordinates does this person’s response pattern produce right now?”*  
CLM answers: *“How can we represent, evolve, constrain, and explain coordinates as a landscape over time — without mixing in worldview or diagnosis?”*

## Shared semantics

- PCMS routing dimensions **F–V** are defined in both projects.
- `@clm/landscape` provides:
  - `createPcmsStateSpace()` / `createPcmsPipelineStateSpace()`
  - `cognitiveStateFromPcmsPipeline()` / `cognitiveStateFromLandscapeSnapshot()`
  - `createPcmsStructuralModel()` in `@clm/structural` for F–V latent presets

## Dependency direction

```
PCMS (app)  ──optional export──▶  CLM (@clm/landscape)
CLM         ──never imports──✕   PCMS application code
```

CLM must remain usable **without** the PCMS web stack. PCMS may adopt CLM packages in future releases; that is an integration decision, not a runtime requirement today.

## Legacy parallel APIs

Early CLM prototypes mirrored PCMS snapshot types (`LandscapeSnapshot`, legacy dynamics/structural snapshots). These remain **deprecated**; new work should use `CognitiveState` and modern layer APIs. See root README migration table.

## Licensing and governance

Both projects use the **MIT License** and Synaptic Four governance documents (security, code of conduct, ethics framing). Forks and integrators inherit responsibility for their own deployments — see [`ethics.md`](./ethics.md).

## Where to start integrating

1. Run PCMS locally or use exported session JSON / pipeline output.
2. Convert to `CognitiveState` via `@clm/landscape` bridges.
3. Optionally run `calibrateFromCognitiveStates()` → modulated `SimulationRunner` → explanation / interpretation.

Reference: [`tests/integration/clm-pipeline.test.ts`](../tests/integration/clm-pipeline.test.ts)
