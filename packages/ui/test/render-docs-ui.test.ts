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

  it("renders a minimal operation-first devtool shell", () => {
    const html = renderDocsUi({
      openApiUrl: "/api/openapi.json",
    });

    expect(html).toContain("data-specord-search");
    expect(html).toContain("data-specord-method-filters");
    expect(html).toContain("data-specord-operation-list");
    expect(html).toContain("data-specord-operation-detail");
    expect(html).toContain("data-specord-schema-list");
    expect(html).toContain("data-specord-copy-json");
    expect(html).toContain("data-specord-loading");
    expect(html).toContain("data-specord-error");
  });

  it("renders customizable panel workspace affordances", () => {
    const html = renderDocsUi({
      openApiUrl: "/api/openapi.json",
    });

    expect(html).toContain("data-specord-workspace");
    expect(html).toContain("data-specord-panel=");
    expect(html).toContain("data-specord-panel-drag");
    expect(html).toContain("data-specord-panel-menu");
    expect(html).toContain("data-specord-add-panel");
    expect(html).toContain("data-specord-remove-panel");
    expect(html).toContain("data-specord-undo-layout");
    expect(html).toContain("data-specord-redo-layout");
    expect(html).toContain("data-specord-reset-layout");
  });

  it("renders endpoint tabs for planned reference surfaces", () => {
    const html = renderDocsUi({
      openApiUrl: "/api/openapi.json",
    });

    expect(html).toContain('data-specord-tab="overview"');
    expect(html).toContain('data-specord-tab="code"');
    expect(html).toContain('data-specord-tab="schema"');
    expect(html).toContain('data-specord-tab="changelog"');
    expect(html).toContain("data-specord-code-snippets");
    expect(html).toContain("data-specord-changelog");
    expect(html).toContain("data-specord-try-panel");
    expect(html).toContain("Execution contract pending");
  });

  it("does not render dashboard KPIs or decorative hero chrome", () => {
    const html = renderDocsUi({
      openApiUrl: "/api/openapi.json",
    });

    expect(html).not.toContain("path-count");
    expect(html).not.toContain("operation-count");
    expect(html).not.toContain("schema-count");
    expect(html).not.toContain("console-card");
    expect(html).not.toContain("inline-lens");
    expect(html).not.toContain("summary-grid");
  });

  it("keeps injected client configuration HTML-safe", () => {
    const html = renderDocsUi({
      title: "Specord",
      openApiUrl: "/api/openapi.json?next=<script>",
    });

    expect(html).toContain("/api/openapi.json?next=\\u003cscript>");
    expect(html).not.toContain("/api/openapi.json?next=<script>");
  });
});
