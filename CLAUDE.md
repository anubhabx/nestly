# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

pnpm + Turborepo monorepo. Node `>=18`, pnpm `10.33.4`. On Windows shells, use `pnpm.cmd` (the `inspect`/`generate`/`serve` scripts forward extra args after `--`).

- `pnpm install` — install workspace deps
- `pnpm build` — `turbo run build` (each package compiles via `tsc` to `dist/`); `test` depends on `build`
- `pnpm test` — run all package tests
- `pnpm lint` / `pnpm clean`
- `pnpm.cmd inspect -- examples/nestjs-api` — canonical V1 inspection fixture run
- `pnpm.cmd generate -- examples/nestjs-realworld --pretty` — Swagger-heavy fixture, OpenAPI to stdout
- `pnpm.cmd serve -- examples/nestjs-realworld --pretty` — local docs at `/api`

Per-package tests use Vitest. To run a single test from a package directory: `pnpm --filter @specord/core test -- path/to/file.test.ts -t "name"`. The CLI binary is `packages/cli/bin/specord.js`.

## Architecture

Specord is a **source-first OpenAPI extractor for NestJS**. It does not boot the Nest app, execute decorators, or depend on `@nestjs/swagger` at runtime — everything is harvested statically from a TypeScript program. This is the central design constraint; "valid OpenAPI 3.1 without runtime introspection" is the trust boundary.

### Workspace layout

- `packages/types` — public V1 contracts: `InspectionModel`, `OperationModel`, `SchemaModel`, `Diagnostic`, `SpecordConfigV1`. Pure types, no runtime.
- `packages/core` — extraction pipeline. Owns the TS program, source discovery, controller/route/param/schema/response extractors, Swagger-compat harvesting, diagnostics, and config loader/overrides.
- `packages/openapi` — emits OpenAPI 3.1 JSON from `InspectionModel` and validates with `@seriousme/openapi-schema-validator`.
- `packages/nestjs` — `setupSpecordDocs(app)` route injection helper; no `@nestjs/swagger` dependency.
- `packages/ui` — `renderDocsUi(...)` HTML for the docs shell served at `/api`.
- `packages/cli` — `specord` binary dispatching `inspect`, `generate`, `serve`.

### Extraction pipeline (`packages/core/src/pipeline.ts`)

`inspect(ResolvedConfig) → InspectionModel`, then `applyConfigOverrides`. Stages, in order:

1. `createProgram(project)` — TypeScript program + checker.
2. `discoverSources(...)` — split into controller files and DTO/entity files using suffix + include/exclude filters.
3. `extractSchemas` — DTO/entity → `SchemaModel` map. `discoveredSchemaNames` is used downstream to gate `$ref` emission.
4. `discoverControllers` — collect controller classes from controller files.
5. For each controller, `extractRoutes` (applies `globalPrefix` and URI versioning prefix), then per route: `extractParams`, `extractResponse`, security harvesting, route-conflict detection, path-template validation, unsupported-decorator diagnostics.
6. Assemble `OperationModel[]` with per-operation diagnostics; collect inferred security schemes; produce a global diagnostics array.
7. `applyConfigOverrides(model, userConfig)` is the **precision layer** — config wins over extraction when explicit.

Config precedence: CLI flags > `specord.config.ts` > positional project dir > cwd defaults. Swagger decorators harvest below config and above TS/class-validator inference.

### Cross-cutting invariants

- **Determinism.** Serializer output, schema names, operation order, and diagnostics must be stable across runs. Anything that breaks snapshot/fixture parity is a contract change.
- **No speculative inference.** When something cannot be resolved statically, emit a `Diagnostic` (taxonomy in `@specord/types`) with a `suggestedOverridePath`. Do not guess.
- **Source-first.** Never import or call `@nestjs/swagger`, `SwaggerModule`, or anything that requires booting the Nest app.

### Fixture-driven validation

`examples/nestjs-api` is the canonical extractor target; `examples/nestjs-realworld` exercises Swagger-compat harvesting. Extractor changes must be validated against both, and snapshot updates in `packages/core/test/__snapshots__/` should be intentional.

## Repository conventions

- TypeScript ESM, strict mode, Node16 module resolution. Source in `src/`, compiled to `dist/`.
- Conventional Commits with package scope: `feat(core): ...`, `fix(cli): ...`, `chore: ...`.
- Contract changes (internal model, diagnostic taxonomy, config schema/precedence, cross-cutting architecture) require an RFC issue first — see `CONTRIBUTING.md` and the GitHub RFC template.
- Normative behavior lives in `spec/`; the most load-bearing files are `spec/specord-v1-extractor-spec.md`, `spec/Phase-2-real-world-nestjs-openapi-spec.md`, and `spec/Phase-3-dev-docs-runtime-spec.md`. Update spec + implementation in the same PR when contracts change.

## Session reporting (from AGENTS.md)

At the end of each development session, write/overwrite `reports/phase-<N>.md` with the cumulative state of the current phase. Each report must include: status summary, what was built, acceptance matrix vs. V1 spec, extraction-output summary, architecture capabilities, codebase metrics, decision log, roadmap, risk assessment. `reports/` is the only canonical location.
