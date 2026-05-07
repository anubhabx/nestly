// ============================================================================
// Test helper — normalize machine-specific fields for snapshot stability
// ============================================================================

import type {
  InspectionModel,
  OperationModel,
  ResponseModel,
  Diagnostic,
  InferenceState,
} from "@specord/types";

/**
 * Normalize a type-string embedded in a diagnostic message or reason.
 * TypeScript's checker can serialize the same types differently depending
 * on whether the fixture's node_modules are fully resolved, which TS
 * version is running, or even the platform. The diagnostic *code* and
 * *count* are the stable contracts — the exact type representation is not.
 *
 * Example:
 *   'Return type "Promise<{ access_token: string; }>" is not a reducible ...'
 *   → 'Return type "<type>" is not a reducible ...'
 */
function normalizeTypeString(s: string): string {
  // Normalize quoted type strings: "SomeType<...>" → "<type>"
  return s.replace(/"[^"]+"/g, '"<type>"');
}

function normalizeDiagnostic(diag: Diagnostic): Diagnostic {
  return {
    ...diag,
    message: normalizeTypeString(diag.message),
  };
}

function normalizeInference(inference: InferenceState): InferenceState {
  if (inference.status === "unresolved" || inference.status === "inferred-with-warning") {
    return {
      ...inference,
      reason: normalizeTypeString(inference.reason),
    };
  }
  return inference;
}

function normalizeResponse(response: ResponseModel): ResponseModel {
  return {
    ...response,
    inference: normalizeInference(response.inference),
  };
}

function normalizeOperation(op: OperationModel): OperationModel {
  return {
    ...op,
    responses: op.responses.map(normalizeResponse),
    diagnostics: op.diagnostics.map(normalizeDiagnostic),
  };
}

/**
 * Replace absolute paths, timestamps, and TypeScript type strings with
 * stable placeholders. This prevents snapshot churn from CI vs local
 * differences in environment, type resolution, or platform.
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
    operations: model.operations.map(normalizeOperation),
    diagnostics: model.diagnostics.map(normalizeDiagnostic),
  };
}

