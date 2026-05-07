// ============================================================================
// Config loader tests — resolveConfig precedence and validation
// ============================================================================

import { describe, expect, it } from "vitest";
import path from "node:path";
import { resolveConfig } from "../src/index.ts";
import { validateConfig } from "../src/config/loader.ts";

describe("resolveConfig", () => {
  // 6.1 CLI Flags Required Without Config
  it("requires project and root when config does not provide them", () => {
    expect(() => resolveConfig({}, undefined)).toThrow(/Missing --project/);
  });

  it("requires root when only project is provided", () => {
    expect(() =>
      resolveConfig({ project: "tsconfig.json" }, undefined),
    ).toThrow(/Missing --root/);
  });

  // 6.2 CLI Overrides Config
  it("gives CLI flags precedence over config values", () => {
    const resolved = resolveConfig(
      {
        project: "cli-tsconfig.json",
        root: "cli-src",
      },
      {
        source: {
          project: "config-tsconfig.json",
          root: "config-src",
        },
      },
    );

    expect(resolved.project).toContain("cli-tsconfig.json");
    expect(resolved.root).toContain("cli-src");
  });

  // 6.3 Config Values Work Without CLI
  it("uses config source values when CLI flags are absent", () => {
    const resolved = resolveConfig(
      {},
      {
        source: {
          project: "config-tsconfig.json",
          root: "config-src",
        },
      },
    );

    expect(resolved.project).toContain("config-tsconfig.json");
    expect(resolved.root).toContain("config-src");
  });

  it("resolves project and root to absolute paths", () => {
    const resolved = resolveConfig(
      {
        project: "tsconfig.json",
        root: "src",
      },
      undefined,
    );

    // Cross-platform: works on both Windows (C:\...) and Unix (/...)
    expect(path.isAbsolute(resolved.project)).toBe(true);
    expect(path.isAbsolute(resolved.root)).toBe(true);
  });

  it("passes through the merged config object", () => {
    const userConfig = {
      source: {
        project: "tsconfig.json",
        root: "src",
      },
      routing: {
        globalPrefix: "api",
      },
    };

    const resolved = resolveConfig({}, userConfig);

    expect(resolved.config.routing?.globalPrefix).toBe("api");
  });
});

// 6.4 Deprecated Versioning Type Rejection
describe("config validation", () => {
  it("rejects deprecated routing.versioning.type", () => {
    const config = {
      source: { project: "tsconfig.json", root: "src" },
      routing: {
        versioning: { type: "uri" },
      },
    } as any;

    expect(() => validateConfig(config)).toThrow(/strategy/);
  });

  it("accepts routing.versioning.strategy", () => {
    const config = {
      source: { project: "tsconfig.json", root: "src" },
      routing: {
        versioning: { strategy: "uri" as const },
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });
});
