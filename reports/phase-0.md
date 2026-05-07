# Specord — Executive Development Report

**Date:** 2026-05-07  
**Phase:** 0 — V1 Extractor Spike  
**Status:** 🟢 Core milestone complete. Fixture acceptance criteria met.

---

## 1. What is Specord

Specord is annotation-light OpenAPI documentation tooling for NestJS. It extracts API documentation directly from TypeScript source code — controllers, DTOs, decorators — **without requiring Swagger annotations**, producing deterministic, machine-readable output that downstream tooling can convert to OpenAPI 3.1.

The core value proposition: NestJS teams get accurate API docs from source alone, eliminating the gap between code and spec.

---

## 2. Current State — Phase 0 Delivery

Phase 0 focused exclusively on `specord inspect` — the internal extraction engine — targeting a real NestJS fixture as the acceptance benchmark.

### What has been built

| Component               | Package            | Status                                  |
| ----------------------- | ------------------ | --------------------------------------- |
| **Type System**         | `@specord/types`   | ✅ Frozen for V1                        |
| **Extraction Pipeline** | `@specord/core`    | ✅ Functional                           |
| **CLI**                 | `@specord/cli`     | ✅ `inspect` works, `generate` stubbed  |
| **NestJS Adapter**      | `@specord/nestjs`  | ✅ Skeleton (re-exports `defineConfig`) |
| **OpenAPI Emitter**     | `@specord/openapi` | ⬜ Skeleton only (Phase 2)              |

### Monorepo Structure

```
specord/
├── package.json              pnpm workspace root + Turborepo
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── spec/                     Normative spec documents
├── docs/                     Decision logs, PRDs
├── dev_records/              Session reports (canonical)
├── examples/
│   ├── nestjs-api/           ★ V1 fixture of record
│   ├── express-js-app/       Future target (out of scope)
│   └── express-ts-app/       Future target (out of scope)
├── scripts/
│   └── summarize-inspection.cjs
└── packages/
    ├── types/     17 exported types, 0 runtime deps
    ├── core/      12 source modules, ~1,700 lines
    ├── cli/       3 source modules + bin entry
    ├── openapi/   Empty skeleton
    └── nestjs/    Re-exports defineConfig
```

---

## 3. Fixture Acceptance Matrix

The spec defines 7 acceptance criteria against `examples/nestjs-api`. Current status:

| #   | Criterion                                                           | Status  | Evidence                                              |
| --- | ------------------------------------------------------------------- | ------- | ----------------------------------------------------- |
| 1   | **Controller discovery** — All controllers present                  | ✅ Pass | 4/4: Auth, Health, Products, Users                    |
| 2   | **Route extraction** — HTTP methods, normalized paths               | ✅ Pass | 15 operations, `:id` → `{id}`, correct methods        |
| 3   | **DTO extraction** — CreateUserDto, CreateProductDto, PaginationDto | ✅ Pass | 6 fully-resolved schemas with properties              |
| 4   | **Mapped types** — UpdateUserDto, UpdateProductDto handled          | ✅ Pass | `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE` ×2                |
| 5   | **Security inference** — Guard-backed ops diagnosed                 | ✅ Pass | `EXTRACTOR_UNRESOLVED_SECURITY` ×12                   |
| 6   | **Response inference** — Ambiguous returns diagnosed                | ✅ Pass | `EXTRACTOR_UNRESOLVED_RESPONSE` ×13                   |
| 7   | **Snapshot stability** — Deterministic output                       | ✅ Pass | Byte-identical JSON across runs (excl. `inspectedAt`) |

**All 7/7 acceptance criteria pass.**

---

## 4. Extraction Output Summary

Running the canonical command:

```bash
specord inspect --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
```

### Operations (15)

| Controller            | Method | Path           | Params              | Body             | Diagnostics                                |
| --------------------- | ------ | -------------- | ------------------- | ---------------- | ------------------------------------------ |
| AuthController 🔒     | POST   | /auth/login    | —                   | LoginUserDto     | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| AuthController 🔒     | POST   | /auth/refresh  | —                   | RefreshTokenDto  | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| AuthController        | POST   | /auth/register | —                   | CreateUserDto    | UNRESOLVED_RESPONSE                        |
| HealthController      | GET    | /health        | —                   | —                | UNRESOLVED_RESPONSE, UNSUPPORTED_DECORATOR |
| ProductsController 🔒 | GET    | /products      | query:PaginationDto | —                | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| ProductsController 🔒 | POST   | /products      | —                   | CreateProductDto | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| ProductsController 🔒 | GET    | /products/{id} | path:id (int)       | —                | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| ProductsController 🔒 | PATCH  | /products/{id} | path:id (int)       | UpdateProductDto | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| ProductsController 🔒 | DELETE | /products/{id} | path:id (int)       | —                | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| UsersController       | POST   | /users         | —                   | CreateUserDto    | UNRESOLVED_RESPONSE                        |
| UsersController 🔒    | GET    | /users         | —                   | —                | UNRESOLVED_SECURITY                        |
| UsersController 🔒    | GET    | /users/me      | —                   | —                | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| UsersController 🔒    | GET    | /users/{id}    | path:id             | —                | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| UsersController 🔒    | PATCH  | /users/{id}    | path:id             | UpdateUserDto    | UNRESOLVED_RESPONSE, UNRESOLVED_SECURITY   |
| UsersController 🔒    | DELETE | /users/{id}    | path:id             | —                | UNRESOLVED_SECURITY                        |

### Schemas (8)

| Schema           | Properties                                                               | Required | Status                          |
| ---------------- | ------------------------------------------------------------------------ | -------- | ------------------------------- |
| CreateProductDto | name, price, category, stock                                             | 4        | ✅ Fully resolved               |
| CreateUserDto    | email, password, firstName, lastName, phone                              | 4        | ✅ Fully resolved               |
| LoginUserDto     | email, password                                                          | 2        | ✅ Fully resolved               |
| PaginationDto    | page, limit, search, category                                            | 0        | ✅ Fully resolved, all optional |
| RefreshTokenDto  | refreshToken                                                             | 1        | ✅ Fully resolved               |
| UpdateProductDto | —                                                                        | 0        | ⚠️ Mapped type (PartialType)    |
| UpdateUserDto    | —                                                                        | 0        | ⚠️ Mapped type (PartialType)    |
| User             | id, email, password, firstName, lastName, isActive, createdAt, updatedAt | 8        | ✅ Entity cataloged             |

### Diagnostics (28)

| Code                                | Count | Severity | Purpose                                     |
| ----------------------------------- | ----- | -------- | ------------------------------------------- |
| `EXTRACTOR_UNRESOLVED_RESPONSE`     | 13    | warning  | Return type not reducible to a named schema |
| `EXTRACTOR_UNRESOLVED_SECURITY`     | 12    | warning  | `@UseGuards()` detected, no config mapping  |
| `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE` | 2     | warning  | `PartialType()` wrapper not resolvable      |
| `EXTRACTOR_UNSUPPORTED_DECORATOR`   | 1     | info     | `@HealthCheck()` not in allowlist           |

Every diagnostic includes a `suggestedOverridePath` pointing users to the exact `specord.config.ts` key to resolve it.

---

## 5. Architecture Capabilities

### What the extractor can do today

- ✅ Create `ts.Program` from any `tsconfig.json`
- ✅ Filter source files by `--root` boundary + suffix patterns (`.controller.ts`, `.dto.ts`, `.entity.ts`)
- ✅ Discover `@Controller()` classes with prefix extraction
- ✅ Extract HTTP method decorators (`@Get`, `@Post`, etc.) with path normalization
- ✅ Detect `@UseGuards()` at class and method level
- ✅ Extract `@Param`, `@Query`, `@Body`, `@Headers` with pipe type hints (`ParseIntPipe` → integer)
- ✅ Extract DTO properties, types, defaults, enums, and class-validator constraints
- ✅ Handle `Promise<T>` and `Observable<T>` unwrapping
- ✅ Detect mapped type utilities (`PartialType`, `PickType`, etc.)
- ✅ Infer response status codes from method defaults + `@HttpCode()` overrides
- ✅ Produce deterministic, ordered JSON output
- ✅ Load and validate `specord.config.ts` with precedence rules (CLI > config > defaults)
- ✅ Reject deprecated `versioning.type` with migration error

### What it cannot do yet

- ❌ Apply config overrides to operations/schemas (reads config, doesn't apply overrides)
- ❌ Resolve `PartialType` to actual properties (emits diagnostic instead)
- ❌ Emit OpenAPI 3.1 from InspectionModel (`@specord/openapi` is empty)
- ❌ Formal test suite (Vitest is configured but no test files written)
- ❌ `specord generate` (stubbed — exits with "not implemented")

---

## 6. Codebase Metrics

| Metric                        | Value                                        |
| ----------------------------- | -------------------------------------------- |
| Total commits                 | 14 (4 pre-existing + 10 Phase 0)             |
| Files changed in Phase 0      | 119                                          |
| Lines added                   | ~35,800 (including fixtures with lock files) |
| Source lines (packages/)      | ~2,200                                       |
| Type definitions              | 17 exported types                            |
| Diagnostic codes defined      | 7 (4 actively emitted)                       |
| Dependencies (workspace root) | typescript, turbo, vitest, @types/node       |
| Runtime deps (@specord/core)  | @specord/types, typescript                   |

---

## 7. Decision Log

All architectural decisions are documented in `docs/implementation-consolidation.md`. Key bindings:

| Decision              | Resolution                                                          |
| --------------------- | ------------------------------------------------------------------- |
| Monorepo tool         | pnpm workspaces + Turborepo                                         |
| Package count         | 5 upfront (types, core, cli, openapi, nestjs)                       |
| Config helper         | `defineConfig` from `@specord/core`, not `@specord/nestjs`          |
| Versioning config key | `strategy` (not `type`); loader rejects `type` with migration error |
| `--root` boundary     | Extractor walks only files under `--root`; `main.ts` ignored        |
| Global prefix         | Config-only via `routing.globalPrefix`; not inferred from runtime   |
| TypeScript version    | Pin `^5.3.3`; use project's TS in future                            |
| Express fixtures      | Out of scope for V1                                                 |

---

## 8. Roadmap — What's Next

### Phase 1 — Hardening (not started)

- [ ] Formal Vitest snapshot tests against the fixture
- [ ] Config override application (resolve diagnostics via `specord.config.ts`)
- [ ] `PartialType` property resolution (walk base class properties)
- [ ] Additional class-validator decorator coverage
- [ ] CI pipeline (GitHub Actions with `turbo test`)

### Phase 2 — OpenAPI Emission (not started)

- [ ] Implement `@specord/openapi` — translate `InspectionModel` → OpenAPI 3.1
- [ ] Wire `specord generate` to call the emitter
- [ ] Structural and semantic validation of emitted spec
- [ ] Diff-mode for tracking spec changes over time

### Phase 3 — Developer Experience (not started)

- [ ] Watch mode for `specord inspect`
- [ ] VS Code extension / language server
- [ ] Swagger UI preview integration
- [ ] Plugin architecture for non-NestJS frameworks

---

## 9. Risk Assessment

| Risk                       | Severity  | Mitigation                                                                    |
| -------------------------- | --------- | ----------------------------------------------------------------------------- |
| No formal test suite yet   | 🟡 Medium | Extraction is manually verified against fixture; Vitest is configured         |
| `PartialType` not resolved | 🟢 Low    | Emits diagnostic with override path; config can patch                         |
| 13/15 responses unresolved | 🟡 Medium | Expected for anonymous return types; config overrides will address in Phase 1 |
| No CI pipeline             | 🟡 Medium | Local builds pass; CI is a Phase 1 item                                       |
| Lock files tracked in git  | 🟢 Low    | Only for fixture apps; workspace lock is gitignored                           |

---

> **Bottom line:** Phase 0 is complete. The extraction engine works end-to-end against the reference fixture, all spec acceptance criteria pass, and the architecture is structured for the OpenAPI emission phase. The highest-value next step is Phase 1 hardening — formal tests and config override application.
