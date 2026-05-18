# Specord

NestJS-first OpenAPI tooling that extracts from source, harvests common Swagger-compatible patterns, and emits validated OpenAPI 3.1 JSON without depending on `@nestjs/swagger`.

## Current Status

Specord V1 is focused on real-world NestJS REST projects:

- `specord inspect`: deterministic internal model and diagnostics
- `specord generate`: validated OpenAPI 3.1 JSON
- `setupSpecordDocs(app)`: Nest bootstrap route injection at `/api`
- `specord serve`: standalone local docs server at `/api`
- Compatibility: static harvesting for common NestJS Swagger decorators, mapped types, and `_OPENAPI_METADATA_FACTORY()`
- Precision layer: optional `specord.config.ts`

Specord does not boot the Nest app, execute decorators, import `@nestjs/swagger`, or call `SwaggerModule.createDocument()`.

## Quickstart

Install dependencies:

```bash
pnpm install
```

Inspect the primary fixture:

```bash
pnpm.cmd inspect -- examples/nestjs-api
```

Generate OpenAPI for the Swagger-heavy fixture:

```bash
pnpm.cmd generate -- examples/nestjs-api --pretty
```

Write a validated file:

```bash
pnpm.cmd generate -- examples/nestjs-api --output openapi.json --pretty
```

Inject docs into a Nest app:

```ts
import { setupSpecordDocs } from "@specord/nestjs";

setupSpecordDocs(app); // /api and /api/openapi.json
```

Serve docs independently:

```bash
pnpm.cmd serve -- examples/nestjs-api --pretty
```

Specord defaults to `tsconfig.json` and `src/` in the current directory or in the project directory argument. Use `--project` and `--root` only when the defaults do not match your app layout.

## Documentation Map

- [`spec/specord-v1-extractor-spec.md`](spec/specord-v1-extractor-spec.md): normative extractor contract
- [`spec/Phase-2-real-world-nestjs-openapi-spec.md`](spec/Phase-2-real-world-nestjs-openapi-spec.md): real-world NestJS OpenAPI V1 contract
- [`docs/getting-started.md`](docs/getting-started.md): first inspect/generate workflow
- [`docs/specord-inspect.md`](docs/specord-inspect.md): internal model command
- [`docs/specord-generate.md`](docs/specord-generate.md): OpenAPI generation command
- [`docs/specord-nestjs.md`](docs/specord-nestjs.md): Nest route injection helper
- [`docs/specord-serve.md`](docs/specord-serve.md): standalone local docs server
- [`docs/configuration.md`](docs/configuration.md): config shape, filters, routing, strict CI
- [`docs/development.md`](docs/development.md): local development and test/snapshot flow
- [`spec/Phase-3-dev-docs-runtime-spec.md`](spec/Phase-3-dev-docs-runtime-spec.md): docs route and serve contract

## Guiding Principles

- Source-first extraction is the trust boundary.
- Config is the final precision layer.
- Swagger compatibility is harvested statically, not delegated to Swagger runtime packages.
- Warnings should be actionable, not mysterious.
- Valid OpenAPI is the release bar.
