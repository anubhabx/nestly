// ============================================================================
// CLI entrypoint — command dispatch
// ============================================================================

import { runInspect } from "./commands/inspect.js";
import { type GenerateFlags, runGenerate } from "./commands/generate.js";
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
      const flags = parseGenerateFlags(argv.slice(1));
      await runGenerate(flags);
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
 * Supports: [project-dir] --project <path> --root <path>
 */
function parseFlags(args: string[]): CLIFlags {
  const flags: CLIFlags = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--") {
      continue;
    } else if (arg === "--project" && i + 1 < args.length) {
      flags.project = args[++i];
    } else if (arg === "--root" && i + 1 < args.length) {
      flags.root = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      printInspectHelp();
      process.exit(0);
    } else if (arg.startsWith("-")) {
      process.stderr.write(`Unknown flag: ${arg}\n`);
      process.exit(1);
    } else if (!flags.target) {
      flags.target = arg;
    } else {
      process.stderr.write(`Unknown argument: ${arg}\n`);
      process.exit(1);
    }
  }

  return flags;
}

function parseGenerateFlags(args: string[]): GenerateFlags {
  const flags: GenerateFlags = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--") {
      continue;
    } else if (arg === "--project" && i + 1 < args.length) {
      flags.project = args[++i];
    } else if (arg === "--root" && i + 1 < args.length) {
      flags.root = args[++i];
    } else if (arg === "--output" && i + 1 < args.length) {
      flags.output = args[++i];
    } else if (arg === "--pretty") {
      flags.pretty = true;
    } else if (arg === "--help" || arg === "-h") {
      printGenerateHelp();
      process.exit(0);
    } else if (arg.startsWith("-")) {
      process.stderr.write(`Unknown flag: ${arg}\n`);
      process.exit(1);
    } else if (!flags.target) {
      flags.target = arg;
    } else {
      process.stderr.write(`Unknown argument: ${arg}\n`);
      process.exit(1);
    }
  }

  return flags;
}

function printUsage(): void {
  process.stdout.write(
    `specord — annotation-light OpenAPI documentation for NestJS

Usage:
  specord <command> [project-dir] [flags]

Commands:
  inspect    Extract internal model from NestJS source (JSON output)
  generate   Generate OpenAPI 3.1 document

Flags:
  --help, -h    Show help

Defaults:
  project-dir defaults to the current directory.
  Specord infers tsconfig.json and src/ unless --project/--root are provided.

Run "specord <command> --help" for command-specific help.
`,
  );
}

function printGenerateHelp(): void {
  process.stdout.write(
    `specord generate — generate OpenAPI 3.1 from NestJS source

Usage:
  specord generate [project-dir] [--output openapi.json] [--pretty]
  specord generate --project <tsconfig.json> --root <src-dir> [--output openapi.json] [--pretty]

Flags:
  --project <path>    Path to tsconfig.json
  --root <path>       Source root directory to inspect
  --output <path>     Write OpenAPI JSON to a file instead of stdout
  --pretty            Pretty-print JSON output
  --help, -h          Show help

Example:
  specord generate
  specord generate apps/api --output openapi.json --pretty
  specord generate --project apps/api/tsconfig.build.json --root apps/api/source
`,
  );
}

function printInspectHelp(): void {
  process.stdout.write(
    `specord inspect — extract internal model from NestJS source

Usage:
  specord inspect [project-dir]
  specord inspect --project <tsconfig.json> --root <src-dir>

Flags:
  --project <path>    Path to tsconfig.json
  --root <path>       Source root directory to inspect
  --help, -h          Show help

Example:
  specord inspect
  specord inspect apps/api
  specord inspect --project apps/api/tsconfig.build.json --root apps/api/source
`,
  );
}
