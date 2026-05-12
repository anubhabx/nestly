# `specord inspect`

`specord inspect` is the debugging command. It extracts the internal `InspectionModel` from NestJS source and prints deterministic JSON.

Use `generate` for OpenAPI output.

## Canonical Command

```bash
pnpm.cmd inspect -- examples/nestjs-api
```

Inside a Nest project that has `tsconfig.json` and `src/`:

```bash
specord inspect
```

Use explicit flags only when the default project and root paths do not match your layout:

```bash
specord inspect --project apps/api/tsconfig.build.json --root apps/api/source
```

## Required Behavior

- Load the TypeScript program from `--project`, `source.project`, or inferred `tsconfig.json`
- Walk source under `--root`, `source.root`, or inferred `src/`
- Apply `source.include` and `source.exclude` filters from config
- Extract controllers, routes, params, request bodies, responses, security state, and schemas
- Harvest supported Swagger-compatible decorators and `_OPENAPI_METADATA_FACTORY()` metadata without importing `@nestjs/swagger`
- Apply `specord.config.ts` overrides
- Emit deterministic JSON ordering
- Emit diagnostics instead of guessing when confidence is low

## Output

The output is an `InspectionModel` JSON document. See `spec/specord-v1-extractor-spec.md` for the base contract and `spec/Phase-2-real-world-nestjs-openapi-spec.md` for the Phase 2 additions.

At minimum, output includes:

- `source`
- `operations`
- `schemas`
- `diagnostics`

Operations may also carry OpenAPI-ready metadata such as `operationId`, `summary`, `description`, `tags`, response fragments, and security requirements.

## Exit Behavior

- Successful extraction with warnings: exit 0
- Structural extraction failure: non-zero exit
- Config validation failure: non-zero exit

`inspect` remains tolerant of unresolved extraction cases so teams can debug what Specord can and cannot infer.

## Diagnostics

Diagnostics use canonical codes documented in the specs. New diagnostic codes should be added to the spec before shipping.
