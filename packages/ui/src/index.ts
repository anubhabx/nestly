// ============================================================================
// @specord/ui - minimal static docs devtool
// ============================================================================

export interface DocsUiOptions {
  title?: string;
  openApiUrl: string;
  appUrl?: string;
}

export function renderDocsUi(options: DocsUiOptions): string {
  const title = escapeHtml(options.title ?? "Specord API Docs");
  const openApiUrl = escapeHtml(options.openApiUrl);
  const appUrl = options.appUrl ? escapeHtml(options.appUrl) : undefined;
  const clientConfig = safeJson({
    openApiUrl: options.openApiUrl,
  });

  return `<!doctype html>
<html lang="en" data-specord-docs-shell>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #fbfbfa;
        --surface: #ffffff;
        --surface-muted: #f7f6f3;
        --line: #e9e7e2;
        --line-strong: #d8d5cd;
        --text: #20211f;
        --text-muted: #6f6d67;
        --text-faint: #9b9890;
        --accent: #2f5f4a;
        --accent-soft: #edf3ec;
        --blue: #1f5d7d;
        --blue-soft: #e7f2f8;
        --yellow: #7c5b13;
        --yellow-soft: #fbf3db;
        --red: #8a302a;
        --red-soft: #fdebec;
        --radius: 8px;
        --mono: "Geist Mono", "SFMono-Regular", "Cascadia Code", Consolas, monospace;
        --sans: "Geist Sans", "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        min-height: 100%;
      }

      body {
        margin: 0;
        overflow-x: hidden;
        background: var(--canvas);
        color: var(--text);
        font-family: var(--sans);
        font-size: 14px;
        line-height: 1.5;
      }

      a {
        color: inherit;
      }

      button,
      input {
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      .skip-link {
        position: fixed;
        left: 12px;
        top: 8px;
        z-index: 20;
        transform: translateY(-150%);
        border: 1px solid var(--line-strong);
        border-radius: 6px;
        background: var(--surface);
        padding: 8px 10px;
        text-decoration: none;
        transition: transform 160ms ease;
      }

      .skip-link:focus {
        transform: translateY(0);
      }

      .shell {
        display: grid;
        min-height: 100vh;
        grid-template-rows: auto minmax(0, 1fr);
      }

      .toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        display: grid;
        grid-template-columns: minmax(160px, auto) minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        border-bottom: 1px solid var(--line);
        background: rgba(251, 251, 250, 0.94);
        backdrop-filter: blur(12px);
        padding: 10px 14px;
      }

      .brand {
        min-width: 0;
      }

      .brand strong {
        display: block;
        overflow: hidden;
        color: var(--text);
        font-size: 14px;
        font-weight: 680;
        letter-spacing: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .brand span {
        display: block;
        margin-top: 1px;
        color: var(--text-muted);
        font-size: 12px;
      }

      .source {
        min-width: 0;
        overflow: hidden;
        color: var(--text-muted);
        font-family: var(--mono);
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .toolbar-actions {
        display: inline-flex;
        gap: 8px;
        align-items: center;
      }

      .button,
      .link-button,
      .filter-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 32px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--surface);
        color: var(--text);
        font-size: 12px;
        font-weight: 620;
        line-height: 1;
        text-decoration: none;
        transition:
          background 140ms ease,
          border-color 140ms ease,
          transform 140ms ease;
      }

      .button,
      .link-button {
        padding: 0 10px;
      }

      .button:hover,
      .link-button:hover,
      .filter-button:hover {
        border-color: var(--line-strong);
        background: var(--surface-muted);
      }

      .button:active,
      .link-button:active,
      .filter-button:active,
      .operation-button:active,
      .schema-button:active {
        transform: scale(0.99);
      }

      .button:focus-visible,
      .link-button:focus-visible,
      .filter-button:focus-visible,
      .operation-button:focus-visible,
      .schema-button:focus-visible,
      input:focus-visible {
        outline: 2px solid rgba(47, 95, 74, 0.28);
        outline-offset: 2px;
      }

      .app {
        display: grid;
        grid-template-columns: minmax(280px, 360px) minmax(0, 1fr) minmax(260px, 320px);
        min-height: 0;
      }

      .pane {
        min-width: 0;
        min-height: 0;
        border-right: 1px solid var(--line);
        background: var(--surface);
      }

      .pane:last-child {
        border-right: 0;
      }

      .pane-header {
        border-bottom: 1px solid var(--line);
        padding: 14px;
      }

      .pane-title {
        margin: 0;
        color: var(--text);
        font-size: 13px;
        font-weight: 680;
      }

      .pane-note {
        margin: 4px 0 0;
        color: var(--text-muted);
        font-size: 12px;
      }

      .pane-body {
        min-height: 0;
        padding: 14px;
      }

      .scroll-pane {
        height: calc(100vh - 54px);
        overflow: auto;
      }

      .search {
        width: 100%;
        min-height: 36px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--surface);
        color: var(--text);
        padding: 0 10px;
      }

      .search::placeholder {
        color: var(--text-faint);
      }

      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }

      .filter-button {
        min-height: 28px;
        padding: 0 9px;
        color: var(--text-muted);
      }

      .filter-button.is-active {
        border-color: #cbd9cd;
        background: var(--accent-soft);
        color: var(--accent);
      }

      .state {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--surface-muted);
        color: var(--text-muted);
        padding: 12px;
        font-size: 13px;
      }

      .state[hidden],
      [hidden] {
        display: none !important;
      }

      .operation-list {
        display: grid;
        gap: 0;
        border-top: 1px solid var(--line);
      }

      .operation-button {
        display: grid;
        width: 100%;
        grid-template-columns: 58px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        border: 0;
        border-bottom: 1px solid var(--line);
        background: var(--surface);
        color: inherit;
        padding: 11px 14px;
        text-align: left;
      }

      .operation-button:hover,
      .operation-button.is-selected {
        background: var(--surface-muted);
      }

      .operation-button.is-selected {
        box-shadow: inset 3px 0 0 var(--accent);
      }

      .method {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 22px;
        border-radius: 5px;
        background: var(--surface-muted);
        color: var(--text-muted);
        font-family: var(--mono);
        font-size: 10px;
        font-weight: 760;
        letter-spacing: 0;
      }

      .method.get {
        background: var(--blue-soft);
        color: var(--blue);
      }

      .method.post {
        background: var(--accent-soft);
        color: var(--accent);
      }

      .method.patch,
      .method.put {
        background: var(--yellow-soft);
        color: var(--yellow);
      }

      .method.delete {
        background: var(--red-soft);
        color: var(--red);
      }

      .operation-main {
        min-width: 0;
      }

      .operation-path {
        display: block;
        overflow-wrap: anywhere;
        color: var(--text);
        font-family: var(--mono);
        font-size: 12px;
        font-weight: 650;
      }

      .operation-summary {
        display: block;
        margin-top: 3px;
        overflow: hidden;
        color: var(--text-muted);
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tag {
        margin-top: 5px;
        color: var(--text-faint);
        font-size: 11px;
      }

      .detail {
        padding: 22px;
      }

      .detail-head {
        border-bottom: 1px solid var(--line);
        padding-bottom: 18px;
      }

      .detail-route {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .detail-path {
        min-width: 0;
        overflow-wrap: anywhere;
        color: var(--text);
        font-family: var(--mono);
        font-size: 18px;
        font-weight: 680;
      }

      .detail-summary {
        max-width: 80ch;
        margin: 12px 0 0;
        color: var(--text);
        font-size: 15px;
        line-height: 1.6;
      }

      .detail-description {
        max-width: 82ch;
        margin: 4px 0 0;
        color: var(--text-muted);
        font-size: 13px;
        line-height: 1.6;
      }

      .section {
        border-bottom: 1px solid var(--line);
        padding: 18px 0;
      }

      .section:last-child {
        border-bottom: 0;
      }

      .section-title {
        margin: 0 0 10px;
        color: var(--text-muted);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .table {
        display: grid;
        gap: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        overflow: hidden;
      }

      .row {
        display: grid;
        grid-template-columns: minmax(110px, 0.42fr) minmax(0, 1fr);
        gap: 12px;
        border-bottom: 1px solid var(--line);
        background: var(--surface);
        padding: 9px 10px;
      }

      .row:last-child {
        border-bottom: 0;
      }

      .row code {
        color: var(--text);
        font-family: var(--mono);
        font-size: 12px;
      }

      .row span {
        min-width: 0;
        overflow-wrap: anywhere;
        color: var(--text-muted);
        font-size: 12px;
      }

      .empty-text {
        margin: 0;
        color: var(--text-muted);
        font-size: 13px;
      }

      pre {
        max-height: 360px;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: #20211f;
        color: #f7f6f3;
        padding: 12px;
        font-family: var(--mono);
        font-size: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
      }

      .schema-list {
        display: grid;
        border-top: 1px solid var(--line);
      }

      .schema-button {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        border: 0;
        border-bottom: 1px solid var(--line);
        background: var(--surface);
        color: var(--text);
        padding: 10px 14px;
        text-align: left;
      }

      .schema-button:hover,
      .schema-button.is-selected {
        background: var(--surface-muted);
      }

      .schema-name {
        min-width: 0;
        overflow-wrap: anywhere;
        font-family: var(--mono);
        font-size: 12px;
        font-weight: 650;
      }

      .schema-meta {
        color: var(--text-muted);
        font-size: 11px;
        white-space: nowrap;
      }

      .schema-detail {
        border-top: 1px solid var(--line);
        padding: 14px;
      }

      .schema-detail h3 {
        margin: 0 0 10px;
        overflow-wrap: anywhere;
        font-family: var(--mono);
        font-size: 13px;
      }

      .toast {
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 30;
        transform: translateY(12px);
        border: 1px solid var(--line-strong);
        border-radius: 6px;
        background: var(--surface);
        color: var(--text);
        opacity: 0;
        padding: 9px 10px;
        font-size: 12px;
        transition:
          opacity 160ms ease,
          transform 160ms ease;
      }

      .toast.is-visible {
        transform: translateY(0);
        opacity: 1;
      }

      @media (max-width: 1120px) {
        .app {
          grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
        }

        .schemas-pane {
          display: none;
        }
      }

      @media (max-width: 760px) {
        .toolbar {
          position: static;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .toolbar-actions {
          flex-wrap: wrap;
        }

        .app {
          display: block;
        }

        .pane {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .scroll-pane {
          height: auto;
          overflow: visible;
        }

        .detail {
          padding: 16px;
        }

        .row {
          grid-template-columns: 1fr;
          gap: 4px;
        }
      }
    </style>
  </head>
  <body>
    <a href="#specord-main" class="skip-link">Skip to operation detail</a>
    <div class="shell">
      <header class="toolbar">
        <div class="brand">
          <strong id="api-title">${title}</strong>
          ${appUrl ? `<span>${appUrl}</span>` : `<span>read-only OpenAPI reference</span>`}
        </div>
        <div class="source" title="${openApiUrl}">${openApiUrl}</div>
        <div class="toolbar-actions">
          <a class="link-button" href="${openApiUrl}">JSON</a>
          <button class="button" type="button" data-specord-copy-json>Copy</button>
        </div>
      </header>

      <main class="app" id="specord-main">
        <aside class="pane scroll-pane" aria-label="Operations">
          <div class="pane-header">
            <h1 class="pane-title">Operations</h1>
            <p class="pane-note">Search routes, methods, tags, or operation IDs.</p>
          </div>
          <div class="pane-body">
            <input
              class="search"
              type="search"
              placeholder="Find an operation"
              autocomplete="off"
              data-specord-search
            />
            <div class="filters" data-specord-method-filters aria-label="HTTP method filters"></div>
            <div class="state" data-specord-loading>Loading OpenAPI document...</div>
            <div class="state" data-specord-error hidden></div>
            <div class="state" data-specord-empty hidden>No matching operations.</div>
          </div>
          <div class="operation-list" data-specord-operation-list></div>
        </aside>

        <section class="pane scroll-pane detail-pane" aria-label="Operation detail">
          <div class="detail" data-specord-operation-detail>
            <div class="state">Select an operation.</div>
          </div>
        </section>

        <aside class="pane scroll-pane schemas-pane" aria-label="Schemas">
          <div class="pane-header">
            <h2 class="pane-title">Schemas</h2>
            <p class="pane-note">Component schemas in this document.</p>
          </div>
          <div class="schema-list" data-specord-schema-list></div>
          <div class="schema-detail" data-specord-schema-detail>
            <h3>No schema selected</h3>
            <pre>Select a schema to inspect it.</pre>
          </div>
        </aside>
      </main>
    </div>
    <div class="toast" role="status" aria-live="polite" data-specord-toast></div>

    <script>
      window.__SPECORD_DOCS__ = ${clientConfig};
      const methodOrder = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];
      const state = {
        document: undefined,
        rows: [],
        selectedOperationId: undefined,
        selectedMethod: "all",
        selectedSchemaName: undefined,
        query: ""
      };

      const els = {
        title: document.getElementById("api-title"),
        search: document.querySelector("[data-specord-search]"),
        filters: document.querySelector("[data-specord-method-filters]"),
        list: document.querySelector("[data-specord-operation-list]"),
        detail: document.querySelector("[data-specord-operation-detail]"),
        schemas: document.querySelector("[data-specord-schema-list]"),
        schemaDetail: document.querySelector("[data-specord-schema-detail]"),
        loading: document.querySelector("[data-specord-loading]"),
        error: document.querySelector("[data-specord-error]"),
        empty: document.querySelector("[data-specord-empty]"),
        copy: document.querySelector("[data-specord-copy-json]"),
        toast: document.querySelector("[data-specord-toast]")
      };

      async function loadDocument() {
        const response = await fetch(window.__SPECORD_DOCS__.openApiUrl, {
          headers: { "accept": "application/json" }
        });

        if (!response.ok) {
          throw new Error("OpenAPI request failed with status " + response.status);
        }

        return response.json();
      }

      function operationRows(openApiDocument) {
        let index = 0;
        return Object.entries(openApiDocument.paths || {}).flatMap(([path, pathItem]) =>
          methodOrder
            .filter((method) => pathItem && pathItem[method])
            .map((method) => {
              const operation = pathItem[method];
              index += 1;
              const tag = firstTag(operation);
              const summary = operation.summary || operation.operationId || "";
              return {
                id: String(index),
                method,
                path,
                operation,
                tag,
                summary,
                searchText: [
                  method,
                  path,
                  tag,
                  summary,
                  operation.description,
                  operation.operationId
                ].filter(Boolean).join(" ").toLowerCase()
              };
            })
        ).sort(sortOperationRows);
      }

      function firstTag(operation) {
        return Array.isArray(operation.tags) && operation.tags.length > 0
          ? String(operation.tags[0])
          : "untagged";
      }

      function sortOperationRows(left, right) {
        const tagCompare = left.tag.localeCompare(right.tag);
        if (tagCompare !== 0) return tagCompare;
        const pathCompare = left.path.localeCompare(right.path);
        if (pathCompare !== 0) return pathCompare;
        return methodOrder.indexOf(left.method) - methodOrder.indexOf(right.method);
      }

      function schemaEntries(openApiDocument) {
        const schemas = openApiDocument.components && openApiDocument.components.schemas
          ? openApiDocument.components.schemas
          : {};

        return Object.entries(schemas).sort(([left], [right]) => left.localeCompare(right));
      }

      function filteredRows() {
        const query = state.query.trim().toLowerCase();
        return state.rows.filter((row) => {
          const methodMatches = state.selectedMethod === "all" || row.method === state.selectedMethod;
          const queryMatches = !query || row.searchText.includes(query);
          return methodMatches && queryMatches;
        });
      }

      function renderMethodFilters() {
        const counts = state.rows.reduce((next, row) => {
          next[row.method] = (next[row.method] || 0) + 1;
          return next;
        }, {});
        const filters = ["all", ...methodOrder.filter((method) => counts[method])];

        els.filters.innerHTML = filters.map((method) => {
          const count = method === "all" ? state.rows.length : counts[method];
          const active = state.selectedMethod === method ? " is-active" : "";
          const label = method === "all" ? "All" : method.toUpperCase();
          return '<button class="filter-button' + active + '" type="button" data-method="' + escapeAttribute(method) + '">' +
            escapeHtml(label) + " " + String(count) +
          '</button>';
        }).join("");

        els.filters.querySelectorAll("[data-method]").forEach((button) => {
          button.addEventListener("click", () => {
            state.selectedMethod = button.getAttribute("data-method") || "all";
            renderOperations();
          });
        });
      }

      function renderOperations() {
        const rows = filteredRows();
        renderMethodFilters();
        els.empty.hidden = rows.length > 0 || !state.document;

        if (rows.length === 0) {
          els.list.innerHTML = "";
          renderOperationDetail();
          return;
        }

        if (!rows.some((row) => row.id === state.selectedOperationId)) {
          state.selectedOperationId = rows[0].id;
        }

        els.list.innerHTML = rows.map(renderOperationButton).join("");
        els.list.querySelectorAll("[data-operation-id]").forEach((button) => {
          button.addEventListener("click", () => {
            state.selectedOperationId = button.getAttribute("data-operation-id") || undefined;
            renderOperations();
          });
        });

        renderOperationDetail();
      }

      function renderOperationButton(row) {
        const selected = row.id === state.selectedOperationId ? " is-selected" : "";
        const summary = row.summary || "No summary";
        const label = row.method.toUpperCase() + " " + row.path + " " + summary;
        return '<button class="operation-button' + selected + '" type="button" data-operation-id="' + escapeAttribute(row.id) + '" aria-label="' + escapeAttribute(label) + '">' +
          '<span class="method ' + escapeAttribute(row.method) + '">' + row.method.toUpperCase() + '</span>' +
          '<span class="operation-main">' +
            '<span class="operation-path">' + escapeHtml(row.path) + '</span>' +
            '<span class="operation-summary">' + escapeHtml(summary) + '</span>' +
            '<span class="tag">' + escapeHtml(row.tag) + '</span>' +
          '</span>' +
        '</button>';
      }

      function renderOperationDetail() {
        const visibleRows = filteredRows();
        const row = visibleRows.find((item) => item.id === state.selectedOperationId);

        if (!row) {
          els.detail.innerHTML = '<div class="state">Select an operation.</div>';
          return;
        }

        const operation = row.operation;
        const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
        const security = Array.isArray(operation.security) ? operation.security : [];
        const responses = operation.responses || {};
        const requestBody = operation.requestBody;
        const summary = operation.summary || operation.operationId || "Generated operation";
        const description = operation.description || "";

        els.detail.innerHTML =
          '<div class="detail-head">' +
            '<div class="detail-route">' +
              '<span class="method ' + escapeAttribute(row.method) + '">' + row.method.toUpperCase() + '</span>' +
              '<span class="detail-path">' + escapeHtml(row.path) + '</span>' +
            '</div>' +
            '<p class="detail-summary">' + escapeHtml(summary) + '</p>' +
            (description ? '<p class="detail-description">' + escapeHtml(description) + '</p>' : "") +
          '</div>' +
          section("Parameters", renderParameters(parameters)) +
          section("Request body", renderRequestBody(requestBody)) +
          section("Responses", renderResponses(responses)) +
          section("Security", renderSecurity(security)) +
          section("Raw operation", '<pre>' + escapeHtml(JSON.stringify(operation, null, 2)) + '</pre>');
      }

      function section(title, content) {
        return '<section class="section">' +
          '<h2 class="section-title">' + escapeHtml(title) + '</h2>' +
          content +
        '</section>';
      }

      function renderParameters(parameters) {
        if (parameters.length === 0) {
          return '<p class="empty-text">No parameters.</p>';
        }

        return '<div class="table">' + parameters.map((param) => {
          const name = param.name || "parameter";
          const location = param.in || "unknown";
          const required = param.required ? "required" : "optional";
          return '<div class="row"><code>' + escapeHtml(String(name)) + '</code><span>' +
            escapeHtml(String(location)) + " / " + escapeHtml(required) +
          '</span></div>';
        }).join("") + '</div>';
      }

      function renderRequestBody(requestBody) {
        if (!requestBody) {
          return '<p class="empty-text">No request body.</p>';
        }

        const content = requestBody.content || {};
        const types = Object.keys(content);
        return '<div class="table"><div class="row"><code>' +
          (requestBody.required ? "required" : "optional") +
          '</code><span>' + escapeHtml(types.join(", ") || "content type not emitted") + '</span></div></div>';
      }

      function renderResponses(responses) {
        const entries = Object.entries(responses);
        if (entries.length === 0) {
          return '<p class="empty-text">No responses.</p>';
        }

        return '<div class="table">' + entries.map(([status, response]) => {
          const content = response && response.content ? Object.keys(response.content) : [];
          const description = response && response.description ? String(response.description) : "response";
          return '<div class="row"><code>' + escapeHtml(status) + '</code><span>' +
            escapeHtml(description) +
            (content.length ? " / " + escapeHtml(content.join(", ")) : "") +
          '</span></div>';
        }).join("") + '</div>';
      }

      function renderSecurity(security) {
        if (security.length === 0) {
          return '<p class="empty-text">No security requirements.</p>';
        }

        return '<div class="table">' + security.flatMap((requirement) => {
          const names = Object.keys(requirement);
          return names.length
            ? names.map((name) => '<div class="row"><code>' + escapeHtml(name) + '</code><span>' + escapeHtml((requirement[name] || []).join(", ") || "scheme") + '</span></div>')
            : ['<div class="row"><code>anonymous</code><span>No scheme names emitted.</span></div>'];
        }).join("") + '</div>';
      }

      function renderSchemas() {
        const entries = state.document ? schemaEntries(state.document) : [];

        if (entries.length === 0) {
          els.schemas.innerHTML = '<div class="state">No schemas.</div>';
          els.schemaDetail.innerHTML = '<h3>No schema selected</h3><pre>This document does not contain component schemas.</pre>';
          return;
        }

        if (!state.selectedSchemaName || !entries.some(([name]) => name === state.selectedSchemaName)) {
          state.selectedSchemaName = entries[0][0];
        }

        els.schemas.innerHTML = entries.map(([name, schema]) => {
          const properties = schema && schema.properties ? Object.keys(schema.properties).length : 0;
          const selected = name === state.selectedSchemaName ? " is-selected" : "";
          return '<button class="schema-button' + selected + '" type="button" data-schema-name="' + escapeAttribute(name) + '">' +
            '<span class="schema-name">' + escapeHtml(name) + '</span>' +
            '<span class="schema-meta">' + String(properties) + ' props</span>' +
          '</button>';
        }).join("");

        els.schemas.querySelectorAll("[data-schema-name]").forEach((button) => {
          button.addEventListener("click", () => {
            state.selectedSchemaName = button.getAttribute("data-schema-name") || undefined;
            renderSchemas();
          });
        });

        const selected = entries.find(([name]) => name === state.selectedSchemaName);
        if (selected) {
          els.schemaDetail.innerHTML = '<h3>' + escapeHtml(selected[0]) + '</h3>' +
            '<pre>' + escapeHtml(JSON.stringify(selected[1], null, 2)) + '</pre>';
        }
      }

      function showToast(message) {
        els.toast.textContent = message;
        els.toast.classList.add("is-visible");
        window.setTimeout(() => {
          els.toast.classList.remove("is-visible");
        }, 1500);
      }

      function copyDocument() {
        if (!state.document) {
          showToast("Document is still loading.");
          return;
        }

        const payload = JSON.stringify(state.document, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(payload)
            .then(() => showToast("Copied OpenAPI JSON."))
            .catch(() => showToast("Clipboard permission denied."));
          return;
        }

        showToast("Clipboard unavailable.");
      }

      function setDocument(openApiDocument) {
        const title = openApiDocument.info && openApiDocument.info.title
          ? String(openApiDocument.info.title)
          : "Specord API Docs";
        els.title.textContent = title;
        state.document = openApiDocument;
        state.rows = operationRows(openApiDocument);
        els.loading.hidden = true;
        renderOperations();
        renderSchemas();
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function escapeAttribute(value) {
        return escapeHtml(value).replaceAll("\`", "&#096;");
      }

      els.search.addEventListener("input", () => {
        state.query = els.search.value;
        renderOperations();
      });

      els.copy.addEventListener("click", copyDocument);

      loadDocument()
        .then(setDocument)
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          els.loading.hidden = true;
          els.error.hidden = false;
          els.error.textContent = message;
        });
    </script>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
