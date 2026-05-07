# Configuration

Specord V1 supports an optional `specord.config.ts` as a precision layer. CLI flags remain the highest-precedence input.

## Precedence

1. CLI flags
2. `specord.config.ts`
3. Built-in defaults

## Minimum v1 shape

```ts
export type SpecordConfigV1 = {
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

## Notes

- Use operation-level overrides for known unresolved response/security cases.
- Keep config explicit and minimal for V1.
- Any new config shape should be reflected in the extractor spec before implementation.

## Phase 1B override fragments

Config overrides use OpenAPI 3.1-shaped fragments. `specord inspect` preserves these fragments on the inspection model; `specord generate` remains a later phase.

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

Supported fields:

- `securitySchemes`: OpenAPI Security Scheme Object fragments.
- `operations[id].responses`: OpenAPI Responses Object fragments keyed by status code or `default`.
- `operations[id].security`: OpenAPI Security Requirement Object array.
- `operations[id].summary`, `description`, `tags`, and `exclude`.
- `schemas[name]`: OpenAPI Schema Object or Reference Object fragments.

When an override resolves extractor uncertainty, the affected inference state is marked as `overridden` and the matching unresolved diagnostic is removed. Unknown operation ids, unknown schema names, and invalid response status keys are treated as config errors.
