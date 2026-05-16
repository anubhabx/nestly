// ============================================================================
// @specord/ui docs shell tests
// ============================================================================

import { describe, expect, it } from "vitest";
import { renderDocsUi } from "../src/index.js";

describe("renderDocsUi", () => {
  it("renders an escaped docs shell with title and source wired to the OpenAPI endpoint", () => {
    const html = renderDocsUi({
      title: "<Specord Docs>",
      openApiUrl: "/openapi.json",
      appUrl: "http://localhost:3000",
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("&lt;Specord Docs&gt;");
    expect(html).not.toContain("<title><Specord Docs>");
    expect(html).toContain("/openapi.json");
    expect(html).toContain("http://localhost:3000");
    expect(html).toContain("data-specord-docs-shell");
  });

  it("exposes the customizable panel workspace affordances", () => {
    const html = renderDocsUi({ openApiUrl: "/api/openapi.json" });

    expect(html).toContain("data-specord-workspace");
    expect(html).toContain("data-specord-panel");
    expect(html).toContain("data-specord-panel-drag");
    expect(html).toContain("data-specord-panel-menu");
    expect(html).toContain("data-specord-add-toggle");
    expect(html).toContain("data-specord-remove-panel");
    expect(html).toContain("data-specord-reset");
    expect(html).toContain("data-specord-copy-json");
  });

  it("ships the seven planned panel types via the client registry", () => {
    const html = renderDocsUi({ openApiUrl: "/api/openapi.json" });

    for (const type of [
      "operations",
      "op-detail",
      "schemas",
      "schema-detail",
      "try",
      "code",
      "raw",
    ]) {
      expect(html).toContain(type);
    }
  });

  it("exposes data hooks for operation list, schema list, detail, code snippets, and try-it", () => {
    const html = renderDocsUi({ openApiUrl: "/api/openapi.json" });

    expect(html).toContain("data-specord-operation-list");
    expect(html).toContain("data-specord-operation-detail");
    expect(html).toContain("data-specord-schema-list");
    expect(html).toContain("data-specord-code-snippets");
    expect(html).toContain("data-specord-try-panel");
    expect(html).toContain("data-specord-method-filters");
  });

  it("ships browser-local try-it execution hooks without credential persistence", () => {
    const html = renderDocsUi({ openApiUrl: "/api/openapi.json" });

    expect(html).toContain("data-specord-try-submit");
    expect(html).toContain("data-specord-try-result");
    expect(html).toContain("data-try-param-in");
    expect(html).toContain("data-try-body");
    expect(html).toContain("Browser-local request");
    expect(html).toContain("fetch(request.url");
    expect(html).not.toContain("Execution contract pending");
  });

  it("does not include any of the deprecated dashboard or hero chrome", () => {
    const html = renderDocsUi({ openApiUrl: "/api/openapi.json" });

    expect(html).not.toContain("path-count");
    expect(html).not.toContain("operation-count");
    expect(html).not.toContain("schema-count");
    expect(html).not.toContain("console-card");
    expect(html).not.toContain("summary-grid");
  });

  it("keeps injected client configuration HTML-safe", () => {
    const html = renderDocsUi({
      title: "Specord",
      openApiUrl: "/api/openapi.json?next=<script>",
    });

    expect(html).toContain("/api/openapi.json?next=\\u003cscript>");
    expect(html).not.toContain('"openApiUrl":"/api/openapi.json?next=<script>"');
  });

  it("persists layout to localStorage under a versioned key", () => {
    const html = renderDocsUi({ openApiUrl: "/api/openapi.json" });

    expect(html).toContain("specord:layout:v1");
  });
});
