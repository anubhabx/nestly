# Specord V1 Extractor Spec

Date: 2026-04-27
Status: Active normative spec for `specord inspect` spike

## Purpose

V1 focuses on one trustworthy path: extract a deterministic internal model from a conventional NestJS REST codebase, then use that model for later OpenAPI generation. V1 does not require Swagger decorators or the Nest Swagger CLI plugin.

The first delivery target is the extractor, not the renderer.

## Scope and Non-goals

### In scope for this spec

- Source-first extraction from TypeScript using `Program` and `TypeChecker`.
- Stable JSON output from `specord inspect`.
- Route, parameter, request DTO, and baseline response metadata extraction.
- Deterministic diagnostics for unresolved or risky inference.
- Fixture-first behavior for `examples/nestjs-api`.

### Out of scope for this spec

- UI renderer work.
- OpenAPI 3.1 emission details (translation is a later step).
- OpenAPI 3.2-only features.
- Full plugin/adaptor architecture for non-Nest sources.

## Canonical command for this spike

```txt
specord inspect --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
```

The command MUST emit a single JSON document conforming to the contract below.

## Normative extractor contract

### Data model

```ts
type InspectionModel = {
  source: {
    project: string; // CLI-resolved path
    root: string; // CLI-resolved path
    inspectedAt: string; // ISO-8601 UTC timestamp
    version: "v1";
  };
  operations: OperationModel[];
  schemas: Record<string, SchemaModel>;
  diagnostics: Diagnostic[];
};

type OperationModel = {
  id: string; // ControllerName.methodName
  controller: string;
  handler: string;
  method: "get" | "post" | "put" | "patch" | "delete" | "options" | "head";
  path: string; // OpenAPI template form, e.g. /users/{id}
  source?: SourceLocation;
  params: ParameterModel[];
  requestBody?: BodyModel;
  responses: ResponseModel[];
  security: InferenceState;
  diagnostics: Diagnostic[];
};

type InferenceState =
  | { status: "inferred" }
  | { status: "inferred-with-warning"; reason: string }
  | { status: "overridden" }
  | { status: "unresolved"; reason: string };

type Diagnostic = {
  severity: "info" | "warning" | "error";
  code: DiagnosticCode;
  message: string;
  source?: SourceLocation;
  subject?: string;
  suggestedOverridePath?: string;
};

type DiagnosticCode =
  | "EXTRACTOR_UNRESOLVED_RESPONSE"
  | "EXTRACTOR_UNRESOLVED_SECURITY"
  | "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE"
  | "EXTRACTOR_UNSUPPORTED_DECORATOR"
  | "EXTRACTOR_TYPE_FALLBACK_ANY"
  | "EXTRACTOR_ROUTE_CONFLICT"
  | "EXTRACTOR_INVALID_PATH_TEMPLATE";
```

### Determinism rules (MUST)

1. `operations` MUST be sorted by `path`, then `method`, then `id` (ascending lexical order).
2. `schemas` keys MUST be sorted lexically during emission.
3. `diagnostics` MUST be sorted by `severity`, then `code`, then source location.
4. Component/schema naming MUST be stable:
   - exported class DTO name as primary key,
   - collision fallback format: `{ClassName}_{FileStem}_{Hash4}`.
5. `path` MUST normalize to:
   - leading `/`,
   - no trailing slash (except `/`),
   - Nest `:id` tokens converted to `{id}`.
6. No extraction behavior may depend on runtime evaluation of function bodies.

## V1 extraction rules

### Automatic extraction (MUST)

- Controller prefixes from `@Controller(...)`.
- Method decorators: `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`, `@Options`, `@Head`.
- Joined route paths after normalization rules.
- Parameter metadata from `@Param`, `@Query`, `@Body`, `@Headers`.
- Primitive parameter types from type annotations.
- Pipe-derived type refinement only for an allowlist:
  - `ParseIntPipe` -> integer.
- Request and query schemas from exported class DTO symbols.
- DTO fields including:
  - optional markers,
  - defaults (as default values, not required flags),
  - enum members,
  - arrays,
  - nested exported DTO references.
- Validator hints from `class-validator` allowlist:
  - `IsString`, `IsEmail`, `IsNumber`, `IsInt`, `Min`, `MinLength`, `MaxLength`, `IsEnum`, `IsOptional`, `IsPositive`, `Matches`.
- Default response status:
  - `POST` -> `201`,
  - all other HTTP methods -> `200`,
  - overridden by `@HttpCode(...)` when present.

### Conservative extraction (MUST resolve as unresolved/warning, not guessed)

- Guard-derived auth semantics.
- Return type shape when originating service/data source is `any`.
- Anonymous object literal response shapes.
- Interceptor, serializer, exception-filter transformed output.
- `@Res()` / `@Response()` manual response handling.
- Complex generics, conditional types, and polymorphic unions.
- Unknown/custom decorators without config mapping.

When uncertain, extractor MUST emit incomplete-but-valid model data and at least one diagnostic.

## Diagnostic catalog (v1 minimum)

| Code | Severity | Trigger | Suggested override path |
| --- | --- | --- | --- |
| `EXTRACTOR_UNRESOLVED_RESPONSE` | warning | Response schema cannot be safely inferred | `operations.<id>.responses` |
| `EXTRACTOR_UNRESOLVED_SECURITY` | warning | Guard/auth semantics observed but not mapped | `securitySchemes` or `operations.<id>.security` |
| `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE` | warning | `PartialType`/mapped utility cannot be fully resolved | `schemas.<name>` |
| `EXTRACTOR_UNSUPPORTED_DECORATOR` | info | Decorator seen but not in supported allowlist | `operations.<id>` |
| `EXTRACTOR_TYPE_FALLBACK_ANY` | warning | Symbol resolves to `any` | `schemas.<name>` or `operations.<id>` |
| `EXTRACTOR_ROUTE_CONFLICT` | error | Duplicate `method + path` extracted | `routing` |
| `EXTRACTOR_INVALID_PATH_TEMPLATE` | error | Invalid `path` parameter template | `routing` |

## Fixture-specific acceptance matrix (`examples/nestjs-api`)

The first spike is accepted only when all checks below pass.

| Area | Required result |
| --- | --- |
| Controller discovery | All controllers under `examples/nestjs-api/src` are present in `operations[*].controller`. |
| Route extraction | Every controller handler with supported HTTP decorators appears with normalized `path` and `method`. |
| DTO extraction | `CreateUserDto`, `CreateProductDto`, and `PaginationDto` are present with stable schema names. |
| Mapped types | `UpdateUserDto` and `UpdateProductDto` are either inferred correctly or emit `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE`. |
| Security inference | Guard-backed operations emit `EXTRACTOR_UNRESOLVED_SECURITY` unless explicitly overridden. |
| Response inference | Ambiguous return shapes emit `EXTRACTOR_UNRESOLVED_RESPONSE`. |
| Snapshot stability | Two consecutive runs on unchanged source produce byte-identical JSON snapshot output (excluding `inspectedAt`, which may be normalized in test harness). |

## Known hurdles in fixture

- `ProductsController.findAll()` anonymous paginated object response -> unresolved response required.
- `UsersService` returning `Promise<any>` while mutating response shape -> unresolved response required.
- Guard usage such as `JwtAuthGuard` -> unresolved security required until config override is present.
- `@Param("id", ParseIntPipe) id: number` -> integer path parameter allowed.
- `@Param("id") id: string` then `+id` in method body -> body coercion ignored, remain string.
- `PartialType(...)` usage -> must infer or emit unsupported mapped type diagnostic.

## Minimum v1 config contract

`specord.config.ts` is the precision layer and MUST be optional. CLI flags MUST work without config.

```ts
type SpecordConfigV1 = {
  document?: {
    title?: string;
    version?: string;
    servers?: Array<{ url: string; description?: string }>;
    tags?: Array<{ name: string; description?: string }>;
  };
  source?: {
    project?: string;
    root?: string;
    include?: string[];
    exclude?: string[];
  };
  routing?: {
    globalPrefix?: string;
    versioning?: { strategy: "uri" | "header" | "media-type"; value?: string };
  };
  securitySchemes?: Record<string, unknown>;
  operations?: Record<
    string,
    {
      summary?: string;
      description?: string;
      tags?: string[];
      security?: Array<Record<string, string[]>>;
      responses?: Record<string, unknown>;
      exclude?: boolean;
    }
  >;
  schemas?: Record<string, unknown>;
  ci?: {
    failOnInvalid?: boolean;
    failOnUnresolved?: boolean;
    failOnWarning?: boolean;
  };
};
```

### Precedence rules (MUST)

1. CLI flags override config file values.
2. Config file values override defaults.
3. Defaults apply only where neither CLI nor config provides values.

## Suggested development order

1. Implement `specord inspect` scaffold only.
2. Parse CLI flags and load config with precedence rules.
3. Build TypeScript program from provided project path.
4. Discover controllers and handlers.
5. Extract routes and params.
6. Extract request/query DTO schemas.
7. Attach deterministic diagnostics and source locations.
8. Snapshot fixture output and enforce deterministic ordering.
9. Add explicit return type response inference.
10. Add override application for responses/security.
11. Translate to OpenAPI 3.1 in separate phase.
12. Validate structural and semantic correctness.
13. Build renderer only after extractor and emitter trust is established.

## Phase 1B override application

Config overrides use OpenAPI 3.1-shaped fragments. This keeps the V1 config shape close to the future OpenAPI emitter while allowing `specord inspect` to remain the functional command.

Supported override fields:

- `securitySchemes`: OpenAPI Security Scheme Object fragments.
- `operations.<id>.responses`: OpenAPI Responses Object fragments keyed by status code or `default`.
- `operations.<id>.security`: OpenAPI Security Requirement Object array.
- `operations.<id>.summary`, `description`, `tags`, and `exclude`.
- `schemas.<name>`: OpenAPI Schema Object or Reference Object fragments.

Override application MUST preserve extracted source facts. It MAY add carrier fields for raw OpenAPI fragments so Phase 2 can emit them without losing detail.

When an override resolves a known uncertainty, the affected inference state MUST become `overridden` and only the directly resolved diagnostic MUST be removed:

- response overrides remove `EXTRACTOR_UNRESOLVED_RESPONSE` on the same operation.
- security overrides remove `EXTRACTOR_UNRESOLVED_SECURITY` on the same operation.
- schema overrides remove matching schema diagnostics such as `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE`.
- excluded operations are removed from `operations` and their operation-scoped diagnostics are removed.

Override keys MUST be validated conservatively. Unknown operation ids, unknown schema names, and malformed response status keys are configuration errors.

## Spike completion criteria

The first spike is complete when:

- All fixture acceptance matrix items pass.
- Required diagnostics are emitted for unresolved fixture cases.
- Snapshot tests are stable.
- No extractor output fields violate determinism or path normalization rules in this spec.
