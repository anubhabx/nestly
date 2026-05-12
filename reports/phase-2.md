# Phase 2 Session Report - Real-World NestJS OpenAPI V1

**Phase:** 2 - Real-world NestJS OpenAPI generation
**Date:** 2026-05-13
**Status:** Complete and locally verified, including CLI UX follow-up

---

## Status Summary

Phase 2 makes Specord usable as a NestJS-only OpenAPI 3.1 generator. The system now keeps `specord inspect` as the internal debugging surface and adds a real `specord generate` path that emits validated OpenAPI 3.1 JSON. The 2026-05-13 follow-up simplified CLI usage so common NestJS layouts infer `tsconfig.json` and `src/` from the current directory or a positional project directory.

Health is green:

- `@specord/core`: 7 files, 43 tests passing.
- `@specord/openapi`: 1 file, 1 test passing.
- `@specord/cli`: 2 files, 7 tests passing.
- Workspace `pnpm.cmd test`: 8 Turborepo tasks successful.
- Workspace `pnpm.cmd build`: 5 package builds successful.
- Short-form inspect and generate commands pass for both NestJS fixtures.

---

## What Was Built

| Area | Delivered |
| --- | --- |
| Product contract | `spec/Phase-2-real-world-nestjs-openapi-spec.md` defines V1 as NestJS REST plus static Swagger-compatible harvesting |
| Fixture | `examples/nestjs-realworld` covers Swagger decorators, mapped type compositions, auth decorators, plugin metadata, and unresolved cases |
| Types | Inspection model carries `operationId`, richer schema property metadata, response content type/OpenAPI fragments, and diagnostic origin |
| Swagger compatibility | Static AST harvesting for operation, response, security, property, mapped type, and `_OPENAPI_METADATA_FACTORY()` patterns |
| Mapped types | `PartialType`, `PickType`, `OmitType`, `IntersectionType`, and nested/common compositions resolve deterministically |
| OpenAPI emitter | `@specord/openapi` emits OpenAPI 3.1 paths, operations, params, request bodies, responses, schemas, and security schemes |
| Validation | Generated documents are validated through `@seriousme/openapi-schema-validator` before output |
| CLI | `specord inspect [project-dir]` and `specord generate [project-dir] [--output] [--pretty]` infer common source paths, while `--project` and `--root` remain overrides |
| Config | `specord.config.ts` loading works in the Node CLI runtime; source include/exclude, URI versioning, strict CI flags, and security schemes are supported |
| Tests | Added fixture, core, emitter, and CLI coverage for the new V1 behavior |
| Docs | README, configuration, getting started, inspect, generate, development, and Phase 2 report updated |

---

## Acceptance Matrix

| Criterion | Status | Evidence |
| --- | --- | --- |
| Existing `examples/nestjs-api` inspect stays deterministic | Pass | 15 operations, 8 schemas, 26 diagnostics |
| Existing fixture generates OpenAPI 3.1 | Pass | 9 paths, 15 operations, 8 schemas |
| Production-ish fixture added | Pass | `examples/nestjs-realworld` |
| Swagger operation metadata harvested | Pass | `listOrders`, tags, summary, description extracted |
| Swagger response decorators override inference | Pass | `ApiOkResponse`, `ApiCreatedResponse`, and `ApiResponse` covered |
| Swagger property metadata harvested | Pass | examples, enum values, readOnly, format, nullable-ready fields |
| Static plugin metadata harvested | Pass | `_OPENAPI_METADATA_FACTORY()` adds `createdAt` |
| Mapped type compositions resolve | Pass | nested `PartialType`, `PickType`, `OmitType`, `IntersectionType` tests |
| Bearer auth scheme inferred without Swagger dependency | Pass | `bearerAuth` emitted from `@ApiBearerAuth` |
| Named unknown security schemes are actionable | Pass | `ApiSecurity("apiKeyAuth")` warns unless config defines the scheme |
| Source include/exclude filters work | Pass | fixture test filters out internal controller |
| Strict CI fails unresolved cases | Pass | CLI test covers `ci.failOnUnresolved` |
| Generate validates before writing | Pass | CLI output-file test writes validated JSON |
| Simplified CLI defaults work | Pass | CLI tests cover positional project directories and current-directory defaults |

---

## Extraction Output Summary

| Fixture | Inspect operations | Inspect schemas | Inspect diagnostics | OpenAPI paths | OpenAPI operations | OpenAPI schemas | Security schemes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `examples/nestjs-api` | 15 | 8 | 26 | 9 | 15 | 8 | 0 |
| `examples/nestjs-realworld` | 6 | 6 | 2 | 5 | 6 | 6 | 1 |

Generate warnings:

| Fixture | Warning |
| --- | --- |
| `examples/nestjs-api` | 25 unresolved response/security warnings |
| `examples/nestjs-realworld` | 2 unresolved warnings: dynamic download response and unconfigured `apiKeyAuth` scheme |

---

## Architecture Capabilities

The system can now:

- Analyze NestJS REST source statically through TypeScript.
- Harvest common NestJS Swagger source patterns without depending on `@nestjs/swagger`.
- Preserve and emit OpenAPI-ready metadata from decorators, plugin metadata, config, and inference.
- Expand query DTOs into query parameters.
- Resolve common mapped type compositions.
- Apply `specord.config.ts` as final override layer.
- Infer `tsconfig.json` and `src/` from the current directory or a positional project directory.
- Emit and validate OpenAPI 3.1 JSON.
- Warn by default and fail strict CI when configured.

The system still cannot:

- Guarantee full parity with every `@nestjs/swagger` decorator or plugin edge case.
- Infer arbitrary `@ApiSecurity("name")` scheme definitions without config.
- Express header/media-type versioning as static OpenAPI paths.
- Execute decorators or inspect runtime Nest module state.
- Emit YAML.

---

## Codebase Metrics

| Metric | Value |
| --- | --- |
| Branch | `codex/phase-2-real-world-v1` |
| Commits at verification | 38 |
| Package TypeScript lines, excluding `dist` | 5,424 |
| Repo files under packages/examples/spec/docs/reports | 163 |
| Working tree scope | 14 tracked files modified, 0 untracked entries added |
| Runtime dependency added | `@seriousme/openapi-schema-validator` in `@specord/openapi` |
| Swagger package dependency in Specord packages | None added |

---

## Decision Log

| Decision | Rationale |
| --- | --- |
| Keep V1 NestJS REST only | Matches the release target and avoids adapter sprawl |
| Harvest Swagger source patterns statically | Gives real-world NestJS compatibility without importing or wrapping Swagger |
| Use OpenAPI 3.1 JSON as V1 output | JSON is enough for release and easier to validate deterministically |
| Warn and emit by default | Real projects need partial value before every edge case is configured |
| Strict CI controlled by config | Teams can ratchet warnings into failures when ready |
| Infer bearer schemes from `@ApiBearerAuth` | This is safe and conventional enough to improve generated documents |
| Require config for arbitrary `@ApiSecurity` schemes | Scheme type/location cannot be inferred safely from the decorator name alone |
| Use a non-Swagger validator dependency | Keeps validation independent of NestJS Swagger |
| Alias CLI tests to source packages | Prevents stale `dist` from masking or inventing CLI test behavior |
| Default CLI source paths to `tsconfig.json` and `src/` | Matches the common NestJS project shape and keeps explicit `--project`/`--root` available for custom layouts |
| Treat positional project directory as a CLI source choice | Lets monorepo users type `specord generate apps/api --pretty` without repeating source paths |

---

## Roadmap

| Phase | Focus | TODO |
| --- | --- | --- |
| Phase 2 follow-up | Polish V1 output | Add stronger semantic checks for missing security scheme refs |
| Phase 2 follow-up | Response coverage | Add explicit support for common file/stream response decorators or config examples |
| Phase 2 follow-up | Schema fidelity | Normalize more validator constraints and decorator schema fragments |
| Phase 3 | Packaging | Decide package publishing surface and end-user install workflow |
| Later | Formats | Add YAML output after JSON path is stable |
| Later | Frameworks | Revisit non-Nest adapters only after NestJS V1 proves useful |

---

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Static Swagger compatibility is not full Swagger parity | Medium | Scope documented; diagnostics and config cover gaps |
| OpenAPI validator may not catch every semantic issue | Medium | Add dedicated semantic validation for known weak spots such as security scheme refs |
| `specord.config.ts` runtime loading writes a temporary `.mjs` beside the config | Low | File is removed immediately after import; covered by config loader test |
| Real-world mapped type patterns can exceed V1 support | Medium | Deterministic diagnostics plus schema overrides remain the fallback |
| Existing historical docs mention old phase boundaries | Low | Current README/docs/spec/report point to the Phase 2 contract; historical docs are marked where most likely to confuse |

---

## Verification

Commands run:

```bash
pnpm.cmd --filter @specord/core test
pnpm.cmd --filter @specord/openapi test
pnpm.cmd --filter @specord/cli test
pnpm.cmd --filter @specord/core exec vitest run test/config.test.ts
pnpm.cmd test
pnpm.cmd build
pnpm.cmd --silent inspect -- examples/nestjs-api
pnpm.cmd --silent generate -- examples/nestjs-api --pretty
pnpm.cmd --silent inspect -- examples/nestjs-realworld
pnpm.cmd --silent generate -- examples/nestjs-realworld --pretty
pnpm.cmd --silent generate -- examples/nestjs-realworld --output <temp>/specord-short-openapi.json --pretty
```

Results:

- All commands exited 0.
- Generated OpenAPI documents passed validation before output.
- Default generation emitted unresolved-warning messages but did not fail.
- Strict unresolved failure is covered by CLI test.
- Short-form commands preserve the same fixture counts: `examples/nestjs-api` generated 9 paths, 15 operations, 8 schemas; `examples/nestjs-realworld` generated 5 paths, 6 operations, 6 schemas, and 1 security scheme.
