# Development

This document defines local workflow for Specord V1 development.

## Workflow

1. Align on behavior in `spec/specord-v1-extractor-spec.md` and `spec/Phase-2-real-world-nestjs-openapi-spec.md`.
2. Implement extractor/emitter changes in small increments.
3. Run fixture extraction against `examples/nestjs-api`.
4. Run OpenAPI generation against `examples/nestjs-api` and `examples/nestjs-realworld`.
5. Compare output against expected acceptance matrices and snapshots.
6. Add or update diagnostics when behavior is intentionally unresolved.

## Test and snapshot expectations

- Snapshot output must remain deterministic.
- Changes to ordering, naming, or diagnostics require explicit spec updates.
- Fixture regressions should be treated as high-priority breakages.

## Recommended verification loop

```bash
pnpm.cmd inspect -- --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
pnpm.cmd generate -- --project examples/nestjs-realworld/tsconfig.json --root examples/nestjs-realworld/src --pretty
```

Then verify:

- Route/method coverage
- DTO schema extraction
- Required unresolved diagnostics
- OpenAPI 3.1 validation
- Swagger-compatible metadata harvesting
- Snapshot stability across repeated runs

## Design changes

For non-trivial changes to extraction behavior, open an RFC using the repository RFC issue template before implementation.
