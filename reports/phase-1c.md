# Phase 1C Session Report — PartialType Schema Resolution

**Phase:** 1C — Mapped Type Resolution
**Date:** 2026-05-10
**Status:** In progress and locally verified for the first slice

---

## Status Summary

Phase 1C starts by resolving the narrowest high-value extractor gap from Phase 1B: NestJS `PartialType(BaseDto)` DTOs. The current slice keeps the scope on the NestJS V1 inspection path, leaves OpenAPI emission deferred, and does not change operation modeling.

Health is green for the implemented slice:

- `@specord/core` tests: 5 files, 34 tests passing after snapshot update.
- Workspace tests: 7 Turborepo tasks passing.
- Workspace build: 5 package builds passing.
- Canonical inspect output now reports 26 diagnostics instead of 28 because the two mapped-type diagnostics are gone.

---

## What Was Built

| Area | Delivered |
| --- | --- |
| Schema extractor | Two-pass exported-class indexing so mapped DTOs can resolve base DTOs independent of file order |
| `PartialType` support | `PartialType(BaseDto)` copies base DTO properties and sets `required: []` |
| Conservative fallback | `PickType`, `OmitType`, `IntersectionType`, unknown bases, and unresolved mapped utilities still emit `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE` |
| Tests | Fixture acceptance now asserts `UpdateUserDto` and `UpdateProductDto` are optional copies of their base DTOs |
| Snapshot | Stable inspection snapshot updated for resolved update DTO schemas and removed mapped-type diagnostics |
| Spec | V1 extractor spec updated to document supported `PartialType` behavior |

Key modules:

- `packages/core/src/extractors/schema-extractor.ts`
- `packages/core/test/pipeline.acceptance.test.ts`
- `packages/core/test/__snapshots__/pipeline.snapshot.test.ts.snap`
- `spec/specord-v1-extractor-spec.md`

---

## Acceptance Matrix

| Criterion | Status | Evidence |
| --- | --- | --- |
| Default fixture operation count remains stable | Pass | 15 operations |
| Default fixture schema count remains stable | Pass | 8 schemas |
| `UpdateUserDto` resolves from `CreateUserDto` | Pass | 5 copied properties, 0 required fields |
| `UpdateProductDto` resolves from `CreateProductDto` | Pass | 4 copied properties, 0 required fields |
| Mapped-type diagnostics are removed for supported `PartialType` DTOs | Pass | `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE` count is 0 |
| Unsupported mapped utilities remain conservative | Pass | Fallback path is retained for non-`PartialType` utilities |
| Query DTO behavior remains unchanged | Pass | `PaginationDto` is still represented as a query ref |

---

## Extraction Output Summary

Default fixture output after this slice:

| Metric | Value |
| --- | ---: |
| Controllers | 4 |
| Operations | 15 |
| Schemas | 8 |
| Top-level diagnostics | 0 |
| Operation diagnostics | 26 |
| Total diagnostics | 26 |

Diagnostic counts:

| Code | Count |
| --- | ---: |
| `EXTRACTOR_UNRESOLVED_RESPONSE` | 13 |
| `EXTRACTOR_UNRESOLVED_SECURITY` | 12 |
| `EXTRACTOR_UNSUPPORTED_DECORATOR` | 1 |
| `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE` | 0 |

Schema changes:

| Schema | Result |
| --- | --- |
| `UpdateUserDto` | `email`, `password`, `firstName`, `lastName`, `phone`; all optional |
| `UpdateProductDto` | `name`, `price`, `category`, `stock`; all optional |

---

## Architecture Capabilities

The system can now:

- Resolve direct NestJS `PartialType(BaseDto)` classes when the base DTO is an exported class in the inspected source set.
- Preserve validator-derived constraints, enum values, defaults, and property type refs from the base DTO.
- Keep update DTOs optional by clearing the mapped schema `required` list.
- Keep unsupported mapped utilities loud and override-addressable.

The system still cannot:

- Resolve `PickType`, `OmitType`, `IntersectionType`, or composed mapped-type expressions.
- Expand query DTOs into individual query parameters.
- Emit OpenAPI 3.1 documents.
- Infer ambiguous response bodies or guard security without config.

---

## Codebase Metrics

| Metric | Value |
| --- | --- |
| Branch | `codex/phase-1c-mapped-types` |
| Base branch | `develop` after Phase 1B fast-forward merge |
| Base commit at Phase 1C start | `9c4a1c0` |
| Package TypeScript files, excluding `dist` | 33 |
| Package TypeScript lines, excluding `dist` | 3,683 |
| Runtime dependencies added | 0 |

---

## Decision Log

| Decision | Rationale |
| --- | --- |
| Start Phase 1C with `PartialType` only | It removes known fixture uncertainty without changing operation model contracts |
| Copy base schema properties instead of evaluating Nest runtime classes | Keeps extraction source-first and avoids runtime execution |
| Set mapped DTO `required` to `[]` | Matches NestJS `PartialType` behavior: copied fields become optional |
| Keep other mapped utilities unresolved | Their selection/omission semantics need a separate fixture and contract slice |
| Defer query DTO expansion | It changes parameter shape and deserves its own focused acceptance update |

---

## Roadmap

| Phase | Status | Focus |
| --- | --- | --- |
| Phase 1C.1 | Done | Direct `PartialType(BaseDto)` schema resolution |
| Phase 1C.2 | Recommended | Query DTO expansion into individual query params |
| Phase 1C.3 | Optional | `PickType`/`OmitType`/`IntersectionType` support |
| Phase 2 | Planned | OpenAPI 3.1 emission from `InspectionModel` |

Recommended next steps:

- Add a focused query DTO expansion slice for `PaginationDto`.
- Add synthetic fixture coverage before supporting `PickType`, `OmitType`, or composed mapped types.
- Keep response/security inference config-backed until the OpenAPI emitter exists.

---

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Property copying could diverge from complex Nest mapped-type composition | Medium | Limit supported behavior to direct `PartialType(BaseDto)` and leave other utilities unresolved |
| File-order assumptions could reappear | Low | Two-pass class indexing resolves bases independent of processing order |
| Snapshot churn hides unrelated extractor changes | Low | Acceptance tests assert the specific `Update*Dto` property and diagnostic changes |
| Query DTO expansion may change downstream expectations | Medium | Deferred to a separate slice with explicit acceptance tests |

---

## Verification

Commands run:

```bash
pnpm.cmd --filter @specord/core test
pnpm.cmd test
pnpm.cmd build
node packages/cli/bin/specord.js inspect --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src | node scripts/summarize-inspection.cjs
```

Results:

- Core tests: 5 files, 34 tests passing.
- Workspace tests: 7 Turborepo tasks passing.
- Workspace build: 5 package builds passing.
- Inspect summary: 4 controllers, 15 operations, 8 schemas, 26 diagnostics.
