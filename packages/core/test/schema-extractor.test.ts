// ============================================================================
// Schema extractor tests
// ============================================================================

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { extractSchemas } from "../src/extractors/schema-extractor.ts";

const tempRoots: string[] = [];

afterEach(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe("extractSchemas mapped type fallbacks", () => {
  it("does not mark mapped types inferred when their base cannot be resolved", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "specord-schema-"));
    tempRoots.push(root);

    const sourcePath = path.join(root, "mapped.dto.ts");
    fs.writeFileSync(
      sourcePath,
      [
        "declare function PartialType<T>(base: T): T;",
        "declare function PickType<T>(base: T, keys: readonly string[]): T;",
        "export class CreateThingDto {",
        "  name: string;",
        "}",
        "export class PickedThingDto extends PickType(MissingThingDto, ['name'] as const) {}",
        "export class UpdatePickedThingDto extends PartialType(PickedThingDto) {}",
      ].join("\n"),
    );

    const program = ts.createProgram([sourcePath], {
      module: ts.ModuleKind.Node16,
      moduleResolution: ts.ModuleResolutionKind.Node16,
      noEmit: true,
      target: ts.ScriptTarget.ES2022,
    });

    const sourceFile = program.getSourceFile(sourcePath);
    expect(sourceFile).toBeDefined();

    const result = extractSchemas(
      [sourceFile!],
      program.getTypeChecker(),
      root,
    );

    expect(result.schemas.PickedThingDto.inference.status).toBe(
      "inferred-with-warning",
    );
    expect(result.schemas.UpdatePickedThingDto.inference.status).toBe(
      "inferred-with-warning",
    );
    expect(result.schemas.UpdatePickedThingDto.properties).toEqual({});

    expect(
      result.diagnostics
        .filter(
          (diagnostic) =>
            diagnostic.code === "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
        )
        .map((diagnostic) => diagnostic.subject)
        .sort(),
    ).toEqual(["PickedThingDto", "UpdatePickedThingDto"]);
  });
});
