# CLM Command Reference

Single source of truth for local project commands.

## Core npm commands

| Command | Purpose |
|---------|---------|
| `npm run setup` | Install dependencies, run tests, verify gitignore |
| `npm run type-check` | TypeScript across the monorepo |
| `npm run test` | All Vitest suites (unit, integration, boundary, golden) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Tests with V8 coverage report |
| `npm run test:integration` | End-to-end pipeline tests only |
| `npm run test:boundaries` | Layer import separation tests |
| `npm run test:golden` | PCMS golden-vector tests |
| `npm run check` | `type-check` + `test` |
| `npm run verify` | Gitignore / artifact verification |
| `npm run clean` | Remove build and coverage artifacts |
| `npm run status` | Node/npm and git status summary |

## Gate recommendations

- **Default quality gate:** `npm run check && npm run verify`
- **Pre-release gate:** `npm run check && npm run test:coverage && npm run verify`
- **Focused debugging:** `npm run test:integration` or `npm run test:boundaries`

## Makefile wrappers

| Command | Purpose |
|---------|---------|
| `make setup` | Install + check + verify |
| `make test` | Same as `npm run test` |
| `make check` | Same as `npm run check` |
| `make verify` | Same as `npm run verify` |
| `make clean` | Remove artifacts |
| `make reset` | Remove `node_modules` and reinstall |

## Setup script

```bash
./setup.sh          # default: full setup
./setup.sh install  # npm install only
./setup.sh check    # type-check + test
./setup.sh verify   # gitignore check
./setup.sh clean    # remove artifacts
./setup.sh status   # environment summary
```
