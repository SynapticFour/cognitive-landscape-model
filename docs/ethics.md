# Ethics Framework v0.2
## Cognitive Landscape Model (CLM)

## Overview

The Cognitive Landscape Model (CLM) is a **research-grade TypeScript framework** for representing and simulating cognitive diversity using **continuous dimensional modeling**. It maintains strict separation between **measurement**, **mechanistic trajectory explanation**, and **non-causal worldview interpretation**.

This document outlines ethical expectations for **maintainers, integrators, and researchers** using CLM — whether standalone or alongside the [Perceptual & Cognitive Mapping System (PCMS)](../perceptual-cognitive-mapping-system/).

## Critical Non-Diagnostic Clarification

### NOT A MEDICAL OR CLINICAL TOOL

- **Research purpose only**: CLM is designed for scientific modeling, simulation, and self-understanding integrations — not clinical care delivery by itself.
- **No diagnostic claims**: The framework does not diagnose, treat, or assess medical conditions.
- **No clinical recommendations**: Outputs are not medical advice and must not replace professional healthcare.
- **Label-free measurement**: Core measurement layers use dimensional coordinates, not categorical diagnoses.

### Appropriate use cases

- **Research**: Studying dimensional models, feedback dynamics, and latent structure
- **Educational integration**: Teaching continuous models of cognitive variation
- **Self-understanding tools**: When wrapped by integrators with appropriate consent and copy (e.g. PCMS)
- **Simulation**: Exploring hypothetical trajectories under stated model assumptions

### Inappropriate use cases

- **Medical diagnosis** or screening for ADHD, autism, or other conditions using CLM outputs alone
- **Clinical decision making** or treatment planning
- **Employment screening** or hiring decisions
- **Educational placement**, streaming, or high-stakes tracking without local ethical review

## Non-Gatekeeping Guarantee

When CLM or derivatives are used in human-facing products:

- Results **must not** gate access to formal clinical assessment
- Results **must not** serve as evidence for or against clinical determination
- Results **must not** replace occupational, educational, or healthcare assessment
- Results **are not** designed to be shown to institutions as proof of cognitive traits

Deployments that use CLM-backed scores as gatekeepers violate this project's ethical guidelines and (if research data is collected) may require IRB/ethics reporting.

Forks that influence access to services using CLM outputs must remove Synaptic Four branding where misleading and clearly distinguish their use case.

## Layer separation (ethical requirement)

| Layer | May claim | Must not claim |
|-------|-----------|----------------|
| Landscape / Dynamics / Structural | Coordinate values, uncertainties, simulated transitions under model assumptions | Diagnosis, causality in the real world, moral worth |
| Trajectory explanation | Mechanistic account of **simulated** change | Real-world etiology, treatment need |
| Interpretation | How a frame **reads** coordinates | Causal explanation, modification of underlying state |

Measurement packages **must not import** interpretation or trajectory explanation (enforced by tests).

## Integrator responsibilities

CLM is a library — **integrators** who store or display human data must provide:

- Lawful basis and **informed consent** appropriate to jurisdiction
- **Privacy policy** and retention/deletion mechanisms
- Non-stigmatising language reviewed for locale and audience
- **Institutional ethics approval** when used with minors or in classrooms

Default documentation assumes **adult research participants** unless your fork explicitly adapts consent for other populations.

## Data minimization

- Do not commit participant data to this repository (`clm-research-data/` is gitignored by convention).
- Prefer pseudonymous identifiers in research exports.
- Separate simulation seeds and model configs from identifiable records when publishing methods.

## Classroom, youth, and international deployment

Using CLM through a user-facing integrator with **children or adolescents** requires institutional ethical approval, parental/guardian consent and/or assent per local law, and usually a **separate build** (age text, retention, facilitator flow).

Cross-country research requires per-jurisdiction lawful basis and information sheets — CLM does not provide turnkey legal compliance.

## Core ethical principles

### Respect for persons

- Voluntary participation where humans are involved
- Clear information about what layers do and do not claim
- Right to withdraw and delete data (integrator-implemented)

### Beneficence

- Maximize scientific and self-understanding value
- Minimize risk of misinterpretation — always surface disclaimers in user-facing layers
- Never present simulation as observation without labeling

### Justice

- Avoid using dimensional scores to deny services or opportunities
- Document limitations for under-represented locales before comparative claims

## Reporting concerns

- **Ethics / misuse**: [contact@synapticfour.com](mailto:contact@synapticfour.com)
- **Security vulnerabilities**: see [`SECURITY.md`](../SECURITY.md) — do not use public issues

## Related documents

- [`VALIDATION_PROTOCOL.md`](./VALIDATION_PROTOCOL.md)
- [`RELATIONSHIP_TO_PCMS.md`](./RELATIONSHIP_TO_PCMS.md)
- PCMS [`ethics.md`](../../perceptual-cognitive-mapping-system/docs/ethics.md) — full assessment-flow ethics

---

**Version**: v0.2  
**Status**: Research prototype — integrators must extend with deployment-specific consent and privacy artifacts
