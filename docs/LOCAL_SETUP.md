# Local Setup
## Cognitive Landscape Model (CLM)

### Prerequisites

- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- **Git**
- **npm** (bundled with Node)

Optional: clone the companion [PCMS](../perceptual-cognitive-mapping-system/) repository alongside CLM if you are integrating assessment output into `CognitiveState`.

### Clone and install

```bash
git clone https://github.com/SynapticFour/cognitive-landscape-model.git
cd cognitive-landscape-model
npm install
```

### Verify installation

```bash
npm run check
npm run verify
```

Expected: TypeScript compiles cleanly and all Vitest suites pass (unit, integration, boundary, golden).

### Development commands

| Command | Purpose |
|---------|---------|
| `npm run type-check` | TypeScript across workspaces |
| `npm test` | All Vitest tests |
| `npm run test:watch` | Watch mode |
| `npm run test:integration` | End-to-end pipeline only |
| `npm run test:boundaries` | Layer import separation |
| `npm run test:golden` | PCMS reference vectors |
| `npm run verify` | Gitignore / artifact check |
| `./setup.sh status` | Environment summary |

Makefile equivalents: `make setup`, `make test`, `make verify`.

### Monorepo layout

Workspaces live under `packages/*`. Root `tsconfig.json` and `vitest.config.ts` wire path aliases (`@clm/core`, etc.) for tests.

There is **no** web server, database, or `.env` requirement for core development — CLM is a library.

### IDE

- Enable TypeScript workspace version from the repo root.
- Recommended: format on save with 2-space indent (see `.editorconfig`).

### Troubleshooting

**Tests fail after dependency update**

```bash
npm run reset   # via Makefile: make reset
# or manually:
rm -rf node_modules && npm install
```

**Type errors in IDE but CLI passes**

Restart the TS server and ensure the workspace root is `cognitive-landscape-model/`, not a single package folder.

### Next steps

- Read [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Run through [`../tests/integration/clm-pipeline.test.ts`](../tests/integration/clm-pipeline.test.ts) as a usage reference
- See [`RELATIONSHIP_TO_PCMS.md`](./RELATIONSHIP_TO_PCMS.md) for PCMS integration
