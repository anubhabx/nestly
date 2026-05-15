// ============================================================================
// @specord/ui - static docs workspace scaffold
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
    appUrl: options.appUrl,
  });

  return `<!doctype html>
<html lang="en" data-specord-docs-shell>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: dark;
        --canvas: #0b0c0d;
        --surface: #111214;
        --surface-raised: #17191c;
        --surface-muted: #1e2024;
        --line: #292c31;
        --line-strong: #3a3f47;
        --text: #f4f0e8;
        --text-muted: #b6b0a6;
        --text-faint: #817b73;
        --accent: #8ab4f8;
        --accent-soft: #18243a;
        --green: #5fd69a;
        --green-soft: #11281d;
        --yellow: #e4b75c;
        --yellow-soft: #2d2412;
        --red: #ff7171;
        --red-soft: #32191b;
        --violet: #b8a7ff;
        --violet-soft: #211c35;
        --radius: 7px;
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
      input,
      select {
        font: inherit;
      }

      button,
      select {
        cursor: pointer;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.48;
      }

      .skip-link {
        position: fixed;
        left: 12px;
        top: 8px;
        z-index: 50;
        transform: translateY(-150%);
        border: 1px solid var(--line-strong);
        border-radius: 6px;
        background: var(--surface-raised);
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
        z-index: 20;
        display: grid;
        grid-template-columns: minmax(190px, auto) minmax(220px, 1fr) auto;
        gap: 14px;
        align-items: center;
        border-bottom: 1px solid var(--line);
        background: rgba(11, 12, 13, 0.96);
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
        font-weight: 720;
        letter-spacing: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .brand span,
      .source {
        color: var(--text-muted);
        font-size: 12px;
      }

      .brand span {
        display: block;
        margin-top: 1px;
      }

      .source {
        min-width: 0;
        overflow: hidden;
        font-family: var(--mono);
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .toolbar-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: flex-end;
      }

      .button,
      .link-button,
      .filter-button,
      .tab,
      .panel-action,
      .layout-select {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 32px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--surface-raised);
        color: var(--text);
        font-size: 12px;
        font-weight: 640;
        line-height: 1;
        text-decoration: none;
        transition:
          background 140ms ease,
          border-color 140ms ease,
          transform 140ms ease;
      }

      .button,
      .link-button,
      .panel-action {
        padding: 0 10px;
      }

      .layout-select {
        min-width: 116px;
        padding: 0 26px 0 10px;
      }

      .button:hover,
      .link-button:hover,
      .filter-button:hover,
      .tab:hover,
      .panel-action:hover,
      .layout-select:hover {
        border-color: var(--line-strong);
        background: var(--surface-muted);
      }

      .button:active,
      .link-button:active,
      .filter-button:active,
      .operation-button:active,
      .schema-button:active,
      .tab:active,
      .panel-action:active {
        transform: scale(0.99);
      }

      .button:focus-visible,
      .link-button:focus-visible,
      .filter-button:focus-visible,
      .operation-button:focus-visible,
      .schema-button:focus-visible,
      .tab:focus-visible,
      .panel-action:focus-visible,
      input:focus-visible,
      select:focus-visible {
        outline: 2px solid rgba(138, 180, 248, 0.34);
        outline-offset: 2px;
      }

      .workspace {
        display: flex;
        min-height: 0;
        align-items: stretch;
        gap: 1px;
        overflow: auto;
        background: var(--line);
        padding: 1px;
      }

      .workspace.is-empty {
        display: grid;
        place-items: center;
        background: var(--canvas);
        padding: 20px;
      }

      .panel {
        position: relative;
        display: flex;
        min-width: 260px;
        min-height: 280px;
        max-width: min(92vw, 980px);
        max-height: calc(100vh - 70px);
        flex: 0 0 auto;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 0;
        background: var(--surface);
      }

      .panel-inner {
        display: flex;
        width: 100%;
        height: 100%;
        flex-direction: column;
        overflow: auto;
      }

      .panel-top {
        position: sticky;
        top: 0;
        z-index: 4;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        border-bottom: 1px solid var(--line);
        background: rgba(17, 18, 20, 0.98);
        padding: 10px 12px;
      }

      .panel-drag {
        width: 28px;
        min-width: 28px;
        height: 28px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--surface-raised);
        color: var(--text-faint);
        font-family: var(--mono);
        font-size: 16px;
        line-height: 1;
      }

      .panel-drag:hover {
        color: var(--text);
      }

      .panel-heading {
        min-width: 0;
      }

      .panel-heading h2 {
        margin: 0;
        overflow: hidden;
        color: var(--text);
        font-size: 13px;
        font-weight: 720;
        letter-spacing: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .panel-heading p {
        margin: 2px 0 0;
        overflow: hidden;
        color: var(--text-muted);
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .panel-menu {
        display: inline-flex;
        gap: 6px;
        align-items: center;
      }

      .panel-body {
        min-height: 0;
        padding: 14px;
      }

      .panel-body.flush {
        padding: 0;
      }

      .panel-empty {
        max-width: 420px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--surface);
        padding: 16px;
        color: var(--text-muted);
      }

      .search {
        width: 100%;
        min-height: 36px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #0f1012;
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
        border-color: #244a78;
        background: var(--accent-soft);
        color: var(--accent);
      }

      .state {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--surface-raised);
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

      .tag-group {
        border-bottom: 1px solid var(--line);
      }

      .tag-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px 7px;
        color: var(--text-muted);
        font-size: 11px;
        font-weight: 720;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .operation-button {
        display: grid;
        width: 100%;
        grid-template-columns: 58px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        border: 0;
        border-top: 1px solid rgba(41, 44, 49, 0.72);
        background: transparent;
        color: inherit;
        padding: 10px 14px;
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
        font-weight: 780;
        letter-spacing: 0;
      }

      .method.get {
        background: var(--accent-soft);
        color: var(--accent);
      }

      .method.post {
        background: var(--green-soft);
        color: var(--green);
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
        font-weight: 660;
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

      .detail {
        padding: 22px;
      }

      .detail-head {
        padding-bottom: 16px;
      }

      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-bottom: 12px;
        color: var(--text-muted);
        font-family: var(--mono);
        font-size: 11px;
      }

      .detail-route {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .detail-path,
      .url-bar {
        min-width: 0;
        overflow-wrap: anywhere;
        color: var(--text);
        font-family: var(--mono);
        font-size: 18px;
        font-weight: 700;
      }

      .url-line {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        margin-top: 16px;
      }

      .url-bar {
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #0f1012;
        padding: 10px 12px;
        font-size: 13px;
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

      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        border-bottom: 1px solid var(--line);
        margin: 6px 0 0;
        padding: 0 0 10px;
      }

      .tab {
        min-height: 30px;
        padding: 0 10px;
        color: var(--text-muted);
      }

      .tab.is-active {
        border-color: var(--accent);
        background: var(--accent-soft);
        color: var(--accent);
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
        font-weight: 760;
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
        max-height: 420px;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: #090a0b;
        color: var(--text);
        padding: 12px;
        font-family: var(--mono);
        font-size: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
      }

      .code-grid {
        display: grid;
        gap: 12px;
      }

      .code-title {
        margin: 0 0 6px;
        color: var(--text-muted);
        font-size: 12px;
        font-weight: 700;
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
        background: transparent;
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

      .try-body {
        display: grid;
        gap: 14px;
      }

      .try-route {
        display: grid;
        gap: 8px;
      }

      .try-fields {
        display: grid;
        gap: 8px;
      }

      .try-field {
        display: grid;
        gap: 5px;
      }

      .try-field label {
        color: var(--text-muted);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .try-field input {
        min-height: 34px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #0f1012;
        color: var(--text);
        padding: 0 10px;
      }

      .try-footer {
        position: sticky;
        bottom: 0;
        display: grid;
        gap: 8px;
        border-top: 1px solid var(--line);
        background: rgba(17, 18, 20, 0.98);
        padding: 12px 14px;
      }

      .toast {
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 60;
        transform: translateY(12px);
        border: 1px solid var(--line-strong);
        border-radius: 6px;
        background: var(--surface-raised);
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

      @media (max-width: 980px) {
        .toolbar {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .toolbar-actions {
          justify-content: flex-start;
        }

        .workspace {
          display: grid;
          gap: 1px;
          overflow: visible;
        }

        .panel {
          width: auto !important;
          max-width: none;
          min-width: 0;
          max-height: none;
        }

        .detail {
          padding: 16px;
        }

        .row,
        .url-line {
          grid-template-columns: 1fr;
          gap: 6px;
        }
      }

      /* ── Resize handles ──────────────────────────────────────────── */
      .resize-handle {
        position: absolute;
        z-index: 12;
        box-sizing: border-box;
      }
      .resize-n  { top: 0;    left: 10px;  right: 10px;  height: 5px; cursor: ns-resize; }
      .resize-s  { bottom: 0; left: 10px;  right: 10px;  height: 5px; cursor: ns-resize; }
      .resize-e  { right: 0;  top: 10px;   bottom: 10px; width: 5px;  cursor: ew-resize; }
      .resize-w  { left: 0;   top: 10px;   bottom: 10px; width: 5px;  cursor: ew-resize; }
      .resize-nw { top: 0;    left: 0;     width: 12px;  height: 12px; cursor: nwse-resize; }
      .resize-ne { top: 0;    right: 0;    width: 12px;  height: 12px; cursor: nesw-resize; }
      .resize-sw { bottom: 0; left: 0;     width: 12px;  height: 12px; cursor: nesw-resize; }
      .resize-se { bottom: 0; right: 0;    width: 12px;  height: 12px; cursor: nwse-resize; }

      body[data-resizing="n"]  * { cursor: ns-resize   !important; }
      body[data-resizing="s"]  * { cursor: ns-resize   !important; }
      body[data-resizing="e"]  * { cursor: ew-resize   !important; }
      body[data-resizing="w"]  * { cursor: ew-resize   !important; }
      body[data-resizing="nw"] * { cursor: nwse-resize !important; }
      body[data-resizing="se"] * { cursor: nwse-resize !important; }
      body[data-resizing="ne"] * { cursor: nesw-resize !important; }
      body[data-resizing="sw"] * { cursor: nesw-resize !important; }
      body[data-resizing]      { user-select: none; }

      /* ── Panel ghost (drag clone) ────────────────────────────────── */
      .panel-ghost {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 100;
        pointer-events: none;
        opacity: 0.88;
        will-change: transform;
        box-shadow: 0 24px 64px rgba(0,0,0,0.72), 0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px var(--line-strong);
        border-radius: var(--radius);
        overflow: hidden;
        transform-origin: top left;
        transition: none !important;
      }
      .panel-ghost .resize-handle { display: none; }
      .panel-ghost .panel-inner   { overflow: hidden; }

      /* ── Source panel placeholder ────────────────────────────────── */
      .panel.is-drag-source {
        opacity: 0.22;
        pointer-events: none;
        transition: opacity 120ms ease;
      }

      /* ── Drop indicator ──────────────────────────────────────────── */
      .drop-indicator {
        flex: 0 0 3px;
        min-width: 3px;
        align-self: stretch;
        border-radius: 3px;
        background: var(--accent);
        pointer-events: none;
        opacity: 0;
        transition: opacity 100ms ease;
      }
      .drop-indicator.is-visible {
        opacity: 1;
      }

      /* ── Drag handle polish ──────────────────────────────────────── */
      .panel-drag {
        cursor: grab;
        touch-action: none;
        will-change: auto;
      }
      .panel-drag:active {
        cursor: grabbing;
      }
    </style>
  </head>
  <body>
    <a href="#specord-main" class="skip-link">Skip to operation detail</a>
    <div class="shell">
      <header class="toolbar">
        <div class="brand">
          <strong id="api-title">${title}</strong>
          ${appUrl ? `<span>${appUrl}</span>` : `<span>customizable OpenAPI workspace</span>`}
        </div>
        <div class="source" title="${openApiUrl}">${openApiUrl}</div>
        <div class="toolbar-actions">
          <select class="layout-select" data-specord-add-panel aria-label="Add panel">
            <option value="">Add panel</option>
          </select>
          <button class="button" type="button" data-specord-undo-layout disabled>Undo</button>
          <button class="button" type="button" data-specord-redo-layout disabled>Redo</button>
          <button class="button" type="button" data-specord-reset-layout>Reset</button>
          <a class="link-button" href="${openApiUrl}">JSON</a>
          <button class="button" type="button" data-specord-copy-json>Copy</button>
        </div>
      </header>

      <main class="workspace" id="specord-main" data-specord-workspace>
        <div class="panel-empty" data-specord-empty-layout hidden>
          All panels are hidden. Use Add panel in the toolbar to restore the workspace.
        </div>

        <aside class="panel" data-specord-panel="navigator" aria-label="Endpoints">
          <div class="panel-inner">
            <header class="panel-top">
              <button class="panel-drag" type="button" data-specord-panel-drag data-panel-id="navigator" title="Drag panel">⠿</button>
              <div class="panel-heading">
                <h2>Endpoints</h2>
                <p>Search routes, methods, tags, or operation IDs.</p>
              </div>
              <div class="panel-menu" data-specord-panel-menu>
                <button class="panel-action" type="button" data-specord-remove-panel="navigator" title="Remove panel">Remove</button>
              </div>
            </header>
            <div class="panel-body">
              <input
                class="search"
                type="search"
                placeholder="Jump to endpoint..."
                autocomplete="off"
                data-specord-search
              />
              <div class="filters" data-specord-method-filters aria-label="HTTP method filters"></div>
              <div class="state" data-specord-loading>Loading OpenAPI document...</div>
              <div class="state" data-specord-error hidden></div>
              <div class="state" data-specord-empty hidden>No matching operations.</div>
            </div>
            <div class="operation-list" data-specord-operation-list></div>
          </div>
        </aside>

        <section class="panel" data-specord-panel="reference" aria-label="Operation reference">
          <div class="panel-inner">
            <header class="panel-top">
              <button class="panel-drag" type="button" data-specord-panel-drag data-panel-id="reference" title="Drag panel">⠿</button>
              <div class="panel-heading">
                <h2>Reference</h2>
                <p>Overview, code, schemas, and changelog scaffolds.</p>
              </div>
              <div class="panel-menu" data-specord-panel-menu>
                <button class="panel-action" type="button" data-specord-remove-panel="reference" title="Remove panel">Remove</button>
              </div>
            </header>
            <div class="detail" data-specord-operation-detail>
              <div class="tabs" data-specord-tabs>
                <button class="tab is-active" type="button" data-specord-tab="overview">Overview</button>
                <button class="tab" type="button" data-specord-tab="code">Code</button>
                <button class="tab" type="button" data-specord-tab="schema">Schema</button>
                <button class="tab" type="button" data-specord-tab="changelog">Changelog</button>
              </div>
              <div class="state">Select an operation.</div>
              <div data-specord-code-snippets hidden></div>
              <div data-specord-changelog hidden></div>
            </div>
          </div>
        </section>

        <aside class="panel" data-specord-panel="try" data-specord-try-panel aria-label="Try it scaffold">
          <div class="panel-inner">
            <header class="panel-top">
              <button class="panel-drag" type="button" data-specord-panel-drag data-panel-id="try" title="Drag panel">⠿</button>
              <div class="panel-heading">
                <h2>Try it</h2>
                <p>Request builder scaffold. Execution contract pending.</p>
              </div>
              <div class="panel-menu" data-specord-panel-menu>
                <button class="panel-action" type="button" data-specord-remove-panel="try" title="Remove panel">Remove</button>
              </div>
            </header>
            <div class="panel-body" data-specord-try-detail>
              <div class="state">Select an operation to prepare request fields. Execution contract pending.</div>
            </div>
            <div class="try-footer">
              <button class="button" type="button" disabled>Send request</button>
              <span class="source">Returns mocked response only after the execution contract is defined.</span>
            </div>
          </div>
        </aside>

        <aside class="panel" data-specord-panel="schemas" aria-label="Schemas">
          <div class="panel-inner">
            <header class="panel-top">
              <button class="panel-drag" type="button" data-specord-panel-drag data-panel-id="schemas" title="Drag panel">⠿</button>
              <div class="panel-heading">
                <h2>Schemas</h2>
                <p>Component schemas in this document.</p>
              </div>
              <div class="panel-menu" data-specord-panel-menu>
                <button class="panel-action" type="button" data-specord-remove-panel="schemas" title="Remove panel">Remove</button>
              </div>
            </header>
            <div class="schema-list" data-specord-schema-list></div>
            <div class="schema-detail" data-specord-schema-detail>
              <h3>No schema selected</h3>
              <pre>Select a schema to inspect it.</pre>
            </div>
          </div>
        </aside>
      </main>
    </div>
    <div class="toast" role="status" aria-live="polite" data-specord-toast></div>

    <script>
      window.__SPECORD_DOCS__ = ${clientConfig};
      const methodOrder = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];
      const panelCatalog = [
        { id: "navigator", label: "Endpoints" },
        { id: "reference", label: "Reference" },
        { id: "try", label: "Try it" },
        { id: "schemas", label: "Schemas" }
      ];
      const defaultLayout = {
        visible: ["navigator", "reference", "try", "schemas"],
        sizes: {
          navigator: { width: 340, height: null },
          reference: { width: 680, height: null },
          try: { width: 360, height: null },
          schemas: { width: 340, height: null }
        }
      };
      const layoutStorageKey = "specord.docs.panelLayout.v2";
      const tabs = [
        { id: "overview", label: "Overview" },
        { id: "code", label: "Code" },
        { id: "schema", label: "Schema" },
        { id: "changelog", label: "Changelog" }
      ];

      const state = {
        document: undefined,
        rows: [],
        selectedOperationId: undefined,
        selectedMethod: "all",
        selectedSchemaName: undefined,
        activeTab: "overview",
        query: "",
        layout: loadLayout(),
        history: [],
        future: [],
        dragPanelId: undefined,
        skipNextSizeCapture: false,
        layoutJson: undefined
      };
      state.layoutJson = JSON.stringify(state.layout);

      const els = {
        title: document.getElementById("api-title"),
        workspace: document.querySelector("[data-specord-workspace]"),
        emptyLayout: document.querySelector("[data-specord-empty-layout]"),
        addPanel: document.querySelector("[data-specord-add-panel]"),
        undoLayout: document.querySelector("[data-specord-undo-layout]"),
        redoLayout: document.querySelector("[data-specord-redo-layout]"),
        resetLayout: document.querySelector("[data-specord-reset-layout]"),
        search: document.querySelector("[data-specord-search]"),
        filters: document.querySelector("[data-specord-method-filters]"),
        list: document.querySelector("[data-specord-operation-list]"),
        detail: document.querySelector("[data-specord-operation-detail]"),
        tryDetail: document.querySelector("[data-specord-try-detail]"),
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
        return Object.entries(openApiDocument.paths || {}).flatMap(([path, pathItem]) =>
          methodOrder
            .filter((method) => pathItem && pathItem[method])
            .map((method) => {
              const operation = pathItem[method];
              const tag = firstTag(operation);
              const summary = operation.summary || operation.operationId || "";
              return {
                id: method + " " + path,
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

      function selectedRow() {
        const visibleRows = filteredRows();
        return visibleRows.find((item) => item.id === state.selectedOperationId);
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
          renderTryPanel();
          return;
        }

        if (!rows.some((row) => row.id === state.selectedOperationId)) {
          state.selectedOperationId = rows[0].id;
          state.activeTab = "overview";
        }

        els.list.innerHTML = renderOperationGroups(rows);
        els.list.querySelectorAll("[data-operation-id]").forEach((button) => {
          button.addEventListener("click", () => {
            state.selectedOperationId = button.getAttribute("data-operation-id") || undefined;
            state.activeTab = "overview";
            renderOperations();
          });
        });

        renderOperationDetail();
        renderTryPanel();
      }

      function renderOperationGroups(rows) {
        const groups = [];
        rows.forEach((row) => {
          let group = groups.find((item) => item.tag === row.tag);
          if (!group) {
            group = { tag: row.tag, rows: [] };
            groups.push(group);
          }
          group.rows.push(row);
        });

        return groups.map((group) =>
          '<section class="tag-group">' +
            '<div class="tag-head"><span>' + escapeHtml(group.tag) + '</span><span>' + String(group.rows.length) + '</span></div>' +
            group.rows.map(renderOperationButton).join("") +
          '</section>'
        ).join("");
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
          '</span>' +
        '</button>';
      }

      function renderOperationDetail() {
        const row = selectedRow();

        if (!row) {
          els.detail.innerHTML =
            '<div class="tabs" data-specord-tabs>' +
              '<button class="tab is-active" type="button" data-specord-tab="overview">Overview</button>' +
              '<button class="tab" type="button" data-specord-tab="code">Code</button>' +
              '<button class="tab" type="button" data-specord-tab="schema">Schema</button>' +
              '<button class="tab" type="button" data-specord-tab="changelog">Changelog</button>' +
            '</div>' +
            '<div class="state">Select an operation.</div>';
          return;
        }

        const operation = row.operation;
        const summary = operation.summary || operation.operationId || "Generated operation";
        const description = operation.description || "";

        els.detail.innerHTML =
          '<div class="detail-head">' +
            '<div class="breadcrumb"><span>' + escapeHtml(documentTitle()) + '</span><span>/</span><span>' + escapeHtml(row.tag) + '</span></div>' +
            '<div class="detail-route">' +
              '<span class="method ' + escapeAttribute(row.method) + '">' + row.method.toUpperCase() + '</span>' +
              '<span class="detail-path">' + escapeHtml(row.path) + '</span>' +
            '</div>' +
            '<p class="detail-summary">' + escapeHtml(summary) + '</p>' +
            (description ? '<p class="detail-description">' + escapeHtml(description) + '</p>' : "") +
            '<div class="url-line">' +
              '<span class="method ' + escapeAttribute(row.method) + '">' + row.method.toUpperCase() + '</span>' +
              '<div class="url-bar">' + escapeHtml(operationUrl(row)) + '</div>' +
            '</div>' +
          '</div>' +
          renderTabs() +
          renderActiveTab(row);

        els.detail.querySelectorAll("[data-specord-tab]").forEach((button) => {
          button.addEventListener("click", () => {
            state.activeTab = button.getAttribute("data-specord-tab") || "overview";
            renderOperationDetail();
          });
        });
      }

      function renderTabs() {
        return '<div class="tabs" data-specord-tabs>' + tabs.map((tab) => {
          const active = tab.id === state.activeTab ? " is-active" : "";
          return '<button class="tab' + active + '" type="button" data-specord-tab="' + escapeAttribute(tab.id) + '">' +
            escapeHtml(tab.label) +
          '</button>';
        }).join("") + '</div>';
      }

      function renderActiveTab(row) {
        if (state.activeTab === "code") {
          return renderCodeSnippets(row);
        }

        if (state.activeTab === "schema") {
          return renderSchemaTab(row);
        }

        if (state.activeTab === "changelog") {
          return renderChangelog(row);
        }

        return renderOverview(row);
      }

      function renderOverview(row) {
        const operation = row.operation;
        const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
        const security = Array.isArray(operation.security) ? operation.security : [];
        const responses = operation.responses || {};
        const requestBody = operation.requestBody;

        return section("Query and Path Parameters", renderParameters(parameters.filter((param) => param.in !== "header"))) +
          section("Headers", renderParameters(parameters.filter((param) => param.in === "header"))) +
          section("Request Body", renderRequestBody(requestBody)) +
          section("Responses", renderResponses(responses)) +
          section("Security", renderSecurity(security));
      }

      function renderCodeSnippets(row) {
        const curl = curlSnippet(row);
        const fetchCode = fetchSnippet(row);
        return '<section class="section" data-specord-code-snippets>' +
          '<h2 class="section-title">Code Snippets</h2>' +
          '<div class="code-grid">' +
            '<div><h3 class="code-title">cURL</h3><pre>' + escapeHtml(curl) + '</pre></div>' +
            '<div><h3 class="code-title">fetch</h3><pre>' + escapeHtml(fetchCode) + '</pre></div>' +
          '</div>' +
        '</section>';
      }

      function renderSchemaTab(row) {
        const operation = row.operation;
        return section("Request Schema", renderSchemaPreview(operation.requestBody)) +
          section("Response Schemas", renderResponseSchemas(operation.responses || {})) +
          section("Raw Operation", '<pre>' + escapeHtml(JSON.stringify(operation, null, 2)) + '</pre>');
      }

      function renderChangelog(row) {
        const entries = changelogEntries(row.operation);
        if (entries.length === 0) {
          return '<section class="section" data-specord-changelog>' +
            '<h2 class="section-title">Changelog</h2>' +
            '<div class="state">No changelog entries are present in this OpenAPI document. This panel is wired for future operation metadata such as x-specord-changelog.</div>' +
          '</section>';
        }

        return '<section class="section" data-specord-changelog>' +
          '<h2 class="section-title">Changelog</h2>' +
          '<div class="table">' + entries.map((entry) =>
            '<div class="row"><code>' + escapeHtml(entry.date || entry.version || "change") + '</code><span>' +
              escapeHtml(entry.summary || entry.description || String(entry)) +
            '</span></div>'
          ).join("") + '</div>' +
        '</section>';
      }

      function section(title, content) {
        return '<section class="section">' +
          '<h2 class="section-title">' + escapeHtml(title) + '</h2>' +
          content +
        '</section>';
      }

      function renderParameters(parameters) {
        if (parameters.length === 0) {
          return '<p class="empty-text">None.</p>';
        }

        return '<div class="table">' + parameters.map((param) => {
          const name = param.name || "parameter";
          const location = param.in || "unknown";
          const required = param.required ? "required" : "optional";
          const schema = param.schema ? describeSchema(param.schema) : "schema not emitted";
          return '<div class="row"><code>' + escapeHtml(String(name)) + '</code><span>' +
            escapeHtml(String(location)) + " / " + escapeHtml(required) + " / " + escapeHtml(schema) +
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

      function renderSchemaPreview(requestBody) {
        if (!requestBody || !requestBody.content) {
          return '<p class="empty-text">No request schema.</p>';
        }

        const entries = Object.entries(requestBody.content);
        return '<div class="table">' + entries.map(([type, media]) => {
          const schema = media && media.schema ? describeSchema(media.schema) : "schema not emitted";
          return '<div class="row"><code>' + escapeHtml(type) + '</code><span>' + escapeHtml(schema) + '</span></div>';
        }).join("") + '</div>';
      }

      function renderResponseSchemas(responses) {
        const rows = [];
        Object.entries(responses).forEach(([status, response]) => {
          const content = response && response.content ? response.content : {};
          Object.entries(content).forEach(([type, media]) => {
            rows.push({ status, type, schema: media && media.schema ? describeSchema(media.schema) : "schema not emitted" });
          });
        });

        if (rows.length === 0) {
          return '<p class="empty-text">No response schemas.</p>';
        }

        return '<div class="table">' + rows.map((row) =>
          '<div class="row"><code>' + escapeHtml(row.status) + '</code><span>' +
            escapeHtml(row.type) + " / " + escapeHtml(row.schema) +
          '</span></div>'
        ).join("") + '</div>';
      }

      function describeSchema(schema) {
        if (!schema || typeof schema !== "object") {
          return "unknown";
        }

        if (schema.$ref) {
          return schema.$ref;
        }

        if (schema.type) {
          const base = Array.isArray(schema.type) ? schema.type.join(" | ") : String(schema.type);
          if (schema.enum) {
            return base + " enum(" + schema.enum.map(String).join(", ") + ")";
          }
          if (schema.properties) {
            return base + " with " + String(Object.keys(schema.properties).length) + " properties";
          }
          return base;
        }

        if (schema.oneOf) return "oneOf(" + String(schema.oneOf.length) + ")";
        if (schema.anyOf) return "anyOf(" + String(schema.anyOf.length) + ")";
        if (schema.allOf) return "allOf(" + String(schema.allOf.length) + ")";
        return "schema object";
      }

      function changelogEntries(operation) {
        const value = operation["x-specord-changelog"] || operation["x-changelog"] || operation["x-changes"];
        return Array.isArray(value) ? value : [];
      }

      function renderTryPanel() {
        const row = selectedRow();
        if (!row) {
          els.tryDetail.innerHTML = '<div class="state">Select an operation to prepare request fields. Execution contract pending.</div>';
          return;
        }

        const operation = row.operation;
        const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
        const queryParams = parameters.filter((param) => param.in === "query");
        const pathParams = parameters.filter((param) => param.in === "path");
        const headerParams = parameters.filter((param) => param.in === "header");
        const security = Array.isArray(operation.security) ? operation.security : [];

        els.tryDetail.innerHTML =
          '<div class="try-body">' +
            '<div class="try-route">' +
              '<span class="method ' + escapeAttribute(row.method) + '">' + row.method.toUpperCase() + '</span>' +
              '<div class="url-bar">' + escapeHtml(operationUrl(row)) + '</div>' +
            '</div>' +
            renderTryFields("Path", pathParams) +
            renderTryFields("Query", queryParams) +
            renderTryFields("Headers", headerParams) +
            renderTryAuth(security) +
            section("Body", operation.requestBody ? '<pre>' + escapeHtml(requestBodySample(operation.requestBody)) + '</pre>' : '<p class="empty-text">No request body.</p>') +
            '<div class="state">Execution contract pending. This scaffold does not send network requests or store credentials yet.</div>' +
          '</div>';
      }

      function renderTryFields(title, parameters) {
        if (parameters.length === 0) {
          return section(title, '<p class="empty-text">None.</p>');
        }

        return section(title, '<div class="try-fields">' + parameters.map((param) =>
          '<div class="try-field"><label>' + escapeHtml(param.name || "parameter") + '</label>' +
          '<input type="text" placeholder="' + escapeAttribute(describeSchema(param.schema || {})) + '" /></div>'
        ).join("") + '</div>');
      }

      function renderTryAuth(security) {
        if (security.length === 0) {
          return section("Auth", '<p class="empty-text">No security requirements.</p>');
        }

        const names = security.flatMap((requirement) => Object.keys(requirement));
        return section("Auth", '<div class="try-field"><label>Authorization</label><input type="text" placeholder="' + escapeAttribute(names.join(", ") || "Bearer token") + '" /></div>');
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

      function documentTitle() {
        return state.document && state.document.info && state.document.info.title
          ? String(state.document.info.title)
          : "Specord API";
      }

      function baseUrl() {
        if (state.document && Array.isArray(state.document.servers) && state.document.servers[0] && state.document.servers[0].url) {
          return String(state.document.servers[0].url).replace(/\\/$/, "");
        }

        if (window.__SPECORD_DOCS__.appUrl) {
          return String(window.__SPECORD_DOCS__.appUrl).replace(/\\/$/, "");
        }

        return window.location.origin;
      }

      function operationUrl(row) {
        return baseUrl() + row.path;
      }

      function requestBodySample(requestBody) {
        if (!requestBody || !requestBody.content) {
          return "";
        }

        const media = requestBody.content["application/json"] || Object.values(requestBody.content)[0];
        const schema = media && media.schema ? media.schema : undefined;
        return JSON.stringify(sampleFromSchema(schema), null, 2);
      }

      function sampleFromSchema(schema) {
        if (!schema || typeof schema !== "object") {
          return {};
        }

        if (schema.example !== undefined) return schema.example;
        if (schema.default !== undefined) return schema.default;
        if (schema.enum && schema.enum.length > 0) return schema.enum[0];
        if (schema.$ref) return {};
        if (schema.type === "array") return [sampleFromSchema(schema.items)];
        if (schema.type === "string") return "string";
        if (schema.type === "number" || schema.type === "integer") return 0;
        if (schema.type === "boolean") return true;
        if (schema.properties) {
          return Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, sampleFromSchema(value)]));
        }

        return {};
      }

      function curlSnippet(row) {
        const lines = ['curl -X ' + row.method.toUpperCase() + ' "' + operationUrl(row) + '"'];
        const security = Array.isArray(row.operation.security) ? row.operation.security : [];
        if (security.length > 0) {
          lines.push('  -H "Authorization: Bearer <token>"');
        }
        if (row.operation.requestBody) {
          lines.push('  -H "Content-Type: application/json"');
          lines.push("  -d '" + requestBodySample(row.operation.requestBody).replace(/'/g, "\\\\'") + "'");
        }
        return lines.join(" \\\\\\n");
      }

      function fetchSnippet(row) {
        const lines = [
          'await fetch("' + operationUrl(row) + '", {',
          '  method: "' + row.method.toUpperCase() + '",'
        ];
        const headers = [];
        const security = Array.isArray(row.operation.security) ? row.operation.security : [];
        if (security.length > 0) headers.push('"Authorization": "Bearer <token>"');
        if (row.operation.requestBody) headers.push('"Content-Type": "application/json"');

        if (headers.length > 0) {
          lines.push("  headers: { " + headers.join(", ") + " },");
        }

        if (row.operation.requestBody) {
          lines.push("  body: JSON.stringify(" + requestBodySample(row.operation.requestBody) + ")");
        }

        lines.push("});");
        return lines.join("\\n");
      }

      function loadLayout() {
        try {
          const raw = window.localStorage ? window.localStorage.getItem(layoutStorageKey) : null;
          if (!raw) return clone(defaultLayout);
          return normalizeLayout(JSON.parse(raw));
        } catch (_error) {
          return clone(defaultLayout);
        }
      }

      function clone(value) {
        return JSON.parse(JSON.stringify(value));
      }

      function normalizeLayout(layout) {
        const ids = panelCatalog.map((panel) => panel.id);
        const visible = Array.isArray(layout.visible)
          ? layout.visible.filter((id) => ids.includes(id))
          : [...defaultLayout.visible];
        const sizes = { ...clone(defaultLayout).sizes, ...(layout.sizes || {}) };
        return { visible, sizes };
      }

      function saveLayout() {
        try {
          if (window.localStorage) {
            window.localStorage.setItem(layoutStorageKey, JSON.stringify(state.layout));
          }
        } catch (_error) {
          // Storage can be blocked in embedded docs contexts; layout still works for the session.
        }
      }

      function renderLayout() {
        const visible = state.layout.visible;
        panelCatalog.forEach((panelInfo) => {
          const panel = document.querySelector('[data-specord-panel="' + panelInfo.id + '"]');
          if (!panel) return;
          const index = visible.indexOf(panelInfo.id);
          panel.hidden = index === -1;
          panel.style.order = String(index === -1 ? 99 : index);
          const size = state.layout.sizes[panelInfo.id] || defaultLayout.sizes[panelInfo.id];
          panel.style.width = String(Math.max(260, Math.round(size.width || 320))) + "px";
          panel.style.height = size.height ? String(Math.max(280, Math.round(size.height))) + "px" : "";
          if (!panel.hidden) createResizeHandles(panel);
        });

        els.workspace.classList.toggle("is-empty", visible.length === 0);
        els.emptyLayout.hidden = visible.length !== 0;
        renderAddPanelOptions();
        updateLayoutButtons();
      }

      function renderAddPanelOptions() {
        const hiddenPanels = panelCatalog.filter((panel) => !state.layout.visible.includes(panel.id));
        els.addPanel.innerHTML = '<option value="">Add panel</option>' + hiddenPanels.map((panel) =>
          '<option value="' + escapeAttribute(panel.id) + '">' + escapeHtml(panel.label) + '</option>'
        ).join("");
        els.addPanel.disabled = hiddenPanels.length === 0;
      }

      function updateLayoutButtons() {
        els.undoLayout.disabled = state.history.length === 0;
        els.redoLayout.disabled = state.future.length === 0;
      }

      function mutateLayout(mutator) {
        const before = clone(state.layout);
        const beforeJson = JSON.stringify(before);
        mutator(state.layout);
        state.layout = normalizeLayout(state.layout);
        const afterJson = JSON.stringify(state.layout);
        if (beforeJson === afterJson) {
          return;
        }

        state.history.push(before);
        state.future = [];
        state.layoutJson = afterJson;
        state.skipNextSizeCapture = true;
        saveLayout();
        renderLayout();
      }

      function captureLayoutSizes() {
        if (state.skipNextSizeCapture) {
          state.skipNextSizeCapture = false;
          return;
        }

        const next = clone(state.layout);
        next.visible.forEach((id) => {
          const panel = document.querySelector('[data-specord-panel="' + id + '"]');
          if (!panel || panel.hidden) return;
          next.sizes[id] = {
            width: Math.round(panel.offsetWidth),
            height: Math.round(panel.offsetHeight)
          };
        });
        const nextJson = JSON.stringify(next);
        if (nextJson === state.layoutJson) {
          return;
        }

        state.history.push(clone(state.layout));
        state.future = [];
        state.layout = next;
        state.layoutJson = nextJson;
        saveLayout();
        updateLayoutButtons();
      }

      function undoLayout() {
        if (state.history.length === 0) return;
        state.future.push(clone(state.layout));
        state.layout = state.history.pop();
        state.layoutJson = JSON.stringify(state.layout);
        state.skipNextSizeCapture = true;
        saveLayout();
        renderLayout();
      }

      function redoLayout() {
        if (state.future.length === 0) return;
        state.history.push(clone(state.layout));
        state.layout = state.future.pop();
        state.layoutJson = JSON.stringify(state.layout);
        state.skipNextSizeCapture = true;
        saveLayout();
        renderLayout();
      }

      function resetLayout() {
        mutateLayout((layout) => {
          layout.visible = [...defaultLayout.visible];
          layout.sizes = clone(defaultLayout).sizes;
        });
      }

      // ================================================================
      // RESIZE — pointer-events based multi-edge panel resize
      // ================================================================
      const RESIZE = {
        active: false,
        panel: null,
        dir: "",
        startX: 0,
        startY: 0,
        currX: 0,
        currY: 0,
        startW: 0,
        startH: 0,
        rafId: null
      };
      const PANEL_MIN_W = 260, PANEL_MIN_H = 280;

      function createResizeHandles(panel) {
        panel.querySelectorAll(".resize-handle").forEach(function(h) { h.remove(); });
        ["n","s","e","w","nw","ne","sw","se"].forEach(function(dir) {
          const h = document.createElement("div");
          h.className = "resize-handle resize-" + dir;
          h.addEventListener("pointerdown", function(e) { startResize(e, panel, dir); });
          panel.appendChild(h);
        });
      }

      function startResize(e, panel, dir) {
        if (!e.isPrimary || RESIZE.active) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = panel.getBoundingClientRect();
        RESIZE.active = true;
        RESIZE.panel = panel;
        RESIZE.dir = dir;
        RESIZE.startX = e.clientX;
        RESIZE.startY = e.clientY;
        RESIZE.currX = e.clientX;
        RESIZE.currY = e.clientY;
        RESIZE.startW = rect.width;
        RESIZE.startH = rect.height;
        RESIZE.rafId = null;
        document.body.setAttribute("data-resizing", dir);
        e.target.setPointerCapture(e.pointerId);
        e.target.addEventListener("pointermove", onResizeMove);
        e.target.addEventListener("pointerup", onResizeEnd);
        e.target.addEventListener("pointercancel", onResizeEnd);
        e.target.addEventListener("lostpointercapture", onResizeEnd);
      }

      function onResizeMove(e) {
        if (!e.isPrimary || !RESIZE.active) return;
        RESIZE.currX = e.clientX;
        RESIZE.currY = e.clientY;
        if (!RESIZE.rafId) RESIZE.rafId = requestAnimationFrame(applyResize);
      }

      function applyResize() {
        RESIZE.rafId = null;
        if (!RESIZE.active) return;
        const dx = RESIZE.currX - RESIZE.startX;
        const dy = RESIZE.currY - RESIZE.startY;
        const dir = RESIZE.dir;
        const panel = RESIZE.panel;
        const maxW = Math.min(window.innerWidth * 0.92, 980);
        const maxH = window.innerHeight - 70;
        if (dir.indexOf("e") !== -1 || dir.indexOf("w") !== -1) {
          const raw = dir.indexOf("e") !== -1 ? RESIZE.startW + dx : RESIZE.startW - dx;
          panel.style.width = Math.round(Math.max(PANEL_MIN_W, Math.min(maxW, raw))) + "px";
        }
        if (dir.indexOf("s") !== -1 || dir.indexOf("n") !== -1) {
          const raw = dir.indexOf("s") !== -1 ? RESIZE.startH + dy : RESIZE.startH - dy;
          panel.style.height = Math.round(Math.max(PANEL_MIN_H, Math.min(maxH, raw))) + "px";
        }
      }

      function onResizeEnd(e) {
        if (!RESIZE.active) return;
        RESIZE.active = false;
        if (RESIZE.rafId) { cancelAnimationFrame(RESIZE.rafId); RESIZE.rafId = null; }
        document.body.removeAttribute("data-resizing");
        e.target.removeEventListener("pointermove", onResizeMove);
        e.target.removeEventListener("pointerup", onResizeEnd);
        e.target.removeEventListener("pointercancel", onResizeEnd);
        e.target.removeEventListener("lostpointercapture", onResizeEnd);
        RESIZE.panel = null;
        captureLayoutSizes();
      }

      // ================================================================
      // DRAG — pointer-events based panel reorder with ghost + indicator
      // ================================================================
      const DRAG = {
        active: false,
        panelId: null,
        ghost: null,
        indicator: null,
        startX: 0,
        startY: 0,
        currX: 0,
        currY: 0,
        originLeft: 0,
        originTop: 0,
        rafId: null,
        targetBefore: null
      };

      function attachDragHandles() {
        document.querySelectorAll("[data-specord-panel-drag]").forEach(function(handle) {
          if (handle._dragAttached) return;
          handle._dragAttached = true;
          handle.style.touchAction = "none";
          handle.addEventListener("pointerdown", function(e) {
            if (!e.isPrimary) return;
            startPanelDrag(e, handle, handle.getAttribute("data-panel-id"));
          });
        });
      }

      function startPanelDrag(e, handle, panelId) {
        if (DRAG.active || RESIZE.active) return;
        e.preventDefault();
        const panel = document.querySelector('[data-specord-panel="' + panelId + '"]');
        if (!panel) return;
        const rect = panel.getBoundingClientRect();

        // Create floating ghost clone
        const ghost = panel.cloneNode(true);
        ghost.classList.add("panel-ghost");
        ghost.style.width = rect.width + "px";
        ghost.style.height = rect.height + "px";
        ghost.style.transform =
          "translate3d(" + rect.left + "px," + rect.top + "px,0) rotate(1.5deg) scale(1.03)";
        document.body.appendChild(ghost);

        // Create the drop-position indicator line
        const indicator = document.createElement("div");
        indicator.className = "drop-indicator";

        // Dim the real panel as a ghost placeholder
        panel.classList.add("is-drag-source");

        DRAG.active = true;
        DRAG.panelId = panelId;
        DRAG.ghost = ghost;
        DRAG.indicator = indicator;
        DRAG.startX = e.clientX;
        DRAG.startY = e.clientY;
        DRAG.currX = e.clientX;
        DRAG.currY = e.clientY;
        DRAG.originLeft = rect.left;
        DRAG.originTop = rect.top;
        DRAG.rafId = null;
        DRAG.targetBefore = null;

        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";

        handle.setPointerCapture(e.pointerId);
        handle.addEventListener("pointermove", onDragMove, { passive: true });
        handle.addEventListener("pointerup", onDragEnd);
        handle.addEventListener("pointercancel", onDragEnd);
        handle.addEventListener("lostpointercapture", onDragEnd);
      }

      function onDragMove(e) {
        if (!e.isPrimary || !DRAG.active) return;
        DRAG.currX = e.clientX;
        DRAG.currY = e.clientY;
        if (!DRAG.rafId) DRAG.rafId = requestAnimationFrame(paintDrag);
      }

      function paintDrag() {
        DRAG.rafId = null;
        if (!DRAG.active) return;
        const dx = DRAG.currX - DRAG.startX;
        const dy = DRAG.currY - DRAG.startY;
        DRAG.ghost.style.transform =
          "translate3d(" + (DRAG.originLeft + dx) + "px," + (DRAG.originTop + dy) + "px,0) rotate(1.5deg) scale(1.03)";
        updateDropIndicator(DRAG.currX);
      }

      function updateDropIndicator(clientX) {
        const workspace = els.workspace;
        const panels = Array.from(
          workspace.querySelectorAll("[data-specord-panel]:not([hidden]):not(.is-drag-source)")
        );
        if (DRAG.indicator.parentNode) DRAG.indicator.remove();
        if (panels.length === 0) return;
        let insertBefore = null;
        for (let i = 0; i < panels.length; i++) {
          const r = panels[i].getBoundingClientRect();
          if (clientX < r.left + r.width / 2) { insertBefore = panels[i]; break; }
        }
        DRAG.targetBefore = insertBefore
          ? insertBefore.getAttribute("data-specord-panel")
          : null;
        if (insertBefore) {
          workspace.insertBefore(DRAG.indicator, insertBefore);
        } else {
          workspace.appendChild(DRAG.indicator);
        }
        DRAG.indicator.classList.add("is-visible");
      }

      function onDragEnd(e) {
        if (!DRAG.active) return;
        DRAG.active = false;
        if (DRAG.rafId) { cancelAnimationFrame(DRAG.rafId); DRAG.rafId = null; }
        if (DRAG.ghost)     { DRAG.ghost.remove();     DRAG.ghost = null; }
        if (DRAG.indicator) { DRAG.indicator.remove(); DRAG.indicator = null; }
        const srcPanel = document.querySelector('[data-specord-panel="' + DRAG.panelId + '"]');
        if (srcPanel) srcPanel.classList.remove("is-drag-source");
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        e.target.removeEventListener("pointermove", onDragMove);
        e.target.removeEventListener("pointerup", onDragEnd);
        e.target.removeEventListener("pointercancel", onDragEnd);
        e.target.removeEventListener("lostpointercapture", onDragEnd);
        const sourceId = DRAG.panelId;
        const targetBeforeId = DRAG.targetBefore;
        DRAG.panelId = null;
        DRAG.targetBefore = null;
        if (sourceId) {
          mutateLayout(function(layout) {
            const next = layout.visible.filter(function(id) { return id !== sourceId; });
            if (targetBeforeId) {
              const idx = next.indexOf(targetBeforeId);
              next.splice(idx < 0 ? next.length : idx, 0, sourceId);
            } else {
              next.push(sourceId);
            }
            layout.visible = next;
          });
        }
      }

      function attachLayoutEvents() {
        els.addPanel.addEventListener("change", () => {
          const id = els.addPanel.value;
          if (!id) return;
          mutateLayout((layout) => {
            layout.visible.push(id);
          });
          els.addPanel.value = "";
        });

        els.undoLayout.addEventListener("click", undoLayout);
        els.redoLayout.addEventListener("click", redoLayout);
        els.resetLayout.addEventListener("click", resetLayout);

        document.querySelectorAll("[data-specord-remove-panel]").forEach((button) => {
          button.addEventListener("click", () => {
            const id = button.getAttribute("data-specord-remove-panel");
            mutateLayout((layout) => {
              layout.visible = layout.visible.filter((panelId) => panelId !== id);
            });
          });
        });

        attachDragHandles();
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
        return escapeHtml(value).replaceAll(String.fromCharCode(96), "&#096;");
      }

      attachLayoutEvents();
      renderLayout();

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
