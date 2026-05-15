# Phase 5 Session Report - Customizable Docs UI Workspace

**Phase:** 5 - Customizable local API documentation workspace
**Date:** 2026-05-15
**Status:** Panel workspace scaffold implemented and locally verified; publish remains gated

---

## Status Summary

Phase 5 starts the API/UI depth roadmap without changing the release gate. The actual npm publish remains pending explicit approval. This slice upgrades the `@specord/ui` docs scaffold into a customizable read-only OpenAPI workspace shared by both `specord serve` and `setupSpecordDocs(app)`.

The UI is still dependency-free and does not execute API requests. The latest follow-up moves the surface toward the screenshot direction: dark reference shell, draggable/resizable panels, add/remove panel controls, undo/redo/reset layout actions, endpoint tabs, code snippets, schema summaries, changelog placeholders, and a read-only try-it scaffold. It deliberately keeps request execution, credential storage, and changelog authoring behind future product/safety contracts.

Health after the implementation pass:

- `@specord/ui`: 1 file, 6 tests passing.
- `@specord/cli`: 3 files, 10 tests passing.
- `@specord/nestjs`: 1 file, 5 tests passing.
- Workspace `pnpm.cmd test`: 11 Turborepo tasks successful.
- Workspace `pnpm.cmd build`: 6 Turborepo tasks successful.
- Dependency audit passed with 0 production and 0 total advisories.
- Generate smoke passed for both canonical fixtures.
- Browser QA covered desktop render, endpoint tabs, changelog placeholder, layout remove/undo, and console cleanliness against `examples/nestjs-realworld`.
- No new runtime dependencies were added.

---

## What Was Built

| Area | Delivered |
| --- | --- |
| UI architecture | Replaced the flat devtool with a customizable panel workspace |
| Visual design | Moved toward the screenshot direction with a dark, dense API-reference shell |
| Panels | Added endpoints, reference, try-it, and schemas panels |
| Layout controls | Added native resize, drag-reorder handles, add/remove panel controls, undo, redo, reset, and local layout persistence |
| Operations | Kept route search, method filtering, grouped endpoint navigation, selected-operation state, and deterministic visible-order selection |
| Operation detail | Added tabbed overview, code, schema, and changelog surfaces |
| Code snippets | Added generated cURL and fetch snippets from the selected operation |
| Changelog scaffold | Added an operation extension hook for `x-specord-changelog`, `x-changelog`, or `x-changes` |
| Try-it scaffold | Added request fields and disabled send action while execution remains unimplemented |
| Schema explorer | Kept schemas as a movable supporting reference panel |
| Utility action | Added copy-JSON affordance with status toast |
| States | Added loading, error, empty, focus, hover, and active handling |
| Safety | Preserved HTML escaping and safe injected client config serialization |
| Tests | Added coverage for minimal shell affordances, no-KPI/no-hero constraints, and script-safe OpenAPI URL injection |

---

## Acceptance Matrix

| Criterion | Status | Evidence |
| --- | --- | --- |
| Existing docs shell still renders escaped title/source data | Pass | `packages/ui/test/render-docs-ui.test.ts` |
| Shell exposes operation-first devtool affordances | Pass | Test asserts search, filters, operation list, detail panel, schema list, copy JSON, loading, and error markers |
| Shell exposes customizable panel affordances | Pass | Test asserts workspace, panel, drag, menu, add, remove, undo, redo, and reset markers |
| Shell exposes planned endpoint tab affordances | Pass | Test asserts overview, code, schema, changelog, code-snippet, changelog, try-it, and pending-execution markers |
| Dashboard KPIs and decorative hero chrome are absent | Pass | Test rejects `path-count`, `operation-count`, `schema-count`, `console-card`, `inline-lens`, and `summary-grid` |
| Injected OpenAPI URL remains script-safe | Pass | Test covers `<script>` encoded to `\u003cscript>` in client config |
| `specord serve` still renders docs and JSON | Pass | `@specord/cli` serve test and local HTTP check |
| `setupSpecordDocs(app)` remains compatible | Pass | `@specord/nestjs` route-injection tests |
| Desktop docs UI loads generated OpenAPI | Pass | Browser showed immediate operations list and selected `GET /orders` detail |
| Search filters operations | Pass | Browser search for `download` reduced the list to one operation |
| Method filters operations and updates detail | Pass | Browser POST filter showed one operation and detail changed to `POST /orders` |
| Endpoint tabs render planned surfaces | Pass | Browser confirmed Code snippets and Changelog placeholder for `GET /orders` |
| Try-it panel stays non-executing | Pass | Browser confirmed request fields and disabled send contract |
| Layout remove/undo works | Pass | Browser removed the Schemas panel, exposed it in Add panel, then restored it with Undo |
| Mobile layout remains readable | Pass | Browser mobile screenshot showed toolbar, search, filters, operations, and selected detail without KPI/dashboard chrome |
| Request execution remains absent | Pass | UI is read-only and exposes JSON/copy only |

---

## Extraction Output Summary

Browser QA target:

| Fixture | OpenAPI | Paths | Operations | Schemas | Warnings |
| --- | --- | ---: | ---: | ---: | ---: |
| `examples/nestjs-realworld` served at `/api/openapi.json` | 0.1.0 document version | 5 | 6 | 6 | 2 unresolved warnings logged server-side |

UI behavior summary:

| Surface | Result |
| --- | --- |
| Route index | Shows operations immediately, grouped by tag, and supports search/method filtering |
| Operation detail | Shows selected method/path plus overview, code, schema, and changelog tabs |
| Code snippets | Generates cURL and fetch snippets using the emitted server, configured app URL, or local docs origin |
| Try-it panel | Shows auth/body/query/header fields with disabled send behavior |
| Layout workspace | Supports resizing, drag-reorder, add/remove, undo/redo/reset, and local persistence |
| Schema explorer | Lists component schemas as a movable supporting reference panel |
| Copy JSON | Provides a clipboard action with fallback status messaging |

---

## Architecture Capabilities

The docs UI can now:

- Render a useful local API reference without third-party UI/runtime dependencies.
- Consume any OpenAPI document served by the existing Specord JSON route.
- Let users resize, reorder, remove, restore, undo, redo, and reset docs panels.
- Let users search and filter operations without a build step.
- Keep operation details on the same page as the route index.
- Generate static code snippets from OpenAPI operation metadata.
- Reserve UI surface for future changelog metadata without inventing extraction contracts.
- Prepare request fields in a read-only try-it scaffold without sending requests.
- Keep schema browsing available as a movable supporting reference.
- Preserve a single renderer shared by CLI serving and Nest route injection.
- Stay read-only, avoiding auth/request-execution decisions.

The docs UI still cannot:

- Execute API requests.
- Persist user preferences between refreshes.
- Persist layout across browsers or devices.
- Deep-link to a specific operation or schema.
- Render a full Swagger/Scalar-level API reference.
- Author or extract changelog entries from source code.
- Provide advanced schema visualization beyond JSON preview.

---

## Codebase Metrics

| Metric | Value |
| --- | ---: |
| Branch | `develop` |
| Commits before this UI checkpoint | 45 |
| Files changed in this slice | 3 tracked files |
| Workspace files under packages/examples/spec/docs/reports, excluding dist/node_modules | 186 |
| TypeScript source lines under packages, excluding declarations and dist | 21,608 |
| New runtime dependencies | 0 |
| Publish status | Not run |

---

## Decision Log

| Decision | Rationale |
| --- | --- |
| Keep the UI dependency-free | Protects the publishable package shape prepared in Phase 4 |
| Keep request execution out of scope | Try-it-out behavior needs auth, environment, and safety decisions |
| Use the shared `@specord/ui` renderer | One implementation improves both `specord serve` and Nest route injection |
| Prefer operation-first browsing over dashboard layout | The docs route is a developer tool, not an analytics surface |
| Keep panel layout local to the browser | Custom comfort layouts do not need a backend contract for this scaffold |
| Use OpenAPI operation extensions for changelog placeholders | Allows future metadata without inventing a source extraction rule in the UI pass |
| Keep send disabled in the try-it panel | The visual scaffold is useful, but live execution needs explicit proxy/auth/CORS rules |
| Remove KPI-style cards | Path/operation/schema counts do not help the user get to a route faster |
| Remove decorative hero/runtime chrome | The first viewport should be usable, not explanatory |
| Preserve `/api` and `/api/openapi.json` behavior | Phase 3 route-injection contract remains stable |
| Use deterministic visible order for selection | The detail pane should match the first visible operation after sorting/filtering |

---

## Roadmap

| Phase | Focus | TODO |
| --- | --- | --- |
| Phase 5 follow-up | Deep links | Add URL hash support for operation/schema selection |
| Phase 5 follow-up | Panel polish | Add keyboard-accessible panel move controls in addition to drag handles |
| Phase 5 follow-up | Schema UX | Render schema properties as structured rows before the raw JSON preview |
| Phase 5 follow-up | Changelog contract | Decide whether changelog metadata comes from OpenAPI extensions, config, git tags, or package history |
| Phase 5 follow-up | Diagnostics | Surface unresolved warnings in the UI when the JSON route can expose them |
| Phase 5 decision | Request execution | Decide whether try-it-out belongs in V1 and what auth/storage rules apply |
| Phase 4 release gate | First npm publish | Run only after explicit approval |

---

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Larger inline renderer can become hard to maintain | Medium | Keep tests on shell contracts and consider extracting client helpers if the UI grows again |
| Native resize and drag are pointer-first interactions | Medium | Add keyboard move/resize affordances before calling layout customization fully accessible |
| JSON previews are useful but not as readable as structured schema tables | Medium | Roadmap includes structured schema rendering |
| Clipboard API may be blocked in some browser contexts | Low | Toast reports clipboard denial or unavailability |
| Very large OpenAPI documents may make client-side filtering heavy | Medium | Current V1 fixtures are small; add virtualized or paged lists if real-project docs need it |
| Visual polish could drift into marketing UI | Medium | Tests now reject the dashboard KPI and hero chrome patterns |
| Try-it scaffold can be mistaken for execution support | Medium | Send remains disabled and the UI repeats "Execution contract pending" |

---

## Verification

Commands and checks run during the implementation pass:

```bash
pnpm.cmd --filter @specord/ui test
pnpm.cmd --filter @specord/ui build
pnpm.cmd --filter @specord/cli test
pnpm.cmd --filter @specord/nestjs test
pnpm.cmd test
pnpm.cmd build
pnpm.cmd audit --prod --json
pnpm.cmd audit --json
pnpm.cmd --silent generate -- examples/nestjs-realworld --pretty
pnpm.cmd --silent generate -- examples/nestjs-api --pretty
pnpm.cmd serve -- examples/nestjs-realworld --port 4795 --pretty
Invoke-WebRequest http://127.0.0.1:4795/api/openapi.json
pnpm.cmd serve -- examples/nestjs-realworld --port 4796 --pretty
Invoke-WebRequest http://127.0.0.1:4796/health
```

Results:

- Workspace tests exited 0 with 11 successful Turborepo tasks.
- Workspace build exited 0 with 6 successful Turborepo tasks.
- Production audit and full audit both reported 0 vulnerabilities.
- `examples/nestjs-realworld` generate emitted 5 paths, 6 operations, 6 schemas, and 2 unresolved warnings.
- `examples/nestjs-api` generate emitted 9 paths, 15 operations, 8 schemas, and 25 unresolved warnings.
- Both generator smokes exited 0.

Browser QA:

- Opened `http://127.0.0.1:4795/api`.
- Confirmed page identity, title, route index, and selected operation detail.
- Confirmed search for `download` reduced operations to one matching route.
- Confirmed POST method filtering selected `POST /orders` and displayed required JSON request body.
- Confirmed the 2026-05-15 panel-workspace pass on `http://127.0.0.1:4796/api`.
- Confirmed 1920px desktop render shows endpoint, reference, try-it, and schemas panels.
- Confirmed Code tab renders generated cURL/fetch snippets.
- Confirmed Changelog tab renders the empty-state extension hook.
- Confirmed removing the Schemas panel exposes it in Add panel and Undo restores it.
- Confirmed console warnings/errors were empty in the Playwright browser.
- Captured desktop and mobile screenshots.
- Stopped stale local docs-server processes between UI rebuilds so browser checks used current compiled UI.
