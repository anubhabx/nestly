# Phase 6 Session Report - API History, Try It, and NestJS Benchmark Reset

**Phase:** 6 - API history architecture, browser-local Try It, and benchmark fixture hardening
**Date:** 2026-05-16
**Status:** Healthy. Try It remains verified; the NestJS benchmark fixture has been reset to a scaffolded, production-shaped Nest CLI app.

---

## Status Summary

Phase 6 now covers two delivered slices:

1. API history planning and browser-local Try It execution for the docs UI.
2. Replacement of the weak NestJS examples with one canonical `examples/nestjs-api` benchmark fixture scaffolded through the Nest CLI and expanded into a realistic application.

Current health is green:

- Workspace `pnpm.cmd build`: 6 Turborepo package builds successful.
- Workspace `pnpm.cmd test`: 11 Turborepo tasks successful.
- `@specord/core`: 7 files, 42 tests passing against the new benchmark fixture.
- `@specord/cli`: 3 files, 10 tests passing against the new benchmark fixture.
- `examples/nestjs-api`: build, lint, unit test, and e2e smoke test passing.
- Docker Compose config for `examples/nestjs-api/compose.yaml` validates.
- Specord extraction sees 7 controllers, 27 operations, 42 schemas, and 29 diagnostics from the new fixture.
- OpenAPI generation emits OpenAPI 3.1.0 with 22 paths, 27 operations, 42 schemas, and 2 unresolved warnings.

The unresolved warnings are intentional benchmark pressure points:

- `ProjectsController.exportCsv` returns a CSV/string export shape that still needs an override or richer emitter support.
- `WebhooksController.stripe` uses signature-based webhook auth that is not represented as a resolved security scheme without config override help.

---

## What Was Built

| Area | Delivered |
| --- | --- |
| Product plan | `spec/Phase-6-api-history-and-try-it-plan.md` remains the repo plan for history and Try It continuation |
| Try It execution | Browser-local request sending, JSON validation, response rendering, and error states remain verified |
| Fixture cleanup | Removed the old `examples/nestjs-api` toy app and `examples/nestjs-realworld` fixture |
| Scaffold | Created a fresh `examples/nestjs-api` Nest CLI project with standalone pnpm lockfile and Nest build/test/lint scripts |
| Local services | Added Compose services for Postgres 16 and Redis 7 with healthchecks, named volumes, and non-conflicting host ports |
| App modules | Added accounts, auth, users, projects, tasks, billing, webhooks, health, database, config, and common modules |
| Persistence model | Added TypeORM entities for accounts, members, users, projects, tasks, task comments, subscriptions, and invoices |
| Request DTOs | Added validation-heavy DTOs with enums, arrays, nested metadata, query filters, path params, and mapped update types |
| Response DTOs | Added response models for auth tokens, profiles, accounts, paginated projects, tasks, comments, billing, health, webhooks, and errors |
| API surface | Added 27 operations across auth, accounts, projects, tasks, billing, health, and webhooks |
| Runtime cross-cutting | Added request context middleware, response envelope interceptor, audit interceptor, exception filter, JWT/API-key/role/webhook guards, and decorators |
| Signup flow | Registration now creates the user, account, and owner membership in a single transaction |
| Docs | Updated README, docs, examples README, and Phase 2 spec references to use `examples/nestjs-api` as the canonical Nest benchmark |
| Tests | Updated core and CLI acceptance/snapshot/config tests to target the new benchmark output |

---

## Acceptance Matrix

| Criterion | Status | Evidence |
| --- | --- | --- |
| Old weak Nest examples removed | Pass | `examples/nestjs-realworld` deleted; old product-style `examples/nestjs-api` files removed |
| New project named `nestjs-api` scaffolded by Nest CLI | Pass | `pnpm dlx @nestjs/cli@latest new nestjs-api --package-manager pnpm --skip-git --skip-install` |
| Local DB/services compose added | Pass | `docker compose -f examples\nestjs-api\compose.yaml config` exited 0 |
| App resembles a real NestJS backend | Pass | Modular app with auth, accounts, projects, tasks, billing, webhooks, health, TypeORM entities, guards, middleware, interceptors, filters |
| DTO and response-shape coverage is broad | Pass | 42 extracted schemas, including request DTOs, response DTOs, entities, mapped types, pagination, nested arrays, enums, records, dates |
| Guards/auth/middleware/interceptors are present | Pass | JWT, API key, roles, webhook signature guards; request context middleware; response envelope and audit interceptors |
| Fixture builds independently | Pass | `pnpm.cmd --dir examples\nestjs-api build` exited 0 |
| Fixture lint passes | Pass | `pnpm.cmd --dir examples\nestjs-api lint` exited 0 |
| Fixture unit/e2e smoke tests pass | Pass | Unit and e2e Jest runs each passed 1 test |
| Specord inspection target remains stable | Pass | `@specord/core` passed 42 tests and snapshot was refreshed |
| CLI commands target the new fixture | Pass | `@specord/cli` passed 10 tests |
| OpenAPI generation works | Pass with warnings | 22 paths, 27 operations, 42 schemas, 2 unresolved warnings |
| Stale `nestjs-realworld` docs/spec/package references removed | Pass | `rg -n "nestjs-realworld|examples/nestjs-api/main\.ts" README.md docs spec packages examples package.json pnpm-workspace.yaml` returned no matches |

---

## Extraction Output Summary

Benchmark target:

| Fixture | OpenAPI | Controllers | Paths | Operations | Schemas | Diagnostics |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `examples/nestjs-api` | 3.1.0 | 7 | 22 | 27 | 42 | 29 |

Operation distribution:

| Controller | Operations | Representative paths |
| --- | ---: | --- |
| AccountsController | 5 | `/accounts`, `/accounts/{accountId}`, `/accounts/{accountId}/members` |
| AuthController | 5 | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/logout` |
| BillingController | 3 | `/billing/subscription`, `/billing/invoices`, `/billing/checkout-sessions` |
| HealthController | 2 | `/health`, `/health/readiness` |
| ProjectsController | 6 | `/projects`, `/projects/{projectId}`, `/projects/{projectId}/export` |
| TasksController | 5 | `/projects/{projectId}/tasks`, `/projects/{projectId}/tasks/{taskId}/comments` |
| WebhooksController | 1 | `/webhooks/stripe` |

Diagnostic distribution:

| Diagnostic | Count | Meaning |
| --- | ---: | --- |
| `EXTRACTOR_UNRESOLVED_RESPONSE` | 1 | CSV export returns a non-schema response shape |
| `EXTRACTOR_UNRESOLVED_SECURITY` | 1 | Signature webhook guard needs config/decorator mapping support |
| `EXTRACTOR_UNSUPPORTED_DECORATOR` | 27 | Real Nest/Swagger decorators are intentionally present beyond the current extractor allowlist |

OpenAPI generation summary:

| Metric | Value |
| --- | ---: |
| OpenAPI version | 3.1.0 |
| Paths | 22 |
| Operations | 27 |
| Schemas | 42 |
| Security schemes | `bearerAuth` |
| Unresolved warnings | 2 |

---

## Architecture Capabilities

The system can now:

- Use a single production-shaped NestJS benchmark instead of split toy fixtures.
- Exercise route extraction across modules, nested resources, path params, query DTOs, body DTOs, role decorators, public routes, guards, and interceptors.
- Extract request/response models from realistic DTO and entity shapes.
- Exercise mapped DTOs such as `PartialType` and `PickType`.
- Surface unsupported but realistic Nest/Swagger decorators as diagnostics instead of hiding them.
- Generate OpenAPI for a non-trivial app while keeping unresolved extraction gaps visible.
- Validate docs serving and generation flows against the same canonical Nest fixture.
- Continue using browser-local Try It without new proxy or credential-storage architecture.

The system still cannot:

- Fully resolve CSV/file-like response contracts without overrides or richer response handling.
- Fully map signature-based webhook auth into OpenAPI security without override/config support.
- Understand every Swagger decorator used by a production Nest app.
- Boot the benchmark against live Postgres/Redis in tests; current fixture tests are unit/e2e smoke tests that do not require Docker services.
- Build the API history index planned earlier in Phase 6.
- Persist or share history snapshots across machines.
- Fetch GitHub Release metadata or diff release-indexed OpenAPI snapshots.

---

## Codebase Metrics

| Metric | Value |
| --- | ---: |
| Branch | `develop` |
| Local branch state | Ahead of `origin/develop` by 10 commits before this uncommitted checkpoint |
| Tracked files changed before report rewrite | 56 |
| Untracked files before report rewrite | 75 |
| Tracked diff before report rewrite | 5,707 insertions, 14,325 deletions |
| New Nest fixture source files | 78 TypeScript files |
| New Nest fixture source lines | 2,646 TypeScript lines |
| New root package dependencies | 0 |
| New example-local dependencies | Nest 11, TypeORM, Postgres driver, config, JWT, Swagger, validation, helmet, compression, Jest tooling |
| Removed large generated artifact | Old `examples/nestjs-api/package-lock.json` |

---

## Decision Log

| Decision | Rationale |
| --- | --- |
| Keep only one NestJS fixture | The benchmark should be canonical and production-shaped, not split between toy examples |
| Scaffold through Nest CLI first | Matches the user's request and gives the app normal Nest project structure |
| Keep fixture dependencies local to `examples/nestjs-api` | Avoids changing root package runtime dependencies for a benchmark app |
| Use Postgres and Redis in Compose | Gives the fixture realistic local infrastructure without requiring services during extractor tests |
| Make extractor warnings visible | CSV exports, signature auth, and unsupported decorators are useful benchmark pressure points |
| Keep docs and tests on `examples/nestjs-api` | One target reduces drift and makes future extraction regressions obvious |
| Do not start Docker services in normal verification | Compose config validation is enough for this slice; extractor tests should stay fast and deterministic |
| Keep Try It browser-local | Previous Phase 6 security boundary still stands until proxy/auth storage decisions are explicit |

---

## Roadmap

| Phase | Focus | TODO |
| --- | --- | --- |
| Phase 6a | History config | Add config types for `release.source`, tag patterns, package version files, and snapshot mode |
| Phase 6b | Snapshot cache | Implement commit/config/tool keyed OpenAPI snapshot cache under `.git/specord` |
| Phase 6c | Diff engine | Convert release-to-release OpenAPI diffs into operation-scoped history records |
| Phase 6d | History server routes | Add local docs server endpoints for operation history, job status, and commit drilldown |
| Phase 6e | UI changelog | Render indexed operation changelog with progressive background updates |
| Phase 6f | Try It hardening | Add generated request examples, auth helper inputs, request history, and optional proxy only after the security contract is explicit |
| Phase 7a | Extractor support | Add first-class mappings for common Swagger decorators now visible in the benchmark |
| Phase 7b | Response support | Improve CSV/file/non-JSON response emission and related OpenAPI content types |
| Phase 7c | Security support | Map custom guards/signature schemes through config or decorator conventions |
| Phase 7d | Benchmark runtime | Add optional Docker-backed smoke tests for the Nest fixture after deciding acceptable test cost |

---

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Benchmark fixture is now much larger than the old examples | Medium | Keep it as the single canonical target and maintain acceptance tests around stable output |
| Snapshot diffs are large when fixture line numbers shift | Medium | Keep formatter stable and treat snapshot updates as intentional benchmark changes |
| CSV export and webhook signature auth remain unresolved warnings | Medium | Preserve them as explicit pressure points; cover override paths in config tests |
| Example-local dependencies increase install time | Low | Dependencies are isolated to `examples/nestjs-api` and do not change root packages |
| Docker services are validated but not runtime-tested | Medium | Add optional Compose-backed smoke tests only after deciding test cost and CI constraints |
| Browser-local Try It still hits CORS in split-origin setups | Medium | Existing UI surfaces fetch failures; proxy design remains a later explicit security decision |
| API history plan is still unimplemented | Medium | Roadmap keeps history config/cache/diff/server/UI as Phase 6 follow-up slices |

---

## Verification

Commands run:

```bash
pnpm.cmd exec vitest run test/pipeline.snapshot.test.ts -u
pnpm.cmd --filter @specord/core test
pnpm.cmd --filter @specord/cli test
pnpm.cmd --dir examples\nestjs-api build
pnpm.cmd --dir examples\nestjs-api lint
pnpm.cmd --dir examples\nestjs-api test --runInBand
pnpm.cmd --dir examples\nestjs-api test:e2e --runInBand
docker compose -f examples\nestjs-api\compose.yaml config
pnpm.cmd --silent inspect -- examples/nestjs-api | node scripts/summarize-inspection.cjs
pnpm.cmd --silent generate -- examples/nestjs-api --pretty
pnpm.cmd build
pnpm.cmd test
git diff --check
rg -n "nestjs-realworld|examples/nestjs-api/main\.ts" README.md docs spec packages examples package.json pnpm-workspace.yaml
```

Results:

- Snapshot refresh exited 0 and updated 1 snapshot.
- `@specord/core` exited 0 with 7 test files and 42 tests passing.
- `@specord/cli` exited 0 with 3 test files and 10 tests passing.
- `examples/nestjs-api` build exited 0.
- `examples/nestjs-api` lint exited 0.
- `examples/nestjs-api` unit test exited 0 with 1 test passing.
- `examples/nestjs-api` e2e test exited 0 with 1 test passing.
- Compose config validation exited 0.
- Workspace build exited 0 with 6 successful Turborepo tasks.
- Workspace test exited 0 with 11 successful Turborepo tasks.
- Generate emitted 22 paths, 27 operations, 42 schemas, `bearerAuth`, and 2 unresolved warnings.
- Stale `nestjs-realworld` and old root `examples/nestjs-api/main.ts` references were not found.
- `git diff --check` reported only CRLF normalization warnings on Windows, not whitespace errors.
