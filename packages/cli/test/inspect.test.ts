// ============================================================================
// CLI inspect command tests
// ============================================================================

import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { main } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const fixtureRoot = path.join(repoRoot, "examples/nestjs-api");

describe("specord inspect CLI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a pnpm argument separator before inspect flags", async () => {
    let stdout = "";
    const stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk: string | Uint8Array) => {
        stdout += chunk.toString();
        return true;
      });

    await main([
      "inspect",
      "--",
      "--project",
      path.join(fixtureRoot, "tsconfig.json"),
      "--root",
      path.join(fixtureRoot, "src"),
    ]);

    expect(stdoutSpy).toHaveBeenCalled();
    const model = JSON.parse(stdout);
    expect(model.source.version).toBe("v1");
    expect(model.operations).toHaveLength(15);
  });
});
