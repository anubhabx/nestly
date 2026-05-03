// ============================================================================
// Specord V1 Configuration Types
// Shape for specord.config.ts — the precision layer.
// See: spec/specord-v1-extractor-spec.md §Minimum v1 config contract
// ============================================================================

/**
 * V1 configuration shape for `specord.config.ts`.
 * Config is optional; CLI flags take precedence.
 */
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
    versioning?: {
      /** Use `strategy`, not `type`. Config loader rejects `type` with a migration error. */
      strategy: "uri" | "header" | "media-type";
      value?: string;
    };
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
