// ============================================================================
// Schema extraction — DTO classes, properties, validators, mapped types
// ============================================================================

import ts from "typescript";
import type {
  SchemaModel,
  PropertyModel,
  SchemaRef,
  SourceLocation,
  Diagnostic,
  InferenceState,
} from "@specord/types";
import { typeToSchemaRef } from "./param-extractor.js";

/** class-validator decorators we map to schema constraints (V1 allowlist). */
const VALIDATOR_MAP: Record<string, (args: ts.NodeArray<ts.Expression>) => Record<string, unknown>> = {
  IsString: () => ({ type: "string" }),
  IsEmail: () => ({ format: "email" }),
  IsNumber: () => ({ type: "number" }),
  IsInt: () => ({ type: "integer" }),
  Min: (args) => ({ minimum: extractNumericArg(args) }),
  MinLength: (args) => ({ minLength: extractNumericArg(args) }),
  MaxLength: (args) => ({ maxLength: extractNumericArg(args) }),
  IsEnum: () => ({}), // Enum is handled through the type itself
  IsOptional: () => ({ optional: true }),
  IsPositive: () => ({ exclusiveMinimum: 0 }),
  Matches: (args) => {
    if (args.length > 0 && ts.isRegularExpressionLiteral(args[0])) {
      return { pattern: args[0].text.slice(1, args[0].text.lastIndexOf("/")) };
    }
    return {};
  },
};

/** Result of schema extraction across all DTO files. */
export interface SchemaExtractionResult {
  schemas: Record<string, SchemaModel>;
  diagnostics: Diagnostic[];
}

/**
 * Extract schemas from all discovered DTO/entity source files.
 */
export function extractSchemas(
  dtoFiles: ts.SourceFile[],
  checker: ts.TypeChecker,
  root: string,
): SchemaExtractionResult {
  const schemas: Record<string, SchemaModel> = {};
  const diagnostics: Diagnostic[] = [];
  const normalizedRoot = root.replace(/\\/g, "/");

  for (const sourceFile of dtoFiles) {
    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return;

      // Only extract exported classes
      const isExported = node.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!isExported) return;

      const className = node.name.text;
      const filePath = sourceFile.fileName.replace(/\\/g, "/");
      const relativePath = filePath.startsWith(normalizedRoot + "/")
        ? filePath.slice(normalizedRoot.length + 1)
        : filePath;

      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

      // Check for mapped types (PartialType, PickType, OmitType, etc.)
      const mappedTypeResult = checkMappedType(node, className, relativePath, line + 1);
      if (mappedTypeResult) {
        diagnostics.push(...mappedTypeResult.diagnostics);
        // Even if we can't fully resolve, add a skeleton schema
        if (mappedTypeResult.schema) {
          schemas[className] = mappedTypeResult.schema;
        }
        return;
      }

      // Extract properties
      const { properties, required, propDiagnostics } = extractProperties(
        node,
        checker,
        sourceFile,
        normalizedRoot,
      );

      diagnostics.push(...propDiagnostics);

      schemas[className] = {
        name: className,
        properties,
        required,
        source: { file: relativePath, line: line + 1 },
        inference: { status: "inferred" },
      };
    });

    // Also extract exported enums
    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isEnumDeclaration(node) || !node.name) return;

      const isExported = node.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!isExported) return;

      // Enums are referenced as types but don't become standalone schemas
      // They are handled inline via enum members on properties
    });
  }

  return { schemas, diagnostics };
}

/**
 * Check if a class extends a mapped type utility (PartialType, PickType, etc.).
 */
function checkMappedType(
  node: ts.ClassDeclaration,
  className: string,
  file: string,
  line: number,
): { schema?: SchemaModel; diagnostics: Diagnostic[] } | null {
  if (!node.heritageClauses) return null;

  for (const clause of node.heritageClauses) {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;

    for (const type of clause.types) {
      const expr = type.expression;

      // Check for PartialType(BaseDto), PickType(BaseDto, ...), etc.
      if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
        const utilName = expr.expression.text;
        if (["PartialType", "PickType", "OmitType", "IntersectionType"].includes(utilName)) {
          // Try to extract the base class name
          let baseClassName: string | undefined;
          if (expr.arguments.length > 0 && ts.isIdentifier(expr.arguments[0])) {
            baseClassName = expr.arguments[0].text;
          }

          return {
            schema: {
              name: className,
              properties: {},
              required: [],
              source: { file, line },
              inference: {
                status: "inferred-with-warning",
                reason: `Mapped type ${utilName}(${baseClassName ?? "?"}) cannot be fully resolved at extraction time`,
              },
            },
            diagnostics: [
              {
                severity: "warning",
                code: "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
                message: `${className} extends ${utilName}(${baseClassName ?? "?"}) — mapped type cannot be fully resolved`,
                source: { file, line },
                subject: className,
                suggestedOverridePath: `schemas.${className}`,
              },
            ],
          };
        }
      }
    }
  }

  return null;
}

/**
 * Extract properties from a class declaration.
 */
function extractProperties(
  classNode: ts.ClassDeclaration,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  normalizedRoot: string,
): {
  properties: Record<string, PropertyModel>;
  required: string[];
  propDiagnostics: Diagnostic[];
} {
  const properties: Record<string, PropertyModel> = {};
  const required: string[] = [];
  const propDiagnostics: Diagnostic[] = [];

  for (const member of classNode.members) {
    if (!ts.isPropertyDeclaration(member) || !member.name) continue;

    const propName = member.name.getText(sourceFile);
    const isOptional = !!member.questionToken;

    // Resolve type
    let typeRef: SchemaRef;
    let format: string | undefined;
    let enumValues: unknown[] | undefined;
    const constraints: Record<string, unknown> = {};

    if (member.type) {
      typeRef = resolvePropertyType(member.type, checker);

      // Check for enum type
      if (ts.isTypeReferenceNode(member.type)) {
        const symbol = checker.getSymbolAtLocation(member.type.typeName);
        if (symbol) {
          const decl = symbol.declarations?.[0];
          if (decl && ts.isEnumDeclaration(decl)) {
            enumValues = decl.members.map((m) => {
              if (m.initializer && ts.isStringLiteral(m.initializer)) {
                return m.initializer.text;
              }
              if (m.initializer && ts.isNumericLiteral(m.initializer)) {
                return Number(m.initializer.text);
              }
              return m.name.getText(decl.getSourceFile());
            });
          }
        }
      }
    } else {
      typeRef = { kind: "unknown" };
    }

    // Extract default value
    let defaultValue: unknown;
    if (member.initializer) {
      if (ts.isNumericLiteral(member.initializer)) {
        defaultValue = Number(member.initializer.text);
      } else if (ts.isStringLiteral(member.initializer)) {
        defaultValue = member.initializer.text;
      } else if (
        member.initializer.kind === ts.SyntaxKind.TrueKeyword ||
        member.initializer.kind === ts.SyntaxKind.FalseKeyword
      ) {
        defaultValue = member.initializer.kind === ts.SyntaxKind.TrueKeyword;
      }
    }

    // Extract class-validator constraints
    const decorators = ts.canHaveDecorators(member)
      ? ts.getDecorators(member)
      : undefined;

    let markedOptional = isOptional;

    if (decorators) {
      for (const decorator of decorators) {
        const decoratorName = getDecoratorCallName(decorator);
        if (!decoratorName) continue;

        const handler = VALIDATOR_MAP[decoratorName];
        if (handler) {
          const args = ts.isCallExpression(decorator.expression)
            ? decorator.expression.arguments
            : ts.factory.createNodeArray<ts.Expression>();
          const result = handler(args);

          if (result.optional) {
            markedOptional = true;
            delete result.optional;
          }

          Object.assign(constraints, result);
        }
      }
    }

    if (!markedOptional) {
      required.push(propName);
    }

    properties[propName] = {
      type: typeRef,
      default: defaultValue,
      enum: enumValues,
      format,
      constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
      inference: { status: "inferred" },
    };
  }

  return { properties, required, propDiagnostics };
}

/**
 * Resolve a property type node to a SchemaRef.
 */
function resolvePropertyType(
  typeNode: ts.TypeNode,
  checker: ts.TypeChecker,
): SchemaRef {
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return { kind: "primitive", type: "string" };
    case ts.SyntaxKind.NumberKeyword:
      return { kind: "primitive", type: "number" };
    case ts.SyntaxKind.BooleanKeyword:
      return { kind: "primitive", type: "boolean" };
    case ts.SyntaxKind.AnyKeyword:
    case ts.SyntaxKind.UnknownKeyword:
      return { kind: "unknown" };
  }

  if (ts.isArrayTypeNode(typeNode)) {
    return {
      kind: "array",
      items: resolvePropertyType(typeNode.elementType, checker),
    };
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const name = ts.isIdentifier(typeNode.typeName)
      ? typeNode.typeName.text
      : typeNode.typeName.getText();

    // Date → string with format date-time
    if (name === "Date") {
      return { kind: "primitive", type: "string" };
    }

    return { kind: "ref", name };
  }

  return { kind: "unknown" };
}

function getDecoratorCallName(decorator: ts.Decorator): string | undefined {
  const expr = decorator.expression;
  if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
    return expr.expression.text;
  }
  if (ts.isIdentifier(expr)) {
    return expr.text;
  }
  return undefined;
}

function extractNumericArg(
  args: ts.NodeArray<ts.Expression>,
): number | undefined {
  if (args.length > 0 && ts.isNumericLiteral(args[0])) {
    return Number(args[0].text);
  }
  return undefined;
}
