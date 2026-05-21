export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  color-scheme: dark;
  --bg: #090a0f;
  --sidebar-bg: #0d0e13;
  --surface: #11131c;
  --surface-hover: #171b26;
  --surface-card: #151824;
  --border: #1e2230;
  --border-light: rgba(255, 255, 255, 0.05);
  --border-focus: #4f46e5;
  --text: #f3f4f6;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  
  --accent: #6366f1;
  --accent-glow: rgba(99, 102, 241, 0.15);
  
  --get-from: #3b82f6;
  --get-to: #6366f1;
  --get-bg: rgba(59, 130, 246, 0.1);
  --get-border: rgba(59, 130, 246, 0.25);
  
  --post-from: #10b981;
  --post-to: #14b8a6;
  --post-bg: rgba(16, 185, 129, 0.1);
  --post-border: rgba(16, 185, 129, 0.25);
  
  --put-from: #f59e0b;
  --put-to: #f97316;
  --put-bg: rgba(245, 158, 11, 0.1);
  --put-border: rgba(245, 158, 11, 0.25);
  
  --delete-from: #ef4444;
  --delete-to: #f43f5e;
  --delete-bg: rgba(239, 68, 68, 0.1);
  --delete-border: rgba(239, 68, 68, 0.25);
  
  --shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.7);
  
  --sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  background-color: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Page Layout */
.app-container {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 420px;
  height: 100vh;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .app-container {
    grid-template-columns: 250px minmax(0, 1fr) 360px;
  }
}

@media (max-width: 992px) {
  .app-container {
    grid-template-columns: 240px minmax(0, 1fr);
    grid-template-rows: 1fr;
  }
  .right-column {
    display: none;
  }
  .right-column.is-visible {
    display: flex;
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    z-index: 1000;
    width: 420px;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.8);
    background: var(--surface);
  }
}

@media (max-width: 768px) {
  .app-container {
    grid-template-columns: 1fr;
  }
  .left-column {
    display: none;
  }
  .left-column.is-mobile-open {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 280px;
    z-index: 1001;
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.8);
  }
}

/* --- Left Sidebar Column --- */
.left-column {
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.brand-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  background: linear-gradient(135deg, var(--accent), #a78bfa);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 0 10px var(--accent-glow);
}

.brand-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  background: linear-gradient(to right, var(--text), #d1d5db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-section {
  padding: 12px 16px;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  height: 34px;
  padding: 0 12px 0 34px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--border-focus);
  outline: none;
  background: var(--bg);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.nav-section {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px 20px;
}

.nav-group {
  margin-bottom: 16px;
}

.nav-group-title {
  padding: 6px 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.nav-item.is-active {
  background: rgba(99, 102, 241, 0.08);
  color: var(--text);
  border-left: 2px solid var(--accent);
}

.sidebar-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}

.meta-stats {
  display: flex;
  gap: 12px;
}

.stat-tag {
  background: var(--surface);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

/* --- Center Content Column --- */
.center-column {
  background: var(--bg);
  overflow-y: auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.center-header {
  position: sticky;
  top: 0;
  background: rgba(9, 10, 15, 0.8);
  backdrop-filter: blur(8px);
  z-index: 10;
  padding: 16px 40px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.api-meta-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.api-meta-badge {
  background: var(--accent-glow);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-premium {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12.5px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-premium:hover {
  background: var(--surface-hover);
  border-color: var(--text-muted);
}

.btn-premium.is-primary {
  background: linear-gradient(135deg, var(--accent), #4f46e5);
  border: none;
  font-weight: 500;
}

.btn-premium.is-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.docs-workspace {
  padding: 40px;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
}

.overview-card {
  margin-bottom: 40px;
  background: linear-gradient(145deg, var(--surface), var(--sidebar-bg));
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px;
  box-shadow: var(--shadow);
}

.overview-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.overview-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Endpoint Operation Card */
.operation-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 30px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: border-color 0.2s ease;
}

.operation-card:hover {
  border-color: var(--text-muted);
}

.operation-header {
  padding: 16px 20px;
  background: var(--surface-card);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.operation-route {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.operation-path {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.operation-summary {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.operation-details {
  padding: 24px 20px;
}

.operation-desc {
  color: var(--text-secondary);
  font-size: 13.5px;
  margin-bottom: 20px;
}

/* Method Badge */
.method-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
  border: 1px solid transparent;
}

.method-badge.get {
  background: var(--get-bg);
  border-color: var(--get-border);
  color: var(--get-from);
  background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15));
}

.method-badge.post {
  background: var(--post-bg);
  border-color: var(--post-border);
  color: var(--post-from);
  background-image: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(20, 184, 166, 0.15));
}

.method-badge.put, .method-badge.patch {
  background: var(--put-bg);
  border-color: var(--put-border);
  color: var(--put-from);
  background-image: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(249, 115, 22, 0.15));
}

.method-badge.delete {
  background: var(--delete-bg);
  border-color: var(--delete-border);
  color: var(--delete-from);
  background-image: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(244, 63, 94, 0.15));
}

/* Schema / Parameters Table */
.params-section {
  margin-top: 24px;
}

.section-subtitle {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-card);
}

.params-table th {
  background: var(--sidebar-bg);
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
}

.params-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  vertical-align: top;
}

.params-table tr:last-child td {
  border-bottom: none;
}

.param-name {
  font-family: var(--mono);
  font-weight: 600;
  color: var(--text);
}

.param-type {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--accent);
  margin-top: 2px;
}

.param-req {
  color: #ef4444;
  font-size: 11px;
  margin-left: 4px;
}

.param-desc {
  color: var(--text-secondary);
}

/* Tree / JSON structures */
.schema-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
  font-family: var(--mono);
  font-size: 12px;
  overflow-x: auto;
  max-height: 280px;
}

/* Responses Block */
.response-pill-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.response-pill {
  background: var(--surface-card);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.response-pill:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.response-pill.is-active {
  background: var(--accent-glow);
  color: var(--text);
  border-color: var(--accent);
}

/* --- Right Toolkit Column --- */
.right-column {
  background: var(--sidebar-bg);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.toolkit-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolkit-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.toolkit-tabs {
  display: flex;
  padding: 4px 6px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.toolkit-tab {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.toolkit-tab:hover {
  color: var(--text);
}

.toolkit-tab.is-active {
  background: var(--surface-card);
  color: var(--text);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toolkit-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* Snippets panel */
.snippet-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.snippet-select-group {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  background: var(--surface);
  padding: 3px;
  border-radius: 6px;
}

.snippet-lang-tab {
  flex: 1;
  text-align: center;
  font-size: 11.5px;
  padding: 4px 0;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.snippet-lang-tab:hover {
  color: var(--text);
}

.snippet-lang-tab.is-active {
  background: var(--surface-card);
  color: var(--text);
}

.snippet-pre {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px;
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--text);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  position: relative;
  line-height: 1.5;
}

/* Try It panel */
.try-field-group {
  margin-bottom: 16px;
}

.try-field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-family: var(--mono);
}

.try-input {
  width: 100%;
  height: 34px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0 12px;
  color: var(--text);
  font-size: 12px;
  font-family: var(--mono);
  transition: all 0.2s ease;
}

.try-input:focus {
  border-color: var(--border-focus);
  outline: none;
  background: var(--bg);
}

.try-textarea {
  width: 100%;
  height: 120px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--text);
  font-size: 12px;
  font-family: var(--mono);
  resize: vertical;
  transition: all 0.2s ease;
}

.try-textarea:focus {
  border-color: var(--border-focus);
  outline: none;
  background: var(--bg);
}

.try-response {
  margin-top: 24px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
}

.try-response-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.try-status-code {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.try-status-code.success {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.try-status-code.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.try-latency {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--mono);
}

/* Toast Notification */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  background: var(--surface-card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  padding: 12px 18px;
  border-radius: 8px;
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

.toast.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.toast.success {
  border-left: 4px solid var(--post-from);
}

.toast.error {
  border-left: 4px solid var(--delete-from);
}

/* Utility UI Classes */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: var(--text-secondary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.hidden {
  display: none !important;
}

/* Schema highlighting */
.json-key { color: #f43f5e; }
.json-value-string { color: #34d399; }
.json-value-number { color: #f59e0b; }
.json-value-boolean { color: #60a5fa; }
.json-value-null { color: #9ca3af; }
`;
