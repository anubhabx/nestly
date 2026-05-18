# `specord generate`

`specord generate` emits validated OpenAPI 3.1 JSON from NestJS source.

It uses the same extractor as `specord inspect`, then translates the `InspectionModel` through `@specord/openapi` and validates the generated document with `@seriousme/openapi-schema-validator`.

## Command

```bash
specord generate [project-dir] [--output openapi.json] [--pretty]
```

Repo-local form:

```bash
pnpm.cmd generate -- examples/nestjs-api --output openapi.json --pretty
```

Inside a Nest project that has `tsconfig.json` and `src/`:

```bash
specord generate --pretty
```

Use explicit flags only for custom layouts:

```bash
specord generate --project apps/api/tsconfig.build.json --root apps/api/source
```

## Output

When `--output` is omitted, JSON is written to stdout:

```bash
pnpm.cmd generate -- examples/nestjs-api --pretty
```

When `--output` is present, Specord creates the parent directory if needed and writes the validated document:

```bash
pnpm.cmd generate -- examples/nestjs-api --output openapi.json --pretty
```

## What Gets Emitted

V1 emits:

- `openapi: "3.1.0"`
- `info`
- optional `servers`
- optional `tags`
- `paths`
- stable operation ids
- parameters
- request bodies
- responses
- `components.schemas`
- configured `components.securitySchemes`

## Validation And Warnings

OpenAPI validation errors are fatal.

Unresolved extraction warnings do not block default generation. Specord prints a warning to stderr and still emits JSON.

When source analysis finds a named request/response type but no matching component schema, Specord emits an unconstrained schema object instead of a dangling `$ref`. This keeps the OpenAPI document valid while making the missing precision visible through diagnostics and config overrides.

Use config for strict CI:

```ts
export default {
  ci: {
    failOnUnresolved: true,
    failOnWarning: true,
  },
};
```

## Swagger Compatibility Stance

Specord recognizes common Swagger source patterns in user projects:

- `@ApiTags`
- `@ApiOperation`
- `@ApiResponse` and common status-specific response decorators
- `@ApiBearerAuth`
- `@ApiSecurity`
- `@ApiProperty`
- `@ApiPropertyOptional`
- `@ApiResponseProperty`
- `PartialType`, `PickType`, `OmitType`, `IntersectionType`
- `_OPENAPI_METADATA_FACTORY()`

Specord does not depend on `@nestjs/swagger`, execute decorators, or call `SwaggerModule.createDocument()`.

## Recommended Workflow

1. Run `inspect` to see the model and diagnostics.
2. Add Swagger decorators or `specord.config.ts` overrides for missing precision.
3. Run `generate --pretty` locally.
4. Run `generate --output openapi.json` in CI with strict flags once warnings are resolved.
