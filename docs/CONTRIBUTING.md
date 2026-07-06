# Contributing to CLM
## Cognitive Landscape Model

Thank you for contributing. This guide mirrors the [PCMS contributing workflow](../../perceptual-cognitive-mapping-system/docs/CONTRIBUTING.md) adapted for this TypeScript monorepo.

## Code of Conduct

See [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- TypeScript familiarity

### Setup

```bash
git clone https://github.com/SynapticFour/cognitive-landscape-model.git
cd cognitive-landscape-model
npm install
npm run check
```

## Development Workflow

1. Branch from `main`: `feature/…` or `fix/…`
2. Keep changes focused; respect **layer boundaries**
3. Add or update tests in the relevant package or `tests/`
4. Update docs when behavior or public API changes
5. Run quality gate before PR:

```bash
npm run check
npm run verify
```

## Layer boundary rules (required)

- `@clm/landscape`, `@clm/dynamics`, `@clm/structural` **must not** import `@clm/interpretation` or `@clm/trajectory-explanation`
- `@clm/structural` **must not** import `@clm/landscape` (use `StateObservationSource` duck typing)
- No diagnostic labels in measurement layer code
- Interpretation plugins remain read-only — never mutate `CognitiveState`

Run `npm run test:boundaries` after changing imports.

## Coding standards

- Strict TypeScript; prefer explicit types
- Match existing naming and file layout in each package
- JSDoc for non-obvious public APIs
- Minimize scope — no drive-by refactors

## Testing

- Unit tests: `packages/*/src/**/__tests__/`
- Integration: `tests/integration/`
- Golden vectors: `tests/golden/`
- Boundaries: `tests/boundaries/`

## Documentation

Update as needed:

- `README.md` for user-facing changes
- `docs/ARCHITECTURE.md` for layer or dependency changes
- `CHANGELOG.md` under `[Unreleased]`
- `docs/ethics.md` if use-case boundaries change

## Pull requests

- Clear title and description
- `npm run check` green
- Note breaking changes explicitly
- Link related PCMS issues if integration-related

## Security

Report vulnerabilities privately — see [`SECURITY.md`](../SECURITY.md).

## Contact

[contact@synapticfour.com](mailto:contact@synapticfour.com)
