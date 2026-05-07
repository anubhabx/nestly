// ============================================================================
// Config override tests — Phase 1B OpenAPI-shaped fragments
// ============================================================================

import { describe, expect, it } from "vitest";
import type { DiagnosticCode, OperationModel } from "@specord/types";
import { inspectNestFixtureWithConfig } from "./helpers/inspect-fixture.js";

function getOperation(model: { operations: OperationModel[] }, id: string): OperationModel {
  const operation = model.operations.find((op) => op.id === id);
  expect(operation, `expected operation ${id}`).toBeDefined();
  return operation!;
}

function countOperationDiagnostics(
  model: { operations: OperationModel[] },
  code: DiagnosticCode,
): number {
  return model.operations.flatMap((op) =>
    op.diagnostics.filter((diag) => diag.code === code),
  ).length;
}

describe("config override application", () => {
  it("applies OpenAPI-shaped response overrides and resolves response diagnostics", () => {
    const model = inspectNestFixtureWithConfig({
      operations: {
        "AuthController.login": {
          responses: {
            "200": {
              description: "Authenticated.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      accessToken: { type: "string" },
                      refreshToken: { type: "string" },
                    },
                    required: ["accessToken", "refreshToken"],
                  },
                },
              },
            },
          },
        },
      },
    });

    const operation = getOperation(model, "AuthController.login");

    expect(operation.responses).toEqual([
      expect.objectContaining({
        status: 200,
        description: "Authenticated.",
        inference: { status: "overridden" },
        openapi: expect.objectContaining({
          description: "Authenticated.",
        }),
      }),
    ]);
    expect(
      operation.diagnostics.some(
        (diag) => diag.code === "EXTRACTOR_UNRESOLVED_RESPONSE",
      ),
    ).toBe(false);
    expect(
      countOperationDiagnostics(model, "EXTRACTOR_UNRESOLVED_RESPONSE"),
    ).toBe(12);
  });

  it("applies security scheme and operation security overrides", () => {
    const model = inspectNestFixtureWithConfig({
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      operations: {
        "ProductsController.findAll": {
          security: [{ bearerAuth: [] }],
        },
      },
    });

    const operation = getOperation(model, "ProductsController.findAll");

    expect(model.securitySchemes).toEqual({
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    });
    expect(operation.security).toEqual({ status: "overridden" });
    expect(operation.openapi?.security).toEqual([{ bearerAuth: [] }]);
    expect(
      operation.diagnostics.some(
        (diag) => diag.code === "EXTRACTOR_UNRESOLVED_SECURITY",
      ),
    ).toBe(false);
    expect(
      countOperationDiagnostics(model, "EXTRACTOR_UNRESOLVED_SECURITY"),
    ).toBe(11);
  });

  it("applies operation metadata overrides", () => {
    const model = inspectNestFixtureWithConfig({
      operations: {
        "UsersController.create": {
          summary: "Create user",
          description: "Create a user account.",
          tags: ["Users"],
        },
      },
    });

    const operation = getOperation(model, "UsersController.create");

    expect(operation.summary).toBe("Create user");
    expect(operation.description).toBe("Create a user account.");
    expect(operation.tags).toEqual(["Users"]);
    expect(operation.openapi).toMatchObject({
      summary: "Create user",
      description: "Create a user account.",
      tags: ["Users"],
    });
  });

  it("excludes operations and drops operation-scoped diagnostics", () => {
    const model = inspectNestFixtureWithConfig({
      operations: {
        "HealthController.check": {
          exclude: true,
        },
      },
    });

    expect(
      model.operations.some((op) => op.id === "HealthController.check"),
    ).toBe(false);
    expect(model.operations).toHaveLength(14);
    expect(
      model.diagnostics.some((diag) => diag.subject === "HealthController.check"),
    ).toBe(false);
  });

  it("applies schema overrides and resolves mapped-type diagnostics", () => {
    const model = inspectNestFixtureWithConfig({
      schemas: {
        UpdateUserDto: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
          },
        },
      },
    });

    expect(model.schemas.UpdateUserDto).toMatchObject({
      name: "UpdateUserDto",
      inference: { status: "overridden" },
      openapi: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
        },
      },
    });
    expect(
      model.diagnostics.some(
        (diag) =>
          diag.code === "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE" &&
          diag.subject === "UpdateUserDto",
      ),
    ).toBe(false);
  });

  it("throws clear errors for invalid override keys", () => {
    expect(() =>
      inspectNestFixtureWithConfig({
        operations: {
          "MissingController.nope": {
            summary: "Nope",
          },
        },
      }),
    ).toThrow(/Unknown operation override "MissingController\.nope"/);

    expect(() =>
      inspectNestFixtureWithConfig({
        schemas: {
          MissingDto: {
            type: "object",
          },
        },
      }),
    ).toThrow(/Unknown schema override "MissingDto"/);

    expect(() =>
      inspectNestFixtureWithConfig({
        operations: {
          "AuthController.login": {
            responses: {
              ok: {
                description: "Nope",
              },
            },
          },
        },
      }),
    ).toThrow(/Invalid response override status "ok"/);
  });
});
