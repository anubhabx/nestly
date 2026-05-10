// ============================================================================
// Extraction pipeline — orchestrates all extraction steps into InspectionModel
// ============================================================================

import type {
  InspectionModel,
  OperationModel,
  Diagnostic,
} from "@specord/types";
import { createProgram } from "./program/create-program.js";
import { discoverSources } from "./program/source-discovery.js";
import { discoverControllers } from "./extractors/controller-discovery.js";
import { extractRoutes } from "./extractors/route-extractor.js";
import { extractParams } from "./extractors/param-extractor.js";
import { extractSchemas } from "./extractors/schema-extractor.js";
import { extractResponse } from "./extractors/response-extractor.js";
import {
  unresolvedSecurityDiagnostic,
  unsupportedDecoratorDiagnostic,
} from "./diagnostics/diagnostic-builder.js";
import type { ResolvedConfig } from "./config/loader.js";
import {
  DEFAULT_CONTROLLER_SUFFIXES,
  DEFAULT_DTO_SUFFIXES,
} from "./config/defaults.js";
import { applyConfigOverrides } from "./config/apply-overrides.js";

/**
 * Run the full extraction pipeline and produce an InspectionModel.
 */
export function inspect(config: ResolvedConfig): InspectionModel {
  const { project, root, config: userConfig } = config;

  // Step 1: Create TypeScript program
  const { program, checker } = createProgram(project);

  // Step 2: Discover source files
  const sources = discoverSources(
    program,
    root,
    DEFAULT_CONTROLLER_SUFFIXES,
    DEFAULT_DTO_SUFFIXES,
  );

  // Step 3: Extract schemas from DTO/entity files
  const { schemas, diagnostics: schemaDiagnostics } = extractSchemas(
    sources.dtoFiles,
    checker,
    root,
  );

  const discoveredSchemaNames = new Set(Object.keys(schemas));

  // Step 4: Discover controllers
  const controllers = discoverControllers(sources.controllerFiles, root);

  // Step 5: Extract routes and build operations
  const globalPrefix = userConfig.routing?.globalPrefix ?? "";
  const operations: OperationModel[] = [];
  const globalDiagnostics: Diagnostic[] = [...schemaDiagnostics];

  // Track paths for route conflict detection
  const routeMap = new Map<string, string>();

  for (const controller of controllers) {
    const routes = extractRoutes(controller, globalPrefix, root);

    for (const route of routes) {
      const operationDiagnostics: Diagnostic[] = [];

      // Check for route conflicts
      const routeKey = `${route.method}:${route.path}`;
      const existing = routeMap.get(routeKey);
      if (existing) {
        globalDiagnostics.push({
          severity: "error",
          code: "EXTRACTOR_ROUTE_CONFLICT",
          message: `Duplicate route ${route.method.toUpperCase()} ${route.path}: ${existing} and ${route.id}`,
          source: route.location,
          subject: route.id,
          suggestedOverridePath: "routing",
        });
      } else {
        routeMap.set(routeKey, route.id);
      }

      // Validate path template params
      const pathParams = extractPathParams(route.path);
      for (const paramName of pathParams) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(paramName)) {
          globalDiagnostics.push({
            severity: "error",
            code: "EXTRACTOR_INVALID_PATH_TEMPLATE",
            message: `Invalid path parameter name "${paramName}" in ${route.path}`,
            source: route.location,
            subject: route.id,
            suggestedOverridePath: "routing",
          });
        }
      }

      // Extract parameters
      const { params, requestBody } = extractParams(route, checker, root, schemas);

      // Extract response
      const { responses, diagnostics: responseDiagnostics } = extractResponse(
        route,
        checker,
        root,
        discoveredSchemaNames,
      );
      operationDiagnostics.push(...responseDiagnostics);

      // Security diagnostics
      if (route.hasMethodLevelGuard || route.hasClassLevelGuard) {
        operationDiagnostics.push(
          unresolvedSecurityDiagnostic(route.id, route.location),
        );
      }

      // Unsupported decorator diagnostics
      for (const decoratorName of route.unsupportedDecorators) {
        operationDiagnostics.push(
          unsupportedDecoratorDiagnostic(route.id, decoratorName, route.location),
        );
      }

      operations.push({
        id: route.id,
        controller: route.controller,
        handler: route.handler,
        method: route.method,
        path: route.path,
        source: route.location,
        params,
        requestBody,
        responses,
        security: (route.hasMethodLevelGuard || route.hasClassLevelGuard)
          ? { status: "unresolved", reason: "Guard/auth semantics require config override" }
          : { status: "inferred" },
        diagnostics: operationDiagnostics,
      });
    }
  }

  const model: InspectionModel = {
    source: {
      project,
      root,
      inspectedAt: new Date().toISOString(),
      version: "v1",
    },
    operations,
    schemas,
    diagnostics: globalDiagnostics,
  };

  return applyConfigOverrides(model, userConfig);
}

/**
 * Extract path parameter names from an OpenAPI template path.
 */
function extractPathParams(path: string): string[] {
  const matches = path.matchAll(/\{([^}]+)\}/g);
  return [...matches].map((m) => m[1]);
}
