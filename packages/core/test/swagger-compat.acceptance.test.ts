// ============================================================================
// Real-world NestJS Swagger compatibility tests
// ============================================================================

import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspect, resolveConfig } from "../src/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const fixtureRoot = path.join(repoRoot, "examples/nestjs-realworld");

function inspectRealworldFixture() {
  return inspect(
    resolveConfig(
      {
        project: path.join(fixtureRoot, "tsconfig.json"),
        root: path.join(fixtureRoot, "src"),
      },
      {
        document: {
          title: "Realworld Orders API",
          version: "1.0.0",
        },
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          apiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
        },
      },
    ),
  );
}

describe("NestJS Swagger compatibility extraction", () => {
  it("harvests operation metadata, tags, responses, and security decorators", () => {
    const model = inspectRealworldFixture();

    const list = model.operations.find((op) => op.id === "OrdersController.list");

    expect(list).toMatchObject({
      operationId: "listOrders",
      summary: "List orders",
      description: "Returns visible orders for the current account.",
      tags: ["Orders"],
      security: { status: "overridden" },
      openapi: {
        security: [{ bearerAuth: [] }],
      },
    });
    expect(list?.responses).toEqual([
      expect.objectContaining({
        status: 200,
        description: "Orders returned.",
        schema: {
          kind: "array",
          items: { kind: "ref", name: "OrderResponseDto" },
        },
        inference: { status: "overridden" },
      }),
    ]);
    expect(
      list?.diagnostics.some((diag) => diag.code === "EXTRACTOR_UNRESOLVED_SECURITY"),
    ).toBe(false);
    expect(
      list?.diagnostics.some((diag) => diag.code === "EXTRACTOR_UNRESOLVED_RESPONSE"),
    ).toBe(false);
  });

  it("infers bearer security schemes and warns for named schemes that need config", () => {
    const model = inspect(
      resolveConfig(
        {
          project: path.join(fixtureRoot, "tsconfig.json"),
          root: path.join(fixtureRoot, "src"),
        },
        undefined,
      ),
    );

    expect(model.securitySchemes?.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });

    const serviceToken = model.operations.find(
      (op) => op.id === "OrdersController.serviceToken",
    );

    expect(serviceToken?.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "EXTRACTOR_UNRESOLVED_SECURITY",
          suggestedOverridePath: "securitySchemes.apiKeyAuth",
          origin: "swagger",
        }),
      ]),
    );
  });

  it("harvests ApiProperty metadata and static OpenAPI metadata factory properties", () => {
    const model = inspectRealworldFixture();

    expect(model.schemas.CreateOrderDto.properties.customerName).toMatchObject({
      example: "Acme Ltd",
      constraints: expect.objectContaining({ minLength: 2, type: "string" }),
    });
    expect(model.schemas.CreateOrderDto.properties.tags).toMatchObject({
      type: { kind: "array", items: { kind: "primitive", type: "string" } },
      example: ["fragile", "gift"],
    });
    expect(model.schemas.OrderResponseDto.properties.createdAt).toMatchObject({
      type: { kind: "primitive", type: "string" },
      format: "date-time",
      example: "2026-05-12T10:30:00.000Z",
      readOnly: true,
    });
    expect(model.schemas.OrderResponseDto.properties.status).toMatchObject({
      enum: ["draft", "submitted", "cancelled"],
      example: "submitted",
    });
  });

  it("resolves common mapped-type compositions", () => {
    const model = inspectRealworldFixture();

    expect(model.schemas.UpdateOrderDto.required).toEqual([]);
    expect(Object.keys(model.schemas.UpdateOrderDto.properties).sort()).toEqual([
      "customerName",
      "quantity",
      "shippingAddress",
      "tags",
    ]);
    expect(Object.keys(model.schemas.OrderSummaryDto.properties).sort()).toEqual([
      "customerName",
      "status",
    ]);
    expect(Object.keys(model.schemas.UpdateOrderWithSummaryDto.properties).sort()).toEqual([
      "customerName",
      "quantity",
      "shippingAddress",
      "status",
      "tags",
    ]);
  });

  it("applies source include and exclude glob filters", () => {
    const model = inspect(
      resolveConfig(
        {
          project: path.join(fixtureRoot, "tsconfig.json"),
          root: path.join(fixtureRoot, "src"),
        },
        {
          source: {
            include: ["orders/**/*.ts"],
            exclude: ["**/guards/*.ts"],
          },
        },
      ),
    );

    expect(model.operations.map((op) => op.controller)).not.toContain("InternalController");
    expect(model.operations.map((op) => op.controller)).toContain("OrdersController");
  });
});
