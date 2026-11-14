# Evidence status

No public maturity stage is recorded for this repository in the claims registry. The npm version in `package.json` is `0.2.0`. That number is not a status.

## What the draft report says

[CLRP-VR-2026-002](https://github.com/SynapticFour/cognitive-landscape-research-programme/blob/main/validation/CLRP-VR-2026-002-clm-framework-status.md) is a draft dated 2026-07-07. It names validation tier T1 for this library: engineering verification by unit tests, integration tests, and import boundaries. It says tiers of psychometrics apply to the instrument that uses the library, not to this library alone. The local pointer is [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md). That page asks readers not to copy the report's status text into this repository.

## What the code shows

`npm run check` type-checks the workspace and runs Vitest. Boundary tests live under `tests/boundaries/`. Integration tests live under `tests/integration/`. Golden vectors live under `tests/golden/`. Those tests check the code. They do not record an empirical sample.

When this library consumes coordinates from the public questionnaire, the questionnaire's own status applies. That status is tier T0 with no empirical sample yet (PCMS-VALIDATION-001), recorded in the programme report CLRP-VR-2026-001.
