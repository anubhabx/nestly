// ============================================================================
// Test helper — normalize machine-specific fields for snapshot stability
// ============================================================================

import type { InspectionModel } from "@specord/types";

/**
 * Replace absolute paths and timestamps with stable placeholders.
 * This prevents snapshot churn from CI vs local differences.
 */
export function normalizeInspectionModel(
  model: InspectionModel,
): InspectionModel {
  return {
    ...model,
    source: {
      ...model.source,
      project: "<fixture-tsconfig>",
      root: "<fixture-root>",
      inspectedAt: "<inspected-at>",
    },
  };
}
