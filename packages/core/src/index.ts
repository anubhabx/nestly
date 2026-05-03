// @specord/core — public API
export { defineConfig } from "./config/define-config.js";
export { loadConfig, resolveConfig } from "./config/loader.js";
export type { CLIFlags, ResolvedConfig } from "./config/loader.js";
export { inspect } from "./pipeline.js";
export { serializeInspectionModel } from "./output/serializer.js";
export { createProgram } from "./program/create-program.js";
