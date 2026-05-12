# Specord

NestJS-first OpenAPI tooling that extracts from source, harvests common Swagger-compatible patterns, and emits validated OpenAPI 3.1 JSON without depending on `@nestjs/swagger`.

## Current Status

Specord V1 is focused on real-world NestJS REST projects:

- `specord inspect`: deterministic internal model and diagnostics
- `specord generate`: validated OpenAPI 3.1 JSON
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
pnpm.cmd inspect -- --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
```

Generate OpenAPI for the Swagger-heavy fixture:

```bash
pnpm.cmd generate -- --project examples/nestjs-realworld/tsconfig.json --root examples/nestjs-realworld/src --pretty
```

Write a validated file:

```bash
pnpm.cmd generate -- --project examples/nestjs-realworld/tsconfig.json --root examples/nestjs-realworld/src --output openapi.json --pretty
```

## Documentation Map

- [`spec/specord-v1-extractor-spec.md`](spec/specord-v1-extractor-spec.md): normative extractor contract
- [`spec/Phase-2-real-world-nestjs-openapi-spec.md`](spec/Phase-2-real-world-nestjs-openapi-spec.md): real-world NestJS OpenAPI V1 contract
- [`docs/getting-started.md`](docs/getting-started.md): first inspect/generate workflow
- [`docs/specord-inspect.md`](docs/specord-inspect.md): internal model command
- [`docs/specord-generate.md`](docs/specord-generate.md): OpenAPI generation command
- [`docs/configuration.md`](docs/configuration.md): config shape, filters, routing, strict CI
- [`docs/development.md`](docs/development.md): local development and test/snapshot flow

## Guiding Principles

- Source-first extraction is the trust boundary.
- Config is the final precision layer.
- Swagger compatibility is harvested statically, not delegated to Swagger runtime packages.
- Warnings should be actionable, not mysterious.
- Valid OpenAPI is the release bar.
