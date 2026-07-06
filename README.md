# Cognitive Landscape Model (CLM) v0.2

**Research-Grade Layered Architecture for Continuous Cognitive Profiling**

**Short project description:**  
`Research-grade TypeScript framework for modeling cognition as a continuous multidimensional landscape — measurement layers separated from interpretation, not diagnosis, not labels.`

A scientifically grounded **library and research codebase** for representing cognitive state as continuous vectors, simulating temporal dynamics, calibrating latent structure, explaining trajectories mechanistically, and mapping coordinates into optional worldview frames for **research and educational self-understanding** (not clinical diagnosis).

> **Research Prototype | MIT License | Not a diagnostic instrument**
>
> CLM maps cognitive tendencies as continuous dimensional profiles — not labels, not diagnoses.
> It is designed for open research, simulation, and integration with instruments such as PCMS.
> Results should never be used for institutional decisions about individuals.
>
> [Why no labels? →](#design-philosophy)

---

### Validation status (researchers & funders)

CLM is a **modeling framework**, not a finished assessment instrument. Layer implementations are unit- and integration-tested, but **publication-standard psychometric validation** of any downstream instrument built on CLM remains the responsibility of that instrument’s operators. For an explicit statement of current limits and a research roadmap, see **[`docs/VALIDATION_PROTOCOL.md`](./docs/VALIDATION_PROTOCOL.md)** and **[`docs/RESEARCH_ACTION_PLAN.md`](./docs/RESEARCH_ACTION_PLAN.md)**.

### For partners and interested institutions

Start with these documents:

- **Validation status:** [`docs/VALIDATION_PROTOCOL.md`](./docs/VALIDATION_PROTOCOL.md)
- **Ethics and appropriate use:** [`docs/ethics.md`](./docs/ethics.md)
- **Relationship to PCMS:** [`docs/RELATIONSHIP_TO_PCMS.md`](./docs/RELATIONSHIP_TO_PCMS.md)
- **Architecture:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- **Documentation index:** [`docs/README.md`](./docs/README.md)

---

### Version labels

Research documentation refers to protocol **v0.2** for reproducibility. The npm semver in `package.json` is maintained separately — pin **git commit** (or release tags, when published) for reproducible research, not the npm version alone.

## Design Philosophy

### Dimensions, not diagnoses

CLM deliberately avoids assigning diagnostic labels. This is a considered scientific and ethical choice, not a gap.

**Scientifically:** Human cognitive traits are continuously distributed. Dimensional models consistently outperform categorical models in predictive validity (Kotov et al., 2017 — HiTOP; Insel et al., 2010 — RDoC).

**In cross-cultural contexts:** A clinical label assigned by a Western instrument applied without local validation can result in stigma, exclusion, or harm. CLM is designed to keep **measurement** (coordinates) separate from **interpretation** (worldview frames), so integrators can choose responsible framing for their context.

**For novel discovery:** By not forcing cognitive variation into pre-existing categories, layered models can represent patterns that categorical instruments mask.

### What CLM is not a replacement for

CLM does not replace:

- Clinical diagnostic assessment
- Neuropsychological testing
- Accommodation or service eligibility assessments

### Two explanation models (do not conflate)

| Layer | Question answered | Causal? |
|-------|-------------------|---------|
| **Trajectory explanation** (`@clm/trajectory-explanation`) | How did coordinates change over simulated time? | Mechanistic / causal within the model |
| **Interpretation** (`@clm/interpretation`) | How does a worldview frame *read* a point? | Explicitly **non-causal** |

## Research-Grade Features

### Measurement stack

- **Landscape** — `CognitiveState`, `StateSpace`, uncertainty, trajectory serialization; PCMS F–V preset
- **Dynamics** — `FeedbackGraph`, `TransitionEngine`, `SimulationRunner`, attractors; optional structural modulation each step
- **Structural** — latent parameters, probabilistic many-to-many influences, `CalibrationEngine`, `ProbabilisticDynamicsModulator`

### Explanation stack (read-only consumers)

- **Trajectory explanation** — time-aware causal chains over simulation runs
- **Interpretation** — scientific/psychological, systems-theory, and optional Christian theological plugins

### Engineering quality

- **Layer separation** enforced by boundary tests (`tests/boundaries/`)
- **End-to-end pipeline test** (`tests/integration/clm-pipeline.test.ts`)
- **Golden vectors** for PCMS neutral profile (`tests/golden/`)
- **MIT licensed**, Synaptic Four governance docs aligned with [PCMS](../perceptual-cognitive-mapping-system/)

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### One-command setup

```bash
./setup.sh
```

Or via Makefile:

```bash
make setup
```

### Manual setup

```bash
git clone https://github.com/SynapticFour/cognitive-landscape-model.git
cd cognitive-landscape-model
npm install
npm run check
```

### Quality gate (recommended before release)

```bash
npm run check      # type-check + all tests
npm run verify     # gitignore / artifact check
npm run test:integration
npm run test:golden
```

## Architecture

Five packages plus shared core — see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

```
packages/
  core/                    # Provenance, MeasurementBundle, unit-interval types
  landscape/               # CognitiveState, StateSpace, PCMS preset
  dynamics/                # Feedback, transitions, simulation
  structural/              # Latent model, calibration, modulator
  trajectory-explanation/  # Mechanistic trajectory narratives
  interpretation/          # Non-causal worldview mappings
tests/
  boundaries/              # Import-graph separation
  integration/             # Full pipeline
  golden/                  # PCMS reference vectors
```

## Relationship to PCMS

The [Perceptual & Cognitive Mapping System](../perceptual-cognitive-mapping-system/) is the production **web assessment platform**. CLM extracts **measurement semantics** into `@clm/landscape` so dynamics, structure, and explanation can evolve without mixing narrative into scoring code. See [`docs/RELATIONSHIP_TO_PCMS.md`](./docs/RELATIONSHIP_TO_PCMS.md).

## Privacy & data handling

CLM is a **library** — it does not collect or store participant data by itself. Integrators who persist states or simulation outputs must provide their own privacy policy, consent, and retention controls. See [`docs/ethics.md`](./docs/ethics.md).

## Support

### Contact

Questions or security concerns: [contact@synapticfour.com](mailto:contact@synapticfour.com)

## Governance

- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](./SECURITY.md)
- Code of conduct: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- Releasing: [`RELEASING.md`](./RELEASING.md)

## Legal Notice

This repository documents technical capabilities and research operating guidance. It is not legal advice and does not by itself provide regulatory certification or compliance guarantees. Compliance outcomes depend on operator configuration, contracts, and organisational controls.

## License

This project is licensed under the MIT License — see [`LICENSE`](./LICENSE).

---

**Important**: This system is for **research, education, and self-understanding** only. It is **not** a medical, diagnostic, or therapeutic tool, **not** a selection or placement test, and **not** a substitute for professional advice. Deploying derived tools with young people or in schools requires **local ethical review**, appropriate consent or assent, and often a customised build. For health concerns, people should consult qualified professionals in their own context.
