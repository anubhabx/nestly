// ============================================================================
// @specord/ui — static docs UI scaffold
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
        --background: #f7f8f5;
        --surface: #ffffff;
        --text: #151712;
        --muted: #64695d;
        --border: #dfe3d8;
        --accent: #0f6b4f;
        --accent-soft: #e1f3eb;
        --code: #27332d;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--background);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      a {
        color: inherit;
      }

      .shell {
        display: grid;
        grid-template-columns: 280px 1fr;
        min-height: 100vh;
      }

      .sidebar {
        border-right: 1px solid var(--border);
        background: #fbfcf8;
        padding: 28px 24px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 700;
      }

      .mark {
        display: grid;
        width: 28px;
        height: 28px;
        place-items: center;
        border: 1px solid #b9c9bd;
        border-radius: 6px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 13px;
        font-weight: 800;
      }

      .status {
        margin-top: 28px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
      }

      .label {
        margin: 0 0 6px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 650;
        text-transform: uppercase;
      }

      .value {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }

      .nav {
        display: grid;
        gap: 10px;
        margin-top: 24px;
      }

      .nav a {
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--surface);
        color: var(--code);
        font-size: 13px;
        font-weight: 650;
        text-decoration: none;
      }

      main {
        min-width: 0;
        padding: 36px 40px;
      }

      .topbar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 28px;
      }

      h1 {
        margin: 0;
        font-size: 32px;
        line-height: 1.12;
      }

      .subtitle {
        max-width: 680px;
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.6;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(96px, 1fr));
        gap: 12px;
        min-width: min(380px, 100%);
      }

      .stat {
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
        padding: 14px;
      }

      .stat strong {
        display: block;
        margin-top: 6px;
        font-size: 24px;
      }

      .section {
        margin-top: 30px;
      }

      .section h2 {
        margin: 0 0 14px;
        font-size: 18px;
      }

      .endpoint-list {
        display: grid;
        gap: 10px;
      }

      .endpoint {
        display: grid;
        grid-template-columns: 76px 1fr;
        gap: 14px;
        align-items: center;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
        padding: 12px 14px;
      }

      .method {
        border-radius: 5px;
        background: var(--accent-soft);
        color: var(--accent);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        font-weight: 800;
        line-height: 28px;
        text-align: center;
      }

      .path {
        min-width: 0;
        overflow-wrap: anywhere;
        color: var(--code);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 13px;
      }

      .empty {
        border: 1px dashed var(--border);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.6);
        color: var(--muted);
        padding: 18px;
      }

      @media (max-width: 860px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .sidebar {
          border-right: 0;
          border-bottom: 1px solid var(--border);
        }

        main {
          padding: 28px 22px;
        }

        .topbar {
          display: grid;
        }

        .stats {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="mark">S</span>
          <span>Specord</span>
        </div>
        <div class="status">
          <p class="label">OpenAPI source</p>
          <p class="value"><a href="${openApiUrl}">${openApiUrl}</a></p>
        </div>
        ${appUrl ? `<div class="status"><p class="label">App process</p><p class="value"><a href="${appUrl}">${appUrl}</a></p></div>` : ""}
        <nav class="nav" aria-label="Docs links">
          <a href="${openApiUrl}">OpenAPI JSON</a>
        </nav>
      </aside>
      <main>
        <section class="topbar">
          <div>
            <h1 id="api-title">${title}</h1>
            <p class="subtitle">Static source analysis served as a local API reference shell.</p>
          </div>
          <div class="stats" aria-label="Document summary">
            <div class="stat"><p class="label">Version</p><strong id="api-version">...</strong></div>
            <div class="stat"><p class="label">Paths</p><strong id="path-count">...</strong></div>
            <div class="stat"><p class="label">Operations</p><strong id="operation-count">...</strong></div>
          </div>
        </section>
        <section class="section">
          <h2>Operations</h2>
          <div id="endpoint-list" class="endpoint-list">
            <div class="empty">Loading OpenAPI document...</div>
          </div>
        </section>
      </main>
    </div>
    <script>
      window.__SPECORD_DOCS__ = ${clientConfig};
      const methodOrder = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];

      async function loadDocument() {
        const response = await fetch(window.__SPECORD_DOCS__.openApiUrl, { headers: { "accept": "application/json" } });
        if (!response.ok) {
          throw new Error("OpenAPI request failed with status " + response.status);
        }
        return response.json();
      }

      function operationRows(document) {
        return Object.entries(document.paths || {}).flatMap(([path, pathItem]) =>
          methodOrder
            .filter((method) => pathItem && pathItem[method])
            .map((method) => ({ method, path, operation: pathItem[method] }))
        );
      }

      function render(openApiDocument) {
        const title = openApiDocument.info && openApiDocument.info.title ? openApiDocument.info.title : "Specord API Docs";
        const version = openApiDocument.info && openApiDocument.info.version ? openApiDocument.info.version : "0.1.0";
        const rows = operationRows(openApiDocument);

        window.document.getElementById("api-title").textContent = title;
        window.document.getElementById("api-version").textContent = version;
        window.document.getElementById("path-count").textContent = String(Object.keys(openApiDocument.paths || {}).length);
        window.document.getElementById("operation-count").textContent = String(rows.length);
        window.document.getElementById("endpoint-list").innerHTML = rows.length
          ? rows.map((row) => '<div class="endpoint"><span class="method">' + row.method.toUpperCase() + '</span><span class="path">' + escapeHtml(row.path) + '</span></div>').join("")
          : '<div class="empty">No operations were emitted.</div>';
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      loadDocument().then(render).catch((error) => {
        window.document.getElementById("endpoint-list").innerHTML =
          '<div class="empty">' + escapeHtml(error.message) + '</div>';
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
