export const CLIENT_SCRIPT = String.raw`
(function () {
  "use strict";

  // ============================================================================
  // configuration injected from server
  // ============================================================================
  var config = window.__SPECORD__ || { openApiUrl: "/openapi.json" };
  var STORAGE_KEY = "specord:layout:v1";

  // ============================================================================
  // panel type registry
  // ============================================================================
  var PANELS = {
    operations:     { title: "Operations",      render: renderOperations,    flush: true  },
    "op-detail":    { title: "Operation",       render: renderOpDetail,      flush: true  },
    schemas:        { title: "Schemas",         render: renderSchemas,       flush: true  },
    "schema-detail":{ title: "Schema",          render: renderSchemaDetail,  flush: true  },
    "try":          { title: "Try it",          render: renderTry,           flush: true  },
    code:           { title: "Code snippets",   render: renderCode,          flush: true  },
    raw:            { title: "Raw OpenAPI",     render: renderRaw,           flush: true  }
  };

  var DEFAULT_LAYOUT = {
    columns: [
      { id: cid(), width: 300, panels: [{ id: pid(), type: "operations", weight: 1 }] },
      { id: cid(), width: 0,   panels: [{ id: pid(), type: "op-detail", weight: 1 }] },
      { id: cid(), width: 380, panels: [
        { id: pid(), type: "code", weight: 1 },
        { id: pid(), type: "try",  weight: 1 }
      ] }
    ]
  };

  function cid() { return "c" + Math.random().toString(36).slice(2, 9); }
  function pid() { return "p" + Math.random().toString(36).slice(2, 9); }

  // ============================================================================
  // state
  // ============================================================================
  var state = {
    layout: loadLayout(),
    doc: null,
    error: null,
    loading: true,
    selectedOp: null,    // "METHOD path"
    selectedSchema: null,
    search: "",
    methods: { GET: true, POST: true, PUT: true, PATCH: true, DELETE: true, OTHER: true },
    tab: "overview",
    flatOps: [],
    schemas: []
  };

  // ============================================================================
  // bootstrap
  // ============================================================================
  var dom = {
    app: q("[data-specord-app]"),
    title: q("[data-specord-title]"),
    workspace: q("[data-specord-workspace]"),
    addMenu: q("[data-specord-add-menu]"),
    addToggle: q("[data-specord-add-toggle]"),
    addList: q("[data-specord-add-list]"),
    copyBtn: q("[data-specord-copy-json]"),
    resetBtn: q("[data-specord-reset]"),
    statusDot: q("[data-specord-status-dot]"),
    statusText: q("[data-specord-status-text]"),
    statusCount: q("[data-specord-status-count]"),
    dropH: q("[data-specord-drop-h]"),
    dropV: q("[data-specord-drop-v]"),
    ghost: q("[data-specord-ghost]"),
    toast: q("[data-specord-toast]")
  };

  function q(sel) { return document.querySelector(sel); }

  attachToolbar();
  attachKeyboard();
  renderWorkspace();
  setStatus("loading", "Loading " + config.openApiUrl);
  fetchDoc(config.openApiUrl).then(onDocLoaded).catch(onDocError);

  // ============================================================================
  // doc loading
  // ============================================================================
  function fetchDoc(url) {
    return fetch(url, { credentials: "same-origin", headers: { accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status + " " + r.statusText);
        return r.json();
      });
  }

  function onDocLoaded(doc) {
    state.doc = doc;
    state.loading = false;
    state.error = null;
    state.flatOps = flattenOperations(doc);
    state.schemas = listSchemas(doc);
    if (state.flatOps.length && !state.selectedOp) {
      state.selectedOp = state.flatOps[0].key;
    }
    if (state.schemas.length && !state.selectedSchema) {
      state.selectedSchema = state.schemas[0].name;
    }
    if (doc && doc.info && doc.info.title) {
      dom.title.textContent = String(doc.info.title);
    }
    setStatus("ok", "Loaded " + state.flatOps.length + " operations");
    dom.statusCount.textContent = state.schemas.length + " schemas";
    renderAllPanels();
  }

  function onDocError(err) {
    state.loading = false;
    state.error = err && err.message ? err.message : String(err);
    setStatus("error", state.error);
    renderAllPanels();
  }

  function setStatus(kind, text) {
    dom.statusDot.className = "status-dot " + (kind === "ok" ? "is-ok" : kind === "error" ? "is-error" : "");
    dom.statusText.textContent = text;
  }

  // ============================================================================
  // layout persistence
  // ============================================================================
  function loadLayout() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_LAYOUT);
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.columns || !Array.isArray(parsed.columns)) return clone(DEFAULT_LAYOUT);
      // sanitize
      parsed.columns = parsed.columns.filter(function (c) { return c && Array.isArray(c.panels); });
      parsed.columns.forEach(function (c) {
        if (!c.id) c.id = cid();
        if (typeof c.width !== "number") c.width = 0;
        c.panels = c.panels.filter(function (p) { return p && PANELS[p.type]; });
        c.panels.forEach(function (p) {
          if (!p.id) p.id = pid();
          if (typeof p.weight !== "number") p.weight = 1;
        });
      });
      parsed.columns = parsed.columns.filter(function (c) { return c.panels.length > 0; });
      if (parsed.columns.length === 0) return clone(DEFAULT_LAYOUT);
      return parsed;
    } catch (e) {
      return clone(DEFAULT_LAYOUT);
    }
  }

  function saveLayout() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.layout)); } catch (e) {}
  }

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  // ============================================================================
  // toolbar wiring
  // ============================================================================
  function attachToolbar() {
    dom.addToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = dom.addMenu.classList.toggle("is-open");
      dom.addToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) renderAddMenu();
    });
    document.addEventListener("click", function (e) {
      if (!dom.addMenu.contains(e.target)) {
        dom.addMenu.classList.remove("is-open");
        dom.addToggle.setAttribute("aria-expanded", "false");
      }
    });
    dom.copyBtn.addEventListener("click", copyDocument);
    dom.resetBtn.addEventListener("click", function () {
      state.layout = clone(DEFAULT_LAYOUT);
      saveLayout();
      renderWorkspace();
      renderAllPanels();
      toast("Layout reset.");
    });
  }

  function renderAddMenu() {
    var present = {};
    state.layout.columns.forEach(function (c) {
      c.panels.forEach(function (p) { present[p.type] = true; });
    });
    var frag = "";
    Object.keys(PANELS).forEach(function (type) {
      var disabled = present[type] ? " disabled" : "";
      var label = PANELS[type].title;
      var status = present[type] ? "<span class=\"menu-item-key\">open</span>" : "";
      frag += '<button class="menu-item" data-add-type="' + type + '"' + disabled + '>' + escapeHtml(label) + status + '</button>';
    });
    dom.addList.innerHTML = frag;
    dom.addList.querySelectorAll("[data-add-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var type = btn.getAttribute("data-add-type");
        if (btn.hasAttribute("disabled")) return;
        addPanel(type);
        dom.addMenu.classList.remove("is-open");
      });
    });
  }

  function addPanel(type) {
    var col = state.layout.columns[state.layout.columns.length - 1];
    if (!col) {
      state.layout.columns.push({ id: cid(), width: 0, panels: [] });
      col = state.layout.columns[0];
    }
    col.panels.push({ id: pid(), type: type, weight: 1 });
    saveLayout();
    renderWorkspace();
    renderAllPanels();
  }

  function removePanel(panelId) {
    state.layout.columns.forEach(function (col) {
      col.panels = col.panels.filter(function (p) { return p.id !== panelId; });
    });
    state.layout.columns = state.layout.columns.filter(function (c) { return c.panels.length > 0; });
    if (state.layout.columns.length === 0) {
      state.layout = clone(DEFAULT_LAYOUT);
    }
    saveLayout();
    renderWorkspace();
    renderAllPanels();
  }

  function copyDocument() {
    if (!state.doc) { toast("Nothing to copy yet."); return; }
    var text = JSON.stringify(state.doc, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Copied OpenAPI JSON."); },
        function () { toast("Clipboard denied."); }
      );
    } else {
      toast("Clipboard unavailable.");
    }
  }

  // ============================================================================
  // keyboard shortcuts
  // ============================================================================
  function attachKeyboard() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && !isTyping(e.target)) {
        e.preventDefault();
        var input = document.querySelector("[data-search-input]");
        if (input) input.focus();
      } else if (e.key === "Escape") {
        dom.addMenu.classList.remove("is-open");
        dom.addToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function isTyping(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  // ============================================================================
  // workspace + panel DOM rendering
  // ============================================================================
  function renderWorkspace() {
    dom.workspace.innerHTML = "";
    state.layout.columns.forEach(function (col, idx) {
      if (idx > 0) {
        var resizer = document.createElement("div");
        resizer.className = "col-resize";
        resizer.setAttribute("data-col-resize", String(idx));
        resizer.addEventListener("pointerdown", function (e) { startColResize(e, idx); });
        dom.workspace.appendChild(resizer);
      }
      dom.workspace.appendChild(renderColumn(col));
    });
    applyColumnWidths();
  }

  function applyColumnWidths() {
    var cols = dom.workspace.querySelectorAll(".col");
    state.layout.columns.forEach(function (col, i) {
      var el = cols[i];
      if (!el) return;
      if (col.width && col.width > 0) {
        el.style.flex = "0 0 " + col.width + "px";
        el.style.width = col.width + "px";
      } else {
        el.style.flex = "1 1 0";
        el.style.width = "auto";
      }
    });
  }

  function renderColumn(col) {
    var wrap = document.createElement("div");
    wrap.className = "col";
    wrap.setAttribute("data-col-id", col.id);
    col.panels.forEach(function (panel, idx) {
      if (idx > 0) {
        var resizer = document.createElement("div");
        resizer.className = "row-resize";
        resizer.setAttribute("data-row-resize", col.id + ":" + idx);
        resizer.addEventListener("pointerdown", function (e) { startRowResize(e, col.id, idx); });
        wrap.appendChild(resizer);
      }
      wrap.appendChild(renderPanelShell(panel, col.id));
    });
    applyRowWeights(wrap, col);
    return wrap;
  }

  function applyRowWeights(colEl, col) {
    var panels = colEl.querySelectorAll(".panel");
    var totalWeight = col.panels.reduce(function (s, p) { return s + (p.weight || 1); }, 0);
    col.panels.forEach(function (p, i) {
      var el = panels[i];
      if (!el) return;
      el.style.flex = (p.weight || 1) + " " + (p.weight || 1) + " 0";
    });
  }

  function renderPanelShell(panel, colId) {
    var def = PANELS[panel.type];
    var el = document.createElement("section");
    el.className = "panel";
    el.setAttribute("data-specord-panel", panel.type);
    el.setAttribute("data-panel-id", panel.id);
    el.setAttribute("data-col-id", colId);

    var head = document.createElement("header");
    head.className = "panel-head";
    head.innerHTML =
      '<button class="panel-grab" data-specord-panel-drag aria-label="Drag panel" title="Drag to reorder">' +
        '<svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">' +
          '<circle cx="2" cy="2" r="1"/><circle cx="2" cy="5" r="1"/><circle cx="2" cy="8" r="1"/>' +
          '<circle cx="8" cy="2" r="1"/><circle cx="8" cy="5" r="1"/><circle cx="8" cy="8" r="1"/>' +
        '</svg>' +
      '</button>' +
      '<div class="panel-title" data-specord-panel-title>' + escapeHtml(def.title) + '</div>' +
      '<div class="panel-actions" data-specord-panel-menu>' +
        '<button class="panel-action" data-specord-remove-panel aria-label="Remove panel" title="Close panel">' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6"/></svg>' +
        '</button>' +
      '</div>';

    var body = document.createElement("div");
    body.className = "panel-body" + (def.flush ? " is-flush" : " is-padded");
    body.setAttribute("data-specord-panel-body", panel.type);

    el.appendChild(head);
    el.appendChild(body);

    head.querySelector("[data-specord-panel-drag]").addEventListener("pointerdown", function (e) {
      startPanelDrag(e, panel.id);
    });
    head.querySelector("[data-specord-remove-panel]").addEventListener("click", function () {
      removePanel(panel.id);
    });

    return el;
  }

  function renderAllPanels() {
    state.layout.columns.forEach(function (col) {
      col.panels.forEach(function (panel) {
        renderPanelContent(panel);
      });
    });
  }

  function renderPanelContent(panel) {
    var body = dom.app.querySelector('[data-panel-id="' + panel.id + '"] .panel-body');
    if (!body) return;
    if (state.loading) {
      body.innerHTML = '<div class="state"><div class="spinner"></div><div>Loading…</div></div>';
      return;
    }
    if (state.error) {
      body.innerHTML = '<div class="state state-error">' + escapeHtml(state.error) + '</div>';
      return;
    }
    var def = PANELS[panel.type];
    if (def && def.render) {
      def.render(body);
    } else {
      body.innerHTML = '<div class="panel-empty">Unknown panel</div>';
    }
  }

  function rerenderDeps(kind) {
    // rerender panels affected by selection/search/filter changes
    state.layout.columns.forEach(function (col) {
      col.panels.forEach(function (panel) {
        if (kind === "op" && (panel.type === "op-detail" || panel.type === "code" || panel.type === "try")) {
          renderPanelContent(panel);
        } else if (kind === "schema" && panel.type === "schema-detail") {
          renderPanelContent(panel);
        } else if (kind === "list" && (panel.type === "operations" || panel.type === "schemas")) {
          renderPanelContent(panel);
        }
      });
    });
  }

  // ============================================================================
  // column resize
  // ============================================================================
  function startColResize(e, colIdx) {
    e.preventDefault();
    var target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    target.classList.add("is-active");
    var cols = dom.workspace.querySelectorAll(".col");
    var leftEl = cols[colIdx - 1];
    var rightEl = cols[colIdx];
    if (!leftEl || !rightEl) return;
    var leftStart = leftEl.getBoundingClientRect().width;
    var rightStart = rightEl.getBoundingClientRect().width;
    var startX = e.clientX;

    function move(ev) {
      var dx = ev.clientX - startX;
      var nextLeft = Math.max(200, leftStart + dx);
      var nextRight = Math.max(200, rightStart - dx);
      state.layout.columns[colIdx - 1].width = nextLeft;
      // right column: if it had a fixed width, preserve; if flex (0), leave 0
      if (state.layout.columns[colIdx].width > 0) {
        state.layout.columns[colIdx].width = nextRight;
      }
      applyColumnWidths();
    }
    function up() {
      target.classList.remove("is-active");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      saveLayout();
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // ============================================================================
  // row (panel height) resize
  // ============================================================================
  function startRowResize(e, colId, panelIdx) {
    e.preventDefault();
    var target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    target.classList.add("is-active");
    var colEl = dom.workspace.querySelector('[data-col-id="' + colId + '"]');
    var panels = colEl ? colEl.querySelectorAll(".panel") : [];
    var topEl = panels[panelIdx - 1];
    var botEl = panels[panelIdx];
    if (!topEl || !botEl) return;
    var topStart = topEl.getBoundingClientRect().height;
    var botStart = botEl.getBoundingClientRect().height;
    var startY = e.clientY;
    var col = findCol(colId);

    function move(ev) {
      var dy = ev.clientY - startY;
      var nextTop = Math.max(80, topStart + dy);
      var nextBot = Math.max(80, botStart - dy);
      var total = nextTop + nextBot;
      var topPanel = col.panels[panelIdx - 1];
      var botPanel = col.panels[panelIdx];
      topPanel.weight = nextTop / total * 2;
      botPanel.weight = nextBot / total * 2;
      applyRowWeights(colEl, col);
    }
    function up() {
      target.classList.remove("is-active");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      saveLayout();
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function findCol(colId) {
    for (var i = 0; i < state.layout.columns.length; i++) {
      if (state.layout.columns[i].id === colId) return state.layout.columns[i];
    }
    return null;
  }

  // ============================================================================
  // panel drag-and-drop
  // ============================================================================
  function startPanelDrag(e, panelId) {
    e.preventDefault();
    var target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    var panelEl = dom.app.querySelector('[data-panel-id="' + panelId + '"]');
    if (!panelEl) return;
    panelEl.classList.add("is-dragging");
    var def = PANELS[panelEl.getAttribute("data-specord-panel")];
    dom.ghost.hidden = false;
    dom.ghost.textContent = def ? def.title : "Panel";
    var dragging = { panelId: panelId, drop: null };
    moveGhost(e.clientX, e.clientY);

    function move(ev) {
      moveGhost(ev.clientX, ev.clientY);
      dragging.drop = computeDropZone(ev.clientX, ev.clientY, panelId);
      paintDropIndicator(dragging.drop);
    }
    function up(ev) {
      panelEl.classList.remove("is-dragging");
      dom.ghost.hidden = true;
      dom.dropH.classList.remove("is-visible");
      dom.dropV.classList.remove("is-visible");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (dragging.drop) applyDrop(panelId, dragging.drop);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function moveGhost(x, y) {
    dom.ghost.style.left = (x + 14) + "px";
    dom.ghost.style.top = (y + 8) + "px";
  }

  function computeDropZone(x, y, sourcePanelId) {
    var wsRect = dom.workspace.getBoundingClientRect();
    if (x < wsRect.left || x > wsRect.right || y < wsRect.top || y > wsRect.bottom) return null;

    // Edge of workspace -> new column at edge
    var edge = 24;
    if (x - wsRect.left < edge) return { kind: "new-col", index: 0 };
    if (wsRect.right - x < edge) return { kind: "new-col", index: state.layout.columns.length };

    // Find column under cursor
    var cols = dom.workspace.querySelectorAll(".col");
    for (var ci = 0; ci < cols.length; ci++) {
      var colEl = cols[ci];
      var cr = colEl.getBoundingClientRect();
      if (x < cr.left || x > cr.right) continue;
      var colId = colEl.getAttribute("data-col-id");

      // Between columns (cursor near left or right gap, but inside col)
      if (x - cr.left < edge && ci > 0) return { kind: "new-col", index: ci };
      if (cr.right - x < edge && ci < cols.length - 1) return { kind: "new-col", index: ci + 1 };

      // Inside column: find panel
      var panels = colEl.querySelectorAll(".panel");
      for (var pi = 0; pi < panels.length; pi++) {
        var pEl = panels[pi];
        var pr = pEl.getBoundingClientRect();
        if (y < pr.top || y > pr.bottom) continue;
        var targetPanelId = pEl.getAttribute("data-panel-id");
        var localY = (y - pr.top) / pr.height;
        if (localY < 0.5) {
          return { kind: "before-panel", colId: colId, panelId: targetPanelId, sourceMatch: targetPanelId === sourcePanelId };
        }
        return { kind: "after-panel", colId: colId, panelId: targetPanelId, sourceMatch: targetPanelId === sourcePanelId };
      }
      // Empty area of column -> append
      return { kind: "append-col", colId: colId };
    }
    return null;
  }

  function paintDropIndicator(drop) {
    dom.dropH.classList.remove("is-visible");
    dom.dropV.classList.remove("is-visible");
    if (!drop) return;
    var wsRect = dom.workspace.getBoundingClientRect();
    if (drop.kind === "new-col") {
      var cols = dom.workspace.querySelectorAll(".col");
      var x;
      if (drop.index === 0) {
        x = wsRect.left;
      } else if (drop.index >= cols.length) {
        x = wsRect.right - 2;
      } else {
        var r = cols[drop.index].getBoundingClientRect();
        x = r.left - 1;
      }
      dom.dropV.style.left = x + "px";
      dom.dropV.style.top = wsRect.top + "px";
      dom.dropV.style.height = wsRect.height + "px";
      dom.dropV.classList.add("is-visible");
      return;
    }
    if (drop.kind === "before-panel" || drop.kind === "after-panel") {
      var pEl = dom.app.querySelector('[data-panel-id="' + drop.panelId + '"]');
      if (!pEl) return;
      var pr = pEl.getBoundingClientRect();
      var y = drop.kind === "before-panel" ? pr.top : pr.bottom - 2;
      dom.dropH.style.top = y + "px";
      dom.dropH.style.left = pr.left + "px";
      dom.dropH.style.width = pr.width + "px";
      dom.dropH.classList.add("is-visible");
      return;
    }
    if (drop.kind === "append-col") {
      var colEl = dom.workspace.querySelector('[data-col-id="' + drop.colId + '"]');
      if (!colEl) return;
      var cr = colEl.getBoundingClientRect();
      dom.dropH.style.top = (cr.bottom - 2) + "px";
      dom.dropH.style.left = cr.left + "px";
      dom.dropH.style.width = cr.width + "px";
      dom.dropH.classList.add("is-visible");
    }
  }

  function applyDrop(sourcePanelId, drop) {
    if (drop.sourceMatch) return; // dropping onto self -> no-op
    var src = extractPanel(sourcePanelId);
    if (!src.panel) return;

    if (drop.kind === "new-col") {
      state.layout.columns.splice(drop.index, 0, { id: cid(), width: 0, panels: [src.panel] });
    } else if (drop.kind === "append-col") {
      var col = findCol(drop.colId);
      if (col) col.panels.push(src.panel);
    } else if (drop.kind === "before-panel" || drop.kind === "after-panel") {
      var targetCol = null;
      var targetIdx = -1;
      for (var i = 0; i < state.layout.columns.length; i++) {
        var c = state.layout.columns[i];
        for (var j = 0; j < c.panels.length; j++) {
          if (c.panels[j].id === drop.panelId) { targetCol = c; targetIdx = j; break; }
        }
        if (targetCol) break;
      }
      if (!targetCol) {
        // restore: put back where it came from
        if (src.col) src.col.panels.push(src.panel);
        return;
      }
      var insertAt = drop.kind === "before-panel" ? targetIdx : targetIdx + 1;
      targetCol.panels.splice(insertAt, 0, src.panel);
    }

    // remove empty columns
    state.layout.columns = state.layout.columns.filter(function (c) { return c.panels.length > 0; });
    if (state.layout.columns.length === 0) state.layout = clone(DEFAULT_LAYOUT);
    saveLayout();
    renderWorkspace();
    renderAllPanels();
  }

  function extractPanel(panelId) {
    for (var i = 0; i < state.layout.columns.length; i++) {
      var c = state.layout.columns[i];
      for (var j = 0; j < c.panels.length; j++) {
        if (c.panels[j].id === panelId) {
          var p = c.panels.splice(j, 1)[0];
          return { panel: p, col: c };
        }
      }
    }
    return { panel: null, col: null };
  }

  // ============================================================================
  // OpenAPI walking
  // ============================================================================
  var METHODS = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];

  function flattenOperations(doc) {
    var out = [];
    var paths = doc && doc.paths ? doc.paths : {};
    Object.keys(paths).forEach(function (path) {
      var item = paths[path];
      if (!item) return;
      METHODS.forEach(function (m) {
        var op = item[m];
        if (!op) return;
        out.push({
          key: m.toUpperCase() + " " + path,
          method: m.toUpperCase(),
          path: path,
          summary: op.summary || "",
          description: op.description || "",
          tags: Array.isArray(op.tags) && op.tags.length ? op.tags : ["default"],
          op: op,
          pathItem: item
        });
      });
    });
    out.sort(function (a, b) {
      if (a.path === b.path) return METHODS.indexOf(a.method.toLowerCase()) - METHODS.indexOf(b.method.toLowerCase());
      return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
    });
    return out;
  }

  function listSchemas(doc) {
    var out = [];
    var comps = doc && doc.components && doc.components.schemas ? doc.components.schemas : {};
    Object.keys(comps).sort().forEach(function (name) {
      out.push({ name: name, schema: comps[name] });
    });
    return out;
  }

  function findOp(key) {
    for (var i = 0; i < state.flatOps.length; i++) {
      if (state.flatOps[i].key === key) return state.flatOps[i];
    }
    return null;
  }

  function findSchema(name) {
    for (var i = 0; i < state.schemas.length; i++) {
      if (state.schemas[i].name === name) return state.schemas[i];
    }
    return null;
  }

  // ============================================================================
  // panel renderers
  // ============================================================================
  function renderOperations(body) {
    var q = state.search.trim().toLowerCase();
    var filtered = state.flatOps.filter(function (o) {
      var bucket = methodBucket(o.method);
      if (!state.methods[bucket]) return false;
      if (!q) return true;
      return (
        o.path.toLowerCase().indexOf(q) >= 0 ||
        o.method.toLowerCase().indexOf(q) >= 0 ||
        (o.summary && o.summary.toLowerCase().indexOf(q) >= 0) ||
        (o.op.operationId && String(o.op.operationId).toLowerCase().indexOf(q) >= 0)
      );
    });
    var groups = {};
    filtered.forEach(function (o) {
      o.tags.forEach(function (t) {
        if (!groups[t]) groups[t] = [];
        groups[t].push(o);
      });
    });
    var html =
      '<div class="search">' +
        '<input data-search-input type="search" placeholder="Search / filter operations… (press /)" value="' + escapeAttr(state.search) + '">' +
      '</div>' +
      '<div class="filters" data-specord-method-filters>' +
        renderChip("GET") +
        renderChip("POST") +
        renderChip("PUT") +
        renderChip("PATCH") +
        renderChip("DELETE") +
        renderChip("OTHER") +
      '</div>';

    if (filtered.length === 0) {
      html += '<div class="panel-empty">No operations match.</div>';
      body.innerHTML = html;
      wireOperationList(body);
      return;
    }

    html += '<div class="op-list" data-specord-operation-list>';
    Object.keys(groups).sort().forEach(function (tag) {
      html += '<div class="op-group">';
      html += '<div class="op-group-head">' + escapeHtml(tag) + ' · ' + groups[tag].length + '</div>';
      groups[tag].forEach(function (o) {
        var selected = o.key === state.selectedOp ? " is-selected" : "";
        html +=
          '<button class="op-row' + selected + '" data-op-key="' + escapeAttr(o.key) + '" type="button">' +
            '<span class="method ' + o.method.toLowerCase() + '">' + o.method + '</span>' +
            '<span class="op-row-main">' +
              '<span class="op-row-path">' + escapeHtml(o.path) + '</span>' +
              (o.summary ? '<span class="op-row-summary">' + escapeHtml(o.summary) + '</span>' : '') +
            '</span>' +
          '</button>';
      });
      html += '</div>';
    });
    html += '</div>';
    body.innerHTML = html;
    wireOperationList(body);
  }

  function methodBucket(m) {
    if (m === "GET" || m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE") return m;
    return "OTHER";
  }

  function renderChip(method) {
    var active = state.methods[method] ? " is-active" : "";
    var cls = method.toLowerCase();
    return '<button class="chip ' + cls + active + '" data-method-toggle="' + method + '" type="button">' + method + '</button>';
  }

  function wireOperationList(body) {
    var input = body.querySelector("[data-search-input]");
    if (input) {
      input.addEventListener("input", function () {
        state.search = input.value;
        renderOperationsListOnly();
      });
    }
    body.querySelectorAll("[data-method-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var m = btn.getAttribute("data-method-toggle");
        state.methods[m] = !state.methods[m];
        renderOperationsListOnly();
      });
    });
    body.querySelectorAll("[data-op-key]").forEach(function (row) {
      row.addEventListener("click", function () {
        state.selectedOp = row.getAttribute("data-op-key");
        rerenderDeps("op");
        // update selection styling in this panel
        body.querySelectorAll(".op-row").forEach(function (r) { r.classList.remove("is-selected"); });
        row.classList.add("is-selected");
      });
    });
  }

  function renderOperationsListOnly() {
    state.layout.columns.forEach(function (col) {
      col.panels.forEach(function (panel) {
        if (panel.type === "operations") renderPanelContent(panel);
      });
    });
  }

  function renderOpDetail(body) {
    var o = findOp(state.selectedOp);
    if (!o) {
      body.innerHTML = '<div class="panel-empty">Select an operation.</div>';
      return;
    }
    var op = o.op;
    var paramRows = "";
    var params = Array.isArray(op.parameters) ? op.parameters : [];
    var pathParams = Array.isArray(o.pathItem.parameters) ? o.pathItem.parameters : [];
    var all = pathParams.concat(params);
    if (all.length) {
      paramRows = '<div class="kvs">';
      all.forEach(function (p) {
        var typ = p.schema && p.schema.type ? p.schema.type : (p.type || "any");
        paramRows +=
          '<div class="kv">' +
            '<div class="kv-k">' + escapeHtml(p.name || "?") + ' <span class="muted">' + escapeHtml(p["in"] || "") + '</span></div>' +
            '<div class="kv-v"><code>' + escapeHtml(String(typ)) + '</code>' +
              (p.required ? ' <span class="muted">required</span>' : '') +
              (p.description ? '<br><span class="muted">' + escapeHtml(p.description) + '</span>' : '') +
            '</div>' +
          '</div>';
      });
      paramRows += '</div>';
    }

    var reqBody = "";
    if (op.requestBody && op.requestBody.content) {
      reqBody += '<div class="section"><div class="section-title">Request body</div>';
      Object.keys(op.requestBody.content).forEach(function (ct) {
        reqBody += '<div class="kvs"><div class="kv"><div class="kv-k">Content-Type</div><div class="kv-v"><code>' + escapeHtml(ct) + '</code></div></div></div>';
        var sch = op.requestBody.content[ct].schema;
        if (sch) reqBody += '<pre class="code">' + escapeHtml(JSON.stringify(sch, null, 2)) + '</pre>';
      });
      reqBody += '</div>';
    }

    var responses = "";
    if (op.responses) {
      responses += '<div class="section"><div class="section-title">Responses</div><div class="kvs">';
      Object.keys(op.responses).forEach(function (code) {
        var r = op.responses[code];
        var desc = (r && r.description) || "";
        responses +=
          '<div class="kv">' +
            '<div class="kv-k"><code>' + escapeHtml(code) + '</code></div>' +
            '<div class="kv-v">' + escapeHtml(desc) +
              (r && r.content ? '<br><span class="muted">' + Object.keys(r.content).map(escapeHtml).join(", ") + '</span>' : '') +
            '</div>' +
          '</div>';
      });
      responses += '</div></div>';
    }

    var security = "";
    if (op.security) {
      security += '<div class="section"><div class="section-title">Security</div>';
      security += '<pre class="code">' + escapeHtml(JSON.stringify(op.security, null, 2)) + '</pre>';
      security += '</div>';
    }

    body.innerHTML =
      '<div class="detail-head" data-specord-operation-detail>' +
        '<div class="detail-route">' +
          '<span class="method ' + o.method.toLowerCase() + '">' + o.method + '</span>' +
          '<span class="detail-path">' + escapeHtml(o.path) + '</span>' +
        '</div>' +
        (o.summary ? '<p class="detail-summary">' + escapeHtml(o.summary) + '</p>' : '') +
        (o.description ? '<p class="detail-description">' + escapeHtml(o.description) + '</p>' : '') +
        (op.operationId ? '<p class="detail-description"><span class="muted">operationId</span> <code>' + escapeHtml(op.operationId) + '</code></p>' : '') +
      '</div>' +
      (paramRows ? '<div class="section"><div class="section-title">Parameters</div>' + paramRows + '</div>' : '') +
      reqBody +
      responses +
      security;
  }

  function renderSchemas(body) {
    if (!state.schemas.length) {
      body.innerHTML = '<div class="panel-empty">No schemas defined.</div>';
      return;
    }
    var html = '<div class="op-list" data-specord-schema-list>';
    state.schemas.forEach(function (s) {
      var selected = s.name === state.selectedSchema ? " is-selected" : "";
      html +=
        '<button class="op-row' + selected + '" data-schema-name="' + escapeAttr(s.name) + '" type="button">' +
          '<span class="method">{ }</span>' +
          '<span class="op-row-main"><span class="op-row-path">' + escapeHtml(s.name) + '</span></span>' +
        '</button>';
    });
    html += '</div>';
    body.innerHTML = html;
    body.querySelectorAll("[data-schema-name]").forEach(function (row) {
      row.addEventListener("click", function () {
        state.selectedSchema = row.getAttribute("data-schema-name");
        rerenderDeps("schema");
        body.querySelectorAll(".op-row").forEach(function (r) { r.classList.remove("is-selected"); });
        row.classList.add("is-selected");
      });
    });
  }

  function renderSchemaDetail(body) {
    var s = findSchema(state.selectedSchema);
    if (!s) {
      body.innerHTML = '<div class="panel-empty">Select a schema.</div>';
      return;
    }
    body.innerHTML =
      '<div class="detail-head"><div class="detail-path">' + escapeHtml(s.name) + '</div></div>' +
      '<div class="section"><pre class="code">' + escapeHtml(JSON.stringify(s.schema, null, 2)) + '</pre></div>';
  }

  function renderTry(body) {
    var o = findOp(state.selectedOp);
    if (!o) {
      body.innerHTML = '<div class="panel-empty">Select an operation.</div>';
      return;
    }
    var params = (Array.isArray(o.pathItem.parameters) ? o.pathItem.parameters : []).concat(o.op.parameters || []);
    var rows = "";
    params.forEach(function (p) {
      rows +=
        '<div class="try-row">' +
          '<label>' + escapeHtml(p.name) + ' <span class="muted">' + escapeHtml(p["in"] || "") + '</span></label>' +
          '<input type="text" placeholder="' + escapeAttr(p.description || "") + '">' +
        '</div>';
    });
    var bodyField = "";
    if (o.op.requestBody) {
      bodyField =
        '<div class="try-row">' +
          '<label>Body</label>' +
          '<textarea placeholder="{}"></textarea>' +
        '</div>';
    }
    body.innerHTML =
      '<form class="try-form" data-specord-try-panel onsubmit="return false">' +
        '<div class="detail-route">' +
          '<span class="method ' + o.method.toLowerCase() + '">' + o.method + '</span>' +
          '<span class="detail-path">' + escapeHtml(o.path) + '</span>' +
        '</div>' +
        rows +
        bodyField +
        '<button class="btn is-primary" type="submit" disabled>Send</button>' +
        '<p class="try-pending">Execution contract pending — form preserves entered values locally; no request is sent.</p>' +
      '</form>';
  }

  function renderCode(body) {
    var o = findOp(state.selectedOp);
    if (!o) {
      body.innerHTML = '<div class="panel-empty">Select an operation.</div>';
      return;
    }
    var base = guessBaseUrl();
    var url = base + o.path;
    var curl = "curl -X " + o.method + " '" + url + "'" + (o.op.requestBody ? " \\\n  -H 'Content-Type: application/json' \\\n  -d '{}'" : "");
    var js =
      "await fetch('" + url + "', {\n" +
      "  method: '" + o.method + "'" +
      (o.op.requestBody
        ? ",\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({})"
        : "") +
      "\n});";
    var py =
      "import requests\n" +
      "requests." + o.method.toLowerCase() + "('" + url + "'" +
      (o.op.requestBody ? ", json={}" : "") +
      ")";
    body.innerHTML =
      '<div data-specord-code-snippets>' +
        '<div class="tabs" data-snippet-tabs>' +
          '<button class="tab is-active" data-snippet="curl">curl</button>' +
          '<button class="tab" data-snippet="js">JavaScript</button>' +
          '<button class="tab" data-snippet="py">Python</button>' +
        '</div>' +
        '<div class="section" data-snippet-body><pre class="code">' + escapeHtml(curl) + '</pre></div>' +
      '</div>';
    var pre = body.querySelector("[data-snippet-body] pre");
    var snippets = { curl: curl, js: js, py: py };
    body.querySelectorAll("[data-snippet]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        body.querySelectorAll("[data-snippet]").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        pre.textContent = snippets[btn.getAttribute("data-snippet")];
      });
    });
  }

  function renderRaw(body) {
    if (!state.doc) {
      body.innerHTML = '<div class="panel-empty">No document loaded.</div>';
      return;
    }
    body.innerHTML = '<div class="section" data-specord-raw><pre class="code">' + escapeHtml(JSON.stringify(state.doc, null, 2)) + '</pre></div>';
  }

  function guessBaseUrl() {
    if (state.doc && Array.isArray(state.doc.servers) && state.doc.servers[0] && state.doc.servers[0].url) {
      return String(state.doc.servers[0].url).replace(/\/$/, "");
    }
    if (config.appUrl) return String(config.appUrl).replace(/\/$/, "");
    return "";
  }

  // ============================================================================
  // toast
  // ============================================================================
  var toastTimer = null;
  function toast(msg) {
    dom.toast.textContent = msg;
    dom.toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { dom.toast.classList.remove("is-visible"); }, 2400);
  }

  // ============================================================================
  // escape helpers
  // ============================================================================
  function escapeHtml(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function escapeAttr(v) { return escapeHtml(v); }
})();
`;
