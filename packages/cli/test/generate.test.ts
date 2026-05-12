// ============================================================================
// CLI generate command tests
// ============================================================================

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { main } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const fixtureRoot = path.join(repoRoot, "examples/nestjs-realworld");
const originalCwd = process.cwd();

describe("specord generate CLI", () => {
  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
  });

  it("writes OpenAPI JSON to stdout by default", async () => {
    let stdout = "";
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
      stdout += chunk.toString();
      return true;
    });

    await main([
      "generate",
      "--project",
      path.join(fixtureRoot, "tsconfig.json"),
      "--root",
      path.join(fixtureRoot, "src"),
    ]);

    const document = JSON.parse(stdout);
    expect(document.openapi).toBe("3.1.0");
    expect(document.paths["/orders"].get.operationId).toBe("listOrders");
    expect(document.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
  });

  it("infers project and root from a positional project directory", async () => {
    let stdout = "";
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
      stdout += chunk.toString();
      return true;
    });

    await main(["generate", fixtureRoot, "--pretty"]);

    const document = JSON.parse(stdout);
    expect(document.openapi).toBe("3.1.0");
    expect(document.paths["/orders"].get.operationId).toBe("listOrders");
    expect(stdout).toContain("\n  \"openapi\"");
  });

  it("uses the current directory as the default project directory", async () => {
    let stdout = "";
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
      stdout += chunk.toString();
      return true;
    });

    process.chdir(fixtureRoot);

    await main(["generate", "--pretty"]);

    const document = JSON.parse(stdout);
    expect(document.openapi).toBe("3.1.0");
    expect(document.paths["/orders"].get.operationId).toBe("listOrders");
  });

  it("writes OpenAPI JSON to --output", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "specord-generate-"));
    const output = path.join(dir, "openapi.json");

    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await main([
      "generate",
      "--project",
      path.join(fixtureRoot, "tsconfig.json"),
      "--root",
      path.join(fixtureRoot, "src"),
      "--output",
      output,
      "--pretty",
    ]);

    const document = JSON.parse(fs.readFileSync(output, "utf8"));
    expect(document.openapi).toBe("3.1.0");
    expect(document.components.schemas.OrderResponseDto).toBeDefined();
  });

  it("fails unresolved extraction warnings when strict CI config requires it", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "specord-generate-strict-"));
    fs.writeFileSync(
      path.join(dir, "specord.config.ts"),
      `export default {
        source: {
          project: ${JSON.stringify(path.join(fixtureRoot, "tsconfig.json"))},
          root: ${JSON.stringify(path.join(fixtureRoot, "src"))}
        },
        ci: {
          failOnUnresolved: true
        }
      };
      `,
      "utf8",
    );

    let stderr = "";
    vi.spyOn(process.stderr, "write").mockImplementation((chunk: string | Uint8Array) => {
      stderr += chunk.toString();
      return true;
    });
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(((code?: string | number | null) => {
        throw new Error(`process.exit:${code}`);
      }) as never);

    process.chdir(dir);

    await expect(main(["generate"])).rejects.toThrow("process.exit:1");
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(stderr).toContain("ci.failOnUnresolved");
  });
});
