// @specord/core — public API
export { defineConfig } from "./config/define-config.js";
export { loadConfig, resolveConfig } from "./config/loader.js";
export type { CLIFlags, ResolvedConfig } from "./config/loader.js";
export { inspect } from "./pipeline.js";
export { serializeInspectionModel } from "./output/serializer.js";
export { createProgram } from "./program/create-program.js";
export {
  createSnapshotCacheKey,
  hashSnapshotInput,
  readOpenApiSnapshot,
  resolveSnapshotCacheDir,
  writeOpenApiSnapshot,
} from "./history/snapshot-cache.js";
export type {
  OpenApiSnapshotCacheEntry,
  ReadOpenApiSnapshotOptions,
  SnapshotCacheKeyInput,
  WriteOpenApiSnapshotOptions,
} from "./history/snapshot-cache.js";
export { diffOpenApiSnapshots } from "./history/openapi-diff.js";
export type { DiffOpenApiSnapshotsOptions } from "./history/openapi-diff.js";
