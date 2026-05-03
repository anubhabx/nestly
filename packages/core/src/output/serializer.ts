// ============================================================================
// Deterministic JSON serializer
// Ensures stable output ordering per spec determinism rules:
//   1. operations sorted by path → method → id
//   2. schemas keys sorted lexically
//   3. diagnostics sorted by severity → code → source location
// ============================================================================

import type { InspectionModel, Diagnostic, SchemaModel } from "@specord/types";

/** Severity ordering for deterministic diagnostic sorting. */
const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 } as const;

/**
 * Serialize an InspectionModel to deterministic JSON.
 * Normalizes ordering per spec rules.
 */
export function serializeInspectionModel(model: InspectionModel): string {
  const sorted: InspectionModel = {
    source: model.source,
    operations: sortOperations(model.operations),
    schemas: sortSchemas(model.schemas),
    diagnostics: sortDiagnostics(model.diagnostics),
  };

  // Also sort diagnostics within each operation
  for (const op of sorted.operations) {
    op.diagnostics = sortDiagnostics(op.diagnostics);
  }

  return JSON.stringify(sorted, null, 2);
}

/**
 * Sort operations by path (asc), then method (asc), then id (asc).
 */
function sortOperations<T extends { path: string; method: string; id: string }>(
  operations: T[],
): T[] {
  return [...operations].sort((a, b) => {
    const pathCmp = a.path.localeCompare(b.path);
    if (pathCmp !== 0) return pathCmp;

    const methodCmp = a.method.localeCompare(b.method);
    if (methodCmp !== 0) return methodCmp;

    return a.id.localeCompare(b.id);
  });
}

/**
 * Sort schema keys lexically.
 */
function sortSchemas(
  schemas: Record<string, SchemaModel>,
): Record<string, SchemaModel> {
  const sorted: Record<string, SchemaModel> = {};
  const keys = Object.keys(schemas).sort();

  for (const key of keys) {
    sorted[key] = schemas[key];
  }

  return sorted;
}

/**
 * Sort diagnostics by severity (error > warning > info), then code, then source location.
 */
function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((a, b) => {
    // Sort by severity
    const severityCmp =
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
    if (severityCmp !== 0) return severityCmp;

    // Sort by code
    const codeCmp = a.code.localeCompare(b.code);
    if (codeCmp !== 0) return codeCmp;

    // Sort by source location
    const fileA = a.source?.file ?? "";
    const fileB = b.source?.file ?? "";
    const fileCmp = fileA.localeCompare(fileB);
    if (fileCmp !== 0) return fileCmp;

    const lineA = a.source?.line ?? 0;
    const lineB = b.source?.line ?? 0;
    return lineA - lineB;
  });
}
