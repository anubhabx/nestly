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
  const resolvedConfig = resolveConfig(
    {
      project: path.join(fixtureRoot, "tsconfig.json"),
      root: path.join(fixtureRoot, "src"),
    },
    undefined,
  );

  return inspect(resolvedConfig);
}

/**
 * Inspect the NestJS fixture with a custom partial SpecordConfigV1.
 * Useful for testing globalPrefix and other config-driven behavior.
 */
export function inspectNestFixtureWithConfig(
  config: SpecordConfigV1,
): InspectionModel {
  const resolvedConfig = resolveConfig(
    {
      project: path.join(fixtureRoot, "tsconfig.json"),
      root: path.join(fixtureRoot, "src"),
    },
    config,
  );

  return inspect(resolvedConfig);
}
