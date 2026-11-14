# For evaluators

Read [STATUS.md](STATUS.md) and [SCOPE.md](SCOPE.md) before citing a test run.

## What a passing check is

`npm run check` is `tsc` and `vitest run`. The suites named in [ARCHITECTURE.md](ARCHITECTURE.md) are unit tests per package, integration tests, boundary tests, and golden vectors. A pass means those checks ran. It does not mean a human sample was measured.

The draft report [CLRP-VR-2026-002](https://github.com/SynapticFour/cognitive-landscape-research-programme/blob/main/validation/CLRP-VR-2026-002-clm-framework-status.md) calls that engineering verification tier T1, and it says psychometric tiers belong to the instrument. The report is a draft.

## What this library is for

CLM represents cognitive coordinates, can simulate them, and keeps measurement separate from interpretation. The layer diagram is [ARCHITECTURE.md](ARCHITECTURE.md). The relationship to the public questionnaire is [RELATIONSHIP_TO_PCMS.md](RELATIONSHIP_TO_PCMS.md).

## What not to conclude

Do not call a green test run a diagnosis, a clinical validation, or a certificate. Do not describe the public questionnaire as a production assessment product. Its validation tier is T0.
