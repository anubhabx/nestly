// ============================================================================
// @specord/ui docs shell tests
// ============================================================================

import { describe, expect, it } from "vitest";
import { renderDocsUi } from "../src/index.js";

describe("renderDocsUi", () => {
  it("renders an escaped docs shell wired to the OpenAPI endpoint", () => {
    const html = renderDocsUi({
      title: "<Specord Docs>",
      openApiUrl: "/openapi.json",
      appUrl: "http://localhost:3000",
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("&lt;Specord Docs&gt;");
    expect(html).not.toContain("<Specord Docs>");
    expect(html).toContain("/openapi.json");
    expect(html).toContain("http://localhost:3000");
    expect(html).toContain("data-specord-docs-shell");
  });
});
