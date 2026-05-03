// ============================================================================
// Controller discovery — find @Controller() decorated classes
// ============================================================================

import ts from "typescript";
import type { SourceLocation } from "@specord/types";

/** Represents a discovered NestJS controller class. */
export interface DiscoveredController {
  /** Class name, e.g. "UsersController". */
  name: string;
  /** Controller route prefix from @Controller("prefix"). */
  prefix: string;
  /** The class declaration AST node. */
  node: ts.ClassDeclaration;
  /** Source file containing the controller. */
  sourceFile: ts.SourceFile;
  /** Source location for diagnostics. */
  location: SourceLocation;
  /** Whether a guard decorator (e.g. @UseGuards) is applied at class level. */
  hasClassLevelGuard: boolean;
}

/**
 * Scan a list of source files for classes decorated with @Controller().
 */
export function discoverControllers(
  sourceFiles: ts.SourceFile[],
  root: string,
): DiscoveredController[] {
  const controllers: DiscoveredController[] = [];
  const normalizedRoot = root.replace(/\\/g, "/");

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return;

      const controllerDecorator = findDecorator(node, "Controller");
      if (!controllerDecorator) return;

      const prefix = extractDecoratorStringArg(controllerDecorator) ?? "";
      const filePath = sourceFile.fileName.replace(/\\/g, "/");
      const relativePath = filePath.startsWith(normalizedRoot + "/")
        ? filePath.slice(normalizedRoot.length + 1)
        : filePath;

      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

      controllers.push({
        name: node.name.text,
        prefix,
        node,
        sourceFile,
        location: {
          file: relativePath,
          line: line + 1, // 1-based
        },
        hasClassLevelGuard: hasDecorator(node, "UseGuards"),
      });
    });
  }

  return controllers;
}

// ---- Decorator helpers ----

/**
 * Find a decorator by name on a node.
 */
export function findDecorator(
  node: ts.HasDecorators,
  name: string,
): ts.Decorator | undefined {
  const decorators = ts.canHaveDecorators(node)
    ? ts.getDecorators(node)
    : undefined;

  if (!decorators) return undefined;

  return decorators.find((d) => {
    const expr = d.expression;
    // @Name()
    if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
      return expr.expression.text === name;
    }
    // @Name (without call)
    if (ts.isIdentifier(expr)) {
      return expr.text === name;
    }
    return false;
  });
}

/**
 * Check if a node has a specific decorator.
 */
export function hasDecorator(node: ts.HasDecorators, name: string): boolean {
  return findDecorator(node, name) !== undefined;
}

/**
 * Extract the first string argument from a decorator call expression.
 * e.g., @Controller("users") -> "users"
 */
export function extractDecoratorStringArg(
  decorator: ts.Decorator,
): string | undefined {
  if (!ts.isCallExpression(decorator.expression)) return undefined;

  const args = decorator.expression.arguments;
  if (args.length === 0) return undefined;

  const firstArg = args[0];
  if (ts.isStringLiteral(firstArg)) {
    return firstArg.text;
  }

  return undefined;
}

/**
 * Extract all arguments from a decorator that are identifiers (e.g., pipe classes).
 * e.g., @Param("id", ParseIntPipe) -> ["ParseIntPipe"]
 */
export function extractDecoratorIdentifierArgs(
  decorator: ts.Decorator,
): string[] {
  if (!ts.isCallExpression(decorator.expression)) return [];

  return decorator.expression.arguments
    .filter(ts.isIdentifier)
    .map((id) => id.text);
}
