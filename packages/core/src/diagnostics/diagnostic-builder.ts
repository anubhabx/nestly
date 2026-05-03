// ============================================================================
// Diagnostic builder — create diagnostics with canonical codes
// ============================================================================

import type {
  Diagnostic,
  DiagnosticCode,
  DiagnosticSeverity,
  SourceLocation,
} from "@specord/types";

/**
 * Create a diagnostic with the canonical structure.
 */
export function createDiagnostic(params: {
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  message: string;
  source?: SourceLocation;
  subject?: string;
  suggestedOverridePath?: string;
}): Diagnostic {
  return {
    severity: params.severity,
    code: params.code,
    message: params.message,
    source: params.source,
    subject: params.subject,
    suggestedOverridePath: params.suggestedOverridePath,
  };
}

/**
 * Create an unresolved security diagnostic for a guarded operation.
 */
export function unresolvedSecurityDiagnostic(
  operationId: string,
  location?: SourceLocation,
): Diagnostic {
  return createDiagnostic({
    severity: "warning",
    code: "EXTRACTOR_UNRESOLVED_SECURITY",
    message: `Guard/auth semantics observed on ${operationId} but not mapped to a security scheme`,
    source: location,
    subject: operationId,
    suggestedOverridePath: `operations.${operationId}.security`,
  });
}

/**
 * Create an unsupported decorator diagnostic.
 */
export function unsupportedDecoratorDiagnostic(
  operationId: string,
  decoratorName: string,
  location?: SourceLocation,
): Diagnostic {
  return createDiagnostic({
    severity: "info",
    code: "EXTRACTOR_UNSUPPORTED_DECORATOR",
    message: `Decorator @${decoratorName}() on ${operationId} is not in the supported allowlist`,
    source: location,
    subject: operationId,
    suggestedOverridePath: `operations.${operationId}`,
  });
}

/**
 * Create a type fallback to any diagnostic.
 */
export function typeFallbackAnyDiagnostic(
  subject: string,
  location?: SourceLocation,
): Diagnostic {
  return createDiagnostic({
    severity: "warning",
    code: "EXTRACTOR_TYPE_FALLBACK_ANY",
    message: `Symbol "${subject}" resolves to any — consider adding a type annotation or config override`,
    source: location,
    subject,
    suggestedOverridePath: `schemas.${subject}`,
  });
}
