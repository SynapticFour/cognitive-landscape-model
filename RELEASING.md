# Releasing

Semantic Versioning (`MAJOR.MINOR.PATCH`). Pin **git tag** (or commit SHA) for reproducible research — not npm version alone.

## Release process

1. Ensure CI is green on `main`.
2. Update `CHANGELOG.md` with the release date and summary.
3. Annotated tag: `git tag -a vX.Y.Z -m "vX.Y.Z"` && `git push origin vX.Y.Z`
4. Verify GitHub Actions **CI** workflow passes on the tag.
5. If publishing packages internally, bump workspace versions consistently under `packages/*/package.json`.

## Versioning rules

- `MAJOR`: breaking public API or layer-boundary contract changes
- `MINOR`: backward-compatible features
- `PATCH`: fixes and maintenance

## Quality gate (required before tag)

```bash
npm run check
npm run test
npm run verify
```

## What is not automated

- npm publish to a registry (this monorepo is `private: true` by default)
- Downstream integration with the PCMS web application (see [`docs/RELATIONSHIP_TO_PCMS.md`](./docs/RELATIONSHIP_TO_PCMS.md))
