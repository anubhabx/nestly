# Repository Guidelines

## Project Structure & Module Organization

Specord is a pnpm/Turborepo monorepo for annotation-light, source-first OpenAPI tooling. Core packages live in `packages/`: `cli` provides the `specord` binary, `core` owns extraction, `types` defines the V1 inspection model, `openapi` is the OpenAPI emission skeleton, and `nestjs` is the NestJS adapter. Fixture applications live in `examples/`, with `examples/nestjs-api` as the primary extractor target. Normative product and behavior contracts live in `spec/specord-v1-extractor-spec.md`; supporting docs are in `docs/`.

## Build, Test, and Development Commands

- `pnpm install`: install workspace dependencies.
- `pnpm build`: run `turbo run build` and compile package `dist/` outputs.
- `pnpm test`: run package tests through Turborepo; `@specord/core` uses Vitest.
- `pnpm lint`: run workspace lint tasks where package scripts exist.
- `pnpm inspect -- --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src`: run the canonical V1 inspection flow.

Use Node.js `>=18` and pnpm `10.33.4` as declared in `package.json`.

## Coding Style & Naming Conventions

Use TypeScript ES modules, strict mode, and Node16 module resolution. Keep source under each package's `src/` directory and compiled output in `dist/`. Prefer explicit exported types for public contracts, `camelCase` for functions/variables, `PascalCase` for types/classes, and kebab-case for CLI command files when adding new commands. Preserve deterministic ordering in serializers and extractor output.

## Testing Guidelines

Write focused Vitest tests near the behavior they cover, using `*.test.ts` naming. Fixture-driven validation is required for extractor changes: run `specord inspect` against `examples/nestjs-api` and verify route, DTO, response, security, and diagnostic output. Snapshot or expected-output changes must be intentional and reflected in the V1 spec when contracts change.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit pattern, for example `feat(core): ...`, `feat(cli): ...`, or `chore: ...`. Keep commits scoped and behaviorally coherent. PRs should include motivation, behavior changes, fixture/test evidence, and linked issues. Use the RFC issue template before changing internal model contracts, diagnostic taxonomy, config precedence, or architecture.

## Session Reporting

At the end of each development session, produce an executive report and write it to `dev_records/phase-<N>.md`, where `<N>` is the current phase number. If a report already exists for the phase, overwrite it with the updated state. Reports are cumulative — each one should reflect the full status of its phase, not just the delta from the previous session.

Each report must include:

1. **Status summary** — phase name, date, overall health.
2. **What was built** — components, packages, and key modules delivered.
3. **Acceptance matrix** — fixture-specific pass/fail against the V1 spec criteria.
4. **Extraction output summary** — operations, schemas, diagnostics counts and tables.
5. **Architecture capabilities** — what the system can and cannot do.
6. **Codebase metrics** — commits, lines, files, dependency counts.
7. **Decision log** — key binding decisions made during the session.
8. **Roadmap** — upcoming phases with TODO items.
9. **Risk assessment** — known risks with severity and mitigation.

The `reports/` directory is the canonical location for all session reports. Do not place reports elsewhere.

## Agent-Specific Instructions

When answering questions about libraries, frameworks, SDKs, APIs, CLIs, or cloud services, fetch current docs through Context7 first. Start with `resolve-library-id`, then query the selected `/org/project` docs with the full question.
