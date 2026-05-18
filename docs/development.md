# Development

This document defines local workflow for Specord V1 development.

## Workflow

1. Align on behavior in `spec/specord-v1-extractor-spec.md` and `spec/Phase-2-real-world-nestjs-openapi-spec.md`.
2. Implement extractor/emitter changes in small increments.
3. Run fixture extraction against `examples/nestjs-api`.
4. Run OpenAPI generation against `examples/nestjs-api`.
5. For docs-runtime changes, verify route injection and standalone serving.
6. Compare output against expected acceptance matrices and snapshots.
7. Add or update diagnostics when behavior is intentionally unresolved.

## Test and snapshot expectations

- Snapshot output must remain deterministic.
- Changes to ordering, naming, or diagnostics require explicit spec updates.
- Fixture regressions should be treated as high-priority breakages.
- Intentional snapshot refreshes must update:
  - `reports/snapshot-registry.json`
  - `reports/snapshot-changelog.md`
  - `reports/snapshot-log.md`
- `packages/core/test/pipeline.snapshot.test.ts` enforces that the registry hash, changelog entry, and log row match the normalized inspection baseline.

## API history primitives

- Snapshot cache helpers live in `packages/core/src/history/snapshot-cache.ts`.
- The local cache path is `.git/specord/cache/snapshots`; cache files are generated and should not be committed.
- Cache keys must include commit, config hash, Specord version, and the lockfile hash when available.
- OpenAPI diff helpers live in `packages/core/src/history/openapi-diff.ts`.
- Diff records are operation-scoped `ApiHistoryRecord` values exported from `@specord/types`.
- Use `pnpm.cmd --filter @specord/core exec vitest run test/snapshot-cache.test.ts test/openapi-history-diff.test.ts` after changing cache or diff behavior.

## Recommended verification loop

```bash
pnpm.cmd inspect -- examples/nestjs-api
pnpm.cmd generate -- examples/nestjs-api --pretty
pnpm.cmd serve -- examples/nestjs-api --pretty
pnpm.cmd audit --prod --json
pnpm.cmd audit --json
```

Then verify:

- Route/method coverage
- DTO schema extraction
- Required unresolved diagnostics
- OpenAPI 3.1 validation
- Swagger-compatible metadata harvesting
- Docs UI loads at `/api`
- Docs JSON loads at `/api/openapi.json`
- Repeated docs JSON requests use the server-side cache unless `--no-cache` is set
- `specord serve` refuses non-loopback hosts unless `--allow-public-host` is set
- Snapshot stability across repeated runs

## Design changes

For non-trivial changes to extraction behavior, open an RFC using the repository RFC issue template before implementation.
