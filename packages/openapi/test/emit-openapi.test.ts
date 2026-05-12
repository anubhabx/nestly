// ============================================================================
// OpenAPI emission tests
// ============================================================================

import { describe, expect, it } from "vitest";
import type { InspectionModel } from "@specord/types";
import { emitOpenApiDocument } from "../src/index.ts";

const model: InspectionModel = {
  source: {
    project: "tsconfig.json",
    root: "src",
    inspectedAt: "2026-05-12T00:00:00.000Z",
    version: "v1",
  },
  operations: [
    {
      id: "OrdersController.list",
      operationId: "listOrders",
      controller: "OrdersController",
      handler: "list",
      method: "get",
      path: "/orders",
      tags: ["Orders"],
      params: [
        {
          name: "page",
          in: "query",
          type: { kind: "primitive", type: "integer" },
          required: false,
          default: 1,
          inference: { status: "inferred" },
        },
      ],
      responses: [
        {
          status: 200,
          description: "Orders returned.",
          schema: {
            kind: "array",
            items: { kind: "ref", name: "OrderResponseDto" },
          },
          inference: { status: "inferred" },
        },
      ],
      security: { status: "overridden" },
      diagnostics: [],
      openapi: {
        security: [{ bearerAuth: [] }],
      },
    },
  ],
  schemas: {
    OrderResponseDto: {
      name: "OrderResponseDto",
      required: ["id"],
      properties: {
        id: {
          type: { kind: "primitive", type: "string" },
          example: "ord_123",
          readOnly: true,
          inference: { status: "inferred" },
        },
      },
      inference: { status: "inferred" },
    },
  },
  securitySchemes: {
    bearerAuth: { type: "http", scheme: "bearer" },
  },
  diagnostics: [],
};

describe("emitOpenApiDocument", () => {
  it("translates the inspection model into deterministic OpenAPI 3.1", () => {
    const document = emitOpenApiDocument(model, {
      document: {
        title: "Orders API",
        version: "1.0.0",
        servers: [{ url: "https://api.example.test" }],
      },
    });

    expect(document).toMatchObject({
      openapi: "3.1.0",
      info: { title: "Orders API", version: "1.0.0" },
      servers: [{ url: "https://api.example.test" }],
      paths: {
        "/orders": {
          get: {
            operationId: "listOrders",
            tags: ["Orders"],
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "integer", default: 1 },
              },
            ],
            responses: {
              "200": {
                description: "Orders returned.",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/OrderResponseDto" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          OrderResponseDto: {
            type: "object",
            required: ["id"],
            properties: {
              id: {
                type: "string",
                example: "ord_123",
                readOnly: true,
              },
            },
          },
        },
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer" },
        },
      },
    });
  });
});
