# Specord V1 Extractor — Implementation Owner Responses

> Historical note: this document records Phase 0 decisions. The current V1 generate contract is now defined in `spec/Phase-2-real-world-nestjs-openapi-spec.md`; any notes below describing `specord generate` as a stub are superseded by Phase 2.

This document is a follow‑up to the “Specord V1 Extractor — Implementation Plan” and serves as the single source of truth for decisions on all questions, inconsistencies, and concerns raised by the agent.

Where relevant, this document **confirms** the agent’s “Recommended resolution”, or **overrides** it with a stronger decision. It is intended to be read alongside the original implementation plan and PRD/spec documents.

---

## 0. High‑level stance

- Phase 0 is **not** a disposable spike; it is the foundation of a strong Release 1 for `specord inspect` on NestJS.
- We are willing to pay for **good architecture, strong type models, deterministic output, and robust CLI/config UX** in Phase 0, as long as the functional scope remains focused on the Nest fixture.
- The answers in this doc are binding for Phase 0; any changes should go through the spec documents, not ad‑hoc code.

---

## 1. Config file naming conflict

> **Concern:** `specord.config.ts` naming vs. `defineSpecordConfig` in `@specord/nestjs` vs. core‑level config type `SpecordConfigV1`.

**Decision**

- The **config file name is** `specord.config.ts`.
- The **primary config helper is** `defineConfig` exported from `@specord/core`.
- `@specord/nestjs` will **re‑export** `defineConfig` as a convenience for Nest users, but the config format itself is framework‑agnostic.

```ts
// specord.config.ts
import { defineConfig } from "@specord/core";

export default defineConfig({
  // SpecordConfigV1
});
```

**Action items**

- Update the PRD and any references from `defineSpecordConfig` to `defineConfig` and emphasize the framework‑agnostic stance.
- Ensure `SpecordConfigV1` is defined in `@specord/types` and re‑exported by `@specord/core`.

---

## 2. `main.ts` outside `src/` and the `--root` boundary

> **Concern:** `main.ts` (with `app.setGlobalPrefix('api')`) is at `examples/nestjs-api/main.ts`, outside `src/`, but included in the TS Program.

**Decision**

- The extractor **walks only files under `--root`**.
- `main.ts` is treated as bootstrap code and ignored by the extractor, even if it is part of the TS Program.

**Implications**

- The extractor will **not** attempt to infer `setGlobalPrefix()` from `main.ts` AST.
- All route paths are derived from controller decorators under `--root` (e.g., `/users`, `/products`).
- The only supported way to express a global prefix is via `SpecordConfigV1.routing.globalPrefix` (see §12 below).

---

## 3. Express fixtures and scope

> **Concern:** `examples/express-js-app` and `examples/express-ts-app` exist but V1 scope is NestJS‑only.

**Decision**

- For Phase 0 / V1, **NestJS is the only supported framework**.
- The Express examples are **explicitly out of scope** and must not influence behavior or tests for `specord inspect`.

**Action items**

- Add `examples/README.md` explaining:
  - `examples/nestjs-api` is the **fixture of record** for V1 acceptance tests.
  - The Express apps are **future targets** and currently unused by the extractor.

---

## 4. `.gitignore` and fixture / PRD visibility

> **Concern:** `.gitignore` currently ignores both `.raw/` and `examples/`, which hides the fixture app as well as the raw PRDs.

**Decision**

- The `examples/` directory **must be version controlled** so that `examples/nestjs-api` is a stable fixture.
- The `.raw/` directory may remain ignored as long as its contents are mirrored into non‑ignored spec/PRD files in the repo.

**Action items**

- Change `.gitignore` so that:
  - `examples/` is **not** ignored.
  - Within `examples/`, ignore only `node_modules`, build artifacts, etc., not the source itself.
- Ensure all normative spec/PRD content used by the extractor is present outside `.raw/` (e.g., under `spec/` or similar).

---

## 5. Missing monorepo scaffold

> **Concern:** No root `package.json`, no workspaces, no `packages/` directory, while PRD expects several packages.

**Decision**

- We will use a **Node + TypeScript monorepo** with **pnpm workspaces** and **Turborepo** from Phase 0.
- The following packages are created upfront:
  - `@specord/types` at `packages/types`
  - `@specord/core` at `packages/core`
  - `@specord/cli` at `packages/cli`
  - `@specord/openapi` at `packages/openapi` (skeleton only in Phase 0)
  - `@specord/nestjs` at `packages/nestjs` (thin adapter in Phase 0)

**Rationale**

- This reduces refactoring cost when we add OpenAPI emission and framework adapters, and forces clear boundaries early.

---

## 6. Command naming: `specord inspect` vs `specord generate`

> **Concern:** PRD references `specord generate` while extractor spec and README use `specord inspect`.

**Decision**

- Phase 0 implements **`specord inspect`** as the main functional command:
  - `inspect` produces the **internal inspection JSON** (`InspectionModel`).
- `specord generate` is **introduced now as a stub**:
  - It parses flags and loads config but returns an explicit “not implemented yet” error until Phase 2.
  - Behavior and interface are stable so downstream users can wire CI/scripts without changing later.

**Action items**

- Update PRD / README to describe a **two‑stage pipeline**:
  - `specord inspect` → internal model
  - `specord generate` → OpenAPI 3.1, later phases.

---

## 7. Fixture acceptance matrix, `PaginationDto`, and `User` entity behavior

> **Concern:** `PaginationDto` lives at `products/dto/pagination.dto.ts` but matches `.dto.ts` suffix; `User` entity lacks class‑validator decorators and has no direct controller binding.

**Decision**

- **Source discovery suffixes**: By default, we walk files under `--root` with suffixes:
  - `.controller.ts`
  - `.dto.ts`
  - `.entity.ts`

- `PaginationDto` and other DTOs:
  - `PaginationDto`, `LoginUserDto`, `RefreshTokenDto` **must** be discovered under `.dto.ts` and appear in the `schemas` catalog.

- `User` entity behavior:
  - Entity files are **walked for schema catalog population**.
  - An entity **appears in `schemas` only if reachable** from a controller operation via parameter or response types.
  - If `User` is referenced only through services and never appears in controller signatures, it will **not** appear as a request/response DTO; at most, it may exist in the schemas catalog if you choose to catalog all entities regardless.

**Clarification**

- For Phase 0, we will:
  - Catalog **exported DTO classes and entities** into `schemas` if they meet the discovery rules.
  - Only attach schemas to operations when they are **explicitly referenced** or resolvable via handler types.

---

## 8. `HealthController` and `@HealthCheck()` decorator

> **Concern:** `HealthController.check()` uses `@HealthCheck()` from `@nestjs/terminus`, which is not in the allowlist and returns a library type `Promise<HealthCheckResult>`.

**Decision**

- Decorator handling:
  - `@HealthCheck()` is treated as an **unsupported decorator** and must emit an `EXTRACTOR_UNSUPPORTED_DECORATOR` diagnostic for the operation.

- Response inference:
  - The handler return type `Promise<HealthCheckResult>` from `@nestjs/terminus` is a **library type** and not a user‑defined class under `--root`.
  - Response inference must fall back to `EXTRACTOR_UNRESOLVED_RESPONSE` for this operation.

**Implication**

- The fixture will implicitly test:
  - Unsupported decorator diagnostics.
  - Unresolved library return type diagnostics.

---

## 9. `@nestjs/swagger` dependency in the fixture

> **Concern:** Fixture has `@nestjs/swagger` installed and uses `SwaggerModule` in `main.ts`, which seems to contradict the “no Swagger decorators” story.

**Decision**

- The presence of `@nestjs/swagger` in `dependencies` is acceptable **as long as controllers/DTOs do not use `@Api*` decorators**.
- The fixture’s `main.ts` Swagger setup is treated as **“before Specord” boilerplate** and is ignored by the extractor (both because it’s outside `--root` and because we walk only allowed suffixes).

**Action items**

- Optionally add a short note in the fixture README:
  - Explain that Swagger is installed but the app has no Swagger decorators, illustrating the “default Nest docs are bad without annotations” problem that Specord solves.

---

## 10. Versioning config shape discrepancy

> **Concern:** PRD example uses `versioning: { type: "uri" }` while spec uses `versioning?: { strategy: "uri" | "header" | "media-type"; value?: string }`.

**Decision**

- We **standardize on the spec shape**:
  - `versioning?: { strategy: "uri" | "header" | "media-type"; value?: string }`.
- `type` as a key is deprecated and not supported in Release 1.

**Action items**

- Update all examples and PRDs to use `strategy` instead of `type`.
- Config loader should **fail validation** if `versioning.type` is used, with a clear error message pointing to the `strategy` field.

---

## 11. Missing type definitions for Response/Parameter/Body/Schema/etc.

> **Concern:** `OperationModel` references types that aren’t yet defined: `ParameterModel`, `BodyModel`, `ResponseModel`, `SchemaModel`, `SourceLocation`, etc.

**Decision**

- The proposed shapes for:
  - `SourceLocation`
  - `ParameterModel`
  - `BodyModel`
  - `ResponseModel`
  - `SchemaRef`
  - `SchemaModel`
  - `PropertyModel`
    are **accepted and frozen for V1** with minor clarifications.

**Clarifications**

- `SchemaRef`:
  - Uses a discriminated union with `kind: "ref" | "primitive" | "array" | "unknown"`.
  - `primitive.type` is from a small, documented set: `"string" | "number" | "integer" | "boolean" | "null" | "object"`.

- `SchemaModel`:
  - `name` corresponds to the key in `InspectionModel.schemas[name]`.
  - `properties` is a `Record<string, PropertyModel>`.
  - `required` is an array of property names.

- `SourceLocation`:
  - `file` is always **relative to `--root`**.
  - `line` is 1‑based, `column` is optional and may be omitted if not easily available.

**Action items**

- Add these type definitions to `@specord/types` and reference them in the normative spec document.

---

## 12. `app.setGlobalPrefix('api')` and routing config

> **Concern:** `main.ts` calls `app.setGlobalPrefix('api')`, but this is not visible to the extractor under `--root`; we need to reconcile this with actual observed routes.

**Decision**

- The extractor **does not inspect `main.ts`**; it **cannot infer** global prefixes from runtime bootstrap code.
- The **only supported representation** of global prefixes in V1 is:
  - `SpecordConfigV1.routing.globalPrefix: string`.

**Behavior**

- Without config:
  - Extracted paths will be `/users`, `/products`, etc.
- With config:
  - If `routing.globalPrefix: "api"` is set, the final model should reflect paths like `/api/users`, `/api/products`, etc.

**Action items**

- Explicitly document this in the spec and fixture expectations:
  - “Paths in snapshots do not include `/api` unless `routing.globalPrefix: "api"` is provided in config.”

---

## 13. Open Questions — explicit answers

The plan listed “Open Questions (Need Your Input)” as items 1–5. Here are the final answers.

### 13.1 Monorepo tool

> **Question:** `npm workspaces` vs `pnpm workspaces` vs `turborepo` vs `nx`?

**Answer**

- Use **pnpm workspaces** for package management.
- Use **Turborepo** for build/test orchestration.
- Nx is not needed at this time; we can revisit if we add significantly more complexity later.

---

### 13.2 Missing type definitions (Parameter/Body/Response/Schema)

> **Question:** Are the proposed shapes correct?

**Answer**

- **Yes.** The proposed shapes are accepted with the clarifications in §11 and are considered part of the normative spec for V1.

---

### 13.3 `.gitignore` fix

> **Question:** Should `examples/` be removed from `.gitignore`?

**Answer**

- **Yes.** `examples/` (including `examples/nestjs-api`) must be **version‑controlled**.
- Only ignore build outputs and `node_modules` within `examples/`.

---

### 13.4 TypeScript version usage

> **Question:** Use the project’s TypeScript or bundle our own?

**Answer**

- The repo itself pins **TypeScript `^5.3.3`** as a devDependency and uses that version when creating the `ts.Program`.
- For future real users, the extractor should attempt to use the **project’s installed TypeScript** where possible, but Phase 0 focuses on the internal repo, aligned with the fixture.

---

### 13.5 Package shape in Phase 0

> **Question:** Start with a flat `packages/cli` with everything inline, or scaffold `core` + `cli` + `types` upfront?

**Answer**

- **Scaffold all three upfront**, plus skeletons for `@specord/openapi` and `@specord/nestjs` to lock boundaries early.
- There will be **no “flat CLI”** that later gets refactored; the initial architecture should reflect the long‑term package structure.

---

## 14. Expectations for the implementation plan

With all questions answered:

- The existing implementation plan remains valid in its structure (Steps 1–8), but with the following updates:
  - Replace “npm workspaces” with **pnpm workspaces + Turborepo**.
  - Reflect the finalized config shape (`versioning.strategy`, `routing.globalPrefix`) and type definitions as described above.
  - Treat `@specord/openapi` and `@specord/nestjs` as part of the monorepo scaffold (even if features are stubbed in Phase 0).

- Any future ambiguities or new questions should be added as a new section in this follow‑up doc (or an equivalent ADR/decision log), not left implicit in code.

---
