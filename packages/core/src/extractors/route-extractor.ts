// ============================================================================
// Route extraction — HTTP method decorators, path normalization, path joining
// ============================================================================

import ts from "typescript";
import type { SourceLocation } from "@specord/types";
import type { DiscoveredController } from "./controller-discovery.js";
import { findDecorator, extractDecoratorStringArg, hasDecorator } from "./controller-discovery.js";

/** HTTP methods supported for V1 extraction. */
const HTTP_METHOD_DECORATORS = [
  "Get", "Post", "Put", "Patch", "Delete", "Options", "Head",
] as const;

type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "options" | "head";

/** Discovered route handler within a controller. */
export interface DiscoveredRoute {
  /** Operation ID: ControllerName.methodName */
  id: string;
  controller: string;
  handler: string;
  method: HttpMethod;
  /** Normalized OpenAPI path, e.g. /users/{id} */
  path: string;
  /** The method declaration AST node. */
  node: ts.MethodDeclaration;
  sourceFile: ts.SourceFile;
  location: SourceLocation;
  /** Whether this handler has a method-level @UseGuards. */
  hasMethodLevelGuard: boolean;
  /** Whether the controller has a class-level @UseGuards. */
  hasClassLevelGuard: boolean;
  /** Names of unsupported decorators on this handler. */
  unsupportedDecorators: string[];
}

/** Known NestJS/common decorators that we handle or explicitly ignore. */
const KNOWN_DECORATORS = new Set([
  ...HTTP_METHOD_DECORATORS,
  "Controller", "UseGuards", "HttpCode",
  "Param", "Query", "Body", "Headers", "Request", "Req", "Res", "Response",
  "Injectable", "Inject",
]);

/**
 * Extract all route handlers from a discovered controller.
 */
export function extractRoutes(
  controller: DiscoveredController,
  globalPrefix: string = "",
  root: string,
): DiscoveredRoute[] {
  const routes: DiscoveredRoute[] = [];
  const normalizedRoot = root.replace(/\\/g, "/");

  ts.forEachChild(controller.node, (node) => {
    if (!ts.isMethodDeclaration(node) || !node.name) return;

    const methodName = node.name.getText(controller.sourceFile);

    for (const decoratorName of HTTP_METHOD_DECORATORS) {
      const httpDecorator = findDecorator(node, decoratorName);
      if (!httpDecorator) continue;

      const methodPath = extractDecoratorStringArg(httpDecorator) ?? "";
      const fullPath = normalizePath(globalPrefix, controller.prefix, methodPath);

      const filePath = controller.sourceFile.fileName.replace(/\\/g, "/");
      const relativePath = filePath.startsWith(normalizedRoot + "/")
        ? filePath.slice(normalizedRoot.length + 1)
        : filePath;

      const { line } = controller.sourceFile.getLineAndCharacterOfPosition(
        node.getStart(),
      );

      // Detect unsupported decorators
      const unsupported = detectUnsupportedDecorators(node);

      routes.push({
        id: `${controller.name}.${methodName}`,
        controller: controller.name,
        handler: methodName,
        method: decoratorName.toLowerCase() as HttpMethod,
        path: fullPath,
        node,
        sourceFile: controller.sourceFile,
        location: { file: relativePath, line: line + 1 },
        hasMethodLevelGuard: hasDecorator(node, "UseGuards"),
        hasClassLevelGuard: controller.hasClassLevelGuard,
        unsupportedDecorators: unsupported,
      });

      break; // One HTTP method per handler
    }
  });

  return routes;
}

/**
 * Normalize and join path segments into an OpenAPI template path.
 * Rules:
 *   - Leading /
 *   - No trailing slash (except /)
 *   - Nest :id tokens converted to {id}
 */
export function normalizePath(...segments: string[]): string {
  // Join segments, filter empty
  const joined = segments
    .map((s) => s.replace(/^\/|\/$/g, ""))
    .filter((s) => s.length > 0)
    .join("/");

  if (joined.length === 0) return "/";

  // Convert Nest :param syntax to OpenAPI {param} syntax
  const converted = joined.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "{$1}");

  return "/" + converted;
}

/**
 * Detect decorators on a method that are not in the known set.
 */
function detectUnsupportedDecorators(node: ts.MethodDeclaration): string[] {
  const decorators = ts.canHaveDecorators(node)
    ? ts.getDecorators(node)
    : undefined;

  if (!decorators) return [];

  const unsupported: string[] = [];

  for (const d of decorators) {
    const name = getDecoratorName(d);
    if (name && !KNOWN_DECORATORS.has(name)) {
      unsupported.push(name);
    }
  }

  return unsupported;
}

function getDecoratorName(decorator: ts.Decorator): string | undefined {
  const expr = decorator.expression;
  if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
    return expr.expression.text;
  }
  if (ts.isIdentifier(expr)) {
    return expr.text;
  }
  return undefined;
}
