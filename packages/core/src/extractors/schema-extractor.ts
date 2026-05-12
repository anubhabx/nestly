// ============================================================================
// Schema extraction — DTO classes, properties, validators, mapped types
// ============================================================================

import ts from "typescript";
import type {
  SchemaModel,
  PropertyModel,
  SchemaRef,
  Diagnostic,
} from "@specord/types";
import {
  arrayLiteralStrings,
  extractOpenApiMetadataFactory,
  extractSwaggerProperty,
  schemaRefFromExpression,
  type SwaggerPropertyMetadata,
} from "./swagger-compat.js";

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

type ExportedClassInfo = {
  node: ts.ClassDeclaration;
  sourceFile: ts.SourceFile;
  className: string;
  file: string;
  line: number;
};

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
  const exportedClasses: ExportedClassInfo[] = [];
  const classIndex = new Map<string, ExportedClassInfo>();
  const enumIndex = new Map<string, unknown[]>();

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
      const classInfo = {
        node,
        sourceFile,
        className,
        file: relativePath,
        line: line + 1,
      };

      exportedClasses.push(classInfo);
      classIndex.set(className, classInfo);
    });

    // Also extract exported enums
    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isEnumDeclaration(node) || !node.name) return;

      const isExported = node.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!isExported) return;

      enumIndex.set(node.name.text, enumValuesFromDeclaration(node));
    });
  }

  for (const classInfo of exportedClasses) {
    if (schemas[classInfo.className]) continue;

    const result = extractClassSchema(
      classInfo,
      checker,
      normalizedRoot,
      classIndex,
      enumIndex,
      schemas,
      new Set(),
    );

    schemas[classInfo.className] = result.schema;
    diagnostics.push(...result.diagnostics);
  }

  return { schemas, diagnostics };
}

function extractClassSchema(
  classInfo: ExportedClassInfo,
  checker: ts.TypeChecker,
  normalizedRoot: string,
  classIndex: Map<string, ExportedClassInfo>,
  enumIndex: Map<string, unknown[]>,
  schemas: Record<string, SchemaModel>,
  resolving: Set<string>,
): { schema: SchemaModel; diagnostics: Diagnostic[] } {
  const existing = schemas[classInfo.className];
  if (existing) {
    return { schema: existing, diagnostics: [] };
  }

  if (resolving.has(classInfo.className)) {
    return {
      schema: unsupportedMappedTypeSchema(
        classInfo.className,
        "PartialType",
        "?",
        classInfo.file,
        classInfo.line,
      ),
      diagnostics: [
        unsupportedMappedTypeDiagnostic(
          classInfo.className,
          "PartialType",
          "?",
          classInfo.file,
          classInfo.line,
        ),
      ],
    };
  }

  resolving.add(classInfo.className);

  const mappedTypeResult = checkMappedType(
    classInfo,
    checker,
    normalizedRoot,
    classIndex,
    enumIndex,
    schemas,
    resolving,
  );

  if (mappedTypeResult) {
    resolving.delete(classInfo.className);
    return mappedTypeResult;
  }

  const baseResult = extractBaseClassSchema(
    classInfo,
    checker,
    normalizedRoot,
    classIndex,
    enumIndex,
    schemas,
    resolving,
  );
  const { properties, required, propDiagnostics } = extractProperties(
    classInfo.node,
    checker,
    classInfo.sourceFile,
    normalizedRoot,
    enumIndex,
  );
  const mergedProperties = baseResult
    ? { ...cloneProperties(baseResult.schema.properties), ...properties }
    : properties;
  const mergedRequired = baseResult
    ? [...new Set([...baseResult.schema.required, ...required])]
    : required;

  resolving.delete(classInfo.className);

  return {
    schema: {
      name: classInfo.className,
      properties: mergedProperties,
      required: mergedRequired,
      source: { file: classInfo.file, line: classInfo.line },
      inference: { status: "inferred" },
    },
    diagnostics: [...(baseResult?.diagnostics ?? []), ...propDiagnostics],
  };
}

function extractBaseClassSchema(
  classInfo: ExportedClassInfo,
  checker: ts.TypeChecker,
  normalizedRoot: string,
  classIndex: Map<string, ExportedClassInfo>,
  enumIndex: Map<string, unknown[]>,
  schemas: Record<string, SchemaModel>,
  resolving: Set<string>,
): { schema: SchemaModel; diagnostics: Diagnostic[] } | undefined {
  for (const clause of classInfo.node.heritageClauses ?? []) {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;

    for (const type of clause.types) {
      if (ts.isIdentifier(type.expression)) {
        const baseClass = classIndex.get(type.expression.text);
        if (!baseClass) return undefined;

        const result = extractClassSchema(
          baseClass,
          checker,
          normalizedRoot,
          classIndex,
          enumIndex,
          schemas,
          resolving,
        );
        schemas[baseClass.className] = result.schema;
        return result;
      }
    }
  }

  return undefined;
}

/**
 * Check if a class extends a mapped type utility (PartialType, PickType, etc.).
 */
function checkMappedType(
  classInfo: ExportedClassInfo,
  checker: ts.TypeChecker,
  normalizedRoot: string,
  classIndex: Map<string, ExportedClassInfo>,
  enumIndex: Map<string, unknown[]>,
  schemas: Record<string, SchemaModel>,
  resolving: Set<string>,
): { schema: SchemaModel; diagnostics: Diagnostic[] } | null {
  const { node, className, file, line } = classInfo;

  if (!node.heritageClauses) return null;

  for (const clause of node.heritageClauses) {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;

    for (const type of clause.types) {
      const expr = type.expression;

      if (ts.isCallExpression(expr)) {
        const mapped = resolveMappedTypeExpression(
          expr,
          classInfo,
          checker,
          normalizedRoot,
          classIndex,
          enumIndex,
          schemas,
          resolving,
        );

        if (mapped) {
          return mapped;
        }
      }
    }
  }

  return null;
}

function resolveMappedTypeExpression(
  expr: ts.CallExpression,
  classInfo: ExportedClassInfo,
  checker: ts.TypeChecker,
  normalizedRoot: string,
  classIndex: Map<string, ExportedClassInfo>,
  enumIndex: Map<string, unknown[]>,
  schemas: Record<string, SchemaModel>,
  resolving: Set<string>,
): { schema: SchemaModel; diagnostics: Diagnostic[] } | null {
  if (!ts.isIdentifier(expr.expression)) return null;

  const utilName = expr.expression.text;
  if (!["PartialType", "PickType", "OmitType", "IntersectionType"].includes(utilName)) {
    return null;
  }

  const resolved = schemaFromMappedInput(
    expr,
    checker,
    normalizedRoot,
    classIndex,
    enumIndex,
    schemas,
    resolving,
  );

  if (!resolved) {
    const baseClassName = mappedTypeInputName(expr.arguments[0]);
    return {
      schema: unsupportedMappedTypeSchema(
        classInfo.className,
        utilName,
        baseClassName,
        classInfo.file,
        classInfo.line,
      ),
      diagnostics: [
        unsupportedMappedTypeDiagnostic(
          classInfo.className,
          utilName,
          baseClassName,
          classInfo.file,
          classInfo.line,
        ),
      ],
    };
  }

  return {
    schema: {
      name: classInfo.className,
      properties: cloneProperties(resolved.schema.properties),
      required: [...resolved.schema.required],
      source: { file: classInfo.file, line: classInfo.line },
      inference: { status: "inferred" },
    },
    diagnostics: resolved.diagnostics,
  };
}

function schemaFromMappedInput(
  expr: ts.Expression,
  checker: ts.TypeChecker,
  normalizedRoot: string,
  classIndex: Map<string, ExportedClassInfo>,
  enumIndex: Map<string, unknown[]>,
  schemas: Record<string, SchemaModel>,
  resolving: Set<string>,
): { schema: SchemaModel; diagnostics: Diagnostic[] } | undefined {
  const unwrapped = unwrapExpression(expr);

  if (ts.isIdentifier(unwrapped)) {
    const baseClass = classIndex.get(unwrapped.text);
    if (!baseClass) return undefined;

    const baseResult = extractClassSchema(
      baseClass,
      checker,
      normalizedRoot,
      classIndex,
      enumIndex,
      schemas,
      resolving,
    );
    schemas[baseClass.className] = baseResult.schema;
    return baseResult;
  }

  if (!ts.isCallExpression(unwrapped) || !ts.isIdentifier(unwrapped.expression)) {
    return undefined;
  }

  const utilName = unwrapped.expression.text;
  const base = unwrapped.arguments[0]
    ? schemaFromMappedInput(
        unwrapped.arguments[0],
        checker,
        normalizedRoot,
        classIndex,
        enumIndex,
        schemas,
        resolving,
      )
    : undefined;

  if (utilName === "PartialType" && base) {
    if (base.schema.inference.status !== "inferred") {
      return undefined;
    }

    return {
      schema: {
        ...base.schema,
        properties: cloneProperties(base.schema.properties),
        required: [],
      },
      diagnostics: base.diagnostics,
    };
  }

  if ((utilName === "PickType" || utilName === "OmitType") && base) {
    if (base.schema.inference.status !== "inferred") {
      return undefined;
    }

    const keysArg = unwrapped.arguments[1];
    const keys = keysArg && ts.isExpression(keysArg)
      ? arrayLiteralStrings(keysArg)
      : undefined;
    if (!keys) return undefined;

    const selected = new Set(keys);
    const properties = Object.fromEntries(
      Object.entries(base.schema.properties).filter(([name]) =>
        utilName === "PickType" ? selected.has(name) : !selected.has(name),
      ).map(([name, property]) => [name, cloneProperty(property)]),
    );
    const required = base.schema.required.filter((name) =>
      utilName === "PickType" ? selected.has(name) : !selected.has(name),
    );

    return {
      schema: { ...base.schema, properties, required },
      diagnostics: base.diagnostics,
    };
  }

  if (utilName === "IntersectionType") {
    const left = unwrapped.arguments[0]
      ? schemaFromMappedInput(
          unwrapped.arguments[0],
          checker,
          normalizedRoot,
          classIndex,
          enumIndex,
          schemas,
          resolving,
        )
      : undefined;
    const right = unwrapped.arguments[1]
      ? schemaFromMappedInput(
          unwrapped.arguments[1],
          checker,
          normalizedRoot,
          classIndex,
          enumIndex,
          schemas,
          resolving,
        )
      : undefined;
    if (!left || !right) return undefined;
    if (
      left.schema.inference.status !== "inferred" ||
      right.schema.inference.status !== "inferred"
    ) {
      return undefined;
    }

    return {
      schema: {
        ...left.schema,
        properties: {
          ...cloneProperties(left.schema.properties),
          ...cloneProperties(right.schema.properties),
        },
        required: [...new Set([...left.schema.required, ...right.schema.required])],
      },
      diagnostics: [...left.diagnostics, ...right.diagnostics],
    };
  }

  return undefined;
}

function mappedTypeInputName(expression: ts.Expression | undefined): string {
  if (!expression) return "?";
  const unwrapped = unwrapExpression(expression);
  if (ts.isIdentifier(unwrapped)) return unwrapped.text;
  return unwrapped.getText();
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function unsupportedMappedTypeSchema(
  className: string,
  utilName: string,
  baseClassName: string,
  file: string,
  line: number,
): SchemaModel {
  return {
    name: className,
    properties: {},
    required: [],
    source: { file, line },
    inference: {
      status: "inferred-with-warning",
      reason: `Mapped type ${utilName}(${baseClassName}) cannot be fully resolved at extraction time`,
    },
  };
}

function unsupportedMappedTypeDiagnostic(
  className: string,
  utilName: string,
  baseClassName: string,
  file: string,
  line: number,
): Diagnostic {
  return {
    severity: "warning",
    code: "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
    message: `${className} extends ${utilName}(${baseClassName}) — mapped type cannot be fully resolved`,
    source: { file, line },
    subject: className,
    suggestedOverridePath: `schemas.${className}`,
  };
}

function cloneProperties(
  properties: Record<string, PropertyModel>,
): Record<string, PropertyModel> {
  return Object.fromEntries(
    Object.entries(properties).map(([name, property]) => [
      name,
      cloneProperty(property),
    ]),
  );
}

function cloneProperty(property: PropertyModel): PropertyModel {
  return {
    ...property,
    type: cloneSchemaRef(property.type),
    example: cloneUnknown(property.example),
    examples: property.examples ? [...property.examples] : undefined,
    enum: property.enum ? [...property.enum] : undefined,
    constraints: property.constraints ? { ...property.constraints } : undefined,
    inference: { ...property.inference },
  };
}

function cloneUnknown(value: unknown): unknown {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === "object") return { ...(value as Record<string, unknown>) };
  return value;
}

function cloneSchemaRef(type: SchemaRef): SchemaRef {
  switch (type.kind) {
    case "array":
      return { kind: "array", items: cloneSchemaRef(type.items) };
    case "ref":
      return { kind: "ref", name: type.name };
    case "primitive":
      return { kind: "primitive", type: type.type };
    case "unknown":
      return { kind: "unknown" };
  }
}

/**
 * Extract properties from a class declaration.
 */
function extractProperties(
  classNode: ts.ClassDeclaration,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  normalizedRoot: string,
  enumIndex: Map<string, unknown[]>,
): {
  properties: Record<string, PropertyModel>;
  required: string[];
  propDiagnostics: Diagnostic[];
} {
  const properties: Record<string, PropertyModel> = {};
  const required: string[] = [];
  const propDiagnostics: Diagnostic[] = [];
  const factoryMetadata = extractOpenApiMetadataFactory(classNode, checker);

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
        const typeName = ts.isIdentifier(member.type.typeName)
          ? member.type.typeName.text
          : member.type.typeName.getText();
        if (enumIndex.has(typeName)) {
          enumValues = enumIndex.get(typeName);
          typeRef = enumValues?.every((value) => typeof value === "number")
            ? { kind: "primitive", type: "number" }
            : { kind: "primitive", type: "string" };
        }
        const memberType = checker.getTypeFromTypeNode(member.type);
        const symbol =
          checker.getSymbolAtLocation(member.type.typeName) ??
          memberType.symbol ??
          memberType.aliasSymbol;
        if (!enumValues && symbol) {
          const decl = symbol.declarations?.find(ts.isEnumDeclaration);
          if (decl && ts.isEnumDeclaration(decl)) {
            enumValues = enumValuesFromDeclaration(decl);
            typeRef = enumValues.every((value) => typeof value === "number")
              ? { kind: "primitive", type: "number" }
              : { kind: "primitive", type: "string" };
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
    const swaggerProperty = extractSwaggerProperty(member, checker);

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

    const mergedMetadata = mergePropertyMetadata(
      swaggerProperty,
      factoryMetadata[propName],
    );

    if (mergedMetadata.type) {
      typeRef = mergedMetadata.type;
    }
    if (mergedMetadata.required === false) {
      markedOptional = true;
    }
    if (mergedMetadata.required === true) {
      markedOptional = false;
    }
    if (mergedMetadata.constraints) {
      Object.assign(constraints, mergedMetadata.constraints);
    }

    if (!markedOptional) {
      required.push(propName);
    }

    properties[propName] = {
      type: typeRef,
      description: mergedMetadata.description,
      default: defaultValue,
      example: mergedMetadata.example,
      examples: mergedMetadata.examples,
      enum: mergedMetadata.enum ?? enumValues,
      format: mergedMetadata.format ?? format,
      deprecated: mergedMetadata.deprecated,
      readOnly: mergedMetadata.readOnly,
      writeOnly: mergedMetadata.writeOnly,
      nullable: mergedMetadata.nullable,
      constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
      inference: { status: "inferred" },
    };
  }

  for (const [propName, metadata] of Object.entries(factoryMetadata)) {
    if (properties[propName]) continue;

    const markedOptional = metadata.required === false;
    if (!markedOptional) {
      required.push(propName);
    }

    properties[propName] = {
      type: metadata.type ?? { kind: "unknown" },
      description: metadata.description,
      default: metadata.default,
      example: metadata.example,
      examples: metadata.examples,
      enum: metadata.enum,
      format: metadata.format,
      deprecated: metadata.deprecated,
      readOnly: metadata.readOnly,
      writeOnly: metadata.writeOnly,
      nullable: metadata.nullable,
      constraints: metadata.constraints,
      inference: { status: "inferred" },
    };
  }

  return { properties, required, propDiagnostics };
}

function mergePropertyMetadata(
  ...items: Array<SwaggerPropertyMetadata | undefined>
): SwaggerPropertyMetadata {
  const merged: SwaggerPropertyMetadata = {};
  const constraints: Record<string, unknown> = {};

  for (const item of items) {
    if (!item) continue;
    Object.assign(merged, item);
    if (item.constraints) {
      Object.assign(constraints, item.constraints);
    }
  }

  if (Object.keys(constraints).length > 0) {
    merged.constraints = constraints;
  }

  return merged;
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

function enumValuesFromDeclaration(decl: ts.EnumDeclaration): unknown[] {
  return decl.members.map((member) => {
    if (member.initializer && ts.isStringLiteral(member.initializer)) {
      return member.initializer.text;
    }
    if (member.initializer && ts.isNumericLiteral(member.initializer)) {
      return Number(member.initializer.text);
    }
    return member.name.getText(decl.getSourceFile());
  });
}
