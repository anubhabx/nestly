// ============================================================================
// specord generate — OpenAPI 3.1 generator
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { inspect, loadConfig, resolveConfig } from "@specord/core";
import {
  emitOpenApiDocument,
  validateOpenApiDocument,
} from "@specord/openapi";
import type { CLIFlags } from "@specord/core";
import type { Diagnostic } from "@specord/types";

export interface GenerateFlags extends CLIFlags {
  output?: string;
  pretty?: boolean;
}

export async function runGenerate(flags: GenerateFlags): Promise<void> {
  try {
    const fileConfig = await loadConfig(process.cwd());
    const resolvedConfig = resolveConfig(flags, fileConfig);
    const model = inspect(resolvedConfig);
    const document = emitOpenApiDocument(model, resolvedConfig.config);
    const validation = await validateOpenApiDocument(document);

    if (!validation.valid) {
      throw new Error(
        `[specord] Generated OpenAPI document failed validation: ${JSON.stringify(validation.errors)}`,
      );
    }

    const diagnostics = allDiagnostics(model);
    const unresolved = diagnostics.filter((diag) =>
      diag.code === "EXTRACTOR_UNRESOLVED_RESPONSE" ||
      diag.code === "EXTRACTOR_UNRESOLVED_SECURITY"
    );
    const warnings = diagnostics.filter((diag) => diag.severity === "warning");

    if (unresolved.length > 0) {
      process.stderr.write(
        `[specord] Generated OpenAPI with ${unresolved.length} unresolved warning(s). ` +
        "Use specord.config.ts, Swagger decorators, or strict CI flags to resolve them.\n",
      );
    }

    if (resolvedConfig.config.ci?.failOnUnresolved && unresolved.length > 0) {
      throw new Error(
        `[specord] ci.failOnUnresolved is enabled and ${unresolved.length} unresolved diagnostic(s) remain.`,
      );
    }

    if (resolvedConfig.config.ci?.failOnWarning && warnings.length > 0) {
      throw new Error(
        `[specord] ci.failOnWarning is enabled and ${warnings.length} warning diagnostic(s) remain.`,
      );
    }

    const json = JSON.stringify(document, null, flags.pretty ? 2 : 0);

    if (flags.output) {
      const outputPath = path.resolve(flags.output);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, `${json}\n`, "utf8");
      return;
    }

    process.stdout.write(`${json}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }
}

function allDiagnostics(model: ReturnType<typeof inspect>): Diagnostic[] {
  return [
    ...model.diagnostics,
    ...model.operations.flatMap((operation) => operation.diagnostics),
  ];
}
