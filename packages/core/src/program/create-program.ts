// ============================================================================
// TypeScript Program creation from tsconfig.json
// ============================================================================

import ts from "typescript";
import path from "node:path";
import fs from "node:fs";

/**
 * Create a TypeScript Program from a tsconfig.json path.
 * Returns both the Program and the TypeChecker for downstream extraction.
 */
export function createProgram(tsconfigPath: string): {
  program: ts.Program;
  checker: ts.TypeChecker;
} {
  const absolutePath = path.resolve(tsconfigPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `[specord] tsconfig not found at: ${absolutePath}`,
    );
  }

  const configFile = ts.readConfigFile(absolutePath, ts.sys.readFile);
  if (configFile.error) {
    const message = ts.flattenDiagnosticMessageText(
      configFile.error.messageText,
      "\n",
    );
    throw new Error(`[specord] Failed to read tsconfig: ${message}`);
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(absolutePath),
  );

  if (parsedConfig.errors.length > 0) {
    const messages = parsedConfig.errors
      .map((e) => ts.flattenDiagnosticMessageText(e.messageText, "\n"))
      .join("\n");
    throw new Error(`[specord] tsconfig parse errors:\n${messages}`);
  }

  const program = ts.createProgram(
    parsedConfig.fileNames,
    parsedConfig.options,
  );

  const checker = program.getTypeChecker();

  return { program, checker };
}
