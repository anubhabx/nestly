// ============================================================================
// Response extraction — return type inference and @HttpCode handling
// ============================================================================

import ts from "typescript";
import type {
  ResponseModel,
  SchemaRef,
  Diagnostic,
  SourceLocation,
} from "@specord/types";
import { findDecorator, extractDecoratorStringArg } from "./controller-discovery.js";
import { typeToSchemaRef } from "./param-extractor.js";
import type { DiscoveredRoute } from "./route-extractor.js";
import { extractSwaggerResponses } from "./swagger-compat.js";

/** Default status codes per HTTP method (NestJS convention). */
const DEFAULT_STATUS: Record<string, number> = {
  post: 201,
  get: 200,
  put: 200,
  patch: 200,
  delete: 200,
  options: 200,
  head: 200,
};

/** Result of response extraction for a single route. */
export interface ResponseExtractionResult {
  responses: ResponseModel[];
  diagnostics: Diagnostic[];
}

/**
 * Extract response metadata from a route handler.
 * - Infers status code from method default or @HttpCode()
 * - Infers response schema from return type when it's a reducible exported shape
 * - Emits EXTRACTOR_UNRESOLVED_RESPONSE for non-reducible shapes
 */
export function extractResponse(
  route: DiscoveredRoute,
  checker: ts.TypeChecker,
  root: string,
  discoveredSchemas: Set<string>,
): ResponseExtractionResult {
  const diagnostics: Diagnostic[] = [];
  const swaggerResponses = extractSwaggerResponses(route.node);

  if (swaggerResponses.length > 0) {
    return {
      responses: swaggerResponses.map((response) => ({
        status: response.status,
        description: response.description,
        schema: response.schema,
        inference: { status: "overridden" },
        openapi: response.openapi,
      })),
      diagnostics,
    };
  }

  // Determine status code
  let statusCode = DEFAULT_STATUS[route.method] ?? 200;

  const httpCodeDecorator = findDecorator(route.node, "HttpCode");
  if (httpCodeDecorator) {
    const codeArg = extractHttpCodeArg(httpCodeDecorator);
    if (codeArg !== undefined) {
      statusCode = codeArg;
    }
  }

  // Infer return type
  const returnType = inferReturnType(route, checker, root, discoveredSchemas);

  if (returnType.unresolved) {
    diagnostics.push({
      severity: "warning",
      code: "EXTRACTOR_UNRESOLVED_RESPONSE",
      message: returnType.reason ?? `Response schema for ${route.id} cannot be safely inferred`,
      source: route.location,
      subject: route.id,
      suggestedOverridePath: `operations.${route.id}.responses`,
    });
  }

  const responses: ResponseModel[] = [
    {
      status: statusCode,
      description: returnType.unresolved
        ? "Response schema could not be inferred — provide an override in specord.config.ts"
        : undefined,
      schema: returnType.schema,
      inference: returnType.unresolved
        ? { status: "unresolved", reason: returnType.reason ?? "Return type not reducible" }
        : { status: "inferred" },
    },
  ];

  return { responses, diagnostics };
}

interface InferredReturnType {
  schema?: SchemaRef;
  unresolved: boolean;
  reason?: string;
}

/**
 * Analyze the handler method's return type to infer a response schema.
 */
function inferReturnType(
  route: DiscoveredRoute,
  checker: ts.TypeChecker,
  root: string,
  discoveredSchemas: Set<string>,
): InferredReturnType {
  const signature = checker.getSignatureFromDeclaration(route.node);
  if (!signature) {
    return { unresolved: true, reason: "No callable signature found" };
  }

  const returnType = checker.getReturnTypeOfSignature(signature);
  const schemaRef = typeToSchemaRef(returnType, checker);

  // Check if the return type is reducible
  if (schemaRef.kind === "unknown") {
    // Check if it's an anonymous object literal return
    const typeString = checker.typeToString(returnType);
    return {
      unresolved: true,
      reason: `Return type "${typeString}" is not a reducible exported shape`,
    };
  }

  if (schemaRef.kind === "ref") {
    // Check if the referenced type is in our discovered schemas
    // or is a known primitive wrapper
    if (!discoveredSchemas.has(schemaRef.name)) {
      // It's a library type or external type we don't control
      return {
        schema: schemaRef,
        unresolved: true,
        reason: `Return type "${schemaRef.name}" is not a discovered schema under --root`,
      };
    }
  }

  return { schema: schemaRef, unresolved: false };
}

/**
 * Extract numeric argument from @HttpCode(number).
 */
function extractHttpCodeArg(decorator: ts.Decorator): number | undefined {
  if (!ts.isCallExpression(decorator.expression)) return undefined;
  const args = decorator.expression.arguments;
  if (args.length === 0) return undefined;

  const firstArg = args[0];
  if (ts.isNumericLiteral(firstArg)) {
    return Number(firstArg.text);
  }
  return undefined;
}
