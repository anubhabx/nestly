# Configuration

Specord V1 supports an optional `specord.config.ts` as the precision layer. CLI flags remain highest precedence.

Specord loads TypeScript config files directly in the CLI runtime. The config file is optional: both `inspect` and `generate` infer `tsconfig.json` and `src/` from the current directory or a positional project directory, and still accept `--project` and `--root` for custom layouts.

## Precedence

1. CLI flags
2. `specord.config.ts`
3. Positional project directory defaults
4. Current directory defaults

Swagger decorators and plugin metadata sit below config and above TypeScript/class-validator inference.

## Source Defaults

For the common Nest layout, run from the project directory:

```bash
specord generate --pretty
```

From a monorepo root, pass the project directory once:

```bash
specord generate apps/api --pretty
```

Specord infers:

- `project`: `<project-dir>/tsconfig.json`
- `root`: `<project-dir>/src`

Override either path when your project uses a custom layout:

```bash
specord generate apps/api --project apps/api/tsconfig.build.json --root apps/api/source
```

## Minimum V1 Shape

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
  securitySchemes?: Record<string, OpenApiSecuritySchemeObject>;
  operations?: Record<
    string,
    {
      summary?: string;
      description?: string;
      tags?: string[];
      security?: OpenApiSecurityRequirementObject[];
      responses?: OpenApiResponsesObject;
      exclude?: boolean;
    }
  >;
  schemas?: Record<string, OpenApiSchemaObject>;
  ci?: {
    failOnInvalid?: boolean;
    failOnUnresolved?: boolean;
    failOnWarning?: boolean;
  };
};
```

## Example

```ts
export default {
  document: {
    title: "Orders API",
    version: "1.0.0",
    servers: [{ url: "https://api.example.com" }],
    tags: [{ name: "Orders", description: "Order operations" }],
  },
  source: {
    project: "examples/nestjs-api/tsconfig.json",
    root: "examples/nestjs-api/src",
    include: ["orders/**/*.ts"],
    exclude: ["**/internal/**"],
  },
  routing: {
    globalPrefix: "api",
    versioning: { strategy: "uri", value: "1" },
  },
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
    apiKeyAuth: {
      type: "apiKey",
      in: "header",
      name: "X-API-Key",
    },
  },
  operations: {
    "OrdersController.download": {
      responses: {
        "200": {
          description: "CSV export.",
          content: {
            "text/csv": {
              schema: { type: "string" },
            },
          },
        },
      },
    },
  },
  ci: {
    failOnUnresolved: true,
  },
};
```

## Source Filters

`source.include` and `source.exclude` are glob filters applied to files under `source.root`.

Examples:

- `include: ["orders/**/*.ts"]`
- `exclude: ["**/*.spec.ts", "**/internal/**"]`

Include filters run first. Exclude filters then remove matching files.

## Routing

`routing.globalPrefix` is prepended to extracted paths.

URI versioning is supported:

```ts
routing: {
  versioning: { strategy: "uri", value: "1" },
}
```

This emits paths under `/v1/...`. Header and media-type versioning currently emit `EXTRACTOR_UNSUPPORTED_VERSIONING` because V1 cannot safely express them as static paths.

## Overrides

Use operation overrides for cases static extraction cannot safely infer, especially:

- dynamic response shapes
- file downloads
- manual `@Res()` responses
- guard/security semantics not documented by Swagger decorators

When an override resolves extractor uncertainty, the affected inference state is marked `overridden` and the matching diagnostic is removed.

Unknown operation ids, unknown schema names, invalid response status keys, and malformed security overrides are config errors.

## Strict CI

Default generation warns and emits. CI flags can make unresolved cases fatal:

- `ci.failOnUnresolved`: fail on unresolved response/security diagnostics
- `ci.failOnWarning`: fail on any warning diagnostic
- `ci.failOnInvalid`: reserved for invalid document policy; generated OpenAPI validation failures are already fatal
