# Getting Started

This guide covers the first successful V1 run for Specord.

V1 is NestJS REST only. It can harvest common NestJS Swagger source patterns, but Specord itself does not depend on `@nestjs/swagger`.

## Prerequisites

- Node.js `>=18`
- pnpm `10.33.4`
- Repository dependencies installed with `pnpm install`

## Inspect First

Use `inspect` when you want to see the internal model and diagnostics:

```bash
pnpm.cmd inspect -- --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
```

Expected result:

- A JSON `InspectionModel`
- Stable ordering of operations, schemas, and diagnostics
- Warnings for unresolved inference cases

## Generate OpenAPI

Use `generate` when you want OpenAPI 3.1 JSON:

```bash
pnpm.cmd generate -- --project examples/nestjs-realworld/tsconfig.json --root examples/nestjs-realworld/src --pretty
```

Write to a file:

```bash
pnpm.cmd generate -- --project examples/nestjs-realworld/tsconfig.json --root examples/nestjs-realworld/src --output openapi.json --pretty
```

Generation validates the OpenAPI document before writing. Unresolved extraction warnings are allowed by default and printed to stderr.

## Add Precision With Config

Create `specord.config.ts` when the source code cannot express enough detail:

```ts
export default {
  source: {
    project: "examples/nestjs-realworld/tsconfig.json",
    root: "examples/nestjs-realworld/src",
  },
  document: {
    title: "Orders API",
    version: "1.0.0",
  },
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  ci: {
    failOnUnresolved: true,
  },
};
```

Then run:

```bash
pnpm.cmd generate
```

## Validate Against The Contract

Use these documents as the product boundary:

- `spec/specord-v1-extractor-spec.md`
- `spec/Phase-2-real-world-nestjs-openapi-spec.md`
- `docs/specord-inspect.md`
- `docs/specord-generate.md`
- `docs/configuration.md`
