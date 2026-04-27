# Development

This document defines local workflow for extractor-first development.

## Workflow

1. Align on behavior in `spec/specord-v1-extractor-spec.md`.
2. Implement extractor changes in small increments.
3. Run fixture extraction against `examples/nestjs-api`.
4. Compare output against expected acceptance matrix and snapshots.
5. Add or update diagnostics when behavior is intentionally unresolved.

## Test and snapshot expectations

- Snapshot output must remain deterministic.
- Changes to ordering, naming, or diagnostics require explicit spec updates.
- Fixture regressions should be treated as high-priority breakages.

## Recommended verification loop

```bash
specord inspect --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
```

Then verify:

- Route/method coverage
- DTO schema extraction
- Required unresolved diagnostics
- Snapshot stability across repeated runs

## Design changes

For non-trivial changes to extraction behavior, open an RFC using the repository RFC issue template before implementation.
