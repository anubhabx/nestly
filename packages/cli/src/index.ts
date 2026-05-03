// ============================================================================
// CLI entrypoint — command dispatch
// ============================================================================

import { runInspect } from "./commands/inspect.js";
import { runGenerate } from "./commands/generate.js";
import type { CLIFlags } from "@specord/core";

/**
 * Parse CLI arguments and dispatch to the appropriate command.
 */
export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const command = argv[0];

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  switch (command) {
    case "inspect": {
      const flags = parseFlags(argv.slice(1));
      await runInspect(flags);
      break;
    }

    case "generate": {
      await runGenerate();
      break;
    }

    default: {
      process.stderr.write(`Unknown command: ${command}\n\n`);
      printUsage();
      process.exit(1);
    }
  }
}

/**
 * Parse CLI flags from argv.
 * Supports: --project <path> --root <path>
 */
function parseFlags(args: string[]): CLIFlags {
  const flags: CLIFlags = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--project" && i + 1 < args.length) {
      flags.project = args[++i];
    } else if (arg === "--root" && i + 1 < args.length) {
      flags.root = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      printInspectHelp();
      process.exit(0);
    } else {
      process.stderr.write(`Unknown flag: ${arg}\n`);
      process.exit(1);
    }
  }

  return flags;
}

function printUsage(): void {
  process.stdout.write(
    `specord — annotation-light OpenAPI documentation for NestJS

Usage:
  specord <command> [flags]

Commands:
  inspect    Extract internal model from NestJS source (JSON output)
  generate   Generate OpenAPI 3.1 document (not yet implemented)

Flags:
  --help, -h    Show help

Run "specord <command> --help" for command-specific help.
`,
  );
}

function printInspectHelp(): void {
  process.stdout.write(
    `specord inspect — extract internal model from NestJS source

Usage:
  specord inspect --project <tsconfig.json> --root <src-dir>

Flags:
  --project <path>    Path to tsconfig.json
  --root <path>       Source root directory to inspect
  --help, -h          Show help

Example:
  specord inspect --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
`,
  );
}
