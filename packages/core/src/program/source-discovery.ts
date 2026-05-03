// ============================================================================
// Source file discovery — filter Program files by --root and suffix patterns
// ============================================================================

import ts from "typescript";
import path from "node:path";
import {
  DEFAULT_CONTROLLER_SUFFIXES,
  DEFAULT_DTO_SUFFIXES,
} from "../config/defaults.js";

export interface DiscoveredSources {
  /** Controller source files matching suffix patterns. */
  controllerFiles: ts.SourceFile[];
  /** DTO/entity source files matching suffix patterns. */
  dtoFiles: ts.SourceFile[];
  /** All source files under --root (for reference). */
  allFiles: ts.SourceFile[];
}

/**
 * Filter the TypeScript Program's source files to only those under `root`,
 * then categorize by suffix patterns.
 */
export function discoverSources(
  program: ts.Program,
  root: string,
  controllerSuffixes: string[] = DEFAULT_CONTROLLER_SUFFIXES,
  dtoSuffixes: string[] = DEFAULT_DTO_SUFFIXES,
): DiscoveredSources {
  const normalizedRoot = path.resolve(root).replace(/\\/g, "/");

  const allFiles: ts.SourceFile[] = [];
  const controllerFiles: ts.SourceFile[] = [];
  const dtoFiles: ts.SourceFile[] = [];

  for (const sourceFile of program.getSourceFiles()) {
    // Skip declaration files and node_modules
    if (sourceFile.isDeclarationFile) continue;

    const filePath = sourceFile.fileName.replace(/\\/g, "/");

    // Only walk files under --root
    if (!filePath.startsWith(normalizedRoot + "/")) continue;

    allFiles.push(sourceFile);

    const lowerPath = filePath.toLowerCase();

    if (controllerSuffixes.some((s) => lowerPath.endsWith(s))) {
      controllerFiles.push(sourceFile);
    }

    if (dtoSuffixes.some((s) => lowerPath.endsWith(s))) {
      dtoFiles.push(sourceFile);
    }
  }

  return { controllerFiles, dtoFiles, allFiles };
}
