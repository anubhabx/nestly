import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@specord/core": path.resolve(__dirname, "../core/src/index.ts"),
      "@specord/openapi": path.resolve(__dirname, "../openapi/src/index.ts"),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
