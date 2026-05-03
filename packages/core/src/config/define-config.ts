// ============================================================================
// Config — defineConfig helper
// ============================================================================

import type { SpecordConfigV1 } from "@specord/types";

/**
 * Type-safe config helper for specord.config.ts.
 * Usage:
 * ```ts
 * import { defineConfig } from "@specord/core";
 * export default defineConfig({ ... });
 * ```
 */
export function defineConfig(config: SpecordConfigV1): SpecordConfigV1 {
  return config;
}
