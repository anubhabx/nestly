// ============================================================================
// Acceptance tests — explicit assertions for Phase 0 fixture behavior
//
// These tests name the specific contracts being locked. Snapshots tell you
// something changed; these tests tell you *what* broke.
//
// The fixture is intentionally shaped like a real NestJS service, not a tiny
// teaching app. These assertions lock the benchmark surface that Specord uses
// to exercise controllers, DTOs, nested routes, decorators, guards, and mapped
// types.
// ============================================================================

import { describe, expect, it } from "vitest";
import {
  inspectNestFixture,
  inspectNestFixtureWithConfig,
} from "./helpers/inspect-fixture.js";

// ---------------------------------------------------------------------------
// 4.1 Controller Discovery
// ---------------------------------------------------------------------------
describe("controller discovery", () => {
  it("discovers expected controllers", () => {
    const model = inspectNestFixture();

    const controllers = new Set(model.operations.map((op) => op.controller));

    expect([...controllers].sort()).toEqual([
      "AccountsController",
      "AuthController",
      "BillingController",
      "HealthController",
      "ProjectsController",
      "TasksController",
      "WebhooksController",
    ]);
  });
});

// ---------------------------------------------------------------------------
// 4.2 Operation Count
// ---------------------------------------------------------------------------
describe("operation count", () => {
  it("extracts expected operation count", () => {
    const model = inspectNestFixture();

    expect(model.operations.length).toBeGreaterThanOrEqual(24);
  });
});

// ---------------------------------------------------------------------------
// 4.3 Schema Count
// ---------------------------------------------------------------------------
describe("schema count", () => {
  it("extracts expected schema count", () => {
    const model = inspectNestFixture();

    expect(Object.keys(model.schemas).length).toBeGreaterThanOrEqual(28);
  });
});

// ---------------------------------------------------------------------------
// 4.4 Expected Schema Names
// ---------------------------------------------------------------------------
describe("schema names", () => {
  it("extracts expected schema names", () => {
    const model = inspectNestFixture();

    expect(Object.keys(model.schemas).sort()).toEqual(
      expect.arrayContaining([
        "AccountDetailsDto",
        "AccountResponseDto",
        "CheckoutSessionDto",
        "CreateProjectDto",
        "CreateTaskCommentDto",
        "CreateTaskDto",
        "InviteMemberDto",
        "InvoiceResponseDto",
        "LoginUserDto",
        "PaginatedProjectResponseDto",
        "ProjectQueryDto",
        "ProjectResponseDto",
        "RegisterUserDto",
        "RefreshTokenDto",
        "SubscriptionResponseDto",
        "TaskResponseDto",
        "UpdateProjectDto",
        "UpdateTaskDto",
        "WebhookEventDto",
      ]),
    );
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
        expect.objectContaining({ path: "/accounts/{accountId}" }),
        expect.objectContaining({ path: "/projects/{projectId}" }),
        expect.objectContaining({ path: "/projects/{projectId}/tasks/{taskId}" }),
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
          id: "AuthController.register",
          requestBody: expect.objectContaining({
            schema: { kind: "ref", name: "RegisterUserDto" },
          }),
        }),
        expect.objectContaining({
          id: "ProjectsController.create",
          requestBody: expect.objectContaining({
            schema: { kind: "ref", name: "CreateProjectDto" },
          }),
        }),
        expect.objectContaining({
          id: "TasksController.create",
          requestBody: expect.objectContaining({
            schema: { kind: "ref", name: "CreateTaskDto" },
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

    const projectsList = model.operations.find(
      (op) =>
        op.controller === "ProjectsController" &&
        op.method === "get" &&
        op.path === "/projects",
    );

    expect(projectsList?.params).toEqual(
      expect.arrayContaining([
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
          name: "status",
          in: "query",
          type: { kind: "primitive", type: "string" },
          required: false,
        }),
        expect.objectContaining({
          name: "ownerId",
          in: "query",
          type: { kind: "primitive", type: "string" },
          required: false,
        }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 4.8 Guard / Security Diagnostics
// ---------------------------------------------------------------------------
describe("security extraction", () => {
  it("harvests bearer security from decorated guarded routes", () => {
    const model = inspectNestFixture();

    const createProject = model.operations.find(
      (op) => op.id === "ProjectsController.create",
    );

    expect(createProject).toMatchObject({
      security: { status: "overridden" },
      openapi: {
        security: [{ bearerAuth: [] }],
      },
    });
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

  it("keeps a dynamic file export unresolved for strict-mode coverage", () => {
    const model = inspectNestFixture();

    const exportOperation = model.operations.find(
      (op) => op.id === "ProjectsController.exportCsv",
    );

    expect(exportOperation?.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "EXTRACTOR_UNRESOLVED_RESPONSE",
        }),
      ]),
    );
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

    expect(model.schemas.UpdateProjectDto).toMatchObject({
      name: "UpdateProjectDto",
      properties: {
        name: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
          constraints: expect.objectContaining({ type: "string" }),
        }),
        slug: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
          constraints: expect.objectContaining({ type: "string" }),
        }),
        status: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
          enum: ["planning", "active", "paused", "archived"],
        }),
      },
      required: [],
      inference: { status: "inferred" },
    });

    expect(model.schemas.UpdateTaskDto).toMatchObject({
      name: "UpdateTaskDto",
      properties: {
        title: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
        }),
        status: expect.objectContaining({
          type: { kind: "primitive", type: "string" },
          enum: ["todo", "in_progress", "blocked", "done"],
        }),
      },
      required: [],
      inference: { status: "inferred" },
    });
  });
});

// ---------------------------------------------------------------------------
describe("global middleware and interceptors", () => {
  it("does not treat middleware/interceptor files as controllers", () => {
    const model = inspectNestFixture();

    expect(model.operations.map((op) => op.controller)).not.toContain(
      "RequestContextMiddleware",
    );
    expect(model.operations.map((op) => op.controller)).not.toContain(
      "ResponseEnvelopeInterceptor",
    );
  });
});

// ---------------------------------------------------------------------------
// 7. Global Prefix Behavior
// ---------------------------------------------------------------------------
describe("routing.globalPrefix", () => {
  it("does not add global prefix when config is absent", () => {
    const model = inspectNestFixture();

    expect(model.operations.some((op) => op.path === "/projects")).toBe(true);
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
