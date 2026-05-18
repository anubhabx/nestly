// ============================================================================
// Phase 6c — operation-scoped OpenAPI history records
// ============================================================================

import { describe, expect, it } from "vitest";
import { diffOpenApiSnapshots } from "../src/index.ts";

const baseDocument = {
  openapi: "3.1.0",
  info: { title: "Demo API", version: "1.0.0" },
  paths: {
    "/projects": {
      get: {
        operationId: "listProjects",
        responses: { "200": { description: "Projects returned." } },
      },
    },
    "/projects/{projectId}": {
      get: {
        operationId: "getProject",
        responses: { "200": { description: "Project returned." } },
      },
    },
  },
};

describe("diffOpenApiSnapshots", () => {
  it("returns no records when operation contracts are unchanged", () => {
    expect(
      diffOpenApiSnapshots({
        before: baseDocument,
        after: baseDocument,
        commit: "abc123",
        date: "2026-05-18T00:00:00.000Z",
      }),
    ).toEqual([]);
  });

  it("records added and removed operations", () => {
    const after = {
      ...baseDocument,
      paths: {
        "/projects": baseDocument.paths["/projects"],
        "/tasks": {
          post: {
            operationId: "createTask",
            responses: { "201": { description: "Task created." } },
          },
        },
      },
    };

    expect(
      diffOpenApiSnapshots({
        before: baseDocument,
        after,
        commit: "def456",
        date: "2026-05-18T00:00:00.000Z",
        releaseTag: "v1.1.0",
      }),
    ).toMatchObject([
      {
        operationId: "getProject",
        method: "get",
        path: "/projects/{projectId}",
        changeType: "removed",
        breaking: true,
        affectedFields: ["operation"],
        releaseTag: "v1.1.0",
      },
      {
        operationId: "createTask",
        method: "post",
        path: "/tasks",
        changeType: "added",
        breaking: false,
        affectedFields: ["operation"],
        releaseTag: "v1.1.0",
      },
    ]);
  });

  it("prioritizes security and deprecation changes before generic changes", () => {
    const after = {
      ...baseDocument,
      paths: {
        ...baseDocument.paths,
        "/projects": {
          get: {
            operationId: "listProjects",
            deprecated: true,
            security: [{ bearerAuth: [] }],
            responses: { "200": { description: "Projects returned." } },
          },
        },
      },
    };

    expect(
      diffOpenApiSnapshots({
        before: baseDocument,
        after,
        commit: "abc123",
        date: "2026-05-18T00:00:00.000Z",
      }),
    ).toMatchObject([
      {
        operationId: "listProjects",
        changeType: "security",
        breaking: true,
        affectedFields: ["security"],
      },
      {
        operationId: "listProjects",
        changeType: "deprecated",
        breaking: false,
        affectedFields: ["deprecated"],
      },
    ]);
  });

  it("records changed operation fields with stable affected field names", () => {
    const after = {
      ...baseDocument,
      paths: {
        ...baseDocument.paths,
        "/projects": {
          get: {
            operationId: "listProjects",
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "number" },
              },
            ],
            responses: {
              "200": { description: "Paged projects returned." },
            },
          },
        },
      },
    };

    expect(
      diffOpenApiSnapshots({
        before: baseDocument,
        after,
        commit: "abc123",
        date: "2026-05-18T00:00:00.000Z",
      }),
    ).toMatchObject([
      {
        operationId: "listProjects",
        changeType: "changed",
        breaking: false,
        affectedFields: ["parameters", "responses"],
      },
    ]);
  });
});
