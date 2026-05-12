// ============================================================================
// @specord/nestjs docs route injection tests
// ============================================================================

import { describe, expect, it } from "vitest";
import type { OpenApiDocument } from "@specord/openapi";
import { setupSpecordDocs } from "../src/index.js";

const document: OpenApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Injected API",
    version: "1.0.0",
  },
  paths: {
    "/users": {
      get: {
        operationId: "listUsers",
        responses: {
          "200": { description: "Users returned." },
        },
      },
    },
  },
};

describe("setupSpecordDocs", () => {
  it("injects docs and OpenAPI JSON routes at /api by default", async () => {
    const routes = new Map<string, Function>();
    const app = createApp(routes);

    const result = setupSpecordDocs(app, { document });

    expect(result).toEqual({
      path: "/api",
      jsonPath: "/api/openapi.json",
    });
    expect([...routes.keys()]).toEqual(["/api", "/api/openapi.json"]);

    const html = await invoke(routes.get("/api"));
    const json = await invoke(routes.get("/api/openapi.json"));

    expect(html.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(html.body).toContain("data-specord-docs-shell");
    expect(html.body).toContain("/api/openapi.json");
    expect(json.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(JSON.parse(json.body).paths["/users"].get.operationId).toBe("listUsers");
  });

  it("allows the mounted docs path and JSON path to be overridden", () => {
    const routes = new Map<string, Function>();
    const app = createApp(routes);

    const result = setupSpecordDocs(app, {
      document,
      path: "reference",
      jsonPath: "reference/spec.json",
    });

    expect(result).toEqual({
      path: "/reference",
      jsonPath: "/reference/spec.json",
    });
    expect([...routes.keys()]).toEqual(["/reference", "/reference/spec.json"]);
  });
});

function createApp(routes: Map<string, Function>) {
  return {
    getHttpAdapter() {
      return {
        get(path: string, handler: Function) {
          routes.set(path, handler);
        },
      };
    },
  };
}

async function invoke(handler: Function | undefined): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  if (!handler) {
    throw new Error("Missing route handler");
  }

  const response = createResponse();
  await handler({}, response);
  return response;
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: "",
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    type(value: string) {
      this.headers["content-type"] = value;
      return this;
    },
    send(value: string) {
      this.body = value;
      return this;
    },
  };
}
