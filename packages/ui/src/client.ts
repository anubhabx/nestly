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

  // ---- layout constraints ----
  var COL_MIN_PX = 220;
  var COL_DEFAULT_NEW_PX = 320;
  var ROW_MIN_PX = 120;
  var RESIZER_PX = 4;

  // dragState is set while a panel drag is in flight
  var dragState = null;

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
    toast: q("[data-specord-toast]")
  };

  function q(sel) { return document.querySelector(sel); }

  attachToolbar();
  attachKeyboard();
  attachWorkspaceObserver();
  ensureFlexColumn();
  clampLayout();
  renderWorkspace();
  setStatus("loading", "Loading " + config.openApiUrl);
  fetchDoc(config.openApiUrl).then(onDocLoaded).catch(onDocError);

  function attachWorkspaceObserver() {
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", onViewportChange);
      return;
    }
    var ro = new ResizeObserver(onViewportChange);
    ro.observe(dom.workspace);
  }

  var viewportRaf = 0;
  function onViewportChange() {
    if (viewportRaf) return;
    viewportRaf = requestAnimationFrame(function () {
      viewportRaf = 0;
      if (dragState) return; // don't re-clamp mid-drag
      var before = JSON.stringify(state.layout.columns.map(function (c) { return c.width; }));
      clampLayout();
      var after = JSON.stringify(state.layout.columns.map(function (c) { return c.width; }));
      if (before !== after) {
        applyColumnWidths();
        saveLayout();
      }
    });
  }

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
    ensureFlexColumn();
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
    ensureFlexColumn();
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
  // Incremental reconcile: reuse existing column and panel elements where possible
  // so CSS flex transitions can fire smoothly on neighbors during drag.
  function renderWorkspace() {
    var ws = dom.workspace;
    var oldChildren = Array.prototype.slice.call(ws.children);

    var existingCols = {};
    oldChildren.forEach(function (el) {
      if (el.classList && el.classList.contains("col")) {
        existingCols[el.getAttribute("data-col-id")] = el;
      }
    });

    var desired = [];
    var freshCols = [];
    state.layout.columns.forEach(function (col, idx) {
      if (idx > 0) {
        var resizer = document.createElement("div");
        resizer.className = "col-resize";
        resizer.setAttribute("data-col-resize", String(idx));
        resizer.addEventListener("pointerdown", function (e) { startColResize(e, idx); });
        desired.push(resizer);
      }
      var colEl;
      if (existingCols[col.id]) {
        colEl = existingCols[col.id];
        if (colEl.dataset.leaving === "1") cancelLeave(colEl);
        delete existingCols[col.id];
      } else {
        colEl = document.createElement("div");
        colEl.className = "col";
        colEl.setAttribute("data-col-id", col.id);
        freshCols.push(colEl);
      }
      reconcileColumn(colEl, col);
      desired.push(colEl);
    });

    // Animate orphan columns out (shrink to 0, then remove from DOM).
    for (var cid_ in existingCols) {
      scheduleLeave(existingCols[cid_]);
    }
    // Remove old resizers immediately (they have no visual weight).
    oldChildren.forEach(function (el) {
      if (el.classList && el.classList.contains("col-resize") && el.parentNode === ws) {
        ws.removeChild(el);
      }
    });

    // Reorder in place: only insert new elements at correct positions; leaving
    // columns stay put and collapse via .is-leaving, so neighbors slide in
    // smoothly instead of jumping.
    reorderChildren(ws, desired);

    applyColumnWidths();
    // After applyColumnWidths sets target flex, mark fresh cols for entry so
    // they grow from 0 to their target width on the next paint.
    freshCols.forEach(scheduleEnter);
  }

  function reconcileColumn(colEl, col) {
    var oldChildren = Array.prototype.slice.call(colEl.children);
    var existingPanels = {};
    var existingPlaceholders = {};
    oldChildren.forEach(function (el) {
      if (!el.classList) return;
      if (el.classList.contains("panel")) {
        existingPanels[el.getAttribute("data-panel-id")] = el;
      } else if (el.classList.contains("panel-placeholder")) {
        existingPlaceholders[el.getAttribute("data-placeholder-for")] = el;
      }
    });

    var desired = [];
    var freshPanels = [];
    col.panels.forEach(function (panel, idx) {
      if (idx > 0) {
        var r = document.createElement("div");
        r.className = "row-resize";
        r.setAttribute("data-row-resize", col.id + ":" + idx);
        r.addEventListener("pointerdown", function (e) { startRowResize(e, col.id, idx); });
        desired.push(r);
      }
      var el;
      if (dragState && dragState.panelId === panel.id) {
        el = existingPlaceholders[panel.id] || makePlaceholder(panel);
        delete existingPlaceholders[panel.id];
      } else if (existingPanels[panel.id]) {
        el = existingPanels[panel.id];
        if (el.dataset.leaving === "1") cancelLeave(el);
        el.setAttribute("data-col-id", col.id);
        delete existingPanels[panel.id];
      } else {
        el = renderPanelShell(panel, col.id);
        freshPanels.push(el);
      }
      desired.push(el);
    });

    // Orphan panels shrink out, then get removed.
    for (var pId in existingPanels) {
      scheduleLeave(existingPanels[pId]);
    }
    // Orphan placeholders go away instantly (they're transient drag artifacts).
    for (var phId in existingPlaceholders) {
      var orphPh = existingPlaceholders[phId];
      if (orphPh.parentNode === colEl) colEl.removeChild(orphPh);
    }
    oldChildren.forEach(function (el) {
      if (el.classList && el.classList.contains("row-resize") && el.parentNode === colEl) {
        colEl.removeChild(el);
      }
    });

    reorderChildren(colEl, desired);
    applyRowWeights(colEl, col);
    freshPanels.forEach(scheduleEnter);
  }

  function applyColumnWidths() {
    var cols = dom.workspace.querySelectorAll(".col");
    state.layout.columns.forEach(function (col, i) {
      var el = cols[i];
      if (!el) return;
      if (col.width && col.width > 0) {
        el.style.flex = "0 0 " + col.width + "px";
        el.style.minWidth = COL_MIN_PX + "px";
      } else {
        el.style.flex = "1 1 0";
        el.style.minWidth = COL_MIN_PX + "px";
      }
    });
  }

  function makePlaceholder(panel) {
    var ph = document.createElement("div");
    ph.className = "panel-placeholder";
    ph.setAttribute("data-placeholder-for", panel.id);
    ph.style.flex = (panel.weight || 1) + " " + (panel.weight || 1) + " 0";
    return ph;
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
    dom.workspace.classList.add("is-resizing");
    document.body.style.cursor = "col-resize";

    var cols = dom.workspace.querySelectorAll(".col");
    var leftEl = cols[colIdx - 1];
    var rightEl = cols[colIdx];
    if (!leftEl || !rightEl) return;
    var leftCol = state.layout.columns[colIdx - 1];
    var rightCol = state.layout.columns[colIdx];
    var leftStart = leftEl.getBoundingClientRect().width;
    var rightStart = rightEl.getBoundingClientRect().width;
    var pairTotal = leftStart + rightStart;
    var startX = e.clientX;

    // Compute global slack: how much the resizing PAIR is allowed to occupy
    // given the workspace width, other columns, and resizer widths.
    var wsWidth = dom.workspace.getBoundingClientRect().width;
    var otherFixed = 0;
    var otherFlexCount = 0;
    state.layout.columns.forEach(function (c, i) {
      if (i === colIdx - 1 || i === colIdx) return;
      if (c.width > 0) otherFixed += c.width;
      else otherFlexCount++;
    });
    var resizers = (state.layout.columns.length - 1) * RESIZER_PX;
    var otherFlexMin = otherFlexCount * COL_MIN_PX;
    var pairMax = Math.max(2 * COL_MIN_PX, wsWidth - otherFixed - resizers - otherFlexMin);
    var rightIsFlex = !(rightCol.width > 0);
    var leftIsFlex = !(leftCol.width > 0);

    function move(ev) {
      var dx = ev.clientX - startX;
      var targetLeft, targetRight;

      if (!leftIsFlex && !rightIsFlex) {
        // both fixed: conserve total
        targetLeft = clamp(leftStart + dx, COL_MIN_PX, pairTotal - COL_MIN_PX);
        targetRight = pairTotal - targetLeft;
        // also respect pairMax (in case other columns or window shrank)
        if (targetLeft + targetRight > pairMax) {
          var over = (targetLeft + targetRight) - pairMax;
          targetLeft = Math.max(COL_MIN_PX, targetLeft - over / 2);
          targetRight = Math.max(COL_MIN_PX, pairMax - targetLeft);
        }
        leftCol.width = targetLeft;
        rightCol.width = targetRight;
      } else if (!leftIsFlex && rightIsFlex) {
        // left is fixed, right grows to fill: clamp left so right stays >= COL_MIN_PX
        var maxLeft = pairMax - COL_MIN_PX;
        targetLeft = clamp(leftStart + dx, COL_MIN_PX, maxLeft);
        leftCol.width = targetLeft;
      } else if (leftIsFlex && !rightIsFlex) {
        // right is fixed, left grows to fill
        var maxRight = pairMax - COL_MIN_PX;
        targetRight = clamp(rightStart - dx, COL_MIN_PX, maxRight);
        rightCol.width = targetRight;
      } else {
        // both flex (no width set): convert left to a fixed width derived from drag
        targetLeft = clamp(leftStart + dx, COL_MIN_PX, pairMax - COL_MIN_PX);
        leftCol.width = targetLeft;
      }
      applyColumnWidths();
    }
    function up() {
      target.classList.remove("is-active");
      dom.workspace.classList.remove("is-resizing");
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      saveLayout();
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function clamp(v, lo, hi) {
    if (hi < lo) hi = lo;
    return v < lo ? lo : v > hi ? hi : v;
  }

  // ---- enter/leave animation helpers ----
  var ANIM_HINT_MS = 360;

  function scheduleEnter(el) {
    el.classList.add("is-entering");
    el.classList.add("is-animating");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.remove("is-entering");
      });
    });
    setTimeout(function () { el.classList.remove("is-animating"); }, ANIM_HINT_MS);
  }

  function scheduleLeave(el, ms) {
    if (!el || el.dataset.leaving === "1") return;
    el.dataset.leaving = "1";
    el.classList.add("is-leaving");
    el.classList.add("is-animating");
    var id = setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, ms || 340);
    el._leaveTimer = id;
  }

  // Reverse a pending leave when the same element is wanted again before its
  // timer fires — keeps fast drag-back-and-forth from causing a destroy/rebuild
  // cycle that visually flickers.
  function cancelLeave(el) {
    if (!el || el.dataset.leaving !== "1") return;
    if (el._leaveTimer) {
      clearTimeout(el._leaveTimer);
      el._leaveTimer = null;
    }
    el.dataset.leaving = "";
    el.classList.remove("is-leaving");
    // briefly re-enter so it grows back from its current collapsed size
    el.classList.add("is-animating");
    setTimeout(function () { el.classList.remove("is-animating"); }, ANIM_HINT_MS);
  }

  // Walk desired in order; for each, ensure it sits at the current cursor in
  // parent.children, stepping past any leaving siblings (which stay put so they
  // can collapse animatedly in their original visual position).
  function reorderChildren(parent, desired) {
    var dIdx = 0, cIdx = 0;
    while (dIdx < desired.length) {
      var d = desired[dIdx];
      var c = parent.children[cIdx];
      if (!c) {
        parent.appendChild(d);
        dIdx++;
        cIdx++;
      } else if (c === d) {
        dIdx++;
        cIdx++;
      } else if (c.dataset && c.dataset.leaving === "1") {
        cIdx++;
      } else {
        parent.insertBefore(d, c);
        dIdx++;
        cIdx++;
      }
    }
  }

  // Ensure at least one column is flex (width 0) so the workspace fills
  // horizontally even after fixed-width columns are added or removed.
  function ensureFlexColumn() {
    if (!state.layout.columns.length) return;
    var hasFlex = false;
    state.layout.columns.forEach(function (c) {
      if (!c.width || c.width <= 0) hasFlex = true;
    });
    if (!hasFlex) {
      state.layout.columns[state.layout.columns.length - 1].width = 0;
    }
  }

  // Re-clamp column widths against the current workspace size. Called on
  // viewport changes so panels can never end up wider than the screen.
  function clampLayout() {
    var ws = dom.workspace.getBoundingClientRect();
    if (!ws.width) return;
    var cols = state.layout.columns;
    if (!cols.length) return;
    var resizers = (cols.length - 1) * RESIZER_PX;
    var flexCount = 0;
    cols.forEach(function (c) { if (!c.width || c.width <= 0) flexCount++; });
    var available = ws.width - resizers - flexCount * COL_MIN_PX;
    if (available < COL_MIN_PX) available = COL_MIN_PX;

    var fixedTotal = 0;
    cols.forEach(function (c) { if (c.width > 0) fixedTotal += c.width; });

    if (fixedTotal > available) {
      // proportionally shrink fixed-width columns
      var scale = available / fixedTotal;
      cols.forEach(function (c) {
        if (c.width > 0) c.width = Math.max(COL_MIN_PX, Math.floor(c.width * scale));
      });
    }
    cols.forEach(function (c) {
      if (c.width > 0 && c.width < COL_MIN_PX) c.width = COL_MIN_PX;
    });
  }

  // ============================================================================
  // row (panel height) resize
  // ============================================================================
  function startRowResize(e, colId, panelIdx) {
    e.preventDefault();
    var target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    target.classList.add("is-active");
    dom.workspace.classList.add("is-resizing");
    document.body.style.cursor = "row-resize";

    var colEl = dom.workspace.querySelector('[data-col-id="' + colId + '"]');
    var col = findCol(colId);
    if (!colEl || !col) return;
    var panels = colEl.querySelectorAll(".panel, .panel-placeholder");
    var topEl = panels[panelIdx - 1];
    var botEl = panels[panelIdx];
    if (!topEl || !botEl) return;
    var topStart = topEl.getBoundingClientRect().height;
    var botStart = botEl.getBoundingClientRect().height;
    var pairHeight = topStart + botStart;
    var startY = e.clientY;
    var topPanel = col.panels[panelIdx - 1];
    var botPanel = col.panels[panelIdx];
    var pairWeight = (topPanel.weight || 1) + (botPanel.weight || 1);

    function move(ev) {
      var dy = ev.clientY - startY;
      var nextTop = clamp(topStart + dy, ROW_MIN_PX, Math.max(ROW_MIN_PX, pairHeight - ROW_MIN_PX));
      var nextBot = pairHeight - nextTop;
      if (nextBot < ROW_MIN_PX) { nextBot = ROW_MIN_PX; nextTop = pairHeight - ROW_MIN_PX; }
      topPanel.weight = (nextTop / pairHeight) * pairWeight;
      botPanel.weight = (nextBot / pairHeight) * pairWeight;
      applyRowWeights(colEl, col);
    }
    function up() {
      target.classList.remove("is-active");
      dom.workspace.classList.remove("is-resizing");
      document.body.style.cursor = "";
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
    if (dragState) return;
    var grab = e.currentTarget;
    grab.setPointerCapture(e.pointerId);

    var panelEl = dom.app.querySelector('[data-panel-id="' + panelId + '"]');
    if (!panelEl) return;
    var rect = panelEl.getBoundingClientRect();
    var grabOffsetX = e.clientX - rect.left;
    var grabOffsetY = e.clientY - rect.top;

    // Locate panel in layout and snapshot original position for cancel.
    var loc = locatePanel(panelId);
    if (!loc) return;
    var originSnapshot = clone(state.layout);

    // Lift the panel: detach from column, fix to viewport, follow cursor.
    var liftWidth = Math.min(rect.width, 360);
    var liftHeight = Math.min(rect.height, 220);
    if (panelEl.parentNode) panelEl.parentNode.removeChild(panelEl);
    panelEl.classList.add("is-lifted");
    panelEl.style.width = liftWidth + "px";
    panelEl.style.height = liftHeight + "px";
    panelEl.style.left = (e.clientX - grabOffsetX) + "px";
    panelEl.style.top = (e.clientY - grabOffsetY) + "px";
    document.body.appendChild(panelEl);
    document.body.style.cursor = "grabbing";

    dragState = {
      panelId: panelId,
      origin: { colIdx: loc.colIdx, panelIdx: loc.panelIdx, snapshot: originSnapshot },
      currentZone: zoneKey({ kind: "before-panel", panelId: panelId }),
      panelEl: panelEl,
      offsetX: grabOffsetX,
      offsetY: grabOffsetY,
      liftWidth: liftWidth,
      liftHeight: liftHeight
    };
    dom.workspace.classList.add("is-dragging");

    // Re-render with placeholder in source slot (mutate doesn't move the panel yet —
    // the placeholder takes its visual place, neighbors get nothing extra).
    renderWorkspace();

    var pendingX = e.clientX, pendingY = e.clientY;
    var moveRaf = 0;
    function move(ev) {
      pendingX = ev.clientX;
      pendingY = ev.clientY;
      // Lift follows cursor on every event for direct feedback.
      panelEl.style.left = (pendingX - grabOffsetX) + "px";
      panelEl.style.top = (pendingY - grabOffsetY) + "px";
      // Defer the expensive zone re-compute to rAF so we collapse multiple
      // pointermove events per frame into one layout update.
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(function () {
        moveRaf = 0;
        if (!dragState) return;
        var drop = computeDropZone(pendingX, pendingY, panelId);
        var key = zoneKey(drop);
        if (key === dragState.currentZone) return;
        dragState.currentZone = key;
        if (!drop || drop.kind === "keep") return;
        applyDropToLayout(panelId, drop);
        renderWorkspace();
      });
    }
    function up() {
      if (moveRaf) { cancelAnimationFrame(moveRaf); moveRaf = 0; }
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", onKey);
      finishDrag(false);
    }
    function onKey(ev) {
      if (ev.key === "Escape") {
        ev.preventDefault();
        if (moveRaf) { cancelAnimationFrame(moveRaf); moveRaf = 0; }
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("keydown", onKey);
        finishDrag(true);
      }
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", onKey);
  }

  function finishDrag(cancel) {
    if (!dragState) return;
    var panelEl = dragState.panelEl;
    var panelId = dragState.panelId;

    if (cancel) {
      state.layout = dragState.origin.snapshot;
      // Re-render with dragState still set so placeholder appears in origin slot.
      renderWorkspace();
    }

    // Strip lifted styling.
    panelEl.classList.remove("is-lifted");
    panelEl.style.position = "";
    panelEl.style.left = "";
    panelEl.style.top = "";
    panelEl.style.width = "";
    panelEl.style.height = "";
    panelEl.style.transition = "";
    panelEl.style.boxShadow = "";
    panelEl.style.pointerEvents = "";
    panelEl.style.zIndex = "";
    panelEl.style.opacity = "";

    // Swap into placeholder slot (preserves panel body content).
    var placeholder = dom.workspace.querySelector('[data-placeholder-for="' + panelId + '"]');
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.replaceChild(panelEl, placeholder);
    } else if (panelEl.parentNode) {
      panelEl.parentNode.removeChild(panelEl);
    }

    // Update data-col-id on the panel to match its new column.
    var loc = locatePanel(panelId);
    if (loc) panelEl.setAttribute("data-col-id", loc.col.id);

    dom.workspace.classList.remove("is-dragging");
    document.body.style.cursor = "";
    dragState = null;

    state.layout.columns = state.layout.columns.filter(function (c) { return c.panels.length > 0; });
    if (state.layout.columns.length === 0) state.layout = clone(DEFAULT_LAYOUT);
    ensureFlexColumn();

    // Reapply sizing without nuking DOM.
    applyColumnWidths();
    var cols = dom.workspace.querySelectorAll(".col");
    state.layout.columns.forEach(function (col, i) {
      if (cols[i]) applyRowWeights(cols[i], col);
    });
    saveLayout();
  }

  function locatePanel(panelId) {
    for (var i = 0; i < state.layout.columns.length; i++) {
      var c = state.layout.columns[i];
      for (var j = 0; j < c.panels.length; j++) {
        if (c.panels[j].id === panelId) return { col: c, colIdx: i, panelIdx: j, panel: c.panels[j] };
      }
    }
    return null;
  }

  function applyDropToLayout(panelId, drop) {
    // Remove from current location
    var src = null;
    for (var i = 0; i < state.layout.columns.length; i++) {
      var c = state.layout.columns[i];
      for (var j = 0; j < c.panels.length; j++) {
        if (c.panels[j].id === panelId) { src = c.panels.splice(j, 1)[0]; break; }
      }
      if (src) break;
    }
    // Drop empty columns (but keep current indexing in mind for "new-col" target)
    var purgedBefore = 0;
    for (var k = state.layout.columns.length - 1; k >= 0; k--) {
      if (state.layout.columns[k].panels.length === 0) {
        if (drop.kind === "new-col" && k < drop.index) purgedBefore++;
        state.layout.columns.splice(k, 1);
      }
    }
    if (drop.kind === "new-col") {
      var idx = Math.max(0, Math.min(state.layout.columns.length, drop.index - purgedBefore));
      state.layout.columns.splice(idx, 0, {
        id: cid(),
        width: COL_DEFAULT_NEW_PX,
        panels: [src]
      });
    } else if (drop.kind === "append-col") {
      var col = findCol(drop.colId);
      if (col) col.panels.push(src);
      else state.layout.columns.push({ id: cid(), width: 0, panels: [src] });
    } else if (drop.kind === "before-panel" || drop.kind === "after-panel") {
      var targetCol = null;
      var targetIdx = -1;
      for (var ii = 0; ii < state.layout.columns.length; ii++) {
        var cc = state.layout.columns[ii];
        for (var jj = 0; jj < cc.panels.length; jj++) {
          if (cc.panels[jj].id === drop.panelId) { targetCol = cc; targetIdx = jj; break; }
        }
        if (targetCol) break;
      }
      if (targetCol) {
        var at = drop.kind === "before-panel" ? targetIdx : targetIdx + 1;
        targetCol.panels.splice(at, 0, src);
      } else {
        // fallback: append to last column
        if (!state.layout.columns.length) state.layout.columns.push({ id: cid(), width: 0, panels: [] });
        state.layout.columns[state.layout.columns.length - 1].panels.push(src);
      }
    }
    ensureFlexColumn();
  }

  function computeDropZone(x, y, sourcePanelId) {
    var wsRect = dom.workspace.getBoundingClientRect();
    if (x < wsRect.left - 8 || x > wsRect.right + 8 || y < wsRect.top - 8 || y > wsRect.bottom + 8) return null;
    var clampedX = clamp(x, wsRect.left, wsRect.right - 1);
    var clampedY = clamp(y, wsRect.top, wsRect.bottom - 1);

    var edge = 28;
    if (clampedX - wsRect.left < edge) return { kind: "new-col", index: 0 };
    if (wsRect.right - clampedX < edge) return { kind: "new-col", index: state.layout.columns.length };

    var cols = dom.workspace.querySelectorAll(".col");
    for (var ci = 0; ci < cols.length; ci++) {
      var colEl = cols[ci];
      var cr = colEl.getBoundingClientRect();
      if (clampedX < cr.left || clampedX > cr.right) continue;
      var colId = colEl.getAttribute("data-col-id");

      // Between columns (cursor near left or right gap, but inside col)
      if (clampedX - cr.left < edge && ci > 0) return { kind: "new-col", index: ci };
      if (cr.right - clampedX < edge && ci < cols.length - 1) return { kind: "new-col", index: ci + 1 };

      // Inside column: find slot
      var slots = colEl.querySelectorAll(".panel, .panel-placeholder");
      for (var pi = 0; pi < slots.length; pi++) {
        var sEl = slots[pi];
        var sr = sEl.getBoundingClientRect();
        if (clampedY < sr.top || clampedY > sr.bottom) continue;
        // If slot is the placeholder for source, don't reshuffle
        if (sEl.classList.contains("panel-placeholder")) {
          return { kind: "keep" };
        }
        var targetPanelId = sEl.getAttribute("data-panel-id");
        var localY = (clampedY - sr.top) / sr.height;
        if (localY < 0.5) return { kind: "before-panel", panelId: targetPanelId };
        return { kind: "after-panel", panelId: targetPanelId };
      }
      return { kind: "append-col", colId: colId };
    }
    return null;
  }

  function zoneKey(drop) {
    if (!drop) return "null";
    if (drop.kind === "keep") return "keep";
    if (drop.kind === "new-col") return "nc:" + drop.index;
    if (drop.kind === "append-col") return "ac:" + drop.colId;
    return drop.kind + ":" + drop.panelId;
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
      var location = p["in"] || "query";
      var required = p.required || location === "path";
      rows +=
        '<div class="try-row">' +
          '<label>' + escapeHtml(p.name) + ' <span class="muted">' + escapeHtml(location) + (required ? " required" : "") + '</span></label>' +
          '<input type="text" data-try-param-in="' + escapeAttr(location) + '" data-try-param-name="' + escapeAttr(p.name || "") + '" data-try-param-required="' + (required ? "1" : "0") + '" placeholder="' + escapeAttr(p.description || "") + '">' +
        '</div>';
    });
    var bodyField = "";
    if (o.op.requestBody) {
      bodyField =
        '<div class="try-row">' +
          '<label>Body</label>' +
          '<textarea data-try-body placeholder="{}"></textarea>' +
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
        '<button class="btn is-primary" type="submit" data-specord-try-submit>Send</button>' +
        '<p class="try-pending">Browser-local request. Values stay in this tab; Specord does not store credentials.</p>' +
        '<div class="try-result" data-specord-try-result role="status" aria-live="polite">' +
          '<span class="muted">Response will appear here.</span>' +
        '</div>' +
      '</form>';
    wireTryForm(body, o);
  }

  function wireTryForm(body, row) {
    var form = body.querySelector("[data-specord-try-panel]");
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitTryRequest(form, row);
    });
  }

  function submitTryRequest(form, row) {
    var button = form.querySelector("[data-specord-try-submit]");
    var result = form.querySelector("[data-specord-try-result]");
    var request;
    try {
      request = buildTryRequest(form, row);
    } catch (error) {
      renderTryError(result, error && error.message ? error.message : String(error));
      return;
    }

    if (button) button.disabled = true;
    renderTrySending(result, request.url);
    var started = nowMs();

    fetch(request.url, request.options)
      .then(function (response) {
        return response.text().then(function (text) {
          renderTryResponse(result, response, text, Math.round(nowMs() - started));
        });
      })
      .catch(function (error) {
        renderTryError(result, error && error.message ? error.message : String(error));
      })
      .then(function () {
        if (button) button.disabled = false;
      });
  }

  function buildTryRequest(form, row) {
    var url = guessBaseUrl() + row.path;
    var headers = { accept: "application/json, text/plain;q=0.9, */*;q=0.8" };
    var query = [];
    var fields = form.querySelectorAll("[data-try-param-name]");

    fields.forEach(function (field) {
      var name = field.getAttribute("data-try-param-name") || "";
      var location = field.getAttribute("data-try-param-in") || "query";
      var required = field.getAttribute("data-try-param-required") === "1";
      var value = field.value.trim();
      if (!name) return;
      if (required && !value) {
        throw new Error("Missing required " + location + " parameter: " + name);
      }
      if (!value) return;
      if (location === "path") {
        url = replacePathParam(url, name, value);
      } else if (location === "query") {
        query.push([name, value]);
      } else if (location === "header") {
        headers[name] = value;
      }
    });

    var bodyText = "";
    var bodyInput = form.querySelector("[data-try-body]");
    if (bodyInput) {
      bodyText = bodyInput.value.trim() || "{}";
      try {
        JSON.parse(bodyText);
      } catch (_error) {
        throw new Error("Request body must be valid JSON.");
      }
      headers["content-type"] = "application/json";
    }

    return {
      url: appendQuery(url, query),
      options: {
        method: row.method,
        credentials: "same-origin",
        headers: headers,
        body: bodyInput ? bodyText : undefined
      }
    };
  }

  function replacePathParam(url, name, value) {
    var encoded = encodeURIComponent(value);
    return url
      .replace(new RegExp("\\{" + escapeRegExp(name) + "\\}", "g"), encoded)
      .replace(new RegExp(":" + escapeRegExp(name) + "\\b", "g"), encoded);
  }

  function appendQuery(url, query) {
    if (!query.length) return url;
    var joiner = url.indexOf("?") >= 0 ? "&" : "?";
    return url + joiner + query.map(function (pair) {
      return encodeURIComponent(pair[0]) + "=" + encodeURIComponent(pair[1]);
    }).join("&");
  }

  function renderTrySending(result, url) {
    if (!result) return;
    result.className = "try-result";
    result.innerHTML =
      '<div class="try-meta"><span class="try-status">Sending</span><span>' + escapeHtml(url) + '</span></div>' +
      '<pre class="code">Waiting for response...</pre>';
  }

  function renderTryResponse(result, response, text, elapsedMs) {
    if (!result) return;
    var contentType = response.headers && response.headers.get ? response.headers.get("content-type") || "" : "";
    var formatted = formatResponseText(text, contentType);
    var statusClass = response.ok ? " is-ok" : " is-error";
    result.className = "try-result";
    result.innerHTML =
      '<div class="try-meta">' +
        '<span class="try-status' + statusClass + '">' + response.status + " " + escapeHtml(response.statusText || "") + '</span>' +
        '<span>' + elapsedMs + ' ms</span>' +
        (contentType ? '<span>' + escapeHtml(contentType) + '</span>' : '') +
      '</div>' +
      '<pre class="code">' + escapeHtml(formatted || "(empty response)") + '</pre>';
  }

  function renderTryError(result, message) {
    if (!result) return;
    result.className = "try-result is-error";
    result.innerHTML =
      '<div class="try-meta"><span class="try-status is-error">Request failed</span></div>' +
      '<pre class="code">' + escapeHtml(message) + '</pre>';
  }

  function formatResponseText(text, contentType) {
    if (contentType.indexOf("json") >= 0 && text) {
      try {
        return JSON.stringify(JSON.parse(text), null, 2);
      } catch (_error) {
        return text;
      }
    }
    return text;
  }

  function nowMs() {
    return window.performance && typeof window.performance.now === "function"
      ? window.performance.now()
      : Date.now();
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
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
