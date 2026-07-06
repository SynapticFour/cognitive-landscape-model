# CLM Documentation Index
## Cognitive Landscape Model v0.2 (Research-Grade)

### Audience Guide

- **Partners / institutions / interested stakeholders:** focus on Validation, Ethics, and Relationship to PCMS.
- **Researchers:** use Validation Protocol, Research Action Plan, Whitepaper, and Architecture.
- **Maintainers / contributors:** use Contributing, Architecture, and package-level tests.

### Core Documentation

#### Getting Started

- **[Main README](../README.md)** — Complete overview and quick start
- **[Local Setup Guide](./LOCAL_SETUP.md)** — Development environment
- **[Command reference](./COMMANDS.md)** — npm, Makefile, and setup script
- **[Architecture](./ARCHITECTURE.md)** — Layer diagram, dependencies, testing strategy

#### Research Documentation

- **[Validation protocol](./VALIDATION_PROTOCOL.md)** — Honest status and Phase 1 bar (funders / IRB)
- **[Research action plan](./RESEARCH_ACTION_PLAN.md)** — Phased path to evidence and integration
- **[Whitepaper](./whitepaper.md)** — Technical and theoretical foundation
- **[Relationship to PCMS](./RELATIONSHIP_TO_PCMS.md)** — How CLM relates to the production assessment app
- **[Research materials](../lib/research/methodology.md)** — Methodology notes

#### Ethics and Compliance

- **[Ethics Framework v0.2](./ethics.md)** — Ethical guidelines for CLM and integrators

#### Package map

| Package | Role |
|---------|------|
| `@clm/core` | Shared types, provenance, `MeasurementBundle` |
| `@clm/landscape` | `CognitiveState`, `StateSpace`, PCMS preset |
| `@clm/dynamics` | Feedback, transitions, simulation |
| `@clm/structural` | Latent model, calibration, modulator |
| `@clm/trajectory-explanation` | Mechanistic trajectory narratives |
| `@clm/interpretation` | Non-causal worldview mappings |

### Quick Navigation

#### Developer resources

- **Setup script:** `./setup.sh`
- **Makefile:** `make setup`, `make test`, `make verify`
- **Quality gate:** `npm run check`
- **Integration tests:** `npm run test:integration`

#### Research data flow (library integrator)

1. **Landscape** — Observe or import coordinates into `CognitiveState`
2. **Structural** — Optionally calibrate latent posteriors from observed patterns
3. **Dynamics** — Simulate forward with optional structural modulation
4. **Trajectory explanation** — Generate mechanistic narrative over the run
5. **Interpretation** — Optionally map final state through a worldview plugin (non-causal)

See `tests/integration/clm-pipeline.test.ts` for a reference implementation.

### Quality Assurance

- TypeScript strict mode across the monorepo
- Vitest unit tests per package
- Boundary tests preventing interpretation imports in measurement layers
- Golden-vector tests for PCMS neutral reference data

---

**Last Updated**: July 6, 2026  
**Version**: v0.2 (Research-Grade)  
**Status**: Active development — run `npm run check` before releases
