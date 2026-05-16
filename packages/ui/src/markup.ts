export interface MarkupParts {
  title: string;
  source: string;
}

export function renderShell(parts: MarkupParts): string {
  const { title, source } = parts;
  return `<div class="app" data-specord-app>
  <header class="bar" data-specord-bar>
    <div class="bar-title" data-specord-title>${title}</div>
    <div class="bar-source" data-specord-source>${source}</div>
    <div class="bar-actions">
      <div class="menu" data-specord-add-menu>
        <button class="btn" data-specord-add-toggle aria-haspopup="true" aria-expanded="false">
          <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>
          Add panel
        </button>
        <div class="menu-pop" data-specord-add-list role="menu"></div>
      </div>
      <span class="bar-divider"></span>
      <button class="btn" data-specord-copy-json title="Copy raw OpenAPI document">
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="4" width="9" height="9" rx="1.5"/><path d="M10 4V2.5A0.5.5 0 0 0 9.5 2H3a1 1 0 0 0-1 1v6.5a0.5.5 0 0 0 0.5 0.5H4"/></svg>
        Copy JSON
      </button>
      <button class="btn" data-specord-reset title="Reset layout to defaults">
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7M3 3v3h3"/></svg>
        Reset
      </button>
    </div>
  </header>

  <main class="workspace" data-specord-workspace tabindex="-1"></main>

  <footer class="status" data-specord-status>
    <span class="status-dot" data-specord-status-dot></span>
    <span data-specord-status-text>Idle</span>
    <span class="status-spacer"></span>
    <span data-specord-status-count></span>
  </footer>

  <div class="toast" data-specord-toast role="status" aria-live="polite"></div>
</div>`;
}
