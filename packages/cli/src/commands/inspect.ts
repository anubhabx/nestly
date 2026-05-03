// ============================================================================
// specord inspect — V1 extractor command
// ============================================================================

import { inspect, serializeInspectionModel, resolveConfig, loadConfig } from "@specord/core";
import type { CLIFlags } from "@specord/core";

/**
 * Run the `specord inspect` command.
 * Produces deterministic inspection JSON on stdout.
 */
export async function runInspect(flags: CLIFlags): Promise<void> {
  try {
    // Load optional config
    const fileConfig = await loadConfig(process.cwd());

    // Resolve with precedence: CLI > config > defaults
    const resolvedConfig = resolveConfig(flags, fileConfig);

    // Run extraction pipeline
    const model = inspect(resolvedConfig);

    // Emit deterministic JSON to stdout
    const json = serializeInspectionModel(model);
    process.stdout.write(json + "\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }
}
