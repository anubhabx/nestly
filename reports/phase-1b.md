# Phase 1B Session Report — OpenAPI-Shaped Config Overrides

**Phase:** 1B — Config Override Application
**Date:** 2026-05-10
**Status:** Complete and locally verified

---

## Status Summary

Phase 1B adds config-driven override application to `specord inspect` while keeping OpenAPI document emission deferred to Phase 2. The extractor baseline remains stable for the default fixture run, and override behavior is covered by fixture-driven tests. A fresh verification pass on 2026-05-10 confirmed the current branch remains green without expanding beyond the NestJS V1 path.

Health is green:

- `@specord/core` tests: 5 files, 34 tests passing.
- Workspace tests: 7 Turborepo tasks passing, including the new CLI regression test.
- Workspace build: 5 package builds passing.
- Canonical inspect command works with the documented pnpm separator form.

---

## What Was Built

| Area | Delivered |
| --- | --- |
| Types | OpenAPI-shaped config fragments for response, schema, security scheme, security requirement, and operation overrides |
| Inspection model | Carrier fields for `securitySchemes`, operation metadata/OpenAPI fragments, schema fragments, and response fragments |
| Core pipeline | `applyConfigOverrides()` runs after raw extraction and before returning the model |
| Operation overrides | Applies `responses`, `security`, `summary`, `description`, `tags`, and `exclude` |
| Schema overrides | Applies schema fragments and resolves matching schema diagnostics |
| Validation | Rejects unknown operation ids, unknown schema names, invalid response status keys, malformed tags/security/responses |
| CLI | Accepts the pnpm argument separator form: `pnpm.cmd inspect -- --project ... --root ...` |
| Docs | Phase 1B spec sheet plus V1/config docs updated for OpenAPI-shaped override contracts |

Key modules:

- `packages/core/src/config/apply-overrides.ts`
- `packages/types/src/config.ts`
- `packages/types/src/inspection-model.ts`
- `packages/core/test/config-overrides.test.ts`
- `packages/cli/test/inspect.test.ts`

---

## Acceptance Matrix

| Criterion | Status | Evidence |
| --- | --- | --- |
| Default fixture behavior remains stable | Pass | 15 operations, 8 schemas, 28 diagnostics |
| Response override resolves unresolved response | Pass | `AuthController.login` override drops one response diagnostic |
| Security override resolves unresolved security | Pass | `ProductsController.findAll` override drops one security diagnostic |
| Operation metadata override is carried | Pass | summary, description, tags stored on operation and `operation.openapi` |
| Operation exclusion works | Pass | `HealthController.check` removed; operation count becomes 14 in override test |
| Schema override resolves mapped-type diagnostic | Pass | `UpdateUserDto` marked overridden; matching mapped-type diagnostic removed |
| Invalid override keys fail clearly | Pass | unknown operation, unknown schema, invalid status key tested |
| CLI documented pnpm separator works | Pass | CLI test covers `inspect -- --project ... --root ...` |

---

## Extraction Output Summary

Default fixture output is unchanged when no overrides are supplied.

| Metric | Value |
| --- | --- |
| Controllers | 4 |
| Operations | 15 |
| Schemas | 8 |
| Top-level diagnostics | 2 |
| Operation diagnostics | 26 |
| Total diagnostics | 28 |

Diagnostic counts:

| Code | Count |
| --- | ---: |
| `EXTRACTOR_UNRESOLVED_RESPONSE` | 13 |
| `EXTRACTOR_UNRESOLVED_SECURITY` | 12 |
| `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE` | 2 |
| `EXTRACTOR_UNSUPPORTED_DECORATOR` | 1 |

Override tests prove targeted reductions without changing the default fixture contract.

---

## Architecture Capabilities

The system can now:

- Preserve OpenAPI-shaped config fragments inside the inspection model.
- Represent operation-level response/security/metadata overrides before OpenAPI emission exists.
- Mark overridden responses, operation security, and schemas with `inference.status: "overridden"`.
- Remove only diagnostics directly resolved by a config override.
- Exclude operations from the inspection model via config.
- Validate override keys against discovered operations and schemas.
- Keep `specord generate` deferred and untouched.

The system still cannot:

- Emit an OpenAPI 3.1 document.
- Semantically validate security requirement names against declared security schemes.
- Convert every OpenAPI schema fragment into internal `SchemaRef` fields.
- Resolve mapped types automatically without config.
- Expand query DTOs into individual query parameters.

---

## Codebase Metrics

| Metric | Value |
| --- | --- |
| Branch | `codex/phase-1b-config-overrides` |
| Total commits at verification | 30 |
| Phase 1B scoped commits | 6 |
| Package TypeScript files, excluding `dist` | 33 |
| Package TypeScript lines, excluding `dist` | 3,469 |
| Root dev dependencies | 4 |
| Runtime dependencies added | 0 |

Phase 1B commits:

- `8c160b2 spec: add phase 1b config override contract`
- `f7ecd1c feat(types): type openapi-shaped config overrides`
- `0193ab7 feat(core): apply operation config overrides`
- `b0ed451 test(core): cover config override application`
- `2923c18 fix(cli): accept pnpm inspect argument separator`
- `8968b2e docs: report phase 1b status`

---

## Decision Log

| Decision | Rationale |
| --- | --- |
| Use OpenAPI-shaped config fragments | Avoids a second public override shape before Phase 2 emission |
| Preserve fragments instead of deeply translating them | Prevents guessing unsupported OpenAPI fields into internal model fields |
| Validate override keys against discovered ids | Keeps config mistakes loud and actionable |
| Resolve only matching diagnostics | Avoids hiding unrelated extractor uncertainty |
| Keep security scheme semantic validation deferred | Phase 1B is config application; full OpenAPI semantic validation belongs with emission |
| Fix pnpm separator support now | The repo-documented canonical command used the separator form and needed to remain valid |

---

## Roadmap

| Phase | Status | Focus |
| --- | --- | --- |
| Phase 0 | Done | Extractor pipeline and fixture |
| Phase 1A | Done | Deterministic tests and CI |
| Phase 1B | Done | OpenAPI-shaped config overrides |
| Phase 1C | Recommended | Query DTO expansion and/or mapped type resolution |
| Phase 2 | Planned | OpenAPI 3.1 emission from `InspectionModel` |

Recommended next steps:

- Decide whether Phase 1C should resolve mapped types automatically or move straight to OpenAPI emission.
- Add semantic validation once `@specord/openapi` owns actual component/security references.
- Add a fixture config file once override examples become part of public docs.

---

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| OpenAPI fragments are preserved but not fully interpreted | Medium | Intentional Phase 1B boundary; Phase 2 emitter will consume raw fragments |
| Config can reference undeclared security scheme names | Medium | Deferred to OpenAPI semantic validation; documented as not yet supported |
| Operation ids are user-facing override keys | Medium | Existing deterministic `Controller.method` contract and unknown-key validation reduce silent drift |
| Snapshot expansion from future override defaults | Low | Default no-config fixture output remains unchanged |
| CLI test invokes real extraction | Low | Keeps command coverage honest; runtime is acceptable for current fixture size |

---

## Verification

Commands run:

```bash
pnpm.cmd --filter @specord/core test
pnpm.cmd test
pnpm.cmd build
pnpm.cmd inspect -- --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
```

Results:

- Core tests: 5 files, 34 tests passing.
- Workspace tests: 7 Turborepo tasks passing.
- Workspace build: 5 package builds passing.
- Inspect summary: 4 controllers, 15 operations, 8 schemas, 28 diagnostics.
- Note: workspace `pnpm.cmd test` and `pnpm.cmd build` replayed Turborepo cache logs for all tasks during the 2026-05-10 verification pass; the focused core test and canonical inspect command were run directly in this session.
