// ============================================================================
// Production benchmark NestJS Swagger compatibility tests
// ============================================================================

import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspect, resolveConfig } from "../src/index.ts";
import type { InspectionModel, SpecordConfigV1 } from "@specord/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const fixtureRoot = path.join(repoRoot, "examples/nestjs-api");
const fixtureCache = new Map<string, InspectionModel>();

function inspectBenchmarkFixture(): InspectionModel {
  return inspectBenchmarkFixtureWithConfig({
    document: {
      title: "Specord Benchmark API",
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
      stripeSignature: {
        type: "apiKey",
        in: "header",
        name: "Stripe-Signature",
      },
    },
  });
}

function inspectBenchmarkFixtureWithConfig(
  config: SpecordConfigV1 | undefined,
): InspectionModel {
  const cacheKey = JSON.stringify(config ?? null);
  const cached = fixtureCache.get(cacheKey);
  if (cached) {
    return cloneInspectionModel(cached);
  }

  const model = inspect(
    resolveConfig(
      {
        project: path.join(fixtureRoot, "tsconfig.json"),
        root: path.join(fixtureRoot, "src"),
      },
      config,
    ),
  );
  fixtureCache.set(cacheKey, model);
  return cloneInspectionModel(model);
}

function cloneInspectionModel(model: InspectionModel): InspectionModel {
  return JSON.parse(JSON.stringify(model)) as InspectionModel;
}

describe("NestJS Swagger compatibility extraction", () => {
  it("harvests operation metadata, tags, responses, and security decorators", () => {
    const model = inspectBenchmarkFixture();

    const list = model.operations.find((op) => op.id === "ProjectsController.list");

    expect(list).toMatchObject({
      operationId: "listProjects",
      summary: "List projects",
      description: "Returns projects visible to the current account with filter metadata.",
      tags: ["Projects"],
      security: { status: "overridden" },
      openapi: {
        security: [{ bearerAuth: [] }],
      },
    });
    expect(list?.responses).toEqual([
      expect.objectContaining({
        status: 200,
        description: "Projects returned.",
        schema: {
          kind: "ref",
          name: "PaginatedProjectResponseDto",
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

  it("infers bearer security and harvests named security when configured", () => {
    const model = inspectBenchmarkFixture();

    expect(model.securitySchemes?.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });

    const webhook = model.operations.find(
      (op) => op.id === "WebhooksController.stripe",
    );

    expect(model.securitySchemes?.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
    expect(webhook).toMatchObject({
      security: { status: "overridden" },
      openapi: { security: [{ stripeSignature: [] }] },
    });
  });

  it("harvests ApiProperty metadata and static OpenAPI metadata factory properties", () => {
    const model = inspectBenchmarkFixture();

    expect(model.schemas.CreateProjectDto.properties.name).toMatchObject({
      example: "Mobile Launch",
      constraints: expect.objectContaining({ minLength: 3, type: "string" }),
    });
    expect(model.schemas.CreateProjectDto.properties.tags).toMatchObject({
      type: { kind: "array", items: { kind: "primitive", type: "string" } },
      example: ["mobile", "q3"],
    });
    expect(model.schemas.ProjectResponseDto.properties.createdAt).toMatchObject({
      type: { kind: "primitive", type: "string" },
      format: "date-time",
      example: "2026-05-16T09:30:00.000Z",
      readOnly: true,
    });
    expect(model.schemas.TaskResponseDto.properties.status).toMatchObject({
      enum: ["todo", "in_progress", "blocked", "done"],
      example: "in_progress",
    });
  });

  it("resolves common mapped-type compositions", () => {
    const model = inspectBenchmarkFixture();

    expect(model.schemas.UpdateProjectDto.required).toEqual([]);
    expect(Object.keys(model.schemas.UpdateProjectDto.properties).sort()).toEqual([
      "description",
      "metadata",
      "name",
      "slug",
      "status",
      "tags",
    ]);
    expect(Object.keys(model.schemas.ProjectSummaryDto.properties).sort()).toEqual([
      "id",
      "name",
      "status",
    ]);
    expect(Object.keys(model.schemas.AccountDetailsDto.properties).sort()).toEqual([
      "createdAt",
      "id",
      "members",
      "name",
      "plan",
      "projectCount",
      "slug",
      "status",
    ]);
  });

  it("applies source include and exclude glob filters", () => {
    const model = inspectBenchmarkFixtureWithConfig({
      source: {
        include: ["projects/**/*.ts", "tasks/**/*.ts"],
        exclude: ["**/guards/*.ts"],
      },
    });

    expect(model.operations.map((op) => op.controller)).not.toContain("AuthController");
    expect(model.operations.map((op) => op.controller)).toContain("ProjectsController");
    expect(model.operations.map((op) => op.controller)).toContain("TasksController");
  });
});
