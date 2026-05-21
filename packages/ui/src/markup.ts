export interface MarkupParts {
  title: string;
  source: string;
}

export function renderShell(parts: MarkupParts): string {
  const { title, source } = parts;
  return `
<div class="app-container" data-specord-app>
  <!-- Left Column: Sidebar Navigation -->
  <aside class="left-column" data-specord-sidebar>
    <div class="brand-section">
      <div class="brand-icon">S</div>
      <div class="brand-title">${title}</div>
    </div>
    
    <div class="search-section">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <circle cx="7" cy="7" r="4"/>
          <path d="m10 10 4 4"/>
        </svg>
        <input type="text" class="search-input" placeholder="Search operations..." data-specord-search-input aria-label="Search API operations" />
      </div>
    </div>
    
    <nav class="nav-section" data-specord-navigation role="navigation">
      <div class="loading-indicator">
        <div class="spinner"></div>
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <span>Specord V1</span>
      <div class="meta-stats">
        <span class="stat-tag" data-specord-ops-count>0 ops</span>
      </div>
    </div>
  </aside>

  <!-- Center Column: Core API Reference Documentation -->
  <main class="center-column" tabindex="-1">
    <header class="center-header">
      <div class="api-meta-info">
        <span class="api-meta-badge">OpenAPI 3.1.0</span>
        <span class="api-meta-source" style="font-family: var(--mono); font-size: 11.5px; color: var(--text-muted);" data-specord-source-url>${source}</span>
      </div>
      <div class="header-actions">
        <button class="btn-premium" data-specord-copy-json title="Copy entire OpenAPI raw document">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" style="margin-right: 4px; vertical-align: middle;">
            <rect x="4" y="4" width="9" height="9" rx="1.5"/>
            <path d="M10 4V2.5A0.5.5 0 0 0 9.5 2H3a1 1 0 0 0-1 1v6.5a0.5.5 0 0 0 0.5 0.5H4"/>
          </svg>
          Copy JSON
        </button>
      </div>
    </header>
    
    <div class="docs-workspace" data-specord-workspace>
      <div class="loading-indicator">
        <div class="spinner"></div>
        <div>Parsing OpenAPI document...</div>
      </div>
    </div>
  </main>

  <!-- Right Column: Developer Interactive Toolkit -->
  <section class="right-column" data-specord-toolkit>
    <div class="toolkit-header">
      <span class="toolkit-title">Developer Toolkit</span>
    </div>
    
    <div class="toolkit-tabs" role="tablist">
      <div class="toolkit-tab is-active" data-toolkit-tab="try" role="tab" aria-selected="true" tabindex="0">Try It</div>
      <div class="toolkit-tab" data-toolkit-tab="snippets" role="tab" aria-selected="false" tabindex="-1">Snippets</div>
      <div class="toolkit-tab" data-toolkit-tab="spec" role="tab" aria-selected="false" tabindex="-1">Raw Spec</div>
    </div>
    
    <div class="toolkit-content" data-specord-toolkit-content>
      <div class="empty-state">Select an operation to interact with the developer tools.</div>
    </div>
  </section>

  <!-- Toast alerts notifications container -->
  <div class="toast-container" data-specord-toast-container></div>
</div>
`;
}
