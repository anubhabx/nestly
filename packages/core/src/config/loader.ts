// ============================================================================
// Config — loader
// Loads and validates specord.config.ts with precedence rules:
//   CLI flags > config file > built-in defaults
// ============================================================================

import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import ts from "typescript";
import type { SpecordConfigV1 } from "@specord/types";

/**
 * Attempt to load `specord.config.ts` from the given directory.
 * Returns undefined if no config file is found.
 * Throws on validation errors (e.g., deprecated `versioning.type` key).
 */
export async function loadConfig(
  cwd: string,
): Promise<SpecordConfigV1 | undefined> {
  const configPath = path.resolve(cwd, "specord.config.ts");

  if (!fs.existsSync(configPath)) {
    return undefined;
  }

  const config = await importTypeScriptConfig(configPath);

  validateConfig(config);
  return config;
}

async function importTypeScriptConfig(
  configPath: string,
): Promise<SpecordConfigV1> {
  const source = fs.readFileSync(configPath, "utf8");
  const compiled = ts.transpileModule(source, {
    fileName: configPath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Node16,
      esModuleInterop: true,
      isolatedModules: true,
      sourceMap: false,
      inlineSourceMap: false,
    },
  });

  const hash = crypto
    .createHash("sha256")
    .update(configPath)
    .update(source)
    .digest("hex")
    .slice(0, 12);
  const compiledPath = path.resolve(
    path.dirname(configPath),
    `.specord.config.${process.pid}.${hash}.mjs`,
  );

  fs.writeFileSync(compiledPath, compiled.outputText, "utf8");

  try {
    const configUrl = `${pathToFileURL(compiledPath).href}?t=${Date.now()}`;
    const module = await import(configUrl);
    return module.default ?? module;
  } finally {
    fs.rmSync(compiledPath, { force: true });
  }
}

/**
 * Validate a loaded config and throw on known issues.
 */
export function validateConfig(config: SpecordConfigV1): void {
  // Reject deprecated `versioning.type` key
  const routing = config.routing as Record<string, unknown> | undefined;
  if (routing?.versioning) {
    const versioning = routing.versioning as Record<string, unknown>;
    if ("type" in versioning && !("strategy" in versioning)) {
      throw new Error(
        `[specord] Config error in routing.versioning: ` +
        `"type" is deprecated. Use "strategy" instead.\n` +
        `  Change: versioning: { type: "uri" }\n` +
        `  To:     versioning: { strategy: "uri" }`,
      );
    }
  }
}

/** CLI flags that can override config values. */
export interface CLIFlags {
  project?: string;
  root?: string;
}

/**
 * Merge CLI flags, config file, and defaults following precedence rules:
 *   1. CLI flags override config file values.
 *   2. Config file values override defaults.
 *   3. Defaults apply only where neither CLI nor config provides values.
 */
export interface ResolvedConfig {
  project: string;
  root: string;
  config: SpecordConfigV1;
}

export function resolveConfig(
  flags: CLIFlags,
  fileConfig: SpecordConfigV1 | undefined,
): ResolvedConfig {
  const config = fileConfig ?? {};

  const project = flags.project ?? config.source?.project;
  const root = flags.root ?? config.source?.root;

  if (!project) {
    throw new Error(
      "[specord] Missing --project flag or source.project in config. " +
      "Provide a path to tsconfig.json.",
    );
  }

  if (!root) {
    throw new Error(
      "[specord] Missing --root flag or source.root in config. " +
      "Provide the source root directory to inspect.",
    );
  }

  return {
    project: path.resolve(project),
    root: path.resolve(root),
    config,
  };
}
