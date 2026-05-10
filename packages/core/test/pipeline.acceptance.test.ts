// ============================================================================
// Acceptance tests — explicit assertions for Phase 0 fixture behavior
//
// These tests name the specific contracts being locked. Snapshots tell you
// something changed; these tests tell you *what* broke.
//
// Known limitations frozen here (to be lifted in future phases):
// - Guard-backed routes produce unresolved security until config overrides.
// - Anonymous/library return types produce unresolved response diagnostics.
// ============================================================================

import { describe, expect, it } from "vitest";
import path from "node:path";
import { inspect, resolveConfig } from "../src/index.ts";
import {
  inspectNestFixture,
  inspectNestFixtureWithConfig,
  getNestFixtureRoot,
} from "./helpers/inspect-fixture.js";

// ---------------------------------------------------------------------------
// 4.1 Controller Discovery
// ---------------------------------------------------------------------------
describe("controller discovery", () => {
  it("discovers expected controllers", () => {
    const model = inspectNestFixture();

    const controllers = new Set(model.operations.map((op) => op.controller));

    expect([...controllers].sort()).toEqual([
      "AuthController",
      "HealthController",
      "ProductsController",
      "UsersController",
    ]);
  });
});

// ---------------------------------------------------------------------------
// 4.2 Operation Count
// ---------------------------------------------------------------------------
describe("operation count", () => {
  it("extracts expected operation count", () => {
    const model = inspectNestFixture();

    expect(model.operations).toHaveLength(15);
  });
});

// ---------------------------------------------------------------------------
// 4.3 Schema Count
// ---------------------------------------------------------------------------
describe("schema count", () => {
  it("extracts expected schema count", () => {
    const model = inspectNestFixture();

    expect(Object.keys(model.schemas)).toHaveLength(8);
  });
});

// ---------------------------------------------------------------------------
// 4.4 Expected Schema Names
// ---------------------------------------------------------------------------
describe("schema names", () => {
  it("extracts expected schema names", () => {
    const model = inspectNestFixture();

    expect(Object.keys(model.schemas).sort()).toEqual([
      "CreateProductDto",
      "CreateUserDto",
      "LoginUserDto",
      "PaginationDto",
      "RefreshTokenDto",
      "UpdateProductDto",
      "UpdateUserDto",
      "User",
    ]);
  });
});

// ---------------------------------------------------------------------------
// 4.5 Route Path Normalization
// ---------------------------------------------------------------------------
describe("path normalization", () => {
  it("normalizes Nest path params to OpenAPI template params", () => {
    const model = inspectNestFixture();

    expect(model.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "/users/{id}" }),
        expect.objectContaining({ path: "/products/{id}" }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 4.6 Request Body Extraction
// ---------------------------------------------------------------------------
describe("request body extraction", () => {
  it("extracts request body DTO refs", () => {
    const model = inspectNestFixture();

    expect(model.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "UsersController.create",
          requestBody: expect.objectContaining({
            schema: { kind: "ref", name: "CreateUserDto" },
          }),
        }),
        expect.objectContaining({
          id: "ProductsController.create",
          requestBody: expect.objectContaining({
            schema: { kind: "ref", name: "CreateProductDto" },
          }),
        }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 4.7 Query DTO Extraction
// Query DTOs expand into individual query parameters.
// ---------------------------------------------------------------------------
describe("query DTO extraction", () => {
  it("expands query DTO params into individual query parameters", () => {
    const model = inspectNestFixture();

    const productsList = model.operations.find(
      (op) =>
        op.controller === "ProductsController" &&
        op.method === "get" &&
        op.path === "/products",
    );

    expect(productsList?.params).toEqual([
      expect.objectContaining({
        name: "page",
        in: "query",
        type: { kind: "primitive", type: "number" },
        required: false,
        default: 1,
      }),
      expect.objectContaining({
        name: "limit",
        in: "query",
        type: { kind: "primitive", type: "number" },
        required: false,
        default: 10,
      }),
      expect.objectContaining({
        name: "search",
        in: "query",
        type: { kind: "primitive", type: "string" },
        required: false,
      }),
      expect.objectContaining({
        name: "category",
        in: "query",
        type: { kind: "primitive", type: "string" },
        required: false,
      }),
    ]);
  });
});

// ---------------------------------------------------------------------------
// 4.8 Guard / Security Diagnostics
// ---------------------------------------------------------------------------
describe("security diagnostics", () => {
  it("emits unresolved security diagnostics for guarded routes", () => {
    const model = inspectNestFixture();

    const guardedOps = model.operations.filter(
      (op) => op.security.status === "unresolved",
    );

    expect(guardedOps.length).toBeGreaterThan(0);

    expect(
      guardedOps.some((op) =>
        op.diagnostics.some(
          (diag) => diag.code === "EXTRACTOR_UNRESOLVED_SECURITY",
        ),
      ),
    ).toBe(true);
  });

  it("has expected unresolved security diagnostic count", () => {
    const model = inspectNestFixture();

    const securityDiagnostics = model.operations.flatMap((op) =>
      op.diagnostics.filter(
        (diag) => diag.code === "EXTRACTOR_UNRESOLVED_SECURITY",
      ),
    );

    expect(securityDiagnostics).toHaveLength(12);
  });
});

// ---------------------------------------------------------------------------
// 4.9 Response Diagnostics
// ---------------------------------------------------------------------------
describe("response diagnostics", () => {
  it("emits unresolved response diagnostics for non-reducible return types", () => {
    const model = inspectNestFixture();

    const responseDiagnostics = model.operations.flatMap((op) =>
      op.diagnostics.filter(
        (diag) => diag.code === "EXTRACTOR_UNRESOLVED_RESPONSE",
      ),
    );

    expect(responseDiagnostics.length).toBeGreaterThan(0);
  });

  it("has expected unresolved response diagnostic count", () => {
    const model = inspectNestFixture();

    const responseDiagnostics = model.operations.flatMap((op) =>
      op.diagnostics.filter(
        (diag) => diag.code === "EXTRACTOR_UNRESOLVED_RESPONSE",
      ),
    );

    expect(responseDiagnostics).toHaveLength(13);
  });
});

// ---------------------------------------------------------------------------
// 4.10 Mapped Type Diagnostics
// PartialType DTOs are expanded from their base DTO with all fields optional.
// ---------------------------------------------------------------------------
describe("mapped type diagnostics", () => {
  it("resolves PartialType DTOs as optional copies of their base DTOs", () => {
    const model = inspectNestFixture();

    const diagnostics = model.diagnostics.filter(
      (diag) => diag.code === "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
    );

    expect(diagnostics).toHaveLength(0);

    expect(model.schemas.UpdateUserDto).toMatchObject({
      name: "UpdateUserDto",
      properties: {
        email: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
          constraints: { format: "email" },
        }),
        password: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
          constraints: expect.objectContaining({
            type: "string",
            minLength: 6,
          }),
        }),
        firstName: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
          constraints: { type: "string" },
        }),
        lastName: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
          constraints: { type: "string" },
        }),
        phone: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
        }),
      },
      required: [],
      inference: { status: "inferred" },
    });

    expect(model.schemas.UpdateProductDto).toMatchObject({
      name: "UpdateProductDto",
      properties: {
        name: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
          constraints: { type: "string" },
        }),
        price: expect.objectContaining({
          type: { kind: "primitive", type: "number" },
          constraints: expect.objectContaining({
            type: "number",
            exclusiveMinimum: 0,
          }),
        }),
        category: expect.objectContaining({
          type: { kind: "ref", name: "Category" },
          enum: ["Electronics", "Home", "Clothing", "Books"],
        }),
        stock: expect.objectContaining({
          type: { kind: "primitive", type: "number" },
          constraints: expect.objectContaining({
            type: "number",
            minimum: 0,
          }),
        }),
      },
      required: [],
      inference: { status: "inferred" },
    });
  });
});

// ---------------------------------------------------------------------------
// Unsupported Decorator Diagnostics
// ---------------------------------------------------------------------------
describe("unsupported decorator diagnostics", () => {
  it("has expected unsupported decorator diagnostic count", () => {
    const model = inspectNestFixture();

    const decoratorDiagnostics = model.operations.flatMap((op) =>
      op.diagnostics.filter(
        (diag) => diag.code === "EXTRACTOR_UNSUPPORTED_DECORATOR",
      ),
    );

    expect(decoratorDiagnostics).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 7. Global Prefix Behavior
// ---------------------------------------------------------------------------
describe("routing.globalPrefix", () => {
  it("does not add global prefix when config is absent", () => {
    const model = inspectNestFixture();

    expect(model.operations.some((op) => op.path === "/users")).toBe(true);
    expect(model.operations.every((op) => !op.path.startsWith("/api/"))).toBe(
      true,
    );
  });

  it("applies routing.globalPrefix to extracted paths", () => {
    const model = inspectNestFixtureWithConfig({
      routing: {
        globalPrefix: "api",
      },
    });

    expect(model.operations.every((op) => op.path.startsWith("/api/"))).toBe(
      true,
    );
  });
});
