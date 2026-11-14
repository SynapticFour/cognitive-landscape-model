# Getting started

Prerequisites: Node.js 18 or newer, and npm. Nothing in this tutorial needs another repository. The public questionnaire, when you want it, is [PCMS](https://github.com/SynapticFour/perceptual-cognitive-mapping-system).

## Check the library

```bash
npm install
npm run check
```

`npm run check` runs `tsc -p tsconfig.json` and then `vitest run`. When it works, the type check is silent and Vitest prints a passing summary.

`./setup.sh` does the same install, then the check, then `./verify-gitignore.sh`. When that script finishes, it prints `CLM setup complete`.

The longer notes are in [LOCAL_SETUP.md](LOCAL_SETUP.md). Commands are in [COMMANDS.md](COMMANDS.md).

## What you should not expect

The check does not start a questionnaire, and it does not collect answers. A passing test is engineering verification of this library. It is not a psychometric result. See [STATUS.md](STATUS.md).
