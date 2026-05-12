// ============================================================================
// @specord/nestjs — Swagger-like route injection for Specord docs
// ============================================================================

import { inspect, loadConfig, resolveConfig } from "@specord/core";
import type { CLIFlags } from "@specord/core";
import {
  emitOpenApiDocument,
  validateOpenApiDocument,
} from "@specord/openapi";
import type { OpenApiDocument } from "@specord/openapi";
import type { SpecordConfigV1 } from "@specord/types";
import { renderDocsUi } from "@specord/ui";

export { defineConfig } from "@specord/core";

export interface SpecordNestApplication {
  getHttpAdapter(): SpecordHttpAdapter;
}

export interface SpecordHttpAdapter {
  get?: (path: string, handler: SpecordRouteHandler) => unknown;
  getInstance?: () => {
    get?: (path: string, handler: SpecordRouteHandler) => unknown;
  };
}

export type SpecordRouteHandler = (
  request: unknown,
  response: unknown,
) => void | Promise<void>;

export interface SpecordDocsOptions extends CLIFlags {
  path?: string;
  jsonPath?: string;
  title?: string;
  pretty?: boolean;
  cwd?: string;
  config?: SpecordConfigV1;
  document?: OpenApiDocument | (() => OpenApiDocument | Promise<OpenApiDocument>);
}

export interface SpecordDocsMount {
  path: string;
  jsonPath: string;
}

export function setupSpecordDocs(
  app: SpecordNestApplication,
  options: SpecordDocsOptions = {},
): SpecordDocsMount {
  const docsPath = normalizePath(options.path ?? "/api");
  const jsonPath = normalizePath(options.jsonPath ?? joinPath(docsPath, "openapi.json"));

  registerGetRoute(app, docsPath, async (_request, response) => {
    sendResponse(
      response,
      200,
      "text/html; charset=utf-8",
      renderDocsUi({
        title: options.title ?? "Specord API Docs",
        openApiUrl: jsonPath,
      }),
    );
  });

  registerGetRoute(app, jsonPath, async (_request, response) => {
    try {
      const document = await resolveDocument(options);
      sendResponse(
        response,
        200,
        "application/json; charset=utf-8",
        `${JSON.stringify(document, null, options.pretty ? 2 : 0)}\n`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse(response, 500, "text/plain; charset=utf-8", `${message}\n`);
    }
  });

  return {
    path: docsPath,
    jsonPath,
  };
}

async function resolveDocument(
  options: SpecordDocsOptions,
): Promise<OpenApiDocument> {
  if (typeof options.document === "function") {
    return options.document();
  }

  if (options.document) {
    return options.document;
  }

  const cwd = options.cwd ?? process.cwd();
  const fileConfig = options.config ?? await loadConfig(cwd);
  const resolvedConfig = resolveConfig(options, fileConfig, { cwd });
  const model = inspect(resolvedConfig);
  const document = emitOpenApiDocument(model, resolvedConfig.config);
  const validation = await validateOpenApiDocument(document);

  if (!validation.valid) {
    throw new Error(
      `[specord] Generated OpenAPI document failed validation: ${JSON.stringify(validation.errors)}`,
    );
  }

  return document;
}

function registerGetRoute(
  app: SpecordNestApplication,
  path: string,
  handler: SpecordRouteHandler,
): void {
  const adapter = app.getHttpAdapter();

  if (typeof adapter.get === "function") {
    adapter.get(path, handler);
    return;
  }

  const instance = adapter.getInstance?.();
  if (typeof instance?.get === "function") {
    instance.get(path, handler);
    return;
  }

  throw new Error("[specord] Unable to register docs routes on this Nest HTTP adapter.");
}

function sendResponse(
  response: unknown,
  statusCode: number,
  contentType: string,
  body: string,
): void {
  const res = response as {
    status?: (statusCode: number) => unknown;
    code?: (statusCode: number) => unknown;
    type?: (contentType: string) => unknown;
    header?: (name: string, value: string) => unknown;
    setHeader?: (name: string, value: string) => unknown;
    send?: (body: string) => unknown;
    end?: (body: string) => unknown;
    statusCode?: number;
  };

  if (typeof res.status === "function") {
    res.status(statusCode);
  } else if (typeof res.code === "function") {
    res.code(statusCode);
  } else {
    res.statusCode = statusCode;
  }

  if (typeof res.type === "function") {
    res.type(contentType);
  } else if (typeof res.header === "function") {
    res.header("content-type", contentType);
  } else if (typeof res.setHeader === "function") {
    res.setHeader("content-type", contentType);
  }

  if (typeof res.send === "function") {
    res.send(body);
  } else if (typeof res.end === "function") {
    res.end(body);
  }
}

function normalizePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

function joinPath(base: string, segment: string): string {
  if (base === "/") {
    return normalizePath(segment);
  }

  return normalizePath(`${base}/${segment}`);
}
