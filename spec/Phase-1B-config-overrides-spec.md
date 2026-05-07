# Specord Phase 1B Spec Sheet: OpenAPI-Shaped Config Overrides

## Goal

Apply `specord.config.ts` overrides to the V1 inspection model so users can resolve extractor uncertainty before OpenAPI emission exists.

Phase 1B keeps `specord inspect` as the functional surface. It does not implement `specord generate` or the `@specord/openapi` emitter.

---

## Current Baseline

Phase 1A is complete and protects the NestJS fixture with deterministic tests:

- 15 operations
- 8 schemas
- 12 unresolved security diagnostics
- 13 unresolved response diagnostics
- 2 unsupported mapped type diagnostics
- 1 unsupported decorator diagnostic

The extractor already reads config for source and routing behavior, but it does not apply operation, schema, or security override fragments.

---

## Public Override Contract

Overrides use OpenAPI 3.1-shaped fragments so config can later flow into OpenAPI emission without another public shape change.

```ts
export default defineConfig({
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  operations: {
    "AuthController.login": {
      summary: "Log in",
      description: "Returns access and refresh tokens.",
      tags: ["Auth"],
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Authenticated.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  accessToken: { type: "string" },
                  refreshToken: { type: "string" },
                },
                required: ["accessToken", "refreshToken"],
              },
            },
          },
        },
      },
    },
    "HealthController.check": {
      exclude: true,
    },
  },
  schemas: {
    UpdateUserDto: {
      type: "object",
      properties: {
        firstName: { type: "string" },
      },
    },
  },
});
```

Supported override fields:

- `securitySchemes`: OpenAPI Security Scheme Object fragments.
- `operations[id].responses`: OpenAPI Responses Object fragments keyed by status code or `default`.
- `operations[id].security`: OpenAPI Security Requirement Object array.
- `operations[id].summary`, `description`, `tags`, and `exclude`.
- `schemas[name]`: OpenAPI Schema Object or Reference Object fragments.

Unsupported OpenAPI fields inside supported fragments must be preserved for Phase 2 instead of guessed into internal model fields.

---

## Inspection Model Behavior

Phase 1B adds carrier fields for override fragments:

- `model.securitySchemes`
- `operation.summary`
- `operation.description`
- `operation.tags`
- `operation.openapi`
- `schema.openapi`
- `response.openapi`

When an override applies:

- The affected inference state becomes `{ status: "overridden" }`.
- Extracted source locations and extracted route/schema facts remain intact.
- Only diagnostics directly resolved by that override are removed.

Diagnostic resolution rules:

- Response overrides remove `EXTRACTOR_UNRESOLVED_RESPONSE` for the same operation.
- Security overrides remove `EXTRACTOR_UNRESOLVED_SECURITY` for the same operation.
- Schema overrides remove matching top-level schema diagnostics, including `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE`.
- `exclude: true` removes the operation and drops diagnostics whose `subject` matches the operation id.

---

## Validation Rules

Config override application is conservative:

- Unknown operation ids throw a config error.
- Unknown schema names throw a config error.
- Response keys must be HTTP status codes from `100` through `599` or `default`.
- `operations[id].tags` must be an array of strings.
- `operations[id].security` must be an array of security requirement objects.
- `operations[id].responses` must be an object.
- `schemas[name]` must be an object.

Security requirement names are not validated against `securitySchemes` yet. OpenAPI semantic validation is a Phase 2 concern.

---

## Acceptance Criteria

Phase 1B is complete when:

- A response override resolves at least one fixture response diagnostic.
- A security override resolves at least one fixture security diagnostic.
- Operation summary, description, and tags are represented in the inspection model.
- `exclude: true` removes an operation and its operation-scoped diagnostics.
- A schema override resolves a mapped-type diagnostic for that schema.
- Unknown operation ids, unknown schema names, and invalid response status keys throw clear errors.
- `pnpm.cmd --filter @specord/core test` passes.
- `pnpm.cmd test` passes.
- `pnpm.cmd build` passes.
- The canonical `pnpm.cmd inspect -- --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src` command still emits deterministic JSON.

---

## Next Phase

After Phase 1B, move to Phase 2: translate the inspection model, including preserved OpenAPI fragments, into an OpenAPI 3.1 document.
