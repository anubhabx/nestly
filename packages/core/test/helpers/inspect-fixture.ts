// ============================================================================
// Test helper — run the real core pipeline against the NestJS fixture app
// ============================================================================

import { fileURLToPath } from "node:url";
import path from "node:path";
import { inspect, resolveConfig } from "../../src/index.ts";
import type { InspectionModel, SpecordConfigV1 } from "@specord/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Repo root, resolved from this helper's location. */
const repoRoot = path.resolve(__dirname, "../../../../");

/** Absolute path to the NestJS fixture project root. */
const fixtureRoot = path.join(repoRoot, "examples/nestjs-api");
const fixtureCache = new Map<string, InspectionModel>();

/**
 * Return the fixture root path for use in custom config tests.
 */
export function getNestFixtureRoot(): string {
  return fixtureRoot;
}

/**
 * Inspect the NestJS fixture using default config (no globalPrefix, no overrides).
 */
export function inspectNestFixture(): InspectionModel {
  return cachedInspect("default", undefined);
}

/**
 * Inspect the NestJS fixture with a custom partial SpecordConfigV1.
 * Useful for testing globalPrefix and other config-driven behavior.
 */
export function inspectNestFixtureWithConfig(
  config: SpecordConfigV1,
): InspectionModel {
  return cachedInspect(JSON.stringify(config), config);
}

function cachedInspect(
  cacheKey: string,
  config: SpecordConfigV1 | undefined,
): InspectionModel {
  const cached = fixtureCache.get(cacheKey);
  if (cached) {
    return cloneInspectionModel(cached);
  }

  const resolvedConfig = resolveConfig(
    {
      project: path.join(fixtureRoot, "tsconfig.json"),
      root: path.join(fixtureRoot, "src"),
    },
    config,
  );

  const model = inspect(resolvedConfig);
  fixtureCache.set(cacheKey, model);
  return cloneInspectionModel(model);
}

function cloneInspectionModel(model: InspectionModel): InspectionModel {
  return JSON.parse(JSON.stringify(model)) as InspectionModel;
}
