// ============================================================================
// specord serve — local API docs server
// ============================================================================

import { spawn as nodeSpawn } from "node:child_process";
import type { ChildProcess, SpawnOptions } from "node:child_process";
import http from "node:http";
import type { IncomingMessage, RequestListener, ServerResponse } from "node:http";
import path from "node:path";
import { inspect, loadConfig, resolveConfig } from "@specord/core";
import {
  emitOpenApiDocument,
  validateOpenApiDocument,
} from "@specord/openapi";
import { renderDocsUi } from "@specord/ui";
import type { CLIFlags } from "@specord/core";
import type { Diagnostic } from "@specord/types";

export interface ServeFlags extends CLIFlags {
  host?: string;
  port?: number;
  docsPath?: string;
  jsonPath?: string;
  pretty?: boolean;
  appCommand?: string;
  appCwd?: string;
  appUrl?: string;
}

export interface DocsHandlerOptions {
  cwd?: string;
}

export type SpawnCommand = (
  command: string,
  args: readonly string[],
  options: SpawnOptions,
) => ChildProcess;

export interface StartAppOptions {
  cwd?: string;
  spawn?: SpawnCommand;
}

export interface RunServeOptions extends DocsHandlerOptions, StartAppOptions {}

export function createDocsRequestHandler(
  flags: ServeFlags,
  options: DocsHandlerOptions = {},
): RequestListener {
  const cwd = options.cwd ?? process.cwd();
  const docsPath = normalizePath(flags.docsPath ?? "/api");
  const jsonPath = normalizePath(flags.jsonPath ?? joinPath(docsPath, "openapi.json"));

  return (request, response) => {
    void handleDocsRequest(request, response, flags, cwd, docsPath, jsonPath);
  };
}

export function startAppProcess(
  flags: ServeFlags,
  options: StartAppOptions = {},
): ChildProcess | undefined {
  if (!flags.appCommand) {
    return undefined;
  }

  const cwd = options.cwd ?? process.cwd();
  const spawn = options.spawn ?? nodeSpawn;
  const appCwd = path.resolve(cwd, flags.appCwd ?? flags.target ?? ".");

  return spawn(flags.appCommand, [], {
    cwd: appCwd,
    env: process.env,
    shell: true,
    stdio: "inherit",
  });
}

export async function runServe(
  flags: ServeFlags,
  options: RunServeOptions = {},
): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const host = flags.host ?? "127.0.0.1";
  const port = flags.port ?? 4777;
  const appProcess = startAppProcess(flags, {
    cwd,
    spawn: options.spawn,
  });
  const server = http.createServer(createDocsRequestHandler(flags, { cwd }));

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  const docsUrl = `http://${host}:${actualPort}`;
  process.stdout.write(`[specord] Serving API docs at ${docsUrl}\n`);
  process.stdout.write(`[specord] OpenAPI JSON at ${docsUrl}/openapi.json\n`);
  if (flags.appCommand) {
    process.stdout.write(`[specord] Started app command: ${flags.appCommand}\n`);
  }

  await new Promise<void>((resolve) => {
    const shutdown = () => {
      if (appProcess && !appProcess.killed) {
        appProcess.kill();
      }
      server.close(() => resolve());
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
}

async function handleDocsRequest(
  request: IncomingMessage,
  response: ServerResponse,
  flags: ServeFlags,
  cwd: string,
  docsPath: string,
  jsonPath: string,
): Promise<void> {
  if (request.method !== "GET") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  const url = new URL(request.url ?? "/", "http://specord.local");

  try {
    if (url.pathname === "/" || url.pathname === "/index.html") {
      response.writeHead(302, {
        location: docsPath,
        "cache-control": "no-store",
      });
      response.end();
      return;
    }

    if (samePath(url.pathname, docsPath)) {
      sendHtml(
        response,
        renderDocsUi({
          title: "Specord API Docs",
          openApiUrl: jsonPath,
          appUrl: flags.appUrl,
        }),
      );
      return;
    }

    if (samePath(url.pathname, jsonPath)) {
      const document = await buildOpenApiDocument(flags, cwd);
      sendJson(response, document, flags.pretty);
      return;
    }

    if (url.pathname === "/health") {
      sendJson(response, { ok: true }, flags.pretty);
      return;
    }

    if (url.pathname === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }

    sendText(response, 404, "Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendText(response, 500, message);
  }
}

async function buildOpenApiDocument(
  flags: ServeFlags,
  cwd: string,
): Promise<Record<string, unknown>> {
  const fileConfig = await loadConfig(cwd);
  const resolvedConfig = resolveConfig(flags, fileConfig, { cwd });
  const model = inspect(resolvedConfig);
  const document = emitOpenApiDocument(model, resolvedConfig.config);
  const validation = await validateOpenApiDocument(document);

  if (!validation.valid) {
    throw new Error(
      `[specord] Generated OpenAPI document failed validation: ${JSON.stringify(validation.errors)}`,
    );
  }

  const unresolved = allDiagnostics(model).filter((diag) =>
    diag.code === "EXTRACTOR_UNRESOLVED_RESPONSE" ||
    diag.code === "EXTRACTOR_UNRESOLVED_SECURITY"
  );

  if (unresolved.length > 0) {
    process.stderr.write(
      `[specord] Serving OpenAPI with ${unresolved.length} unresolved warning(s). ` +
      "Use specord.config.ts or Swagger-compatible source metadata to resolve them.\n",
    );
  }

  return document;
}

function allDiagnostics(model: ReturnType<typeof inspect>): Diagnostic[] {
  return [
    ...model.diagnostics,
    ...model.operations.flatMap((operation) => operation.diagnostics),
  ];
}

function sendHtml(response: ServerResponse, html: string): void {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(html);
}

function sendJson(
  response: ServerResponse,
  value: unknown,
  pretty: boolean | undefined,
): void {
  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(`${JSON.stringify(value, null, pretty ? 2 : 0)}\n`);
}

function sendText(response: ServerResponse, status: number, value: string): void {
  response.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(`${value}\n`);
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

function samePath(left: string, right: string): boolean {
  return normalizePath(left) === normalizePath(right);
}
