// ============================================================================
// Serializer determinism tests
//
// The serializer is part of the product contract for `specord inspect`.
// Snapshot stability depends on deterministic ordering.
// ============================================================================

import { describe, expect, it } from "vitest";
import { serializeInspectionModel } from "../src/index.ts";
import { inspectNestFixture } from "./helpers/inspect-fixture.js";
import { normalizeInspectionModel } from "./helpers/normalize-inspection-model.js";
import type { InspectionModel } from "@specord/types";

/**
 * Create a minimal InspectionModel for isolated serializer tests.
 */
function makeMinimalInspectionModel(
  overrides: Partial<InspectionModel>,
): InspectionModel {
  return {
    source: {
      project: "<test>",
      root: "<test>",
      inspectedAt: "<test>",
      version: "v1",
    },
    operations: [],
    schemas: {},
    diagnostics: [],
    ...overrides,
  };
}

describe("serializeInspectionModel", () => {
  it("serializes equivalent models deterministically", () => {
    const first = normalizeInspectionModel(inspectNestFixture());
    const second = normalizeInspectionModel(inspectNestFixture());

    expect(serializeInspectionModel(first)).toEqual(
      serializeInspectionModel(second),
    );
  });

  it("sorts operations by path, method, and id", () => {
    const model = makeMinimalInspectionModel({
      operations: [
        {
          id: "B.z",
          controller: "B",
          handler: "z",
          method: "post",
          path: "/b",
          params: [],
          responses: [],
          security: { status: "inferred" },
          diagnostics: [],
        },
        {
          id: "A.a",
          controller: "A",
          handler: "a",
          method: "get",
          path: "/a",
          params: [],
          responses: [],
          security: { status: "inferred" },
          diagnostics: [],
        },
        {
          id: "A.b",
          controller: "A",
          handler: "b",
          method: "post",
          path: "/a",
          params: [],
          responses: [],
          security: { status: "inferred" },
          diagnostics: [],
        },
      ],
    });

    const json = serializeInspectionModel(model);
    const parsed = JSON.parse(json);

    expect(parsed.operations.map((op: any) => op.id)).toEqual([
      "A.a",
      "A.b",
      "B.z",
    ]);
  });

  it("sorts schema keys lexically", () => {
    const model = makeMinimalInspectionModel({
      schemas: {
        Zebra: {
          name: "Zebra",
          properties: {},
          required: [],
          inference: { status: "inferred" },
        },
        Apple: {
          name: "Apple",
          properties: {},
          required: [],
          inference: { status: "inferred" },
        },
        Mango: {
          name: "Mango",
          properties: {},
          required: [],
          inference: { status: "inferred" },
        },
      },
    });

    const json = serializeInspectionModel(model);
    const parsed = JSON.parse(json);

    expect(Object.keys(parsed.schemas)).toEqual(["Apple", "Mango", "Zebra"]);
  });

  it("sorts diagnostics by severity, code, then source location", () => {
    const model = makeMinimalInspectionModel({
      diagnostics: [
        {
          severity: "warning",
          code: "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
          message: "b",
          source: { file: "b.ts", line: 10 },
        },
        {
          severity: "error",
          code: "EXTRACTOR_ROUTE_CONFLICT",
          message: "a",
          source: { file: "a.ts", line: 5 },
        },
        {
          severity: "warning",
          code: "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
          message: "a",
          source: { file: "a.ts", line: 1 },
        },
        {
          severity: "info",
          code: "EXTRACTOR_TYPE_FALLBACK_ANY",
          message: "c",
          source: { file: "c.ts", line: 1 },
        },
      ],
    });

    const json = serializeInspectionModel(model);
    const parsed = JSON.parse(json);
    const codes = parsed.diagnostics.map((d: any) => d.code);

    // error first, then warning (sorted by code, then source), then info
    expect(codes).toEqual([
      "EXTRACTOR_ROUTE_CONFLICT",
      "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
      "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
      "EXTRACTOR_TYPE_FALLBACK_ANY",
    ]);

    // Within same severity+code, sorted by file then line
    const mappedTypeDiags = parsed.diagnostics.filter(
      (d: any) => d.code === "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
    );
    expect(mappedTypeDiags[0].source.file).toBe("a.ts");
    expect(mappedTypeDiags[1].source.file).toBe("b.ts");
  });
});
