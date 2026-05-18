// ============================================================================
// Phase 6b — OpenAPI snapshot cache
// ============================================================================

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createSnapshotCacheKey,
  hashSnapshotInput,
  readOpenApiSnapshot,
  resolveSnapshotCacheDir,
  writeOpenApiSnapshot,
} from "../src/index.ts";

describe("OpenAPI snapshot cache", () => {
  it("writes and reads snapshots under .git/specord/cache/snapshots", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "specord-cache-"));
    const inputs = {
      commit: "abc123",
      configHash: hashSnapshotInput({ document: { title: "Demo API" } }),
      specordVersion: "0.1.0",
      lockfileHash: hashSnapshotInput("lockfile-v1"),
    };
    const document = {
      openapi: "3.1.0",
      info: { title: "Demo API", version: "1.0.0" },
      paths: {},
    };

    const written = writeOpenApiSnapshot({
      repoRoot,
      inputs,
      document,
      createdAt: "2026-05-18T00:00:00.000Z",
    });

    expect(written.key).toBe(createSnapshotCacheKey(inputs));
    expect(written.path).toBe(
      path.join(resolveSnapshotCacheDir(repoRoot), `${written.key}.json`),
    );
    expect(readOpenApiSnapshot({ repoRoot, inputs })).toEqual(written);
  });

  it("misses the cache when any key input changes", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "specord-cache-"));
    const inputs = {
      commit: "abc123",
      configHash: hashSnapshotInput({ document: { title: "Demo API" } }),
      specordVersion: "0.1.0",
    };

    writeOpenApiSnapshot({
      repoRoot,
      inputs,
      document: {
        openapi: "3.1.0",
        info: { title: "Demo API", version: "1.0.0" },
        paths: {},
      },
    });

    expect(
      readOpenApiSnapshot({
        repoRoot,
        inputs: { ...inputs, configHash: hashSnapshotInput({ document: { title: "Changed API" } }) },
      }),
    ).toBeUndefined();
  });

  it("hashes equivalent config objects deterministically", () => {
    expect(hashSnapshotInput({ b: 2, a: { d: 4, c: 3 } })).toBe(
      hashSnapshotInput({ a: { c: 3, d: 4 }, b: 2 }),
    );
  });
});
