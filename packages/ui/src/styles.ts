export const STYLES = `
:root {
  color-scheme: dark;
  --bg: #0a0b0d;
  --surface: #111316;
  --surface-2: #15181c;
  --surface-3: #1c2026;
  --line: #23272d;
  --line-2: #2e333b;
  --line-3: #3a4049;
  --text: #e7e9ec;
  --text-2: #a8adb5;
  --text-3: #6b7079;
  --accent: #7ea3ff;
  --accent-2: #1a2238;
  --get: #5fb3ff;
  --get-bg: #112033;
  --post: #5fd69a;
  --post-bg: #102b1f;
  --put: #e4b75c;
  --put-bg: #2a2412;
  --patch: #e4b75c;
  --patch-bg: #2a2412;
  --delete: #ff7171;
  --delete-bg: #2e1719;
  --shadow: 0 8px 24px rgba(0,0,0,0.45);
  --mono: ui-monospace, "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  --t-fast: 100ms cubic-bezier(0.2, 0, 0, 1);
  --t-base: 160ms cubic-bezier(0.2, 0, 0, 1);
}

* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

button, input, select, textarea {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  margin: 0;
  padding: 0;
}
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.5; }
:focus-visible { outline: 1px solid var(--accent); outline-offset: 1px; }

.app {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100vh;
}

/* ---------- top bar ---------- */
.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 10px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}
.bar-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}
.bar-source {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.bar-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}
.bar-divider {
  width: 1px;
  height: 18px;
  background: var(--line);
  margin: 0 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-2);
  border: 1px solid transparent;
  transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
  white-space: nowrap;
}
.btn:hover { background: var(--surface-2); color: var(--text); }
.btn:active { background: var(--surface-3); }
.btn.is-primary { background: var(--accent-2); color: var(--accent); border-color: rgba(126, 163, 255, 0.2); }
.btn.is-primary:hover { background: rgba(126, 163, 255, 0.16); }
.btn.is-icon { width: 26px; padding: 0; justify-content: center; }
.btn-kbd {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--surface-3);
}

.menu {
  position: relative;
}
.menu-pop {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 100;
  min-width: 220px;
  padding: 4px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 6px;
  box-shadow: var(--shadow);
  display: none;
}
.menu.is-open .menu-pop { display: block; }
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text);
  text-align: left;
}
.menu-item:hover { background: var(--surface-3); }
.menu-item[disabled] { color: var(--text-3); }
.menu-item-key {
  margin-left: auto;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
}

/* ---------- workspace ---------- */
.workspace {
  display: flex;
  position: relative;
  min-height: 0;
  height: 100%;
  background: var(--bg);
  overflow: hidden;
}

.col {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.col-resize {
  flex: 0 0 4px;
  cursor: col-resize;
  background: transparent;
  position: relative;
  z-index: 5;
  transition: background var(--t-fast);
}
.col-resize::before {
  content: "";
  position: absolute;
  inset: 0 1px;
  background: var(--line);
  transition: background var(--t-fast);
}
.col-resize:hover::before,
.col-resize.is-active::before { background: var(--accent); }

/* ---------- panel ---------- */
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 0;
  margin: 0;
  overflow: hidden;
  position: relative;
}
.panel + .panel { border-top: 0; }
.panel.is-dragging { opacity: 0.4; }
.panel.is-drop-target { box-shadow: inset 0 0 0 1px var(--accent); }

.panel-head {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 6px 0 4px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--line);
  flex: 0 0 auto;
  user-select: none;
}
.panel-grab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 22px;
  cursor: grab;
  color: var(--text-3);
  border-radius: 3px;
}
.panel-grab:hover { color: var(--text); background: var(--surface-3); }
.panel-grab:active { cursor: grabbing; }
.panel-grab svg { width: 10px; height: 10px; }

.panel-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  text-transform: uppercase;
}
.panel-actions {
  display: flex;
  gap: 2px;
  flex: 0 0 auto;
}
.panel-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--text-3);
  border-radius: 3px;
}
.panel-action:hover { color: var(--text); background: var(--surface-3); }
.panel-action svg { width: 12px; height: 12px; }

.panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  position: relative;
}
.panel-body.is-flush { padding: 0; }
.panel-body.is-padded { padding: 12px; }

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-3);
  font-size: 12px;
  padding: 20px;
  text-align: center;
}

.row-resize {
  height: 4px;
  flex: 0 0 4px;
  cursor: row-resize;
  background: var(--line);
  transition: background var(--t-fast);
  position: relative;
  z-index: 4;
}
.row-resize:hover,
.row-resize.is-active { background: var(--accent); }

/* ---------- drop indicators ---------- */
.drop-indicator {
  position: absolute;
  background: var(--accent);
  z-index: 999;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--t-fast);
  box-shadow: 0 0 8px rgba(126, 163, 255, 0.6);
}
.drop-indicator.is-visible { opacity: 1; }
.drop-indicator.horizontal { height: 2px; }
.drop-indicator.vertical { width: 2px; }

.drag-ghost {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  background: var(--surface-2);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  box-shadow: var(--shadow);
  opacity: 0.95;
}

/* ---------- search & list ---------- */
.search {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
.search input {
  flex: 1;
  height: 24px;
  padding: 0 8px;
  background: var(--surface-3);
  border: 1px solid transparent;
  border-radius: 3px;
  font-size: 12px;
  color: var(--text);
  font-family: var(--mono);
  min-width: 0;
}
.search input:focus { border-color: var(--line-3); background: var(--bg); }
.search input::placeholder { color: var(--text-3); }

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 6px 8px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
.chip {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 3px;
  background: var(--surface-3);
  color: var(--text-3);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  transition: all var(--t-fast);
}
.chip:hover { color: var(--text); }
.chip.is-active.get      { background: var(--get-bg);    color: var(--get);    border-color: rgba(95,179,255,0.25); }
.chip.is-active.post     { background: var(--post-bg);   color: var(--post);   border-color: rgba(95,214,154,0.25); }
.chip.is-active.put      { background: var(--put-bg);    color: var(--put);    border-color: rgba(228,183,92,0.25); }
.chip.is-active.patch    { background: var(--patch-bg);  color: var(--patch);  border-color: rgba(228,183,92,0.25); }
.chip.is-active.delete   { background: var(--delete-bg); color: var(--delete); border-color: rgba(255,113,113,0.25); }
.chip.is-active.other    { background: var(--surface-3); color: var(--text);   border-color: var(--line-3); }

.op-list { padding: 0; }
.op-group {
  display: block;
}
.op-group-head {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 6px 10px 4px;
  background: var(--surface);
  color: var(--text-3);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--line);
}
.op-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 10px;
  border: 0;
  background: transparent;
  text-align: left;
  border-left: 2px solid transparent;
  transition: background var(--t-fast);
}
.op-row:hover { background: var(--surface-2); }
.op-row.is-selected { background: var(--surface-3); border-left-color: var(--accent); }
.op-row-path {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.op-row-summary {
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.method {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 2px;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.03em;
  background: var(--surface-3);
  color: var(--text-2);
}
.method.get    { background: var(--get-bg);    color: var(--get); }
.method.post   { background: var(--post-bg);   color: var(--post); }
.method.put    { background: var(--put-bg);    color: var(--put); }
.method.patch  { background: var(--patch-bg);  color: var(--patch); }
.method.delete { background: var(--delete-bg); color: var(--delete); }

/* ---------- detail ---------- */
.detail-head {
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 1;
}
.detail-route {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.detail-path {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  font-weight: 600;
  word-break: break-all;
}
.detail-summary {
  margin: 6px 0 0;
  color: var(--text);
  font-size: 12px;
  line-height: 1.55;
}
.detail-description {
  margin: 4px 0 0;
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.55;
}

.section {
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
}
.section:last-child { border-bottom: 0; }
.section-title {
  margin: 0 0 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
}
.kvs { display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 3px; overflow: hidden; }
.kv {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 12px;
  padding: 6px 10px;
  background: var(--surface);
  font-size: 12px;
}
.kv-k { font-family: var(--mono); color: var(--text-2); }
.kv-v { color: var(--text); word-break: break-word; }
.kv-v code {
  font-family: var(--mono);
  font-size: 11px;
  background: var(--surface-3);
  padding: 1px 4px;
  border-radius: 2px;
}
.muted { color: var(--text-3); }

pre.code {
  margin: 0;
  padding: 10px 12px;
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.55;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 3px;
  overflow: auto;
  white-space: pre;
  max-height: 360px;
}

.tabs {
  display: flex;
  gap: 0;
  padding: 0 10px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}
.tab {
  height: 28px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  border-bottom: 1px solid transparent;
  margin-bottom: -1px;
  letter-spacing: 0.02em;
}
.tab:hover { color: var(--text-2); }
.tab.is-active { color: var(--accent); border-bottom-color: var(--accent); }

/* ---------- try-it ---------- */
.try-form { padding: 12px 14px; display: grid; gap: 10px; }
.try-row { display: grid; gap: 4px; }
.try-row label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-2);
}
.try-row input, .try-row textarea, .try-row select {
  height: 28px;
  padding: 0 8px;
  background: var(--surface-3);
  border: 1px solid var(--line);
  border-radius: 3px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text);
}
.try-row textarea { height: 100px; padding: 8px; resize: vertical; }
.try-row input:focus, .try-row textarea:focus, .try-row select:focus { border-color: var(--line-3); }
.try-pending {
  margin: 6px 0 0;
  padding: 8px 10px;
  background: var(--surface-3);
  border-left: 2px solid var(--put);
  border-radius: 2px;
  font-size: 11px;
  color: var(--text-2);
}

/* ---------- empty/loading/error ---------- */
.state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: var(--text-2);
  z-index: 10;
  background: var(--bg);
}
.state[hidden] { display: none; }
.state-error { color: var(--delete); }
.spinner {
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--line-3);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ---------- status bar ---------- */
.status {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 22px;
  padding: 0 10px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  background: var(--surface);
  border-top: 1px solid var(--line);
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-3);
}
.status-dot.is-ok { background: var(--post); }
.status-dot.is-error { background: var(--delete); }
.status-spacer { flex: 1; }

/* ---------- toast ---------- */
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  z-index: 200;
  padding: 8px 14px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 4px;
  box-shadow: var(--shadow);
  font-size: 12px;
  color: var(--text);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--t-base), transform var(--t-base);
}
.toast.is-visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

[hidden] { display: none !important; }
`;
