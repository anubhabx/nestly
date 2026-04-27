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
