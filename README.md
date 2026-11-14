# Cognitive Landscape Model (CLM)

CLM is a library that represents ways of thinking as positions on continuous scales, and that can simulate how those positions move, without turning the result into a label.

For a researcher or an engineer who wants that model in TypeScript, separate from the public questionnaire that collects answers.

**Status: No public status is recorded.** The claims registry has no maturity stage for this repository. The npm version in `package.json` is `0.2.0`. That number is not a status. A draft report, CLRP-VR-2026-002, calls the engineering checks tier T1 and says psychometric validity is not this library's result. See [docs/STATUS.md](docs/STATUS.md).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What it does

- `packages/landscape` holds a cognitive state as coordinates. A coordinate here is a number on a continuous axis.
- `packages/dynamics` and `packages/structural` simulate change and a latent structure. `packages/trajectory-explanation` describes a simulated path. `packages/interpretation` reads a point through a frame and is marked non-causal.
- Boundary tests refuse to mix interpretation into the measurement packages (`tests/boundaries/`).
- Adapters in `@clm/landscape` can read output from the public questionnaire. The questionnaire is [PCMS](https://github.com/SynapticFour/perceptual-cognitive-mapping-system). This library does not require it. See [docs/RELATIONSHIP_TO_PCMS.md](docs/RELATIONSHIP_TO_PCMS.md).

The programme that states the principles is the [Cognitive Landscape Research Programme](https://github.com/SynapticFour/cognitive-landscape-research-programme).

## Limits

- Not a diagnostic instrument, not a medical device, and not medical advice. See [docs/ethics.md](docs/ethics.md).
- Not the public questionnaire, and not a store of anyone's answers.
- Package tests check the code. They are not an empirical sample. The draft framework report says psychometric tiers apply to the instrument, not to this library alone.
- When the library uses questionnaire coordinates, those coordinates are still at validation tier T0 (PCMS-VALIDATION-001).

The boundary is [docs/SCOPE.md](docs/SCOPE.md). The previous long README is kept at [docs/FROM-README.md](docs/FROM-README.md).

## Quick start

Prerequisites: Node.js 18 or newer, and npm.

```bash
npm install
npm run check
```

When it works, Vitest prints a passing summary. The same path, including `./setup.sh`, is in [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md).

## Documentation

Every file under `docs/` is listed in [docs/README.md](docs/README.md). The groups are a tutorial, how-to guides, reference, and explanation.

### Tutorial

- [Getting started](docs/GETTING-STARTED.md)
- [Local setup](docs/LOCAL_SETUP.md)

### How-to guides

- [Commands](docs/COMMANDS.md)
- [Contributing](docs/CONTRIBUTING.md)

### Reference

- [Evidence status](docs/STATUS.md)
- [What this is not](docs/SCOPE.md)
- [For evaluators](docs/FOR-EVALUATORS.md)
- [Relationship to the public questionnaire](docs/RELATIONSHIP_TO_PCMS.md)
- [Validation pointer](docs/VALIDATION_PROTOCOL.md)

### Explanation

- [Architecture](docs/ARCHITECTURE.md)
- [Whitepaper](docs/whitepaper.md)
- [Ethics](docs/ethics.md)

## Licence

This repository is under the MIT licence. The file is [LICENSE](LICENSE). That grant covers this software and the associated documentation files. There is no second licence file in this repository. This is not legal advice. The claims registry has no separate CLM licence sentence.

## Cite

Use [CITATION.cff](CITATION.cff). Prefer that file over a hand-copied line.

## Website

- Open research: [https://synapticfour.com/en/offene-forschung/](https://synapticfour.com/en/offene-forschung/)
- The base: [https://synapticfour.com/en/offene-forschung/unterbau/](https://synapticfour.com/en/offene-forschung/unterbau/)
- Technical profile: [https://synapticfour.com/en/technical/code/](https://synapticfour.com/en/technical/code/)

The same pages exist in German (`/de/offene-forschung/`, `/de/offene-forschung/unterbau/`, `/de/technik/code/`) and in French (`/fr/offene-forschung/`, `/fr/offene-forschung/unterbau/`, `/fr/technique/code/`).

The map of repositories: [profile/README.md](https://github.com/SynapticFour/.github/blob/main/profile/README.md).

Contact: [contact@synapticfour.com](mailto:contact@synapticfour.com)

Changelog: [CHANGELOG.md](CHANGELOG.md). Security: [SECURITY.md](SECURITY.md). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).
