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

export interface SourceDiscoveryOptions {
  include?: string[];
  exclude?: string[];
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
  options: SourceDiscoveryOptions = {},
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
    const relativePath = filePath.slice(normalizedRoot.length + 1);
    if (!matchesSourceFilters(relativePath, options)) continue;

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

function matchesSourceFilters(
  relativePath: string,
  options: SourceDiscoveryOptions,
): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  const include = options.include ?? [];
  const exclude = options.exclude ?? [];

  if (include.length > 0 && !include.some((pattern) => matchesGlob(normalized, pattern))) {
    return false;
  }

  if (exclude.some((pattern) => matchesGlob(normalized, pattern))) {
    return false;
  }

  return true;
}

function matchesGlob(path: string, pattern: string): boolean {
  const normalizedPattern = pattern.replace(/\\/g, "/");
  const escaped = normalizedPattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "\u0001")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0001/g, "(?:.*/)?")
    .replace(/\u0000/g, ".*");

  return new RegExp(`^${escaped}$`).test(path);
}
